/**
 * 当前运行平台标识，与后端 platform_configs 表里的值一一对应。
 *
 * 抽出来是因为 App.vue 的启动登录和 request.js 的静默重登都要用，
 * 两边各写一份迟早会不一致。
 *
 * 目前只支持微信：小红书 / 抖音 / 支付宝的小程序都要求企业主体才能发布，
 * 个人开发者只有微信这一条路。原来这里按 #ifdef 返回过那三个平台标识，
 * 但后端的 ALLOWED_PLATFORMS 已经只认 weixin，返回别的只会拿到
 * "不支持的平台"而不是一个能排查的错误。
 *
 * 以后真要做多平台：这里加 #ifdef 分支，后端 ALLOWED_PLATFORMS
 * 和 buildPlatformRequest / parseOpenIdFromResponse 同步加即可。
 */
export function getPlatform() {
	return 'weixin'
}
