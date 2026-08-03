/**
 * JPEG EXIF 读写（纯 JS，无依赖，可在小程序里跑）。
 *
 * 支持改写三个 IFD 里的标签：
 *   IFD0     品牌 Make / 机型 Model / 软件 Software / 修改时间 DateTime
 *   ExifIFD  拍摄时间 DateTimeOriginal / 镜头 LensModel / 光圈 FNumber / 焦距
 *   GPS IFD  经纬度
 *
 * 为什么不用 piexifjs：它依赖 btoa/atob，小程序里没有这两个全局函数，
 * 且整包 100KB+，而我们只需要十来个标签。
 *
 * ─── JPEG / EXIF 结构速记 ───
 * JPEG = FFD8(SOI) + 若干段 + ... + FFD9(EOI)
 * 每段 = FFxx(marker) + 2字节长度(含自身) + 数据
 * EXIF 在 APP1 段(FFE1)里：数据 = "Exif\0\0" + TIFF
 * TIFF = 字节序(II/MM) + 42 + IFD0偏移
 * IFD  = 条目数(2) + N×12字节条目 + 下一个IFD偏移(4)
 * 条目 = tag(2) + type(2) + count(4) + 值或偏移(4)
 *        值总长 ≤4 字节时内联，否则存偏移，数据放数据区
 * IFD0 里 0x8769 指向 ExifIFD，0x8825 指向 GPS IFD
 *
 * 所有偏移都相对 TIFF 头起点，不是文件起点。
 *
 * ─── 两个有意的取舍 ───
 * 1. 丢弃 MakerNote(0x927C)：厂商私有块，内部大量使用**相对文件的绝对偏移**，
 *    搬到新位置后那些偏移全部失效，反而会让看图软件解析出错。
 *    与其搬一份坏的，不如不搬。
 * 2. 丢弃 IFD1（内嵌缩略图）：保留它要一并搬运缩略图数据并修正
 *    JPEGInterchangeFormat 偏移，收益极小——相册都是自己生成缩略图的。
 */

const SOI = 0xffd8
const APP1 = 0xffe1
const SOS = 0xffda

/** 标签号 */
export const TAG = {
	// IFD0
	MAKE: 0x010f,
	MODEL: 0x0110,
	SOFTWARE: 0x0131,
	DATETIME: 0x0132,
	EXIF_POINTER: 0x8769,
	GPS_POINTER: 0x8825,
	// ExifIFD
	FNUMBER: 0x829d,
	DATETIME_ORIGINAL: 0x9003,
	DATETIME_DIGITIZED: 0x9004,
	FOCAL_LENGTH: 0x920a,
	MAKER_NOTE: 0x927c,
	FOCAL_35MM: 0xa405,
	LENS_MAKE: 0xa433,
	LENS_MODEL: 0xa434,
	// GPS IFD
	GPS_VERSION: 0x0000,
	GPS_LAT_REF: 0x0001,
	GPS_LAT: 0x0002,
	GPS_LNG_REF: 0x0003,
	GPS_LNG: 0x0004
}

const TYPE = { BYTE: 1, ASCII: 2, SHORT: 3, LONG: 4, RATIONAL: 5, UNDEFINED: 7 }
const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 }

/* ══════════════ 解析 ══════════════ */

function findExifSegment(buf) {
	const view = new DataView(buf)
	if (view.getUint16(0) !== SOI) throw new Error('不是有效的 JPEG 文件')

	let pos = 2
	while (pos + 4 <= buf.byteLength) {
		const marker = view.getUint16(pos)
		if ((marker & 0xff00) !== 0xff00 || marker === SOS) break
		const segLen = view.getUint16(pos + 2)
		if (segLen < 2) break
		if (marker === APP1) {
			// APP1 也可能是 XMP，靠 "Exif\0\0" 区分
			const h = new Uint8Array(buf, pos + 4, Math.min(4, segLen - 2))
			if (h[0] === 0x45 && h[1] === 0x78 && h[2] === 0x69 && h[3] === 0x66) {
				return { start: pos, length: 2 + segLen }
			}
		}
		pos += 2 + segLen
	}
	return null
}

