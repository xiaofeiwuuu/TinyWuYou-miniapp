<template>
	<view class="wallpaper-btn-box fu-bottom" :class="{'fu-fixed': props.fixed}">
		<view class="wallpaper-btn-box__item" :style="{backgroundColor: props.bgColor}">
			<button class="wallpaper-btn-box__block fu-reset-button" v-if="handleVisible('overBack')" @click="onClick('overBack')">
				<fu-icons type="arrows-left" :color="iconColor" :size="iconSize"></fu-icons>
			</button>
			
			<button class="wallpaper-btn-box__block fu-reset-button" v-if="handleVisible('like')" @click="onClick('like')">
				<fu-icons :type="isLike? 'heart-fill': 'heart'" :color="isLike? '#FF725D': iconColor" :size="iconSize"></fu-icons>
			</button>
			
			<button class="wallpaper-btn-box__block fu-reset-button" v-if="handleVisible('download')" @click="onClick('download')">
				<fu-icons type="download-cloud" :color="iconColor" :size="iconSize + 6"></fu-icons>
			</button>
			
			<button class="wallpaper-btn-box__block fu-reset-button" v-if="handleVisible('index')" @click="onClick('index')">
				<fu-icons type="home-fill" :color="iconColor" :size="iconSize"></fu-icons>
			</button>
			
			<button class="wallpaper-btn-box__block fu-reset-button" v-if="handleVisible('collect')" @click="onClick('collect')">
				<fu-icons :type="isCollect? 'star-fill': 'star'" :color="isCollect? '#FF725D': iconColor" :size="iconSize"></fu-icons>
			</button>
			
			<button class="wallpaper-btn-box__block fu-reset-button" v-if="handleVisible('share')" @click="onClick('share')">
				<fu-icons type="share" :color="iconColor" :size="iconSize"></fu-icons>
			</button>
		</view>
	</view>
</template>

