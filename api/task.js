import request from './request.js'

/**
 * 获取任务列表
 */
export function getTaskList() {
	return request({
		url: '/task/list',
		method: 'GET'
	})
}




/**
 * 每日签到
 */
export function signIn() {
	return request({
		url: '/task/sign-in',
		method: 'POST'
	})
}

/**
 * 检查今日是否已签到
 */
export function checkSignIn() {
	return request({
		url: '/task/check-sign',
		method: 'GET'
	})
}

/**
 * 看广告增加下载次数
 */
export function adReward() {
	return request({
		url: '/user/ad-reward',
		method: 'POST'
	})
}
