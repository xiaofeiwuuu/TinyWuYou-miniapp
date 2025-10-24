import request from './request.js'

/**
 * 获取所有广告配置列表
 */
export function getAdList() {
  return request({
    url: '/ad/list',
    method: 'GET'
  })
}

/**
 * 获取指定类型的广告配置
 * @param {string} adType - 广告类型
 */
export function getAdConfig(adType) {
  return request({
    url: '/ad/config',
    method: 'GET',
    data: {
      adType
    }
  })
}

/**
 * 获取激励视频广告配置
 */
export function getRewardVideoAd() {
  return request({
    url: '/ad/reward-video',
    method: 'GET'
  })
}
