/**
 * 获取系统设备信息
 */
function getSystemInfo() {
	return new Promise((resolve) => {
		let menuButton, navInfo;
		uni.getSystemInfo({
			success: res => {
				// #ifndef H5
				menuButton = uni.getMenuButtonBoundingClientRect();
				// #endif
				navInfo = {
					top: menuButton? menuButton.top: 0,
					right: menuButton? res.windowWidth - menuButton.left: 0,
					width: menuButton? menuButton.width: 0,
					height: menuButton? menuButton.height: 0,
					bottom: menuButton? menuButton.top - res.statusBarHeight: 0,
					statusBarHeight: res.statusBarHeight
				}
				resolve(navInfo)
			}
		})
	})
}

/**
 * @description px转rpx
 * @property {Number,String} val px
 */
function pxToRpx(val) {
	return Number(val) * (750 / uni.getSystemInfoSync().windowWidth)
}

/**
 * @description 返回上一页 
 * @param {String} value 指定跳转地址 (默认 '/pages/index/index')  value参数为空时判断有没有上级，有则返回上一页，没有则跳转指定路径‘/pages/index/index’ 注意：如果指定路径没有在pages.json中的tabBar使用则需要指定type跳转类型
 * @param {String} type 跳转方式 （默认 'switchTab'）
 * 	@value navigateTo
 * 	@value switchTab
 * 	@value reLaunch
 * 	@value redirectTo
 */
function overBack(value, type = 'reLaunch') {
	if(!value) {
		let pages = getCurrentPages();
		let prevPage = pages[pages.length - 2]; // 上一页面
		if (prevPage) {
			uni.navigateBack()
			return
		}
		uni[type]({
			url: '/pages/index/index'
		})
		return
	}
	uni[type]({
		url: value
	})
}

/**
 * @description 设置剪贴板
 * @param {String} value  
 */
function setClipboard(value) {
	uni.setClipboardData({
		data: value, // 要复制的内容
		success: res => { // 复制成功回调函数
			uni.showToast({
				title: '复制成功',
				icon: 'none'
			})
		}
	})
}

/**
 * @description 获取剪贴板
 */
function getClipboard() {
	return new Promise((resolve, reject) => {
		uni.getClipboardData({
			success: res => {
				resolve(res.data)
			},
			fail: err => {
				reject(err)
			}
		})
	})
}

/**
 * @description 搜索历史
 * @property {Object} obj 对象参数
 * 	@value key 存储key（通过：uni.getStorageSync(key)获取缓存数据）
 * 	@value data 存储值 (对象/字符串)
 * 	@value keyName 唯一value 不传默认value（用于数据去重，保证数据唯一性） 
 * @example 获取示例: uni.getStorage({
		key: 'wallpaperHistoryStorage',
		success: res => {
			console.log(res.data)
		}
	})
 * @example searchStorage({key: '', data: ''})
 */
function searchStorage(obj) {
	const historyStorage = uni.getStorageSync(obj.key) || [];
	var newsArr = historyStorage.filter(item => item[obj.keyName || 'value'] != obj.data[obj.keyName || 'value']);
	newsArr.unshift(obj.data)
	uni: uni.setStorage({
		key: obj.key,
		data: historyStorage.concat(obj.data).reverse(),
		data: newsArr
	})
}

export default {
	getSystemInfo,
	pxToRpx,
	overBack,
	setClipboard,
	getClipboard,
	searchStorage
}