/** 读一个 IFD，返回 Map<tag, {type, num, data:Uint8Array}> */
function readIfd(buf, tiffStart, ifdOffset, le) {
	const view = new DataView(buf)
	const base = tiffStart + ifdOffset
	if (base + 2 > buf.byteLength) return new Map()

	const count = view.getUint16(base, le)
	const map = new Map()
	for (let i = 0; i < count; i++) {
		const off = base + 2 + i * 12
		if (off + 12 > buf.byteLength) break
		const tag = view.getUint16(off, le)
		const type = view.getUint16(off + 2, le)
		const num = view.getUint32(off + 4, le)
		const size = (TYPE_SIZE[type] || 1) * num
		let data
		if (size <= 4) {
			data = new Uint8Array(buf.slice(off + 8, off + 8 + size))
		} else {
			const p = tiffStart + view.getUint32(off + 8, le)
			if (p + size > buf.byteLength) continue
			data = new Uint8Array(buf.slice(p, p + size))
		}
		map.set(tag, { type, num, data })
	}
	return map
}

/** 完整解析出三个 IFD */
function parseExif(buf) {
	const seg = findExifSegment(buf)
	if (!seg) return null

	const tiffStart = seg.start + 4 + 6
	const view = new DataView(buf)
	const bo = view.getUint16(tiffStart)
	if (bo !== 0x4949 && bo !== 0x4d4d) return null
	const le = bo === 0x4949
	if (view.getUint16(tiffStart + 2, le) !== 42) return null

	const ifd0 = readIfd(buf, tiffStart, view.getUint32(tiffStart + 4, le), le)

	const readSub = (ptrTag) => {
		const e = ifd0.get(ptrTag)
		if (!e || e.data.length < 4) return new Map()
		const dv = new DataView(e.data.buffer, e.data.byteOffset, e.data.byteLength)
		return readIfd(buf, tiffStart, dv.getUint32(0, le), le)
	}

	return { seg, le, ifd0, exif: readSub(TAG.EXIF_POINTER), gps: readSub(TAG.GPS_POINTER) }
}

function toAscii(entry) {
	if (!entry) return ''
	let s = ''
	for (let i = 0; i < entry.data.length; i++) {
		if (entry.data[i] === 0) break
		s += String.fromCharCode(entry.data[i])
	}
	return s
}

/** 读出当前的元信息，用于界面展示 */
export function readMeta(buf) {
	let p
	try { p = parseExif(buf) } catch { return null }
	if (!p) return null

	const gpsCoord = (refTag, valTag) => {
		const v = p.gps.get(valTag)
		const r = toAscii(p.gps.get(refTag))
		if (!v || v.type !== TYPE.RATIONAL || v.num < 3) return null
		const dv = new DataView(v.data.buffer, v.data.byteOffset, v.data.byteLength)
		const rat = (i) => {
			const n = dv.getUint32(i * 8, p.le)
			const d = dv.getUint32(i * 8 + 4, p.le)
			return d ? n / d : 0
		}
		const deg = rat(0) + rat(1) / 60 + rat(2) / 3600
		return (r === 'S' || r === 'W') ? -deg : deg
	}

	return {
		make: toAscii(p.ifd0.get(TAG.MAKE)),
		model: toAscii(p.ifd0.get(TAG.MODEL)),
		software: toAscii(p.ifd0.get(TAG.SOFTWARE)),
		dateTime: toAscii(p.exif.get(TAG.DATETIME_ORIGINAL)) || toAscii(p.ifd0.get(TAG.DATETIME)),
		lensModel: toAscii(p.exif.get(TAG.LENS_MODEL)),
		lat: gpsCoord(TAG.GPS_LAT_REF, TAG.GPS_LAT),
		lng: gpsCoord(TAG.GPS_LNG_REF, TAG.GPS_LNG)
	}
}

/* ══════════════ 构造 ══════════════ */

