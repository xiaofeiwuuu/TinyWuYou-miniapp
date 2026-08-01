import { CryptoUtil } from './crypto.js'
import config from '@/config/index.config.js'

/**
 * 前端密钥管理器
 * 负责与服务端进行密钥交换和管理本地密钥
 */
class KeyManager {
	constructor() {
		this.clientId = null
		this.aesKey = null
		this.serverPublicKey = null
		this.isExchanging = false

		// 初始化时从缓存恢复
		this.init()
	}

	/**
	 * 初始化密钥管理器
	 */
	init() {
		// 生成或获取客户端 ID
		this.clientId = this.getOrCreateClientId()
		// 尝试从 storage 恢复 AES 密钥
		// 注意：uni.getStorageSync 如果 key 不存在会返回空字符串 ""，而不是 null
		const cachedKey = uni.getStorageSync('__aes_key__')
		this.aesKey = cachedKey || null // 将空字符串转换为 null

		console.log('[KeyManager] 客户端 ID:', this.clientId)
		console.log('[KeyManager] 缓存的密钥:', cachedKey ? `存在(${cachedKey.substring(0, 8)}...)` : '不存在')
		if (this.aesKey) {
			console.log('[KeyManager] ✅ 从缓存恢复 AES 密钥')
		}
	}

	/**
	 * 获取或创建客户端 ID
	 */
	getOrCreateClientId() {
		const storageKey = '__client_id__'
		let clientId = uni.getStorageSync(storageKey)

		// 服务端要求 clientId 为 32-64 位的 [A-Za-z0-9_-]
		if (!clientId || clientId.length < 32) {
			clientId = CryptoUtil.generateRandomId(32)
			uni.setStorageSync(storageKey, clientId)
		}

		return clientId
	}

	/**
	 * 获取客户端 ID
	 */
	getClientId() {
		return this.clientId
	}

	/**
	 * 获取 AES 密钥
	 */
	getAesKey() {
		return this.aesKey
	}

	/**
	 * 是否已完成密钥交换
	 * 注意：需要判断密钥不为 null 且不为空字符串
	 */
	isKeyExchanged() {
		return !!this.aesKey // 使用双重否定，将空字符串和 null 都转换为 false
	}

	/**
	 * 与服务端进行密钥交换
	 *
	 * 流程（与管理后台一致）:
	 * 1. 获取服务端公钥
	 * 2. 客户端本地生成 AES 密钥
	 * 3. 用服务端公钥加密该 AES 密钥
	 * 4. 把密文发给服务端，服务端用私钥解密并存储
	 *
	 * AES 密钥由客户端生成、加密后上送，服务端不会把密钥明文下发给任何人。
	 */
	async exchangeKey() {
		// 如果已经有密钥，直接返回
		if (this.isKeyExchanged()) {
			console.log('[KeyManager] 密钥已存在，跳过交换')
			return Promise.resolve()
		}

		// 如果正在交换，等待当前交换完成
		if (this.isExchanging) {
			console.log('[KeyManager] 密钥交换正在进行中，等待完成...')
			// 轮询等待交换完成（最多等待5秒）
			let waitCount = 0
			while (this.isExchanging && waitCount < 50) {
				await new Promise(resolve => setTimeout(resolve, 100))
				waitCount++
			}
			// 再次检查密钥是否已交换
			if (this.isKeyExchanged()) {
				console.log('[KeyManager] 等待密钥交换完成成功')
				return Promise.resolve()
			} else {
				throw new Error('等待密钥交换超时')
			}
		}

		this.isExchanging = true

		try {
			console.log('[KeyManager] 🔐 开始密钥交换...')

			// 步骤 1: 获取服务端公钥
			const publicKeyData = await this.request('GET', '/auth/public-key')
			if (!publicKeyData || !publicKeyData.publicKey) {
				throw new Error('获取服务端公钥失败')
			}
			this.serverPublicKey = publicKeyData.publicKey

			// 步骤 2: 用服务端随机数 + 本机熵派生 AES 密钥 (256-bit)。
			// 小程序运行时没有 crypto.getRandomValues，纯本地生成的密钥是可预测的。
			const aesKey = CryptoUtil.deriveAesKey(publicKeyData.serverRandom)

			// 步骤 3: 用服务端公钥加密
			const encryptedAesKey = CryptoUtil.rsaEncrypt(aesKey, this.serverPublicKey)

			// 步骤 4: 上送密文
			const response = await this.request('POST', '/auth/exchange-key', {
				clientId: this.clientId,
				encryptedAesKey,
				keyVersion: publicKeyData.version
			})

			if (!response || !response.success) {
				throw new Error('服务端密钥交换失败')
			}

			this.aesKey = aesKey
			uni.setStorageSync('__aes_key__', this.aesKey)

			console.log('[KeyManager] ✅ 密钥交换成功，长度:', this.aesKey.length)

			return Promise.resolve()
		} catch (error) {
			console.error('[KeyManager] ❌ 密钥交换失败:', error)
			// 失败时清除密钥
			this.aesKey = null
			this.isExchanging = false
			throw error
		} finally {
			this.isExchanging = false
		}
	}

	/**
	 * 密钥交换阶段的裸请求（此时还没有 AES 密钥，不能走带加密的 request.js）
	 */
	request(method, path, data) {
		return new Promise((resolve, reject) => {
			uni.request({
				url: config.baseUrl + path,
				method,
				data,
				header: {
					'Content-Type': 'application/json',
					'x-client-id': this.clientId
				},
				success: (res) => {
					// NestJS @Post 默认返回 201，所以接受 200 或 201
					if ((res.statusCode === 200 || res.statusCode === 201) && res.data && res.data.code === 0) {
						resolve(res.data.data)
					} else {
						reject(new Error(`${path} 请求失败: ${(res.data && res.data.message) || res.statusCode}`))
					}
				},
				fail: reject
			})
		})
	}

	/**
	 * 清除密钥（退出登录时调用）
	 */
	clearKeys() {
		this.aesKey = null
		this.serverPublicKey = null
		// 清除 storage 中的密钥
		uni.removeStorageSync('__aes_key__')
		console.log('[KeyManager] 密钥已清除')
	}
}

// 导出单例
export const keyManager = new KeyManager()
