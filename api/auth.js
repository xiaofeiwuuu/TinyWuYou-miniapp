import request from './request.js'

/**
 * 微信小程序登录
 * @param {string} code - 微信登录凭证
 * @param {string} nickname - 用户昵称（可选）
 * @param {string} avatarUrl - 用户头像（可选）
 * @param {string} platform - 平台标识(weixin/xiaohongshu/douyin/alipay)
 * @param {string} inviterId - 邀请者ID（可选）
 */
export function wxLogin(code, nickname, avatarUrl, platform = 'weixin', inviterId) {
	return request({
		url: '/auth/wx-login',
		method: 'POST',
		data: {
			code,
			nickname,
			avatarUrl,
			platform,
			inviterId
		}
	})
}

/**
 * 刷新 token
 */
export function refreshToken() {
	return request({
		url: '/auth/refresh',
		method: 'POST'
	})
}

/**
 * 获取用户信息
 */
export function getUserInfo() {
	return request({
		url: '/auth/user-info',
		method: 'GET'
	})
}

/**
 * 登出
 */
export function logout() {
	return request({
		url: '/auth/logout',
		method: 'POST'
	})
}
