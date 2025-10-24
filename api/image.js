import request from './request.js'

/**
 * 获取图片列表
 * @param {Object} params - 查询参数
 * @param {number} params.categoryId - 分类ID
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.sortBy - 排序方式 (latest/hot/recommend)
 */
export function getImageList(params) {
	return request({
		url: '/image/list',
		method: 'GET',
		data: params
	})
}

/**
 * 获取图片详情
 * @param {number} id - 图片ID
 */
export function getImageDetail(id) {
	return request({
		url: `/image/${id}`,
		method: 'GET'
	})
}

/**
 * 获取推荐图片列表
 * @param {string} imageType - 图片类型 (avatar/wallpaper/emoji/sticker/pc_wallpaper)
 * @param {number} limit - 数量限制
 */
export function getRecommendImages(imageType, limit = 10) {
	return request({
		url: '/image/recommend/list',
		method: 'GET',
		data: { imageType, limit }
	})
}

/**
 * 获取热门图片列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 */
export function getHotImages(page = 1, pageSize = 20) {
	return request({
		url: '/image/hot/list',
		method: 'GET',
		data: { page, pageSize }
	})
}

/**
 * 搜索图片
 * @param {string} keyword - 搜索关键词
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 */
export function searchImages(keyword, page = 1, pageSize = 20) {
	return request({
		url: '/image/search',
		method: 'GET',
		data: { keyword, page, pageSize }
	})
}