<script setup>
	import { ref, getCurrentInstance, watch } from 'vue';
	import { collectImage, uncollectImage, downloadImage } from '@/api/user.js';
	import { useUserStore } from '@/stores/user.js';
	import { useAdStore } from '@/stores/ad.js';

	/**
	 * @property {Array} visibleBtn 显示按钮数组
	 * 	@value overBack 返回上一页
	 * 	@value like 喜欢
	 * 	@value download 下载
	 * 	@value collect 收藏
	 * 	@value share 分享
	 * 	@value index 首页
	 */

	// props方法
	const props = defineProps({
		data: {
			type: Object,
			default: () => ({})
		},
		// 固定（默认 true）
		fixed: {
			type: Boolean,
			default: true
		},
		// 自定义背景色
		bgColor: {
			type: String,
			default: ''
		},
		// 是否显示喜欢按钮
		showLike: {
			type: Boolean,
			default: true
		},
		// 是否显示收藏按钮
		showCollect: {
			type: Boolean,
			default: true
		},
		// 显示按钮数组
		visibleBtn: {
			type: Array,
			default: () => ['overBack', "share"]
		},
		// 是否已收藏(可选,从父组件传入)
		isCollected: {
			type: Boolean,
			default: false
		}
	});

	// data数据
	const { $fu, $mUtil, $openPage } = getCurrentInstance().appContext.config.globalProperties;
	const userStore = useUserStore();
	const adStore = useAdStore();
	const iconSize = ref(24);
	const iconColor = ref('#FFFFFF');
	let isLike = ref(false);
	let isCollect = ref(props.isCollected);

	// 监听父组件传入的收藏状态
	watch(() => props.isCollected, (newVal) => {
		isCollect.value = newVal;
	});
	
	// methods方法
	/**
	 * @description onClick方法
	 * @property {String} overBack 返回上一页
	 * @property {String} like 喜欢
	 * @property {String} download 下载
	 * @property {String} collect 收藏
	 * @property {String} share 分享
	 * @property {String} index 首页
	 */
	const onClick = async (state) => {
		switch(state) {
			case 'overBack':
				$mUtil.overBack('', 'redirectTo')
				break
			case 'like':
				if(!isLike.value) return isLike.value = true;
				$fu.toast('你的喜欢从不孤单！！！')
				break
			case 'download':
				await onDownload()
				break
			case 'collect':
				await onCollect()
				break
			case 'share':
				onShare()
				break
			case 'index':
				$openPage({name: 'index', type: 'reLaunch'})
				break
			default:
				break
		}
	};

	// 收藏/取消收藏
	const onCollect = async () => {
		if (!props.data.id) {
			$fu.toast('图片信息错误')
			return
		}

		try {
			if (isCollect.value) {
				// 取消收藏
				await uncollectImage(props.data.id)
				isCollect.value = false
				$fu.toast('已取消收藏')
			} else {
				// 收藏
				await collectImage(props.data.id)
				isCollect.value = true
				$fu.toast('收藏成功')
			}
		} catch (error) {
			console.error('[Wallpaper Btn] 收藏操作失败:', error)
			$fu.toast(error.message || '操作失败')
		}
	};

	// 下载图片
	const onDownload = async () => {
		if (!props.data.id) {
			console.error('[Wallpaper Btn] 缺少图片ID')
			$fu.toast('图片信息错误')
			return
		}

		if (!props.data.image) {
			console.error('[Wallpaper Btn] 缺少图片URL')
			$fu.toast('图片信息错误')
			return
		}

		uni.showLoading({
			title: '保存中...'
		})

		try {
			// 1. 先记录下载历史
			await downloadImage(props.data.id)
 
			// 2. 下载图片到本地
			uni.downloadFile({
				url: props.data.image,
				success: res => {
					if(res.statusCode === 200) {
						const isVideo = /\.mp4$/i.test(res.tempFilePath);
						// #ifndef H5
						if (isVideo) {
							uni.saveVideoToPhotosAlbum({
								filePath: res.tempFilePath,
								success: () => {
									$fu.toast('保存成功！')
									// 刷新用户信息(更新下载次数)
									userStore.refreshUserInfo()
									// 显示插屏广告
									showInterstitialAdIfNeeded()
								},
								fail: err => {
									console.error('[Wallpaper Btn] 视频保存失败:', err)
									$fu.toast(`保存失败：${err.errMsg}`)
								}
							});
						} else {
							uni.saveImageToPhotosAlbum({
								filePath: res.tempFilePath,
								success: () => {
									$fu.toast('保存成功！')
									// 刷新用户信息(更新下载次数)
									userStore.refreshUserInfo()
									// 显示插屏广告
									showInterstitialAdIfNeeded()
								},
								fail: err => {
									console.error('[Wallpaper Btn] 图片保存失败:', err)
									$fu.toast(`保存失败：${err.errMsg}`)
								}
							});
						}
						// #endif
						// #ifdef H5
						uni.previewImage({
							urls: [res.tempFilePath]
						})
						// #endif
					} else {
						console.error('[Wallpaper Btn] 下载失败, statusCode:', res.statusCode)
						$fu.toast('下载失败, 请稍后再试~')
					}
				},
				fail: (err) => {
					console.error('[Wallpaper Btn] 下载文件失败:', err)
					$fu.toast('下载失败, 请稍后再试~')
				},
				complete: () => {
					uni.hideLoading()
				}
			})
		} catch (error) {
			uni.hideLoading()
			console.error('[Wallpaper Btn] 下载失败:', error)
			$fu.toast(error.message || '下载失败')
		}
	};

	// 分享
	const onShare = () => {
		// #ifdef MP-WEIXIN
		uni.showShareMenu({
			withShareTicket: true,
			menus: ['shareAppMessage', 'shareTimeline']
		})
		$fu.toast('请点击右上角分享')
		// #endif

		// #ifndef MP-WEIXIN
		$fu.toast('当前平台暂不支持分享功能')
		// #endif
	}
	
	// 检查按钮是否显示
	const handleVisible = (e) => {
		return props.visibleBtn.includes(e)
	};

	// 显示插屏广告(非会员)
	const showInterstitialAdIfNeeded = () => {
		// 检查是否是会员
		if (userStore.isVip === 1) {
			console.log('[Wallpaper Btn] 会员用户,跳过广告')
			return
		}

		const adUnitId = adStore.adConfig.interstitialId
		if (!adUnitId) {
			console.log('[Wallpaper Btn] 未配置插屏广告')
			return
		}

		// 延迟500毫秒展示,避免与下载提示冲突
		setTimeout(() => {
			showInterstitialAd(adUnitId)
		}, 500)
	}

	// 显示插屏广告
	const showInterstitialAd = (adUnitId) => {
		// #ifdef MP-WEIXIN
		if (typeof wx !== 'undefined' && wx.createInterstitialAd) {
			try {
				const ad = wx.createInterstitialAd({ adUnitId })

				ad.onLoad(() => {
					console.log('[Wallpaper Btn] 插屏广告加载成功')
				})

				ad.onError((err) => {
					console.warn('[Wallpaper Btn] 插屏广告加载失败:', err)
				})

				ad.show().catch((err) => {
					if (err.errCode === 2001) {
						console.warn('[Wallpaper Btn] 广告展示时机受限,稍后再试')
					} else {
						console.warn('[Wallpaper Btn] 广告展示失败:', err.errMsg)
					}
				})
			} catch (error) {
				console.warn('[Wallpaper Btn] 创建插屏广告失败:', error)
			}
		}
		// #endif
	}
</script>

<style lang="scss">
	.wallpaper-btn-box {
		width: 100%;
		color: #ffffff;
		left: 0;
		bottom: 30px;
		
		&__item {
			background-color: rgba(1, 1, 1, 0.6);
			height: 44px;
			margin: 0 15px;
			border-radius: 30px;
			display: flex;
			align-items: center;
			gap: 10px;
		}
		
		&__block {
			flex: 1;
			text-align: center;
		}
	}
</style>