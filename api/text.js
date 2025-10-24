import request from './request.js'

/**
 * 获取文案列表
 * @param {Object} params - 查询参数
 * @param {number} params.categoryId - 分类ID
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.sortBy - 排序方式 (latest/recommend)
 */
export function getTextList(params) {
	return request({
		url: '/text/list',
		method: 'GET',
		data: params
	})
}

/**
 * 获取文案详情
 * @param {number} id - 文案ID
 */
export function getTextDetail(id) {
	return request({
		url: `/text/${id}`,
		method: 'GET'
	})
}

/**
 * 复制文案
 * @param {number} textId - 文案ID
 */
export function copyText(textId) {
	return request({
		url: '/text/copy',
		method: 'POST',
		data: { textId }
	})
}

/**
 * 获取推荐文案列表
 * @param {number} limit - 数量限制
 */
export function getRecommendTexts(limit = 10) {
	return request({
		url: '/text/recommend/list',
		method: 'GET',
		data: { limit }
	})
}

/**
 * 搜索文案
 * @param {string} keyword - 搜索关键词
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 */
export function searchTexts(keyword, page = 1, pageSize = 20) {
	return request({
		url: '/text/search/query',
		method: 'GET',
		data: { keyword, page, pageSize }
	})
}
