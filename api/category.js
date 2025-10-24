import request from './request.js'

/**
 * 获取图片分类列表 (头像/壁纸)
 */
export function getImageCategories() {
	return request({
		url: '/category/image-types',
		method: 'GET'
	})
}

/**
 * 获取分类列表 (按类型)
 */
export function getCategoryList(type, page = 1, pageSize = 50) {
	return request({
		url: '/category/list',
		method: 'GET',
		data: { type, page, pageSize }
	})
}

/**
 * 获取首页推荐分类及图片
 * 返回所有图片类型的分类，每个分类包含前10张图片
 */
export function getRecommendCategories() {
	return request({
		url: '/category/recommend',
		method: 'GET'
	})
}
