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
 * 完成任务
 * @param {number} taskId - 任务ID
 */
export function completeTask(taskId) {
	return request({
		url: '/task/complete',
		method: 'POST',
		data: {
			taskId
		}
	})
}

/**
 * 获取任务完成记录
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 */
export function getTaskRecords(page = 1, pageSize = 20) {
	return request({
		url: '/task/records',
		method: 'GET',
		data: {
			page,
			pageSize
		}
	})
}

/**
 * 获取今日已完成的任务
 */
export function getTodayCompletedTasks() {
	return request({
		url: '/task/today-completed',
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
