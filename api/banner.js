import request from './request.js'

/**
 * 首页轮播图（公开接口，只返回启用中的，已按排序 sortOrder 倒序）。
 *
 * 返回 data.list，每项：
 *   { id, imageUrl(完整地址), categoryId, categoryName, imageType }
 *
 * categoryId / imageType 为空字符串或 null 表示这张图只展示、不可跳转
 * （关联的图片分类已被删除或禁用），前端点击时应忽略。
 */
export function getBanners() {
	return request({
		url: '/banner/list',
		method: 'GET'
	})
}
