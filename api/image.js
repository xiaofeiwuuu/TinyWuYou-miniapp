import request from './request.js'

/**
 * 随机取图（首页「推荐壁纸」九宫格用，刷新换一批）。
 *
 * ⚠️ 放主包 api 而不是 packWallpaper 分包：首页在主包，
 * 主包同步 require 分包模块在小程序里会报 "module is not defined"
 * （分包按需加载，主包启动时分包还没就绪）。反过来分包可以引用主包。
 *
 * @param {Object} params
 * @param {string} [params.imageType] - 限定某图片类型
 * @param {string} [params.orientation] - 朝向，'portrait' 只取竖图类型（由后台图片类型配置决定）
 * @param {number} [params.limit=9] - 数量
 */
export function getRandomImages(params = {}) {
	return request({
		url: '/image/random',
		method: 'GET',
		data: params
	})
}
