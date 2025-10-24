import indexConfig from './index.config.js';
const PATH = indexConfig.assetsPath;
/*
 * 图片静态资源表，所有图片资源路径在这统一管理，不应该写死在页面中，该数据挂载到Vue原型中。
 * 页面使用：this.$mAssetsPath.grid_1
 * CSS背景：应尽量使用:style="" 行内样式设置背景图
 * PATH说明：本地路径或者服务器路径
 *
 * 举例：<image :src="grid_1">  需要在data中映射 grid_1: this.$mAssetsPath.grid_1
 *
 * 特别注意：经测试小程序中不支持 <image :src="$mAssetsPath.grid_1"> 该用法
 */

export default {
	// 应用LOGO
	appLogo: PATH + 'logo.png',
	
	// 素材
	banner: PATH + 'img/banner.png',
	mobile: PATH + 'img/mobile.jpeg',
	mobile1: PATH + 'img/mobile1.jpeg',
	mobile2: PATH + 'img/mobile2.jpeg',
	
	// 发现
	find1: PATH + 'img/find1.jpeg', // 背景
	
	// 个人中心
	user1: PATH + 'img/user1.png', // 我的下载
	user2: PATH + 'img/user2.png', // 我的收藏
	user3: PATH + 'img/user3.png', // 常见问题
	user4: PATH + 'img/user4.png', // 关于我们
	user5: PATH + 'img/user5.png', // 在线客服
	user6: PATH + 'img/user6.png', // 意见反馈
	user7: PATH + 'img/user7.png', // 技术支持
	
	// tabBar
	tabBarIndex: PATH + 'tabBar/index.png',
	tabBarIndex1: PATH + 'tabBar/index1.png',
	tabBarClassify: PATH + 'tabBar/classify.png',
	tabBarClassify1: PATH + 'tabBar/classify1.png',
	tabBarFind: PATH + 'tabBar/find.png',
	tabBarFind1: PATH + 'tabBar/find1.png',
	tabBarUser: PATH + 'tabBar/user.png',
	tabBarUser1: PATH + 'tabBar/user1.png',
};