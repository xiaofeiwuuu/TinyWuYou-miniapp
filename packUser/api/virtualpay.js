import request from '@/api/request.js'

/**
 * 虚拟支付商品列表（VIP 套餐 / 下载次数包）
 */
export function getVirtualProducts() {
	return request({
		url: '/virtualpay/products',
		method: 'GET'
	})
}

/**
 * 下单：传商品 productId + 一个新鲜的 wx.login code。
 * 后端用 code 换 session_key 算 signature，返回 signData/paySig/signature 供拉起支付。
 * @param {string} productId
 * @param {string} code - wx.login() 拿到的 code
 */
export function createVirtualOrder(productId, code) {
	return request({
		url: '/virtualpay/order',
		method: 'POST',
		data: { productId, code }
	})
}

/**
 * 支付成功后确认：后端向微信查单，已支付则立即发货（回调丢失时的兜底）。
 * @param {string} outTradeNo
 */
export function confirmVirtualOrder(outTradeNo) {
	return request({
		url: '/virtualpay/confirm',
		method: 'POST',
		data: { outTradeNo }
	})
}
