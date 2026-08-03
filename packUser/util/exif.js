/**
 * JPEG EXIF 读写（纯 JS，无依赖，可在小程序里跑）。
 *
 * 只做一件事：改写 IFD0 里的机型相关标签（Make / Model / Software），
 * 其余标签（拍摄时间、GPS、光圈快门等）原样保留。
 *
 * 为什么不用现成的 piexifjs：它依赖 btoa/atob，小程序里没有这两个全局函数；
 * 而且它整包 100KB+，我们只需要改三个标签，自己写反而更小更可控。
 *
 * ─── JPEG / EXIF 结构速记 ───
 * JPEG = FFD8(SOI) + 若干段 + ... + FFD9(EOI)
 * 每段 = FFxx(marker) + 2字节长度(含自身) + 数据
 * EXIF 存在 APP1 段(FFE1)里，数据部分 = "Exif\0\0" + TIFF 结构
 * TIFF = 字节序标记(II/MM) + 42 + IFD0偏移
 * IFD  = 条目数(2字节) + N×12字节条目 + 下一个IFD偏移(4字节)
 * 条目 = tag(2) + type(2) + count(4) + value或偏移(4)
 *        值总长 ≤4 字节时直接内联，否则存偏移，实际数据放在数据区
 *
 * 注意：所有偏移都相对 TIFF 头起点，不是文件起点。
 */

const SOI = 0xffd8
const APP1 = 0xffe1
const SOS = 0xffda // 图像数据开始，之后不再有元数据段

/** IFD0 里我们关心的 ASCII 标签 */
export const TAG = {
	MAKE: 0x010f,
	MODEL: 0x0110,
	SOFTWARE: 0x0131,
	DATETIME: 0x0132
}

const TYPE_ASCII = 2

/** 各 TIFF 数据类型占几个字节，用来算条目值的总长度 */
const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 }

class Reader {
	constructor(view, littleEndian) {
		this.view = view
		this.le = littleEndian
	}
	u16(off) { return this.view.getUint16(off, this.le) }
	u32(off) { return this.view.getUint32(off, this.le) }
}

/**
 * 找到 APP1(EXIF) 段。
 * 返回 { start, length }（含 marker 与长度字段），没有则返回 null。
 */
function findExifSegment(buf) {
	const view = new DataView(buf)
	if (view.getUint16(0) !== SOI) {
		throw new Error('不是有效的 JPEG 文件')
	}

	let pos = 2
	while (pos + 4 <= buf.byteLength) {
		const marker = view.getUint16(pos)
		// 段标记必须以 FF 开头；遇到 SOS 之后就是图像数据了
		if ((marker & 0xff00) !== 0xff00 || marker === SOS) break

		const segLen = view.getUint16(pos + 2)
		if (segLen < 2) break

		if (marker === APP1) {
			// APP1 也可能是 XMP，靠 "Exif\0\0" 头区分
			const head = new Uint8Array(buf, pos + 4, Math.min(6, segLen - 2))
			if (head[0] === 0x45 && head[1] === 0x78 && head[2] === 0x69 && head[3] === 0x66) {
				return { start: pos, length: 2 + segLen }
			}
		}
		pos += 2 + segLen
	}
	return null
}

/**
 * 解析 IFD0 的全部条目。
 * 返回 { entries, le, tiffStart, nextIfdOffset }
 */
function parseIfd0(buf, tiffStart) {
	const view = new DataView(buf)
	const byteOrder = view.getUint16(tiffStart)
	if (byteOrder !== 0x4949 && byteOrder !== 0x4d4d) {
		throw new Error('EXIF 字节序标记无效')
	}
	const le = byteOrder === 0x4949 // II = 小端
	const r = new Reader(view, le)

	if (r.u16(tiffStart + 2) !== 42) {
		throw new Error('EXIF TIFF 魔数无效')
	}

	const ifd0 = tiffStart + r.u32(tiffStart + 4)
	const count = r.u16(ifd0)
	const entries = []

	for (let i = 0; i < count; i++) {
		const off = ifd0 + 2 + i * 12
		const tag = r.u16(off)
		const type = r.u16(off + 2)
		const num = r.u32(off + 4)
		const size = (TYPE_SIZE[type] || 1) * num

		let data
		if (size <= 4) {
			data = new Uint8Array(buf.slice(off + 8, off + 8 + size))
		} else {
			const dataOff = tiffStart + r.u32(off + 8)
			data = new Uint8Array(buf.slice(dataOff, dataOff + size))
		}
		entries.push({ tag, type, num, data })
	}

	return { entries, le, nextIfdOffset: r.u32(ifd0 + 2 + count * 12) }
}

