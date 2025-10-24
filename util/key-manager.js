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

		if (!clientId) {
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
	 * 与服务端进行密钥交换 (简化版,适用于小程序)
	 * 服务端生成密钥并直接返回(HTTPS保证安全)
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

			// 发送 clientId 到服务端,服务端生成并返回 AES 密钥
			const response = await new Promise((resolve, reject) => {
				uni.request({
					url: config.baseUrl + '/auth/exchange-key-simple',
					method: 'POST',
					data: {
						clientId: this.clientId
					},
					header: {
						'Content-Type': 'application/json',
						'x-client-id': this.clientId
					},
					success: (res) => {
						console.log('[KeyManager] 服务端响应:', res.statusCode, res.data)
						// NestJS @Post 默认返回 201，所以接受 200 或 201
						if ((res.statusCode === 200 || res.statusCode === 201) && res.data.code === 0) {
							resolve(res.data.data)
						} else {
							reject(new Error(`密钥交换失败: ${res.data.message || '未知错误'}`))
						}
					},
					fail: (err) => {
						console.error('[KeyManager] 请求失败:', err)
						reject(err)
					}
				})
			})

			if (!response || !response.success || !response.aesKey) {
				throw new Error('服务端密钥交换失败: 响应数据不完整')
			}

			// 保存服务端生成的 AES 密钥
			this.aesKey = response.aesKey
			uni.setStorageSync('__aes_key__', this.aesKey)

			console.log('[KeyManager] ✅ 密钥交换成功!')
			console.log('[KeyManager] 密钥已保存，长度:', this.aesKey.length)
			console.log('[KeyManager] 🔒 HTTPS 加密传输保证密钥安全')

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
