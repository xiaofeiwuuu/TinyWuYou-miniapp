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

	const queryStr = encodeURIComponent(JSON.stringify(query))
	return new Promise((resolve, reject) => {
		uni[type]({
			url: `/${route.path}?query=${queryStr}`,
			success: resolve,
			fail: reject
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
