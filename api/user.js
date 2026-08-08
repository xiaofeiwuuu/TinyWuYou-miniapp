import request from './request.js'

/**
 * 获取用户资料(小程序专用)
 */
export function getUserProfile() {
	return request({
		url: '/user/profile',
		method: 'GET'
	})
}

/**
 * 修改个人资料
 *
 * 头像传的是"已收藏图片的 ID"而不是 URL：后端只认收藏里的图，
 * 不开放上传，也不接受外链地址。
 *
 * @param {Object} data
 * @param {string} [data.nickname]      新昵称，1-20 字
 * @param {number} [data.avatarImageId] 用作头像的图片 ID，必须已收藏
 */
export function updateUserProfile(data) {
	return request({
		url: '/user/profile',
		method: 'PUT',
		data
	})
}

/**
 * 收藏图片
 * @param {number} imageId - 图片ID
 */
export function collectImage(imageId) {
	return request({
		url: '/user/collect',
		method: 'POST',
		data: { imageId }
	})
}

/**
 * 取消收藏
 * @param {number} imageId - 图片ID
 */
export function uncollectImage(imageId) {
	return request({
		url: '/user/uncollect',
		method: 'POST',
		data: { imageId }
	})
}

/**
 * 下载预检（点击下载时先调）：只校验能不能下（VIP/次数/每日上限），不扣次数。
 * @param {number} imageId - 图片ID
 */
export function precheckDownload(imageId) {
	return request({
		url: '/user/download/precheck',
		method: 'POST',
		data: { imageId }
	})
}

/**
 * 确认下载（图片保存到相册成功后才调）：此时才扣次数、累加下载量。
 * @param {number} imageId - 图片ID
 */
export function downloadImage(imageId) {
	return request({
		url: '/user/download',
		method: 'POST',
		data: { imageId }
	})
}

/**
 * 获取收藏列表
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 */
export function getCollections(page = 1, pageSize = 20) {
	return request({
		url: '/user/collections',
		method: 'GET',
		data: { page, pageSize }
	})
}

/**
 * 检查图片是否已收藏
 * @param {number} imageId - 图片ID
 */
export function checkCollected(imageId) {
	return request({
		url: '/user/check-collected',
		method: 'GET',
		data: { imageId }
	})
}
