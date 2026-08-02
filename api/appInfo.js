import request from './request.js'

/**
 * 获取小程序信息配置（名称、Logo、分享文案、联系方式、公告）
 *
 * 这是个公开接口，不需要登录：导航栏标题和公告在登录完成前就要用，
 * 等拿到 token 再读会让首屏先空一拍。
 */
export function getAppInfo() {
	return request({
		url: '/app/info',
		method: 'GET'
	})
}
