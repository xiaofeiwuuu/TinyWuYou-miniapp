import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserProfile } from '@/api/user.js'

/**
 * 用户信息 Store
 * 管理用户信息,避免页面闪烁和重复请求
 */
export const useUserStore = defineStore('user', () => {
	// 状态
	const userInfo = ref(null)
	const loading = ref(false)
	const error = ref(null)

	// 计算属性 - 是否已登录
	const isLoggedIn = computed(() => userInfo.value !== null)

	// 计算属性 - 是否VIP
	const isVip = computed(() => {
		if (!userInfo.value) return false
		const now = new Date()
		const expireTime = userInfo.value.vipExpireTime ? new Date(userInfo.value.vipExpireTime) : null
		return userInfo.value.isVip === 1 && expireTime && expireTime > now
	})

	// 计算属性 - VIP剩余天数
	const vipRemainingDays = computed(() => {
		if (!isVip.value || !userInfo.value.vipExpireTime) return 0
		const now = new Date()
		const expireDate = new Date(userInfo.value.vipExpireTime)
		const diffTime = expireDate.getTime() - now.getTime()
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
		return diffDays > 0 ? diffDays : 0
	})

	// 从缓存加载用户信息(初始化时使用)
	const loadFromCache = () => {
		try {
			const cachedUserInfo = uni.getStorageSync('userInfo')
			if (cachedUserInfo) {
				const parsed = JSON.parse(cachedUserInfo)
				userInfo.value = {
					id: parsed.id || '',
					nickname: parsed.nickname || '微信用户',
					avatarUrl: parsed.avatarUrl || 'https://picsum.photos/200/200',
					downloadCount: parsed.downloadCount || 0,
					userLevel: parsed.userLevel || 1,
					isVip: parsed.isVip || 0,
					vipExpireTime: parsed.vipExpireTime || null,
					totalDownloads: parsed.totalDownloads || 0,
					totalCollections: parsed.totalCollections || 0,
					createdAt: parsed.createdAt,
				}
				console.log('[UserStore] 从缓存加载用户信息成功')
				return true
			}
		} catch (error) {
			console.error('[UserStore] 从缓存加载用户信息失败:', error)
		}
		return false
	}

	// 从服务器获取用户信息
	const fetchUserInfo = async (force = false) => {
		// 如果已经有数据且不是强制刷新,先从缓存读取
		if (!force && !userInfo.value) {
			loadFromCache()
		}

		// 如果正在加载,等待加载完成
		if (loading.value) {
			console.log('[UserStore] 等待加载完成...')
			let waitCount = 0
			while (loading.value && waitCount < 50) {
				await new Promise(resolve => setTimeout(resolve, 100))
				waitCount++
			}
			return userInfo.value
		}

		loading.value = true
		error.value = null

		try {
			console.log('[UserStore] 开始从服务器获取用户信息')
			const res = await getUserProfile()

			if (res.code === 0 && res.data) {
				// 更新store
				userInfo.value = {
					id: res.data.id || '',
					nickname: res.data.nickname || '微信用户',
					avatarUrl: res.data.avatarUrl || 'https://picsum.photos/200/200',
					downloadCount: res.data.downloadCount || 0,
					userLevel: res.data.userLevel || 1,
					isVip: res.data.isVip || 0,
					vipExpireTime: res.data.vipExpireTime || null,
					totalDownloads: res.data.totalDownloads || 0,
					totalCollections: res.data.totalCollections || 0,
					createdAt: res.data.createdAt,
				}

				// 更新缓存
				uni.setStorageSync('userInfo', JSON.stringify(res.data))
				console.log('[UserStore] ✅ 用户信息更新成功')
				console.log('[UserStore] - VIP状态:', userInfo.value.isVip === 1 ? 'VIP' : '普通用户')
				console.log('[UserStore] - 下载次数:', userInfo.value.downloadCount)

				return userInfo.value
			} else {
				throw new Error(res.message || '获取用户信息失败')
			}
		} catch (err) {
			console.error('[UserStore] ❌ 获取用户信息失败:', err)
			error.value = err.message || '获取用户信息失败'
			// 如果服务器请求失败,尝试从缓存读取
			if (!userInfo.value) {
				loadFromCache()
			}
			throw err
		} finally {
			loading.value = false
		}
	}

	// 更新用户信息(用于VIP激活后等场景)
	const refreshUserInfo = async () => {
		return await fetchUserInfo(true)
	}

	// 清除用户信息(退出登录时使用)
	const clearUserInfo = () => {
		console.log('[UserStore] 清除用户信息')
		userInfo.value = null
		error.value = null
		uni.removeStorageSync('userInfo')
	}

	// 更新下载次数(下载后调用)
	const updateDownloadCount = (count) => {
		if (userInfo.value) {
			userInfo.value.downloadCount = count
			// 同步更新缓存
			const cached = uni.getStorageSync('userInfo')
			if (cached) {
				const parsed = JSON.parse(cached)
				parsed.downloadCount = count
				uni.setStorageSync('userInfo', JSON.stringify(parsed))
			}
		}
	}

	return {
		// 状态
		userInfo,
		loading,
		error,

		// 计算属性
		isLoggedIn,
		isVip,
		vipRemainingDays,

		// 方法
		loadFromCache,
		fetchUserInfo,
		refreshUserInfo,
		clearUserInfo,
		updateDownloadCount,
	}
})