function ascii(str) {
	const s = String(str)
	const b = new Uint8Array(s.length + 1)
	for (let i = 0; i < s.length; i++) {
		// EXIF ASCII 只放 0-255，中文会变乱码，超范围一律换成 '?'
		const c = s.charCodeAt(i)
		b[i] = c < 256 ? c : 0x3f
	}
	return { type: TYPE.ASCII, num: b.length, data: b }
}

function short(v) {
	const b = new Uint8Array(2)
	new DataView(b.buffer).setUint16(0, v, true)
	return { type: TYPE.SHORT, num: 1, data: b, _le: true }
}

/** RATIONAL：分子分母各 4 字节。用分母放大来表达小数，避免浮点误差 */
function rational(values, denom = 1000) {
	const arr = Array.isArray(values) ? values : [values]
	const b = new Uint8Array(arr.length * 8)
	const dv = new DataView(b.buffer)
	arr.forEach((v, i) => {
		dv.setUint32(i * 8, Math.round(Math.abs(v) * denom), true)
		dv.setUint32(i * 8 + 4, denom, true)
	})
	return { type: TYPE.RATIONAL, num: arr.length, data: b, _le: true }
}

/** 十进制度 → 度/分/秒 三个 RATIONAL */
function gpsRational(deg) {
	const abs = Math.abs(deg)
	const d = Math.floor(abs)
	const m = Math.floor((abs - d) * 60)
	const s = (abs - d - m / 60) * 3600
	const b = new Uint8Array(24)
	const dv = new DataView(b.buffer)
	dv.setUint32(0, d, true); dv.setUint32(4, 1, true)
	dv.setUint32(8, m, true); dv.setUint32(12, 1, true)
	// 秒保留 4 位小数，够精确到厘米级
	dv.setUint32(16, Math.round(s * 10000), true); dv.setUint32(20, 10000, true)
	return { type: TYPE.RATIONAL, num: 3, data: b, _le: true }
}

/**
 * 序列化一个 IFD。
 * @returns { entries: Uint8Array, data: Uint8Array } 条目区与数据区
 */
function serializeIfd(map, dataStartRel, le) {
	const tags = [...map.keys()].sort((a, b) => a - b)
	const entries = new Uint8Array(2 + tags.length * 12 + 4)
	const ev = new DataView(entries.buffer)
	ev.setUint16(0, tags.length, le)

	const chunks = []
	let dataLen = 0

	tags.forEach((tag, i) => {
		const e = map.get(tag)
		const off = 2 + i * 12
		const size = (TYPE_SIZE[e.type] || 1) * e.num
		ev.setUint16(off, tag, le)
		ev.setUint16(off + 2, e.type, le)
		ev.setUint32(off + 4, e.num, le)

		// 我们自己构造的多字节值是按小端写的；若整个 TIFF 是大端就得翻转
		let data = e.data
		if (e._le && !le) data = swapEndian(data, e.type)

		if (size <= 4) {
			entries.set(data.subarray(0, size), off + 8)
		} else {
			ev.setUint32(off + 8, dataStartRel + dataLen, le)
			chunks.push(data)
			dataLen += size
			if (dataLen % 2) { chunks.push(new Uint8Array(1)); dataLen += 1 }
		}
	})
	ev.setUint32(2 + tags.length * 12, 0, le) // 无下一个 IFD

	const data = new Uint8Array(dataLen)
	let p = 0
	for (const c of chunks) { data.set(c, p); p += c.length }
	return { entries, data }
}

function swapEndian(u8, type) {
	const unit = TYPE_SIZE[type] || 1
	if (unit === 1) return u8
	const out = new Uint8Array(u8.length)
	// RATIONAL 是两个 4 字节整数，按 4 字节翻转而不是 8
	const step = type === TYPE.RATIONAL ? 4 : unit
	for (let i = 0; i < u8.length; i += step) {
		for (let j = 0; j < step; j++) out[i + j] = u8[i + step - 1 - j]
	}
	return out
}