/** 读出机型信息，用于展示"当前是什么" */
export function readDeviceInfo(arrayBuffer) {
	const seg = findExifSegment(arrayBuffer)
	if (!seg) return null

	const tiffStart = seg.start + 4 + 6 // 跳过 marker+长度+"Exif\0\0"
	let parsed
	try {
		parsed = parseIfd0(arrayBuffer, tiffStart)
	} catch {
		return null
	}

	const out = {}
	const nameOf = { [TAG.MAKE]: 'make', [TAG.MODEL]: 'model', [TAG.SOFTWARE]: 'software', [TAG.DATETIME]: 'dateTime' }
	for (const e of parsed.entries) {
		const key = nameOf[e.tag]
		if (!key || e.type !== TYPE_ASCII) continue
		let s = ''
		for (let i = 0; i < e.data.length; i++) {
			if (e.data[i] === 0) break
			s += String.fromCharCode(e.data[i])
		}
		out[key] = s
	}
	return out
}

/** 把字符串转成以 \0 结尾的 ASCII 字节 */
function asciiBytes(str) {
	const s = String(str)
	const bytes = new Uint8Array(s.length + 1)
	for (let i = 0; i < s.length; i++) {
		// EXIF 的 ASCII 类型只允许 0-255，中文机型名会被截断成乱码，
		// 所以超出范围的字符直接换成 '?'，而不是写入一个坏值
		const code = s.charCodeAt(i)
		bytes[i] = code < 256 ? code : 0x3f
	}
	bytes[s.length] = 0
	return bytes
}

/**
 * 重建 IFD0 并组装出新的 JPEG。
 *
 * 采用"整体重建 IFD0"而不是"原地改字符串"：
 * 新机型名的长度几乎肯定和原来不同，原地改会破坏后续所有条目的偏移。
 * 重建时所有偏移重新计算，天然正确。
 *
 * 只重建 IFD0 本身。ExifIFD / GPS 这些子 IFD 通过指针标签引用，
 * 它们的数据在原始 TIFF 区域里，位置不变——所以这里保持
 * 原 TIFF 数据整体不动，只把 IFD0 换成新的，并让子 IFD 指针继续指向原处。
 */
function rebuild(arrayBuffer, seg, changes) {
	const tiffStart = seg.start + 4 + 6
	const { entries, le } = parseIfd0(arrayBuffer, tiffStart)

	// 应用修改：已存在就替换，不存在就新增
	const merged = entries.filter((e) => !(e.tag in changes))
	for (const tagStr of Object.keys(changes)) {
		const tag = Number(tagStr)
		const bytes = asciiBytes(changes[tagStr])
		merged.push({ tag, type: TYPE_ASCII, num: bytes.length, data: bytes })
	}
	// TIFF 规范要求 IFD 条目按 tag 升序
	merged.sort((a, b) => a.tag - b.tag)

	// 子 IFD 指针（ExifIFD 0x8769 / GPS 0x8825 / Interop 0xA005）指向原 TIFF 里的位置。
	// 我们把原 TIFF 整体保留在新 IFD0 之后，所以这些偏移需要按位移量修正。
	const oldIfd0Rel = new DataView(arrayBuffer).getUint32(tiffStart + 4, le)

	const count = merged.length
	const entriesSize = 2 + count * 12 + 4
	// 新 IFD0 紧跟在 TIFF 头(8字节)之后
	const newIfd0Rel = 8
	const dataStartRel = newIfd0Rel + entriesSize

	let dataArea = []
	let dataLen = 0
	const entryBufs = []

	for (const e of merged) {
		const size = (TYPE_SIZE[e.type] || 1) * e.num
		const buf = new ArrayBuffer(12)
		const dv = new DataView(buf)
		dv.setUint16(0, e.tag, le)
		dv.setUint16(2, e.type, le)
		dv.setUint32(4, e.num, le)

		if (size <= 4) {
			const arr = new Uint8Array(buf, 8, 4)
			arr.set(e.data.subarray(0, size))
		} else {
			dv.setUint32(8, dataStartRel + dataLen, le)
			dataArea.push(e.data)
			dataLen += size
			if (dataLen % 2) { dataArea.push(new Uint8Array(1)); dataLen += 1 }
		}
		entryBufs.push(new Uint8Array(buf))
	}

	// 原 TIFF 数据整体附在后面，用于承载子 IFD 等我们没有解析的部分
	const oldTiffLen = seg.start + seg.length - tiffStart
	const oldTiff = new Uint8Array(arrayBuffer.slice(tiffStart, tiffStart + oldTiffLen))
	const tailStartRel = dataStartRel + dataLen
	const shift = tailStartRel // 原 TIFF 起点在新结构里的相对位置

	// 修正子 IFD 指针：原值是相对原 TIFF 头的偏移，现在原 TIFF 整体后移了 shift
	for (const e of merged) {
		if (e.tag !== 0x8769 && e.tag !== 0x8825 && e.tag !== 0xa005) continue
		const idx = merged.indexOf(e)
		const dv = new DataView(entryBufs[idx].buffer)
		const old = dv.getUint32(8, le)
		dv.setUint32(8, old + shift, le)
	}

	// 拼装 TIFF：头 + IFD0 + 数据区 + 原 TIFF 全量
	const tiffLen = 8 + entriesSize + dataLen + oldTiff.length
	const tiff = new Uint8Array(tiffLen)
	const tv = new DataView(tiff.buffer)
	tv.setUint16(0, le ? 0x4949 : 0x4d4d, false)
	tv.setUint16(2, 42, le)
	tv.setUint32(4, newIfd0Rel, le)
	tv.setUint16(8, count, le)

	let p = 10
	for (const b of entryBufs) { tiff.set(b, p); p += 12 }
	tv.setUint32(p, 0, le) // 没有 IFD1（缩略图），置 0
	p += 4
	for (const d of dataArea) { tiff.set(d, p); p += d.length }
	tiff.set(oldTiff, p)

	// 组装 APP1 段
	const payloadLen = 6 + tiff.length
	if (payloadLen + 2 > 0xffff) {
		throw new Error('EXIF 数据过大，无法写入')
	}
	const app1 = new Uint8Array(4 + payloadLen)
	const av = new DataView(app1.buffer)
	av.setUint16(0, APP1, false)
	av.setUint16(2, payloadLen + 2, false)
	app1.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 4) // "Exif\0\0"
	app1.set(tiff, 10)

	// 用新 APP1 替换旧的
	const head = new Uint8Array(arrayBuffer.slice(0, seg.start))
	const tail = new Uint8Array(arrayBuffer.slice(seg.start + seg.length))
	const out = new Uint8Array(head.length + app1.length + tail.length)
	out.set(head, 0)
	out.set(app1, head.length)
	out.set(tail, head.length + app1.length)
	return out.buffer
}

