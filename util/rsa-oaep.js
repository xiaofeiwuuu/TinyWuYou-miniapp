import CryptoJS from 'crypto-js'

/**
 * RSA-OAEP(SHA-256) 公钥加密，纯 ES 模块实现。
 *
 * 为什么不用 node-forge：
 * forge 在模块初始化阶段就会读 `util.globalScope.crypto`，而 globalScope 的取法是
 *   isNodejs ? global : (typeof self === 'undefined' ? window : self)
 * 小程序里 self 和 window 都不存在，globalScope 求值成 undefined，
 * random.js 在 import 阶段直接抛 "Cannot read property 'crypto' of undefined"，
 * 整个小程序起不来。
 *
 * 这个崩溃发生在 vendor 分包加载时，早于任何业务代码，所以在项目代码里补 polyfill
 * 没法保证先于它执行；而 HBuilderX 工程没有 vite.config.js，也没法用 define 注入。
 * 加上 forge 拿不到 CSPRNG 时会退回 `new Date()` 播种的弱 PRNG——正是我们要避免的东西。
 *
 * 所以这里自己实现：只依赖 crypto-js（项目已在用）和 BigInt，不碰任何全局对象。
 */

/* ------------------------------ 字节工具 ------------------------------ */

/** WordArray -> Uint8Array */
function wordsToBytes(wordArray) {
	const { words, sigBytes } = wordArray
	const out = new Uint8Array(sigBytes)
	for (let i = 0; i < sigBytes; i++) {
		out[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff
	}
	return out
}

/** Uint8Array -> WordArray */
function bytesToWords(bytes) {
	const words = []
	for (let i = 0; i < bytes.length; i++) {
		words[i >>> 2] |= bytes[i] << (24 - (i % 4) * 8)
	}
	return CryptoJS.lib.WordArray.create(words, bytes.length)
}

function sha256Bytes(bytes) {
	return wordsToBytes(CryptoJS.SHA256(bytesToWords(bytes)))
}

function utf8ToBytes(str) {
	return wordsToBytes(CryptoJS.enc.Utf8.parse(str))
}

function bytesToBase64(bytes) {
	return CryptoJS.enc.Base64.stringify(bytesToWords(bytes))
}

function base64ToBytes(b64) {
	return wordsToBytes(CryptoJS.enc.Base64.parse(b64))
}

function bytesToBigInt(bytes) {
	let hex = ''
	for (let i = 0; i < bytes.length; i++) {
		hex += bytes[i].toString(16).padStart(2, '0')
	}
	return hex === '' ? 0n : BigInt('0x' + hex)
}

/** BigInt -> 定长大端字节串（I2OSP） */
function bigIntToBytes(value, length) {
	let hex = value.toString(16)
	if (hex.length % 2) hex = '0' + hex
	const out = new Uint8Array(length)
	const start = length - hex.length / 2
	if (start < 0) throw new Error('整数超出目标长度')
	for (let i = 0; i < hex.length / 2; i++) {
		out[start + i] = parseInt(hex.substr(i * 2, 2), 16)
	}
	return out
}

/* ------------------------------ DER 解析 ------------------------------ */

/**
 * 极简 DER 读取器。只需要能从公钥里取出 modulus 和 exponent，
 * 不做完整的 ASN.1 校验。
 */
function createReader(bytes) {
	let pos = 0
	return {
		readLength() {
			let len = bytes[pos++]
			if (len & 0x80) {
				const count = len & 0x7f
				len = 0
				for (let i = 0; i < count; i++) len = (len << 8) | bytes[pos++]
			}
			return len
		},
		readTag() {
			return bytes[pos++]
		},
		skip(n) {
			pos += n
		},
		slice(n) {
			const out = bytes.subarray(pos, pos + n)
			pos += n
			return out
		},
		get position() {
			return pos
		},
	}
}

/**
 * 从 PEM 公钥里取出 { n, e }。
 * 同时支持 SPKI（-----BEGIN PUBLIC KEY-----）和 PKCS#1（-----BEGIN RSA PUBLIC KEY-----）。
 */
export function parsePublicKey(pem) {
	const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
	const der = base64ToBytes(body)
	const r = createReader(der)

	r.readTag() // SEQUENCE
	r.readLength()

	let tag = r.readTag()
	if (tag === 0x30) {
		// SPKI：先是 AlgorithmIdentifier，跳过，再进 BIT STRING 里的 RSAPublicKey
		const algLen = r.readLength()
		r.skip(algLen)
		r.readTag() // BIT STRING
		r.readLength()
		r.skip(1) // BIT STRING 的 unused-bits 字节
		r.readTag() // 内层 SEQUENCE
		r.readLength()
		tag = r.readTag() // INTEGER n
	}
	if (tag !== 0x02) throw new Error('无法解析公钥：未找到 modulus')

	const nLen = r.readLength()
	const nBytes = r.slice(nLen)
	r.readTag() // INTEGER e
	const eLen = r.readLength()
	const eBytes = r.slice(eLen)

	return {
		n: bytesToBigInt(nBytes),
		e: bytesToBigInt(eBytes),
		// 去掉 DER INTEGER 可能带的前导 0x00，得到真实密钥长度
		size: nBytes[0] === 0 ? nLen - 1 : nLen,
	}
}

/* ------------------------------ OAEP ------------------------------ */

const HASH_LEN = 32 // SHA-256

/** MGF1-SHA256 */
function mgf1(seed, length) {
	const out = new Uint8Array(length)
	let filled = 0
	for (let counter = 0; filled < length; counter++) {
		const input = new Uint8Array(seed.length + 4)
		input.set(seed, 0)
		input[seed.length] = (counter >>> 24) & 0xff
		input[seed.length + 1] = (counter >>> 16) & 0xff
		input[seed.length + 2] = (counter >>> 8) & 0xff
		input[seed.length + 3] = counter & 0xff
		const digest = sha256Bytes(input)
		const take = Math.min(HASH_LEN, length - filled)
		out.set(digest.subarray(0, take), filled)
		filled += take
	}
	return out
}

/** 模幂：公钥指数很小（通常 65537），平方-乘法足够快 */
function modPow(base, exponent, modulus) {
	let result = 1n
	let b = base % modulus
	let e = exponent
	while (e > 0n) {
		if (e & 1n) result = (result * b) % modulus
		b = (b * b) % modulus
		e >>= 1n
	}
	return result
}

/**
 * RSA-OAEP(SHA-256, MGF1-SHA256, 空 label) 加密。
 *
 * @param {string} message  明文（这里是 64 位 hex 的 AES 密钥）
 * @param {string} pem      服务端公钥
 * @param {Uint8Array} seed 32 字节种子，必须不可预测。由调用方提供，
 *                          不在这里生成——小程序没有 CSPRNG，随手用 Math.random
 *                          会让 OAEP 的随机性形同虚设。
 * @returns {string} base64 密文
 */
export function rsaOaepEncrypt(message, pem, seed) {
	if (!(seed instanceof Uint8Array) || seed.length !== HASH_LEN) {
		throw new Error(`OAEP 种子必须是 ${HASH_LEN} 字节`)
	}

	const { n, e, size: k } = parsePublicKey(pem)
	const msg = utf8ToBytes(message)

	// 明文上限：k - 2*hLen - 2
	const maxLen = k - 2 * HASH_LEN - 2
	if (msg.length > maxLen) {
		throw new Error(`明文过长：${msg.length} > ${maxLen}`)
	}

	// DB = lHash || PS(全 0) || 0x01 || M
	const lHash = sha256Bytes(new Uint8Array(0)) // 空 label 的哈希
	const db = new Uint8Array(k - HASH_LEN - 1)
	db.set(lHash, 0)
	db[db.length - msg.length - 1] = 0x01
	db.set(msg, db.length - msg.length)

	// maskedDB = DB ⊕ MGF1(seed)
	const dbMask = mgf1(seed, db.length)
	const maskedDb = new Uint8Array(db.length)
	for (let i = 0; i < db.length; i++) maskedDb[i] = db[i] ^ dbMask[i]

	// maskedSeed = seed ⊕ MGF1(maskedDB)
	const seedMask = mgf1(maskedDb, HASH_LEN)
	const maskedSeed = new Uint8Array(HASH_LEN)
	for (let i = 0; i < HASH_LEN; i++) maskedSeed[i] = seed[i] ^ seedMask[i]

	// EM = 0x00 || maskedSeed || maskedDB
	const em = new Uint8Array(k)
	em[0] = 0x00
	em.set(maskedSeed, 1)
	em.set(maskedDb, 1 + HASH_LEN)

	const cipher = modPow(bytesToBigInt(em), e, n)
	return bytesToBase64(bigIntToBytes(cipher, k))
}
