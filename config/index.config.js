const CONFIG = {
	// 开发环境配置
	development: {
		assetsPath: '/static/', // 静态资源路径
		// baseUrl: 'http://192.168.1.171:3000/api', // 后台接口请求地址（真机调试用 Mac 局域网 IP；换网络后 IP 会变，需同步改）
		baseUrl: 'https://server.xiaofeiwuuu.top/api', // 后台接口请求地址
		hostUrl: '', // H5地址(前端运行地址)
		websocketUrl: '', // websocket服务端地址
		weixinAppId: '' // 微信公众号appid
	},
	// 生产环境配置
	production: {
		assetsPath: '/static/', // 静态资源路径
		baseUrl: 'https://server.xiaofeiwuuu.top/api', // 后台接口请求地址
		hostUrl: '', // H5地址(前端运行地址)
		websocketUrl: '', // websocket服务端地址
		weixinAppId: '' // 微信公众号appid
	}
};
export default CONFIG[process.env.NODE_ENV];