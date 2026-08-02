/**
 * 项目内路由封装（替代原 fusions-ui openRouter）
 * $openPage({name: 'my', query: {id: 123}, type: 'navigateTo'}) 或 $openPage('my')
 * 接收页通过 $parseURL(options.query) 解析参数
 * pages.json 中每个页面必须配置 name 字段
 */
import pagesJson from '@/pages.json'

const VALID_TYPES = ['navigateTo', 'switchTab', 'reLaunch', 'redirectTo']

function buildRoutes() {
	const routes = []
	;(pagesJson.pages || []).forEach(page => {
		if (!page.name) throw Error(`页面缺少 name 配置: ${JSON.stringify(page)}`)
		routes.push({ name: page.name, path: page.path, type: page.type })
	})
	;(pagesJson.subPackages || []).forEach(pkg => {
		pkg.pages.forEach(page => {
			if (!page.name) throw Error(`页面缺少 name 配置: ${JSON.stringify(page)}`)
			routes.push({ name: page.name, path: `${pkg.root}/${page.path}`, type: page.type })
		})
	})
	return routes
}

const routes = buildRoutes()

/**
 * 跳转期间的重复点击保护。
 *
 * 从点下去到新页面出现中间有几百毫秒：navigateTo 的转场动画，
 * 首次进分包还要等分包下载完。这段时间界面上没有任何反馈，
 * 用户会以为没点上而连点几下，而每一下都会真的压一个页面进栈——
 * 微信页面栈上限是 10 层，连点几下不但返回时要按好几次，
 * 点满还会直接 navigateTo:fail webview count limit exceeded。
 */
let navigating = false

/** 兜底释放：万一 uni 的回调没回来，不能让整个 App 从此跳不动 */
const NAV_TIMEOUT = 5000

/**
 * 超过这个时间还没跳成功，才显示带遮罩的 loading。
 * 不立刻显示是因为大多数跳转在 200ms 内就完成了，
 * 立刻显示会闪一下，反而比没有更难受。
 */
const LOADING_DELAY = 200

export function openPage(args) {
	let name, query = {}, type
	if (typeof args === 'string') {
		name = args
	} else if (args && typeof args === 'object') {
		({ name, type, query = {} } = args)
	} else {
		throw new Error('参数必须是对象或者字符串')
	}

	const route = routes.find(item => item.name === name)
	if (!route) throw new Error(`没有${name}页面`)

	type = type || route.type || 'navigateTo'
	if (!VALID_TYPES.includes(type)) {
		throw new Error(`name:${name}的type必须是${VALID_TYPES.join('/')}之一`)
	}

	// 上一次跳转还没落地就再点，直接忽略。
	// 这里 resolve 而不是 reject：调用方普遍不接 catch，抛出去只会变成未处理的拒绝。
	if (navigating) {
		console.warn(`[Router] 上一次跳转还没完成，忽略本次: ${name}`)
		return Promise.resolve()
	}
	navigating = true

	let loadingShown = false
	const loadingTimer = setTimeout(() => {
		loadingShown = true
		uni.showLoading({ title: '加载中', mask: true })
	}, LOADING_DELAY)

	// 回调没回来也要释放，否则整个 App 卡死在"跳转中"
	const safetyTimer = setTimeout(() => {
		console.warn(`[Router] 跳转回调超时，强制释放: ${name}`)
		cleanup()
	}, NAV_TIMEOUT)

	function cleanup() {
		clearTimeout(loadingTimer)
		clearTimeout(safetyTimer)
		// 只有真的显示过才关，否则会触发"showLoading 与 hideLoading 必须配对使用"
		if (loadingShown) {
			loadingShown = false
			uni.hideLoading()
		}
		navigating = false
	}

	const queryStr = encodeURIComponent(JSON.stringify(query))
	return new Promise((resolve, reject) => {
		uni[type]({
			url: `/${route.path}?query=${queryStr}`,
			success: (res) => {
				cleanup()
				resolve(res)
			},
			fail: (err) => {
				cleanup()
				reject(err)
			}
		})
	})
}

export function parseURL(query) {
	if (!query) return {}
	return JSON.parse(decodeURIComponent(query))
}

export default {
	install(app) {
		app.config.globalProperties.$openPage = openPage
		app.config.globalProperties.$parseURL = parseURL
	}
}