/** 只算条目区大小，用于预先确定各 IFD 的起始偏移 */
const ifdEntriesSize = (map) => 2 + map.size * 12 + 4

/* ══════════════ 写入 ══════════════ */

/**
 * 改写照片元信息。
 *
 * @param {ArrayBuffer} buf 原始 JPEG
 * @param {Object} meta
 *   {string} [make] [model] [software]      品牌/机型/软件
 *   {string} [dateTime]                     "YYYY:MM:DD HH:mm:ss"
 *   {Object} [lens] { model, focalLength, fNumber, focal35 }
 *   {Object} [gps]  { lat, lng }            十进制度，负数表示南纬/西经
 * @returns {ArrayBuffer}
 */
export function writeMeta(buf, meta) {
	let parsed = null
	try { parsed = parseExif(buf) } catch { parsed = null }

	// 统一用小端重建：我们构造的值都是小端，省掉一次翻转，
	// 而 II 小端是绝大多数相机的实际选择，兼容性没有问题
	const le = true
	const ifd0 = new Map()
	const exif = new Map()
	const gps = new Map()

	// 先继承原有标签
	if (parsed) {
		for (const [t, e] of parsed.ifd0) {
			// 指针交给下面重新计算；MakerNote 和缩略图相关的一律丢弃
			if (t === TAG.EXIF_POINTER || t === TAG.GPS_POINTER) continue
			// 原数据按原字节序存的，若原来是大端而我们要写小端，需要翻转
			ifd0.set(t, parsed.le === le ? e : { ...e, data: swapEndian(e.data, e.type) })
		}
		for (const [t, e] of parsed.exif) {
			if (t === TAG.MAKER_NOTE) continue
			exif.set(t, parsed.le === le ? e : { ...e, data: swapEndian(e.data, e.type) })
		}
		for (const [t, e] of parsed.gps) {
			gps.set(t, parsed.le === le ? e : { ...e, data: swapEndian(e.data, e.type) })
		}
	}

	// 应用修改
	if (meta.make !== undefined) ifd0.set(TAG.MAKE, ascii(meta.make))
	if (meta.model !== undefined) ifd0.set(TAG.MODEL, ascii(meta.model))
	if (meta.software !== undefined) ifd0.set(TAG.SOFTWARE, ascii(meta.software))

	if (meta.dateTime) {
		// 三个时间标签一起写：相册主要看 DateTimeOriginal，
		// 但有的看图软件读 DateTime，只改一个会出现两处显示不一致
		ifd0.set(TAG.DATETIME, ascii(meta.dateTime))
		exif.set(TAG.DATETIME_ORIGINAL, ascii(meta.dateTime))
		exif.set(TAG.DATETIME_DIGITIZED, ascii(meta.dateTime))
	}

	if (meta.lens) {
		const l = meta.lens
		if (l.model !== undefined) {
			exif.set(TAG.LENS_MODEL, ascii(l.model))
			if (meta.make !== undefined) exif.set(TAG.LENS_MAKE, ascii(meta.make))
		}
		if (l.focalLength !== undefined) exif.set(TAG.FOCAL_LENGTH, rational(l.focalLength, 100))
		if (l.fNumber !== undefined) exif.set(TAG.FNUMBER, rational(l.fNumber, 100))
		if (l.focal35 !== undefined) exif.set(TAG.FOCAL_35MM, short(l.focal35))
	}

	if (meta.gps && typeof meta.gps.lat === 'number' && typeof meta.gps.lng === 'number') {
		gps.set(TAG.GPS_VERSION, { type: TYPE.BYTE, num: 4, data: new Uint8Array([2, 3, 0, 0]) })
		gps.set(TAG.GPS_LAT_REF, ascii(meta.gps.lat >= 0 ? 'N' : 'S'))
		gps.set(TAG.GPS_LAT, gpsRational(meta.gps.lat))
		gps.set(TAG.GPS_LNG_REF, ascii(meta.gps.lng >= 0 ? 'E' : 'W'))
		gps.set(TAG.GPS_LNG, gpsRational(meta.gps.lng))
	}

	// 预留指针位（值稍后填），这样 ifd0 的条目数在算偏移前就是最终值
	const hasExif = exif.size > 0
	const hasGps = gps.size > 0
	if (hasExif) ifd0.set(TAG.EXIF_POINTER, { type: TYPE.LONG, num: 1, data: new Uint8Array(4) })
	if (hasGps) ifd0.set(TAG.GPS_POINTER, { type: TYPE.LONG, num: 1, data: new Uint8Array(4) })

	// ── 布局：TIFF头(8) → IFD0条目 → IFD0数据 → Exif条目 → Exif数据 → GPS条目 → GPS数据
	const ifd0Rel = 8
	const ifd0EntriesSize = ifdEntriesSize(ifd0)
	const ifd0DataRel = ifd0Rel + ifd0EntriesSize

	// 先序列化子 IFD 以得知各自数据区大小；它们的起始偏移依赖 IFD0 数据区长度，
	// 而 IFD0 数据区长度又不依赖子 IFD，所以先算 IFD0 是安全的
	const ifd0Ser0 = serializeIfd(ifd0, ifd0DataRel, le)
	const exifRel = ifd0DataRel + ifd0Ser0.data.length
	const exifSer = hasExif ? serializeIfd(exif, exifRel + ifdEntriesSize(exif), le) : null
	const gpsRel = hasExif ? exifRel + ifdEntriesSize(exif) + exifSer.data.length : exifRel
	const gpsSer = hasGps ? serializeIfd(gps, gpsRel + ifdEntriesSize(gps), le) : null

	// 回填指针后重新序列化 IFD0（长度不变，因为指针条目已经占位了）
	if (hasExif) {
		const d = new Uint8Array(4)
		new DataView(d.buffer).setUint32(0, exifRel, le)
		ifd0.set(TAG.EXIF_POINTER, { type: TYPE.LONG, num: 1, data: d })
	}
	if (hasGps) {
		const d = new Uint8Array(4)
		new DataView(d.buffer).setUint32(0, gpsRel, le)
		ifd0.set(TAG.GPS_POINTER, { type: TYPE.LONG, num: 1, data: d })
	}
	const ifd0Ser = serializeIfd(ifd0, ifd0DataRel, le)

	// 拼 TIFF
	const parts = [ifd0Ser.entries, ifd0Ser.data]
	if (hasExif) parts.push(exifSer.entries, exifSer.data)
	if (hasGps) parts.push(gpsSer.entries, gpsSer.data)
	const bodyLen = parts.reduce((n, p) => n + p.length, 0)

	const tiff = new Uint8Array(8 + bodyLen)
	const tv = new DataView(tiff.buffer)
	tv.setUint16(0, le ? 0x4949 : 0x4d4d, false)
	tv.setUint16(2, 42, le)
	tv.setUint32(4, ifd0Rel, le)
	let p = 8
	for (const part of parts) { tiff.set(part, p); p += part.length }

	// 拼 APP1
	const payloadLen = 6 + tiff.length
	if (payloadLen + 2 > 0xffff) throw new Error('EXIF 数据过大，无法写入')
	const app1 = new Uint8Array(4 + payloadLen)
	const av = new DataView(app1.buffer)
	av.setUint16(0, APP1, false)
	av.setUint16(2, payloadLen + 2, false)
	app1.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 4)
	app1.set(tiff, 10)

	// 替换或插入 APP1
	const seg = parsed ? parsed.seg : findExifSegment(buf)
	const cutStart = seg ? seg.start : 2
	const cutEnd = seg ? seg.start + seg.length : 2
	const head = new Uint8Array(buf.slice(0, cutStart))
	const tail = new Uint8Array(buf.slice(cutEnd))
	const out = new Uint8Array(head.length + app1.length + tail.length)
	out.set(head, 0)
	out.set(app1, head.length)
	out.set(tail, head.length + app1.length)
	return out.buffer
}
