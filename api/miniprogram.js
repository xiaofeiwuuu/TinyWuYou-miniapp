import request from './request.js'

/**
 * 获取小程序推荐列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 */
export function getMiniProgramList(page = 1, pageSize = 20) {
	return request({
		url: '/miniprogram/list',
		method: 'GET',
		data: { page, pageSize }
	})
}
