import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAppInfo } from '@/api/appInfo.js'
import $mAssetsPath from '@/config/assets.config.js'

/**
 * 小程序信息配置。
 *
 * 名称、Logo、分享文案、联系方式、公告都由后台「运营管理 → 小程序信息」维护，
 * 改完即时生效，不用重新发布小程序。
 *
 * 每一项都有本地兜底：接口挂了或还没回来时界面照常显示，
 * 不会出现空白标题或空分享卡片。这也是为什么这里不做"加载中"状态——
 * 调用方任何时候读到的都是可用的值。
 */

/** 缓存键。冷启动先用缓存渲染，避免首屏标题闪一下 */
const CACHE_KEY = '__app_info__'
/** 已读公告的版本号 */
const SEEN_KEY = '__announcement_seen__'

const FALLBACK = {
	appName: 'TinyWuYou-壁纸',
	shareTitle: 'TinyWuYou-壁纸 精美壁纸头像等你来拿！',
	logo: '',
	contact: { wechat: '', email: '', workTime: '' },
	announcement: { enabled: false }
}

export const useAppInfoStore = defineStore('appInfo', () => {
	const info = ref({ ...FALLBACK })
	const isLoaded = ref(false)
	let loading = null

	// 读缓存。放在这里而不是 fetch 里，是为了让第一帧就有值可用
	try {
		const cached = uni.getStorageSync(CACHE_KEY)
		if (cached) info.value = { ...FALLBACK, ...JSON.parse(cached) }
	} catch (error) {
		console.error('[AppInfo] 读取缓存失败:', error)
	}

	const appName = computed(() => info.value.appName || FALLBACK.appName)

	// 分享文案没配就退回小程序名，不要让分享卡片出现空标题
	const shareTitle = computed(() => info.value.shareTitle || appName.value)

	// 后台没传 Logo 就用包内自带的，外部地址加载不出来时也有东西可显示
	const logo = computed(() => info.value.logo || $mAssetsPath.appLogo)

	const contact = computed(() => info.value.contact || FALLBACK.contact)

	/**
	 * 当前是否有该弹的公告。
	 *
	 * 按 version 判断而不是"弹过就不再弹"：运营改了内容把版本号 +1，
	 * 已经看过的人会再看到一次；不改版本号就每人只弹一次。
	 */
	const pendingAnnouncement = computed(() => {
		const a = info.value.announcement
		if (!a || !a.enabled || !a.content) return null

		let seen = 0
		try {
			seen = Number(uni.getStorageSync(SEEN_KEY)) || 0
		} catch (error) {
			console.error('[AppInfo] 读取公告已读版本失败:', error)
		}

		return Number(a.version) > seen ? a : null
	})

	/** 标记当前公告已读 */
	const markAnnouncementSeen = () => {
		const a = info.value.announcement
		if (!a || !a.version) return
		try {
			uni.setStorageSync(SEEN_KEY, Number(a.version))
		} catch (error) {
			console.error('[AppInfo] 记录公告已读失败:', error)
		}
	}

	/**
	 * 拉取配置。并发调用只会真正请求一次。
	 */
	const fetchInfo = async (force = false) => {
		if (isLoaded.value && !force) return info.value
		if (loading && !force) return loading

		loading = (async () => {
			try {
				const res = await getAppInfo()
				if (res && res.code === 0 && res.data) {
					info.value = { ...FALLBACK, ...res.data }
					isLoaded.value = true
					uni.setStorageSync(CACHE_KEY, JSON.stringify(res.data))
				} else {
					console.error('[AppInfo] 返回异常:', res)
				}
				return info.value
			} catch (error) {
				// 失败不抛出：调用方拿到的仍是兜底值，界面不受影响
				console.error('[AppInfo] 获取失败，使用本地兜底:', error)
				return info.value
			} finally {
				// 失败也要释放，否则后续调用永远拿到这个失败的 promise
				loading = null
			}
		})()

		return loading
	}

	return {
		info,
		isLoaded,
		appName,
		shareTitle,
		logo,
		contact,
		pendingAnnouncement,
		markAnnouncementSeen,
		fetchInfo
	}
})