/** 没有 EXIF 段时，新建一个只含机型信息的 APP1 插进去 */
function insertNew(arrayBuffer, changes) {
	const tags = Object.keys(changes).map((t) => ({
		tag: Number(t),
		type: TYPE_ASCII,
		data: asciiBytes(changes[t])
	})).sort((a, b) => a.tag - b.tag)

	const count = tags.length
	const entriesSize = 2 + count * 12 + 4
	const dataStartRel = 8 + entriesSize

	let dataLen = 0
	const dataArea = []
	const entryBufs = []
	for (const t of tags) {
		const size = t.data.length
		const buf = new ArrayBuffer(12)
		const dv = new DataView(buf)
		dv.setUint16(0, t.tag, true)
		dv.setUint16(2, t.type, true)
		dv.setUint32(4, size, true)
		if (size <= 4) {
			new Uint8Array(buf, 8, 4).set(t.data.subarray(0, size))
		} else {
			dv.setUint32(8, dataStartRel + dataLen, true)
			dataArea.push(t.data)
			dataLen += size
			if (dataLen % 2) { dataArea.push(new Uint8Array(1)); dataLen += 1 }
		}
		entryBufs.push(new Uint8Array(buf))
	}

	const tiff = new Uint8Array(8 + entriesSize + dataLen)
	const tv = new DataView(tiff.buffer)
	tv.setUint16(0, 0x4949, false)
	tv.setUint16(2, 42, true)
	tv.setUint32(4, 8, true)
	tv.setUint16(8, count, true)
	let p = 10
	for (const b of entryBufs) { tiff.set(b, p); p += 12 }
	tv.setUint32(p, 0, true)
	p += 4
	for (const d of dataArea) { tiff.set(d, p); p += d.length }

	const payloadLen = 6 + tiff.length
	const app1 = new Uint8Array(4 + payloadLen)
	const av = new DataView(app1.buffer)
	av.setUint16(0, APP1, false)
	av.setUint16(2, payloadLen + 2, false)
	app1.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 4)
	app1.set(tiff, 10)

	const head = new Uint8Array(arrayBuffer.slice(0, 2)) // SOI
	const tail = new Uint8Array(arrayBuffer.slice(2))
	const out = new Uint8Array(2 + app1.length + tail.length)
	out.set(head, 0)
	out.set(app1, 2)
	out.set(tail, 2 + app1.length)
	return out.buffer
}

/**
 * 写入机型信息，返回新的 ArrayBuffer。
 *
 * @param {ArrayBuffer} arrayBuffer 原始 JPEG
 * @param {Object} device { make, model, software }
 */
export function writeDeviceInfo(arrayBuffer, device) {
	const changes = {}
	if (device.make !== undefined) changes[TAG.MAKE] = device.make
	if (device.model !== undefined) changes[TAG.MODEL] = device.model
	if (device.software !== undefined) changes[TAG.SOFTWARE] = device.software
	if (Object.keys(changes).length === 0) return arrayBuffer

	const seg = findExifSegment(arrayBuffer)
	return seg ? rebuild(arrayBuffer, seg, changes) : insertNew(arrayBuffer, changes)
}
