/**
 * 当前运行平台标识，与后端 platform_configs 表里的值一一对应。
 *
 * 抽出来是因为 App.vue 的启动登录和 request.js 的静默重登都要用，
 * 两边各写一份 #ifdef 迟早会不一致。
 */
export function getPlatform() {
	// #ifdef MP-XHS
	return 'xiaohongshu'
	// #endif
	// #ifdef MP-DOUYIN
	return 'douyin'
	// #endif
	// #ifdef MP-ALIPAY
	return 'alipay'
	// #endif
	return 'weixin'
}
