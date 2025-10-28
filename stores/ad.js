import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAdList } from '@/api/ad.js'

export const useAdStore = defineStore('ad', () => {
  // 广告配置数据
  const adConfig = ref({
    rewardVideoId: '', // 激励视频广告ID (jlAd)
    nativeTemplateId: '', // 原生模板广告ID (spAd)
    interstitialId: '', // 插屏广告ID (cpAd)
  })

  // 是否已加载
  const isLoaded = ref(false)

  /**
   * 加载广告配置
   */
  const fetchAdConfig = async () => {
    try {
      console.log('[AdStore] 开始加载广告配置')

      const res = await getAdList()

      if (res.code === 0) {
        const ads = res.data || []

        // 查找激励视频广告 (video)
        const rewardVideo = ads.find(ad => ad.adType === 'video' && ad.isEnabled === 1)
        if (rewardVideo) {
          adConfig.value.rewardVideoId = rewardVideo.adUnitId
        }

        // 查找原生模板广告 (native)
        const nativeTemplate = ads.find(ad => ad.adType === 'native' && ad.isEnabled === 1)
        if (nativeTemplate) {
          adConfig.value.nativeTemplateId = nativeTemplate.adUnitId
        }

        // 查找插屏广告 (interstitial)
        const interstitial = ads.find(ad => ad.adType === 'interstitial' && ad.isEnabled === 1)
        if (interstitial) {
          adConfig.value.interstitialId = interstitial.adUnitId
        }

        isLoaded.value = true
      } else {
        console.error('[AdStore] 广告配置加载失败:', res.message)
      }
    } catch (error) {
      console.error('[AdStore] 广告配置加载异常:', error)
    }
  }

  return {
    adConfig,
    isLoaded,
    fetchAdConfig
  }
})
