import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getImageTypes } from '@/api/category.js'

/**
 * 图片类型配置。
 *
 * 类型不再写死在前端，而是后台「内容管理 → 图片类型」里配的，
 * 每个类型带一个朝向（竖图/横图/方图），列表页据此决定网格布局。
 * 这样后台新增类型时，小程序不用改代码也不用发版。
 */

/** 朝向 → 网格参数。与各页面原有的写死布局一一对应 */
const GRID_BY_ORIENTATION = {
	// 方图：三列正方形（头像、表情包、贴纸）
	square: { column: 3, multiple: 1 },
	// 竖图：三列，高是宽的两倍（手机壁纸）
	portrait: { column: 3, multiple: 2 },
	// 横图：两列，高是宽的 0.7（平板/电脑壁纸）
	landscape: { column: 2, multiple: 0.7 }
}

/** 拿不到配置时的兜底，按最通用的方图处理 */
const DEFAULT_GRID = GRID_BY_ORIENTATION.square

export const useImageTypeStore = defineStore('imageType', () => {
	const types = ref([])
	const isLoaded = ref(false)
	let loading = null

	/**
	 * 拉取类型配置。并发调用只会真正请求一次。
	 */
	const fetchTypes = async (force = false) => {
		if (isLoaded.value && !force) return types.value
		if (loading && !force) return loading

		loading = (async () => {
			try {
				const res = await getImageTypes()
				if (res && res.code === 0 && Array.isArray(res.data)) {
					types.value = res.data
					isLoaded.value = true
				} else {
					console.error('[ImageTypeStore] 返回异常:', res)
				}
				return types.value
			} catch (error) {
				console.error('[ImageTypeStore] 获取图片类型失败:', error)
				return types.value
			} finally {
				// 失败也要释放，否则后续调用永远拿到这个失败的 promise
				loading = null
			}
		})()

		return loading
	}

	/** 取某个类型的朝向，取不到返回 square */
	const getOrientation = (code) => {
		const hit = types.value.find((t) => t.code === code)
		return (hit && hit.orientation) || 'square'
	}

	/** 取某个类型的网格参数（列数 + 高宽比） */
	const getGridConfig = (code) => {
		return GRID_BY_ORIENTATION[getOrientation(code)] || DEFAULT_GRID
	}

	/** 取某个类型的中文名 */
	const getTypeName = (code) => {
		const hit = types.value.find((t) => t.code === code)
		return (hit && hit.name) || ''
	}

	return {
		types,
		isLoaded,
		fetchTypes,
		getOrientation,
		getGridConfig,
		getTypeName
	}
})
