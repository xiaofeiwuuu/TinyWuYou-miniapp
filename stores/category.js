import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getImageCategories, getRecommendCategories } from '@/api/category.js'
import { readCache, writeCache, removeCache } from '@/util/storage-cache.js'

// 缓存 key（带版本号，结构变了就升版本让旧缓存失效）
const CATEGORIES_KEY = 'imageCategories:v1'
const RECOMMEND_KEY = 'recommendImages:v1'

/**
 * 分类数据 Store
 * 管理所有分类数据和推荐数据，避免重复请求
 */
export const useCategoryStore = defineStore('category', () => {
	// 状态（冷启动先用本地缓存垫上，页面立即有数据，避免白屏）
	const categories = ref(readCache(CATEGORIES_KEY)) // 原始分类数据 { avatar: [], wallpaper: [], text: [], ... }
	const recommendData = ref(readCache(RECOMMEND_KEY)) // 推荐数据 { avatar: [images], wallpaper: [images], ... }
	const loading = ref(false)
	const recommendLoading = ref(false)
	const error = ref(null)
	// 本次运行是否已从线上刷新过（缓存 hydrate 不算，只是先垫着，仍需 revalidate）
	let categoriesRevalidated = false
	let recommendRevalidated = false

	// 计算属性 - 壁纸分类列表（用于 tabs）
	const wallpaperList = computed(() => {
		if (!categories.value || !categories.value.wallpaper) return []
		return categories.value.wallpaper.map(item => ({
			id: item.id,
			name: item.name
		}))
	})

	// 计算属性 - 头像分类列表
	const avatarList = computed(() => {
		if (!categories.value || !categories.value.avatar) return []
		return categories.value.avatar.map(item => ({
			id: item.id,
			name: item.name
		}))
	})

	// 计算属性 - 文案分类列表
	const textList = computed(() => {
		if (!categories.value || !categories.value.text) return []
		return categories.value.text.map(item => ({
			id: item.id,
			name: item.name
		}))
	})

	// 计算属性 - 全部分类列表（用于其他页面）
	const allCategories = computed(() => {
		if (!categories.value) return []
		const result = []
		if (categories.value.avatar) {
			result.push(...categories.value.avatar)
		}
		if (categories.value.wallpaper) {
			result.push(...categories.value.wallpaper)
		}
		return result
	})

	// 是否已加载数据
	const isLoaded = computed(() => categories.value !== null)
	const isRecommendLoaded = computed(() => recommendData.value !== null)

	// 获取推荐数据（SWR：有缓存先用、后台刷新；无缓存才等线上）
	const fetchRecommendData = async (force = false) => {
		// 本次已从线上刷新过，直接用内存
		if (recommendRevalidated && !force) {
			return recommendData.value
		}

		const hasCache = recommendData.value !== null

		// 已有请求在飞：有缓存就不等（那次会更新），无缓存才轮询等它
		if (recommendLoading.value) {
			if (hasCache && !force) return recommendData.value
			let waitCount = 0
			while (recommendLoading.value && waitCount < 100) {
				await new Promise(resolve => setTimeout(resolve, 100))
				waitCount++
			}
			return recommendData.value
		}

		recommendLoading.value = true

		const task = (async () => {
			try {
				console.log('[CategoryStore] 开始获取推荐数据')
				const res = await getRecommendCategories()
				if (res.code === 0) {
					recommendData.value = res.data
					recommendRevalidated = true
					writeCache(RECOMMEND_KEY, res.data) // 回写缓存供下次冷启动用
					console.log('[CategoryStore] ✅ 推荐数据加载成功')
				} else {
					throw new Error(res.message || '获取推荐数据失败')
				}
			} catch (err) {
				console.error('[CategoryStore] ❌ 获取推荐数据失败:', err)
				// 有缓存兜底就不抛（用旧数据先顶着）；无缓存才把错误抛给页面
				if (!hasCache) throw err
			} finally {
				recommendLoading.value = false
			}
		})()

		// SWR：有缓存立即返回，刷新在后台跑；无缓存则等这次
		if (hasCache && !force) return recommendData.value
		await task
		return recommendData.value
	}

	// 获取分类数据（SWR：有缓存先用、后台刷新；无缓存才等线上）
	const fetchCategories = async (force = false) => {
		// 本次已从线上刷新过，直接用内存
		if (categoriesRevalidated && !force) {
			return categories.value
		}

		const hasCache = categories.value !== null

		// 已有请求在飞：有缓存就不等（那次会更新），无缓存才轮询等它
		if (loading.value) {
			if (hasCache && !force) return categories.value
			let waitCount = 0
			while (loading.value && waitCount < 100) {
				await new Promise(resolve => setTimeout(resolve, 100))
				waitCount++
			}
			return categories.value
		}

		loading.value = true
		error.value = null

		const task = (async () => {
			try {
				console.log('[CategoryStore] 开始获取分类数据')
				const res = await getImageCategories()
				if (res.code === 0) {
					categories.value = res.data
					categoriesRevalidated = true
					writeCache(CATEGORIES_KEY, res.data) // 回写缓存供下次冷启动用
					console.log('[CategoryStore] ✅ 分类数据加载成功')
				} else {
					throw new Error(res.message || '获取分类失败')
				}
			} catch (err) {
				console.error('[CategoryStore] ❌ 获取分类失败:', err)
				error.value = err.message || '获取分类失败'
				// 有缓存兜底就不抛（用旧数据先顶着）；无缓存才把错误抛给页面
				if (!hasCache) throw err
			} finally {
				loading.value = false
			}
		})()

		// SWR：有缓存立即返回，刷新在后台跑；无缓存则等这次
		if (hasCache && !force) return categories.value
		await task
		return categories.value
	}

	// 清除缓存（含本地持久缓存），下次会重新从线上拉
	const clearCache = () => {
		console.log('[CategoryStore] 清除所有缓存')
		categories.value = null
		recommendData.value = null
		error.value = null
		categoriesRevalidated = false
		recommendRevalidated = false
		removeCache(CATEGORIES_KEY)
		removeCache(RECOMMEND_KEY)
	}

	// 根据 ID 查找分类
	const getCategoryById = (id, type = 'wallpaper') => {
		if (!categories.value || !categories.value[type]) return null
		return categories.value[type].find(item => item.id === id)
	}

	return {
		// 状态
		categories,
		recommendData,
		loading,
		recommendLoading,
		error,
		isLoaded,
		isRecommendLoaded,

		// 计算属性
		wallpaperList,
		avatarList,
		textList,
		allCategories,

		// 方法
		fetchCategories,
		fetchRecommendData,
		clearCache,
		getCategoryById
	}
})
