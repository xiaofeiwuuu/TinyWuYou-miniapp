import request from '@/api/request.js'

/**
 * 激活VIP卡密
 * @param {string} cardCode - VIP卡密
 */
export function activateVipCardApi(cardCode) {
	return request({
		url: '/vip/activate',
		method: 'POST',
		data: {
			cardCode
		}
	})
}

/**
 * 获取VIP状态
 */
export function getVipStatusApi() {
	return request({
		url: '/vip/status',
		method: 'GET'
	})
}

/**
 * 获取VIP激活历史记录
 */
export function getVipHistoryApi() {
	return request({
		url: '/vip/history',
		method: 'GET'
	})
}
