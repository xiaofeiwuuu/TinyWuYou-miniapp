import config from '@/config/index.config.js'
import { keyManager } from '@/util/key-manager.js'
import { CryptoUtil } from '@/util/crypto.js'
import { getPlatform } from '@/util/platform.js'

// 不需要加密的路由（仅限密钥交换、登录等必要接口）
const skipRoutes = [
	'/auth/exchange-key',
	'/auth/public-key',
	'/auth/wx-login',
	'/auth/logout',
	'/upload'
]

/**
 * 正在进行中的静默重登。
 * 单飞：并发的多个请求同时 401 时只登录一次，其余的等这一次的结果，
 * 否则会同时发起十几次 wx-login，既浪费也可能触发微信的频率限制。
 */
let reloginPromise = null

/**
 * 静默重新登录。
 *
 * 小程序的优势在于 uni.login() 随时能拿到新的 code，全程不需要用户参与，
 * 所以 token 过期不该是"请重新打开小程序"，而应该自己悄悄换一张。
 * 这也是为什么不需要把 token 设成永不过期——那样一旦泄露就是永久有效。
 */
function silentRelogin() {
	if (reloginPromise) return reloginPromise

	reloginPromise = (async () => {
		try {
			const loginRes = await new Promise((resolve, reject) => {
				uni.login({ success: resolve, fail: reject })
			})
			if (!loginRes || !loginRes.code) {
				throw new Error('获取登录 code 失败')
			}

			// 走 request 自己发，wx-login 在 skipRoutes 里不会被加密签名；
			// 直接 import api/auth.js 会和本文件形成循环引用
			const res = await request({
				url: '/auth/wx-login',
				method: 'POST',
				data: {
					code: loginRes.code,
					nickname: '',
					avatarUrl: '',
					platform: getPlatform(),
					inviteCode: ''
				}
			})

			if (!res || res.code !== 0 || !res.data || !res.data.accessToken) {
				throw new Error((res && res.message) || '登录失败')
			}

			uni.setStorageSync('token', res.data.accessToken)
			if (res.data.userInfo) {
				uni.setStorageSync('userInfo', JSON.stringify(res.data.userInfo))
			}
			console.log('[Auth] 静默重新登录成功')
			return res.data.accessToken
		} finally {
			// 无论成败都要释放，否则失败一次之后再也不会重试
			reloginPromise = null
		}
	})()

	return reloginPromise
}

/**
 * 封装的请求方法（支持加密通信）
 * @param {Object} options 请求选项
 * @param {Object} retried 内部重试标记 { key: 密钥已重试过, auth: 已重登过 }
 */
