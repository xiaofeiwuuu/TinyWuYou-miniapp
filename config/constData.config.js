import $mAssetsPath from './assets.config.js'
export default {
	// 验证码发送间隔
	sendCodeTime: 60,

	// 金额符号
	moneySymbol: '￥',
	
	// 距离单位
	distanceUnit: 'km',

	// 每页条数
	pageSize: 20,
	
	// 个人中心
	userEntrys: [
		{ name: '卡密兑换', icon: $mAssetsPath.user1, url: 'redeemCode' },
		{ name: '我的收藏', icon: $mAssetsPath.user2, url: 'userCollect' },
		{ name: '常见问题', icon: $mAssetsPath.user3, url: 'question' },
		{ name: '关于我们', icon: $mAssetsPath.user4, url: 'aboutUs' }
	],
	
	userRestEntrys: [
		{ name: '在线客服', icon: $mAssetsPath.user5, openType: 'contact', isIcon: true },
		// { name: '我要吐槽', icon: $mAssetsPath.user6, url: 'feedback', isIcon: true },
		// { name: '技术热线', icon: $mAssetsPath.user7, url: '', isIcon: false },
	],
	
	aboutUs: [
		{ name: '用户协议', url: 'richText', params: {type: 'user_agreement'} },
		{ name: '隐私政策', url: 'richText', params: {type: 'privacy_policy'} },
		{ name: '侵权联系', url: 'richText', params: {type: ''} }
	],
	
	// 自定义tabBar
	tabbar: {
		"color": "#ccc", // 未选中字体颜色
		"selectedColor": "#FFFFFF", // 选择字体颜色
		"iconColor": "#ccc", // 图标默认颜色
		"selectedIconColor": "#111111", // 选中图标颜色
		"backgroundColor": "#333333", // 背景颜色
		"selectedBackground": "#fff",
		"list": [{
				"text": "首页", // 底部文字
				"iconPath": $mAssetsPath.tabBarIndex, // 未选择icon图标
				"selectedIconPath": $mAssetsPath.tabBarIndex1, // 选中icon图标
				"pagePath": "index" // 跳转路径Name
			},
			{
				"text": "文案",
				"iconPath": $mAssetsPath.tabBarClassify,
				"selectedIconPath": $mAssetsPath.tabBarClassify1,
				"pagePath": "classify"
			},
			{
				"text": "发现",
				"iconPath": $mAssetsPath.tabBarFind,
				"selectedIconPath": $mAssetsPath.tabBarFind1,
				"pagePath": "find"
			},
			{
				"text": "我的",
				"iconPath": $mAssetsPath.tabBarUser,
				"selectedIconPath": $mAssetsPath.tabBarUser1,
				"pagePath": "user"
			}
		]
	}
};