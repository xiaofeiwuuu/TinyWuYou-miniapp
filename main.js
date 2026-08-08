import App from './App'

// 引入全局uview-plus
import uviewPlus from 'uview-plus'
// 图标字体改用内联 base64，替代 at.alicdn.com 外网字体
import { UICON_FONT } from '@/config/uicon-font.js'

// 引入项目内路由封装
import router from '@/util/router.js'

// 引入全局方法
import $mAssetsPath from '@/config/assets.config.js'
import $mConstDataConfig from '@/config/constData.config.js'
import $mUtil from '@/util/index.js'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(uviewPlus)
  app.use(router)
  uni.$u.setConfig({
	  config: {
		  unit: 'rpx',
		  /**
		   * 图标字体只加载一次。
		   *
		   * u-icon 的 beforeCreate 里是 `if (!fontUtil.params.loaded) loadFont()`，
		   * 而 params.loaded 只有在 loadFontOnce 为 true 时才会被置位，
		   * 默认 false 意味着**每个图标实例**都会重新请求一次 55.9KB 的
		   * at.alicdn.com iconfont —— 一个页面几十个图标就是几十次请求。
		   *
		   * uni.loadFontFace 本身带 global: true，在小程序里注册一次即可全局生效，
		   * 重复注册没有任何收益。
		   */
		  loadFontOnce: true,
		  // 图标字体走内联 base64，不再从 at.alicdn.com 外网加载
		  iconUrl: UICON_FONT
	  }
  });
  app.config.globalProperties.$mAssetsPath = $mAssetsPath;
  app.config.globalProperties.$mConstDataConfig = $mConstDataConfig;
  app.config.globalProperties.$mUtil = $mUtil;
  return {
    app
  }
}
// #endif