async function request(options, retried = {}) {
	const url = options.url || ''
	const needEncrypt = !skipRoutes.some(route => url.includes(route))

	// 如果需要加密，先确保已完成密钥交换
	if (needEncrypt && !keyManager.isKeyExchanged()) {
		let retryCount = 0
		let exchangeSuccess = false

		while (!exchangeSuccess && retryCount < 2) {
			try {
 
				await keyManager.exchangeKey()

				// 验证密钥是否真的交换成功
				if (keyManager.isKeyExchanged()) {
 
					exchangeSuccess = true
				} else {
					throw new Error('密钥交换完成但密钥不可用')
				}
			} catch (error) {
				retryCount++
				console.error(`[Request] 密钥交换失败 (尝试 ${retryCount}/2):`, error)

				if (retryCount >= 2) {
					console.error('[Request] 密钥交换最终失败，请求将不加密')
					uni.showToast({
						title: '密钥交换失败',
						icon: 'none'
					})
					break
				}

				// 交换失败,清除旧 clientId 和密钥重试
				console.warn('[Request] 清除 clientId 和密钥，准备重试')
				uni.removeStorageSync('__client_id__')
				uni.removeStorageSync('__aes_key__')
				keyManager.clearKeys()

				// 等待一下再重试
				await new Promise(resolve => setTimeout(resolve, 500))
			}
		}
	}

	// 准备请求数据
	let requestData = options.data || {}
	const aesKey = keyManager.getAesKey()
	const method = (options.method || 'GET').toUpperCase()

	// 准备请求头
	const headers = options.header || { 'Content-Type': 'application/json' }
	headers['x-client-id'] = keyManager.getClientId()

	// 加密请求体并签名（仅 POST/PUT/PATCH/DELETE 等非 GET 请求）
	// GET 请求的参数会变成 URL 查询字符串，加密后后端无法解析
	//
	// 注意：这里原来只加密不签名，而服务端对所有非 GET 请求都要求
	// x-timestamp / x-signature —— 下载、收藏、签到、兑换全都会被拒。
	if (needEncrypt && aesKey && method !== 'GET') {
		try {
			const timestamp = Date.now().toString()
			const nonce = CryptoUtil.generateNonce()

			let encrypted = ''
			if (method !== 'DELETE' || (requestData && Object.keys(requestData).length > 0)) {
				// timestamp 一并加密进 body，服务端解密后会剔除
				const payload = { ...(requestData || {}), timestamp }
				encrypted = CryptoUtil.aesEncrypt(JSON.stringify(payload), aesKey)
				requestData = { encrypted }
			}

			// 服务端拿到的 path 带 /api 前缀且不含查询串
			const path = `/api${url.split('?')[0]}`

			headers['x-timestamp'] = timestamp
			headers['x-nonce'] = nonce
			headers['x-signature'] = CryptoUtil.buildSignature({
				method,
				path,
				timestamp,
				nonce,
				body: encrypted,
				aesKey
			})
		} catch (error) {
			console.error('[Request] 加密或签名失败:', error)
		}
	}

	// 添加 token（如果存在）
	const token = uni.getStorageSync('token')
	if (token) {
		headers['Authorization'] = `Bearer ${token}`
	}

	return new Promise((resolve, reject) => {
		uni.request({
			url: config.baseUrl + url,
			method: options.method || 'GET',
			data: requestData,
			header: headers,
			success: (res) => {
				// 处理 401 未授权 (token 失效)：静默重新登录后自动重试原请求，
				// 用户无感。原来是清空登录态 + 提示"请重新打开小程序"，
				// 而小程序随时能拿到新 code，完全没必要把这个负担丢给用户。
				if (res.statusCode === 401) {
					// 登录接口自己 401 就别再套娃了
					if (retried.auth || url.includes('/auth/wx-login')) {
						console.error('[Response] 重新登录后仍然 401，放弃')
						uni.removeStorageSync('token')
						uni.removeStorageSync('userInfo')
						uni.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
						reject(new Error('未授权访问'))
						return
					}

					// 本次请求用的 token 已经被别的请求换掉了，说明刚刚有人登过，
					// 直接拿新 token 重试即可，不用再登一次。
					// 没有这一步的话：一批请求带着旧 token 发出去，响应陆续回来，
					// 每个 401 都会各自触发一次登录（单飞只挡得住同时在飞的那些）。
					const latestToken = uni.getStorageSync('token')
					if (latestToken && latestToken !== token) {
						console.log('[Response] token 已被刷新，直接重试:', url)
						request(options, { ...retried, auth: true }).then(resolve).catch(reject)
						return
					}

					console.warn('[Response] Token 失效，静默重新登录后重试:', url)
					silentRelogin()
						.then(() => request(options, { ...retried, auth: true }))
						.then(resolve)
						.catch((error) => {
							console.error('[Response] 静默重新登录失败:', error)
							uni.removeStorageSync('token')
							uni.removeStorageSync('userInfo')
							uni.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
							reject(error)
						})
					return
				}

				// 处理 428 密钥过期错误
				if (res.statusCode === 428 || res.data?.needKeyExchange) {
					// 防止无限重试
					if (retried.key) {
						console.error('[Response] 重试后仍然密钥过期，放弃请求')
						reject(new Error('密钥交换失败'))
						return
					}

					console.warn('[Response] 服务端密钥已过期，重新交换密钥后自动重试')
					keyManager.clearKeys()

					// 重新交换密钥后自动重试原请求
					keyManager.exchangeKey()
						.then(() => {
							console.log('[Response] 密钥已更新，自动重试原请求:', url)
							return request(options, { ...retried, key: true })
						})
						.then(resolve)
						.catch(reject)
					return
				}

				// 接受 2xx 范围的状态码
				if (res.statusCode >= 200 && res.statusCode < 300) {
					let responseData = res.data
					// 解密响应数据
					if (needEncrypt && responseData?.encrypted) {
						if (!aesKey) {
							console.warn('[Response] 收到加密响应但本地无密钥')
							uni.removeStorageSync('__client_id__')
							uni.removeStorageSync('__aes_key__')
							keyManager.clearKeys()
							reject(new Error('无密钥'))
							return
						}

						try {
							const decryptedData = CryptoUtil.aesDecrypt(responseData.encrypted, aesKey)
							responseData = JSON.parse(decryptedData)
						} catch (error) {
							console.error('[Response] 解密失败:', error)
							console.error('[Response] 加密的内容:', responseData.encrypted?.substring(0, 100))
							uni.removeStorageSync('__client_id__')
							uni.removeStorageSync('__aes_key__')
							keyManager.clearKeys()
							reject(error)
							return
						}
					} else if (needEncrypt) {
						console.warn(`[Response] ${url} - 需要加密但响应未加密！`)
					}
					resolve(responseData)
				} else {
					console.error(`[Response] ${url} - 请求失败:`, res.statusCode, res.data)

					/**
					 * 抛出带 message 的 Error，而不是原始响应对象。
					 *
					 * 原来 reject(res) 抛的是 uni.request 的响应对象，上面没有 message 属性，
					 * 调用方普遍写的是 `error.message || '默认文案'`，于是后端返回的
					 * "该图片为VIP专属,请先购买VIP" 全都被吞掉，用户只看到"下载失败"。
					 *
					 * 这里也不再弹通用 toast：
					 * 1. 12 处调用方本来就会用 error.message 自行提示，会重复弹两次
					 * 2. showToast 会顶掉正在显示的 showLoading，
					 *    控制台那句"showLoading 与 hideLoading 必须配对使用"就是这么来的
					 */
					const message =
						(res.data && (res.data.message || res.data.error)) ||
						`请求失败(${res.statusCode})`
					const error = new Error(message)
					error.statusCode = res.statusCode
					error.data = res.data
					reject(error)
				}
			},
			fail: (err) => {
				// 同样抛 Error 而不是 uni 的原始对象，并且不在这里弹提示
				console.error(`[Response] ${url} - 网络错误:`, err)
				const error = new Error('网络错误，请检查网络后重试')
				error.isNetworkError = true
				error.raw = err
				reject(error)
			}
		})
	})
}

export default request
