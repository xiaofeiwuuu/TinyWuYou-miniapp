import App from './App'

// 引入全局FusionsUI
import FusionsUI from 'fusions-ui'

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
  app.use(FusionsUI, {
	  openRouter: true
  })
  uni.$fu.config.unit = 'rpx';
  app.config.globalProperties.$mAssetsPath = $mAssetsPath;
  app.config.globalProperties.$mConstDataConfig = $mConstDataConfig;
  app.config.globalProperties.$mUtil = $mUtil;
  return {
    app
  }
}
// #endif