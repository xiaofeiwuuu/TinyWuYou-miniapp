import config from '@/config/index.config.js'
import { keyManager } from '@/util/key-manager.js'
import { CryptoUtil } from '@/util/crypto.js'

// 不需要加密的路由（仅限密钥交换、登录等必要接口）
const skipRoutes = [
	'/auth/exchange-key',
	'/auth/exchange-key-simple',
	'/auth/public-key',
	'/auth/wx-login',
	'/auth/logout',
	'/upload'
]

/**
 * 封装的请求方法（支持加密通信）
 */
async function request(options) {
	const url = options.url || ''
	const needEncrypt = !skipRoutes.some(route => url.includes(route))

	// 如果需要加密，先确保已完成密钥交换
	if (needEncrypt && !keyManager.isKeyExchanged()) {
		let retryCount = 0
		let exchangeSuccess = false

		while (!exchangeSuccess && retryCount < 2) {
			try {
				console.log(`[Request] 开始密钥交换 (尝试 ${retryCount + 1}/2)`)
				await keyManager.exchangeKey()

				// 验证密钥是否真的交换成功
				if (keyManager.isKeyExchanged()) {
					console.log(`[Request] ✅ 密钥交换成功`)
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
	console.log(`[Request] ${url} - 获取AES密钥:`, aesKey ? `存在(${aesKey.substring(0, 8)}...)` : '不存在')

	// 加密请求数据
	if (needEncrypt && aesKey && requestData && Object.keys(requestData).length > 0) {
		try {
			const encrypted = CryptoUtil.aesEncrypt(JSON.stringify(requestData), aesKey)
			requestData = { encrypted }
			console.log(`[Request] ✅ 加密请求数据: ${url}`)
		} catch (error) {
			console.error('[Request] 加密失败:', error)
		}
	}

	// 准备请求头
	const headers = options.header || { 'Content-Type': 'application/json' }
	headers['x-client-id'] = keyManager.getClientId()
	// headers['Referer'] = 'server.xiaofeiwuuu.top'

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
				console.log(`[Response] ${url} - 状态码:`, res.statusCode)

				// 处理 401 未授权错误 (token 失效)
				if (res.statusCode === 401) {
					console.warn('[Response] Token 失效，清除本地数据并触发重新登录')
					// 清除 token
					uni.removeStorageSync('token')
					uni.removeStorageSync('userInfo')
					// 清除密钥
					uni.removeStorageSync('__client_id__')
					uni.removeStorageSync('__aes_key__')
					keyManager.clearKeys()

					uni.showToast({
						title: '登录已失效，请重新打开小程序',
						icon: 'none',
						duration: 3000
					})
					reject(new Error('未授权访问'))
					return
				}

				// 处理 428 密钥过期错误
				if (res.statusCode === 428 || res.data?.needKeyExchange) {
					console.warn('[Response] 服务端密钥已过期，使用原 clientId 重新交换密钥')
					keyManager.clearKeys()
					keyManager.exchangeKey().then(() => {
						console.log('[Response] 密钥交换成功，请重新请求')
						uni.showToast({
							title: '密钥已更新,请重试',
							icon: 'none'
						})
					})
					reject(new Error('密钥已过期'))
					return
				}

				// 接受 2xx 范围的状态码
				if (res.statusCode >= 200 && res.statusCode < 300) {
					let responseData = res.data
					console.log(`[Response] ${url} - 原始响应:`, JSON.stringify(responseData).substring(0, 200))

					// 解密响应数据
					if (needEncrypt && responseData?.encrypted) {
						console.log(`[Response] ${url} - 检测到加密响应，开始解密`)
						if (!aesKey) {
							console.warn('[Response] 收到加密响应但本地无密钥')
							uni.removeStorageSync('__client_id__')
							uni.removeStorageSync('__aes_key__')
							keyManager.clearKeys()
							reject(new Error('无密钥'))
							return
						}

						try {
							console.log(`[Response] 加密内容长度:`, responseData.encrypted.length)
							const decryptedData = CryptoUtil.aesDecrypt(responseData.encrypted, aesKey)
							console.log(`[Response] 解密后的数据:`, decryptedData.substring(0, 10000))
							responseData = JSON.parse(decryptedData)
							console.log(`[Response] ✅ 解密响应数据: ${url}`)
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

					console.log(`[Response] ${url} - 最终数据:`, JSON.stringify(responseData).substring(0, 200))
					resolve(responseData)
				} else {
					console.error(`[Response] ${url} - 请求失败:`, res.statusCode, res.data)
					uni.showToast({
						title: '请求失败',
						icon: 'none'
					})
					reject(res)
				}
			},
			fail: (err) => {
				uni.showToast({
					title: '网络错误',
					icon: 'none'
				})
				reject(err)
			}
		})
	})
}

export default request
