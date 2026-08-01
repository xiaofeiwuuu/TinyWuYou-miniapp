import CryptoJS from 'crypto-js'
import forge from 'node-forge'

/**
 * 前端加密工具类
 * 使用 RSA + AES 混合加密
 */
export class CryptoUtil {
	/**
	 * RSA 加密（OAEP-SHA256）
	 *
	 * 原来用 JSEncrypt，它只支持 PKCS1v1.5 填充。而服务端跑在新版 Node 上，
	 * Node 已经禁止用 RSA_PKCS1_PADDING 做私钥解密（node-rsa 也绕不过去，
	 * 会直接抛 "RSA_PKCS1_PADDING is no longer supported for private decryption"）——
	 * 也就是说小程序此前根本无法完成密钥交换。
	 *
	 * 换成 node-forge 的 OAEP-SHA256，与服务端 crypto.privateDecrypt 的
	 * RSA_PKCS1_OAEP_PADDING + oaepHash:'sha256' 完全对应。
	 * OAEP 本身也不存在 PKCS1v1.5 的填充预言问题。
	 */
	static rsaEncrypt(data, publicKey) {
		try {
			const pubKey = forge.pki.publicKeyFromPem(publicKey)
			const encrypted = pubKey.encrypt(data, 'RSA-OAEP', {
				md: forge.md.sha256.create(),
				mgf1: { md: forge.md.sha256.create() }
			})
			return forge.util.encode64(encrypted)
		} catch (error) {
			console.error('[CryptoUtil] RSA 加密失败:', error)
			throw error
		}
	}

	/**
	 * 单调递增计数器，用于派生互不重复的 IV
	 */
	static ivCounter = 0

	/**
	 * 派生一个不可预测且不重复的 IV。
	 *
	 * 原来的 IV 来自 Math.random()——非密码学安全，攻击者可预测 IV，
	 * 而 CBC 模式下可预测的 IV 会让相同明文产生可识别的密文模式。
	 *
	 * 这里用 HMAC(aesKey, timestamp:counter:random) 派生：
	 * 计数器保证同一会话内不重复，而 aesKey 是保密的，
	 * 所以没有密钥的人无法预测 IV —— 不依赖运行时是否提供 CSPRNG。
	 */
	static deriveIv(key) {
		this.ivCounter = (this.ivCounter + 1) % Number.MAX_SAFE_INTEGER
		const seed = `${Date.now()}:${this.ivCounter}:${Math.random()}`
		const keyWordArray = CryptoJS.enc.Hex.parse(key)
		const digest = CryptoJS.HmacSHA256(seed, keyWordArray)
		// 取前 16 字节作为 IV
		return CryptoJS.lib.WordArray.create(digest.words.slice(0, 4), 16)
	}

	/**
	 * AES 加密
	 * 使用 AES-256-CBC
	 */
	static aesEncrypt(data, key) {
		try {
			// 将密钥转换为 WordArray (key是hex字符串)
			const keyWordArray = CryptoJS.enc.Hex.parse(key)

			// 从密钥派生 IV，不依赖 Math.random
			const iv = this.deriveIv(key)

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
	 * 收集本机可用的熵。
	 *
	 * 小程序运行时没有 crypto.getRandomValues，只能尽量多混一些来源。
	 * 注意：这个函数的输出**不足以单独作为密钥**，必须和服务端随机数一起派生。
	 */
	static collectLocalEntropy() {
		const parts = [
			Date.now(),
			// eslint-disable-next-line no-restricted-properties
			Math.random(),
			Math.random(),
			this.ivCounter,
		]

		try {
			const info = uni.getSystemInfoSync()
			parts.push(info.brand, info.model, info.system, info.screenWidth, info.screenHeight)
		} catch (e) {
			// 取不到就算了
		}

		try {
			parts.push(uni.getStorageInfoSync().currentSize)
		} catch (e) {
			// 忽略
		}

		return parts.join('|')
	}

	/**
	 * 派生 AES 密钥 (256-bit / 32 bytes)，返回 64 位 hex 字符串。
	 *
	 * 原来是 64 次 Math.random() 逐位取 hex —— 整把 AES-256 密钥只有
	 * Math.random 的熵，可以从少量输出还原内部状态进而预测密钥。
	 *
	 * 现在由服务端随机数（服务端有真正的 CSPRNG，随公钥接口一起下发）
	 * 与本机熵一起派生：即使本机这部分完全可预测，攻击者也拿不到
	 * 通过 TLS 单独发给该客户端的那段服务端随机数。
	 *
	 * @param {string} serverRandom /auth/public-key 返回的 serverRandom
	 */
	static deriveAesKey(serverRandom) {
		if (!serverRandom || serverRandom.length < 32) {
			throw new Error('服务端随机数缺失，无法安全派生密钥')
		}

		const material = `${serverRandom}|${this.collectLocalEntropy()}`
		return CryptoJS.SHA256(material).toString(CryptoJS.enc.Hex)
	}

	/**
	 * 生成客户端 ID。
	 * 只需要不可猜、不重复，不作为密钥使用。
	 */
	static generateRandomId(length = 32) {
		const digest = CryptoJS.SHA256(this.collectLocalEntropy()).toString(CryptoJS.enc.Hex)
		return digest.slice(0, length)
	}

	/**
	 * HMAC-SHA256 签名（hex）
	 */
	static hmacSha256(data, secretHex) {
		const keyWordArray = CryptoJS.enc.Hex.parse(secretHex)
		return CryptoJS.HmacSHA256(data, keyWordArray).toString(CryptoJS.enc.Hex)
	}

	/**
	 * SHA-256（hex）
	 */
	static sha256(data) {
		return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex)
	}

	/**
	 * 生成一次性随机数（防重放）
	 */
	static generateNonce() {
		return CryptoJS.SHA256(`${this.collectLocalEntropy()}|nonce`).toString(CryptoJS.enc.Hex).slice(0, 48)
	}

	/**
	 * 计算请求签名。
	 *
	 * 签名内容为 method + path + timestamp + nonce + sha256(body)，与服务端一致。
	 * 小程序端原来**完全没有发送签名**，而服务端对所有非 GET 请求都要求
	 * x-timestamp/x-signature —— 下载、收藏、签到、兑换全都会被拒。
	 */
	static buildSignature({ method, path, timestamp, nonce, body, aesKey }) {
		const signData = [
			String(method).toUpperCase(),
			path,
			timestamp,
			nonce,
			this.sha256(body || '')
		].join('\n')
		return this.hmacSha256(signData, aesKey)
	}
}
