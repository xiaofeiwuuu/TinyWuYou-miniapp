import request from './request.js'

/**
 * 微信小程序登录
 * @param {string} code - 微信登录凭证
 * @param {string} nickname - 用户昵称（可选）
 * @param {string} avatarUrl - 用户头像（可选）
 * @param {string} platform - 平台标识，目前仅支持 weixin
 * @param {string} inviteCode - 邀请码（来自分享链接，可选）
 */
export function wxLogin(code, nickname, avatarUrl, platform = 'weixin', inviteCode) {
	return request({
		url: '/auth/wx-login',
		method: 'POST',
		data: {
			code,
			nickname,
			avatarUrl,
			platform,
			inviteCode
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
