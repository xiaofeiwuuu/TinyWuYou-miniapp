import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getImageCategories, getRecommendCategories } from '@/api/category.js'

/**
 * 分类数据 Store
 * 管理所有分类数据和推荐数据，避免重复请求
 */
export const useCategoryStore = defineStore('category', () => {
	// 状态
	const categories = ref(null) // 原始分类数据 { avatar: [], wallpaper: [], text: [], ... }
	const recommendData = ref(null) // 推荐数据 { avatar: [images], wallpaper: [images], ... }
	const loading = ref(false)
	const recommendLoading = ref(false)
	const error = ref(null)

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

	// 获取推荐数据
	const fetchRecommendData = async (force = false) => {
		// 如果已经有数据且不是强制刷新，直接返回
		if (isRecommendLoaded.value && !force) {
			console.log('[CategoryStore] 使用推荐数据缓存')
			return recommendData.value
		}

		// 如果正在加载，等待加载完成
		if (recommendLoading.value) {
			console.log('[CategoryStore] 等待推荐数据加载完成...')
			let waitCount = 0
			while (recommendLoading.value && waitCount < 100) {
				await new Promise(resolve => setTimeout(resolve, 100))
				waitCount++
			}
			return recommendData.value
		}

		recommendLoading.value = true

		try {
			console.log('[CategoryStore] 开始获取推荐数据')
			const res = await getRecommendCategories()

			if (res.code === 0) {
				recommendData.value = res.data
				console.log('[CategoryStore] ✅ 推荐数据加载成功')
				console.log('[CategoryStore] - avatar:', res.data.avatar?.length || 0)
				console.log('[CategoryStore] - wallpaper:', res.data.wallpaper?.length || 0)
				console.log('[CategoryStore] - pc_wallpaper:', res.data.pc_wallpaper?.length || 0)
				console.log('[CategoryStore] - emoji:', res.data.emoji?.length || 0)
				console.log('[CategoryStore] - sticker:', res.data.sticker?.length || 0)
				return recommendData.value
			} else {
				throw new Error(res.message || '获取推荐数据失败')
			}
		} catch (err) {
			console.error('[CategoryStore] ❌ 获取推荐数据失败:', err)
			throw err
		} finally {
			recommendLoading.value = false
		}
	}

	// 获取分类数据
	const fetchCategories = async (force = false) => {
		// 如果已经有数据且不是强制刷新，直接返回
		if (isLoaded.value && !force) {
			console.log('[CategoryStore] 使用缓存数据')
			return categories.value
		}

		// 如果正在加载，等待加载完成
		if (loading.value) {
			console.log('[CategoryStore] 等待加载完成...')
			// 轮询等待加载完成（最多等待10秒）
			let waitCount = 0
			while (loading.value && waitCount < 100) {
				await new Promise(resolve => setTimeout(resolve, 100))
				waitCount++
			}
			return categories.value
		}

		loading.value = true
		error.value = null

		try {
			console.log('[CategoryStore] 开始获取分类数据')
			const res = await getImageCategories()

			if (res.code === 0) {
				categories.value = res.data
				console.log('[CategoryStore] ✅ 分类数据加载成功')
				console.log('[CategoryStore] - 头像分类:', res.data.avatar?.length || 0)
				console.log('[CategoryStore] - 壁纸分类:', res.data.wallpaper?.length || 0)
				return categories.value
			} else {
				throw new Error(res.message || '获取分类失败')
			}
		} catch (err) {
			console.error('[CategoryStore] ❌ 获取分类失败:', err)
			error.value = err.message || '获取分类失败'
			throw err
		} finally {
			loading.value = false
		}
	}

	// 清除缓存
	const clearCache = () => {
		console.log('[CategoryStore] 清除所有缓存')
		categories.value = null
		recommendData.value = null
		error.value = null
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
