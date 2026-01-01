import CryptoJS from 'crypto-js'
import JSEncrypt from 'jsencrypt'

/**
 * 前端加密工具类
 * 使用 RSA + AES 混合加密
 */
export class CryptoUtil {
	/**
	 * RSA 加密 (使用 PKCS1 填充，兼容小程序环境)
	 */
	static rsaEncrypt(data, publicKey) {
		try {
			const encrypt = new JSEncrypt()
			encrypt.setPublicKey(publicKey)
			const encrypted = encrypt.encrypt(data)

			if (!encrypted) {
				throw new Error('RSA 加密失败')
			}

			return encrypted
		} catch (error) {
			console.error('[CryptoUtil] RSA 加密失败:', error)
			throw error
		}
	}

	/**
	 * 生成随机 WordArray（小程序兼容）
	 * @param {number} nBytes 字节数
	 */
	static generateRandomWordArray(nBytes) {
		const words = []
		for (let i = 0; i < nBytes; i += 4) {
			// 使用 Math.random() 生成 32 位随机数
			words.push((Math.random() * 0x100000000) | 0)
		}
		return CryptoJS.lib.WordArray.create(words, nBytes)
	}

	/**
	 * AES 加密
	 * 使用 AES-256-CBC
	 */
	static aesEncrypt(data, key) {
		try {
			// 将密钥转换为 WordArray (key是hex字符串)
			const keyWordArray = CryptoJS.enc.Hex.parse(key)

			// 生成随机 IV（使用小程序兼容方式）
			const iv = this.generateRandomWordArray(16)

			// 加密
			const encrypted = CryptoJS.AES.encrypt(data, keyWordArray, {
				iv,
				mode: CryptoJS.mode.CBC,
				padding: CryptoJS.pad.Pkcs7
			})

			// 将 IV 和密文组合返回 (IV:密文)
			return `${iv.toString(CryptoJS.enc.Base64)}:${encrypted.toString()}`
		} catch (error) {
			console.error('[CryptoUtil] AES 加密失败:', error)
			throw new Error('AES 加密失败')
		}
	}

	/**
	 * AES 解密
	 */
	static aesDecrypt(encrypted, key) {
		try {
			// 将密钥转换为 WordArray (key是hex字符串)
			const keyWordArray = CryptoJS.enc.Hex.parse(key)

			// 分离 IV 和密文
			const [ivBase64, ciphertext] = encrypted.split(':')
			const iv = CryptoJS.enc.Base64.parse(ivBase64)

			// 解密
			const decrypted = CryptoJS.AES.decrypt(ciphertext, keyWordArray, {
				iv,
				mode: CryptoJS.mode.CBC,
				padding: CryptoJS.pad.Pkcs7
			})

			return decrypted.toString(CryptoJS.enc.Utf8)
		} catch (error) {
			console.error('[CryptoUtil] AES 解密失败:', error)
			throw new Error('AES 解密失败')
		}
	}

	/**
	 * 生成 AES 密钥 (256-bit / 32 bytes)
	 * 返回 64 位 hex 字符串
	 * 小程序环境下使用自定义随机数生成
	 */
	static generateAesKey() {
		// 小程序环境下不支持 crypto.getRandomValues()，使用 Math.random() 代替
		const hexChars = '0123456789abcdef'
		let result = ''
		for (let i = 0; i < 64; i++) {
			result += hexChars[Math.floor(Math.random() * 16)]
		}
		return result
	}

	/**
	 * 生成随机字符串（用于客户端 ID）
	 */
	static generateRandomId(length = 16) {
		const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
		let result = ''
		for (let i = 0; i < length; i++) {
			result += chars.charAt(Math.floor(Math.random() * chars.length))
		}
		return result
	}
}
