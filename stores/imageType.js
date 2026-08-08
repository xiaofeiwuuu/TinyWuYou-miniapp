import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getImageTypes } from '@/api/category.js'
import { readCache, writeCache } from '@/util/storage-cache.js'

// 缓存 key（带版本号，结构变了就升版本让旧缓存失效）
const CACHE_KEY = 'imageTypes:v2'

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
	// 冷启动先用本地缓存把 types 填上，页面立即有数据可渲染（不用等网络）
	const types = ref(readCache(CACHE_KEY) || [])
	// 是否本次运行已从线上刷新过（缓存不算，缓存只是先垫着）
	const isLoaded = ref(false)
	let loading = null

	/**
	 * 拉取类型配置（SWR）：
	 * - 有缓存 → 立即返回缓存，同时后台请求线上刷新并回写；
	 * - 无缓存（首次安装）→ 等线上返回；
	 * 并发调用只会真正请求一次。
	 */
	const fetchTypes = async (force = false) => {
		// 本次已从线上刷新过，直接用内存
		if (isLoaded.value && !force) return types.value

		// 已有一个请求在飞：有缓存就不等（后台那次会更新），无缓存才等它
		if (loading && !force) {
			return types.value.length ? types.value : loading
		}

		loading = (async () => {
			try {
				const res = await getImageTypes()
				if (res && res.code === 0 && Array.isArray(res.data)) {
					types.value = res.data
					isLoaded.value = true
					writeCache(CACHE_KEY, res.data) // 刷新本地缓存供下次冷启动用
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

		// SWR：有缓存立即返回缓存，让页面先渲染；线上刷新在后台跑完自动更新响应式 types
		if (types.value.length && !force) return types.value
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
