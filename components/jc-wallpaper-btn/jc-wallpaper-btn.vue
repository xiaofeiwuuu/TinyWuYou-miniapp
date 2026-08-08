<template>
	<view class="wallpaper-btn-box fu-bottom" :class="{'fu-fixed': props.fixed}">
		<view class="wallpaper-btn-box__item" :style="{backgroundColor: props.bgColor}">
			<button class="wallpaper-btn-box__block fu-reset-button" v-if="handleVisible('overBack')" @click="onClick('overBack')">
				<up-icon name="arrow-leftward" :color="iconColor" :size="iconSize"></up-icon>
			</button>
			
			<button class="wallpaper-btn-box__block fu-reset-button" v-if="handleVisible('like')" @click="onClick('like')">
				<up-icon :name="isLike? 'heart-fill': 'heart'" :color="isLike? '#FF725D': iconColor" :size="iconSize"></up-icon>
			</button>
			
			<button class="wallpaper-btn-box__block fu-reset-button" v-if="handleVisible('download')" @click="onClick('download')">
				<!-- 尺寸与其余图标保持一致，原来是 iconSize + 6，比旁边大一圈 -->
				<up-icon name="download" :color="iconColor" :size="iconSize"></up-icon>
			</button>
			
			<button class="wallpaper-btn-box__block fu-reset-button" v-if="handleVisible('index')" @click="onClick('index')">
				<up-icon name="home-fill" :color="iconColor" :size="iconSize"></up-icon>
			</button>
			
			<button class="wallpaper-btn-box__block fu-reset-button" v-if="handleVisible('collect')" @click="onClick('collect')">
				<!--
					收藏图标单独包一层来做动画：
					up-icon 的根节点样式由组件自己控制，动画类挂在外层才不会被它覆盖。
					collect-icon--on 是常驻的放大态（收藏后比未收藏略大一点，状态更明显），
					collect-icon--pop 是收藏成功那一下的弹跳，播完由 transitionend 之外的定时器摘掉。
				-->
				<view class="collect-icon" :class="{ 'collect-icon--on': isCollect, 'collect-icon--pop': collectPop }">
					<up-icon :name="isCollect? 'star-fill': 'star'" :color="isCollect? '#FF725D': iconColor" :size="iconSize"></up-icon>
				</view>
			</button>
			
			<!-- #ifdef MP -->
			<!-- 小程序：open-type="share" 点击直接触发页面 onShareAppMessage 弹分享面板，
			     不能用 JS 主动调起转发，所以这里不走 @click -->
			<button class="wallpaper-btn-box__block fu-reset-button" v-if="handleVisible('share')" open-type="share">
				<up-icon name="share-square" :color="iconColor" :size="iconSize"></up-icon>
			</button>
			<!-- #endif -->
			<!-- #ifndef MP -->
			<button class="wallpaper-btn-box__block fu-reset-button" v-if="handleVisible('share')" @click="onClick('share')">
				<up-icon name="share-square" :color="iconColor" :size="iconSize"></up-icon>
			</button>
			<!-- #endif -->
		</view>
	</view>
</template>

<script setup>
	import { ref, reactive, getCurrentInstance, watch, onUnmounted } from 'vue';
	import { collectImage, uncollectImage, downloadImage, precheckDownload } from '@/api/user.js';
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

	// 下载/收藏/取消收藏成功后，通知父组件刷新计数
	const emit = defineEmits(['refresh']);

	// data数据
	const { $u, $mUtil, $openPage } = getCurrentInstance().appContext.config.globalProperties;
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

	/**
	 * 动作防重入。
	 *
	 * 收藏和下载"点下去到结果返回"都有几百毫秒空档，用户会以为没点上而连点，
	 * 而这两个后端接口都不是幂等的：
	 *   收藏  重复提交直接 400「已收藏过该图片」，用户看到的是一次"成功"加一次"报错"
	 *   下载  每调一次就扣一次下载次数（download_count - 1），连点几下白扣几次
	 *
	 * 挡住重复提交的是这把锁，不是遮罩——所以遮罩是纯粹的"还在忙"提示，可以按需要开关。
	 */
	const pending = reactive({});

	/** 超过这个时间还没完成才弹遮罩，避免快操作闪一下反而更难受 */
	const LOADING_DELAY = 200;

	/** 收藏成功那一下的弹跳 */
	let collectPop = ref(false);
	let popTimer = null;

	const playCollectAnim = () => {
		// 先摘类再挂类，中间隔一帧，否则连续收藏第二次时 CSS 动画不会重播
		clearTimeout(popTimer);
		collectPop.value = false;
		popTimer = setTimeout(() => {
			collectPop.value = true;
			popTimer = setTimeout(() => { collectPop.value = false }, 400);
		}, 20);
	};

	// 组件销毁时清掉定时器，避免在已卸载的组件上改响应式状态
	onUnmounted(() => clearTimeout(popTimer));

	/**
	 * 跑一个互斥动作。
	 *
	 * @param key     动作标识，同一个 key 在完成前的重复点击会被忽略
	 * @param task    实际任务。不要自己弹提示，把提示文案 return 出来——
	 *                uni.showToast 会顶掉正在显示的 showLoading，
	 *                若在 task 内部弹，之后的 hideLoading 就成了没配对的调用，
	 *                控制台会刷"showLoading 与 hideLoading 必须配对使用"。
	 * @param loading { title } 才显示遮罩；不传就完全不显示。
	 *                乐观更新的动作（比如收藏，点下去图标立刻就变了）不要遮罩：
	 *                结果都已经摆在眼前了，再盖一层"加载中"等于收回刚给出的确定感，
	 *                还会挡住用户的下一步操作。
	 */
	const runExclusive = async (key, task, loading = null) => {
		if (pending[key]) {
			console.warn('[Wallpaper Btn] 上一次操作还没完成，忽略本次:', key);
			return;
		}
		pending[key] = true;

		let loadingShown = false;
		const timer = loading
			? setTimeout(() => {
				loadingShown = true;
				uni.showLoading({ title: loading.title, mask: true });
			}, loading.delay || LOADING_DELAY)
			: null;

		let tip = '';
		try {
			tip = (await task()) || '';
		} finally {
			if (timer) clearTimeout(timer);
			// 只有真的显示过才关，否则同样会触发配对警告
			if (loadingShown) uni.hideLoading();
			pending[key] = false;
		}

		if (tip) $u.toast(tip);
		return tip;
	};

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
				$u.toast('你的喜欢从不孤单！！！')
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
			$u.toast('图片信息错误')
			return
		}

		// 不传 loading：图标已经立刻变了，再盖一层遮罩只会把这份确定感收回去
		await runExclusive('collect', async () => {
			const next = !isCollect.value

			/**
			 * 先把图标切过去，再发请求（乐观更新）。
			 *
			 * 收藏是个高频轻操作，等接口回来再变，手感上就是"点了没反应"，
			 * 用户会以为没点上而连点。失败时回滚，并把后端的真实原因弹出来，
			 * 所以不会出现"看着收藏了其实没收藏"的假象。
			 */
			isCollect.value = next
			if (next) playCollectAnim()

			try {
				if (next) {
					await collectImage(props.data.id)
				} else {
					await uncollectImage(props.data.id)
				}
				// 收藏数（及后端据此算的热度）已变，通知详情页刷新计数
				emit('refresh')
				return next ? '收藏成功' : '已取消收藏'
			} catch (error) {
				console.error('[Wallpaper Btn] 收藏操作失败:', error)
				isCollect.value = !next
				return error.message || '操作失败'
			}
		})
	};

	// 下载图片
	const onDownload = async () => {
		if (!props.data.id) {
			console.error('[Wallpaper Btn] 缺少图片ID')
			$u.toast('图片信息错误')
			return
		}

		/**
		 * 保存到相册必须用原图。
		 * data.image 是详情页展示用的压缩图（720px），壁纸存下来会糊；
		 * downloadUrl 才是未经处理的原图。老调用方没传 downloadUrl 时退回 image，
		 * 保证行为不会中断。
		 */
		const sourceUrl = props.data.downloadUrl || props.data.image
		if (!sourceUrl) {
			console.error('[Wallpaper Btn] 缺少图片URL')
			$u.toast('图片信息错误')
			return
		}

		/**
		 * 整个流程串成 await 链，而不是原来的回调嵌套。
		 *
		 * 回调式写法下，onDownload 在 downloadFile 发出去的那一刻就返回了，
		 * 防重入的锁会在文件真正下载完之前就释放，连点照样能重复扣次数。
		 * 顺带修掉一个旧问题：原来 hideLoading 挂在 downloadFile 的 complete 上，
		 * 保存到相册还在进行时遮罩就没了。
		 */
		await runExclusive('download', async () => {
			// 1. 预检：能不能下（VIP 专属 / 次数 / 每日上限），只校验、不扣次数
			try {
				await precheckDownload(props.data.id)
			} catch (error) {
				return error.message || '暂时无法下载'
			}

			// 2. 下载图片到本地
			let res
			try {
				res = await new Promise((resolve, reject) => {
					uni.downloadFile({ url: sourceUrl, success: resolve, fail: reject })
				})
			} catch (err) {
				console.error('[Wallpaper Btn] 下载文件失败:', err)
				return '下载失败, 请稍后再试~'
			}
			if (res.statusCode !== 200) {
				console.error('[Wallpaper Btn] 下载失败, statusCode:', res.statusCode)
				return '下载失败, 请稍后再试~'
			}

			// 3. 保存到相册。保存失败 / 用户取消 → 直接返回，绝不记账（不扣次数、不加下载量）
			// #ifndef H5
			const isVideo = /\.mp4$/i.test(res.tempFilePath)
			try {
				await new Promise((resolve, reject) => {
					if (isVideo) {
						uni.saveVideoToPhotosAlbum({ filePath: res.tempFilePath, success: resolve, fail: reject })
					} else {
						uni.saveImageToPhotosAlbum({ filePath: res.tempFilePath, success: resolve, fail: reject })
					}
				})
			} catch (err) {
				const msg = (err && err.errMsg) || ''
				// 用户主动取消：不是失败，给个轻提示即可（也不记账）
				if (msg.includes('cancel')) {
					return '已取消保存'
				}
				console.error('[Wallpaper Btn] 保存失败:', err)
				// 相册权限被拒：引导去设置里开
				if (msg.includes('auth') || msg.includes('deny')) {
					return '请在设置里开启保存到相册的权限'
				}
				return '保存失败，请稍后再试'
			}
			// #endif
			// #ifdef H5
			uni.previewImage({ urls: [res.tempFilePath] })
			// #endif

			// 4. 到这一步图片才真正到手 → 确认记账：扣次数 + 图片下载量+1。
			//    记账失败不影响用户（图已保存），只告警；宁可少扣也不误扣。
			try {
				await downloadImage(props.data.id)
				emit('refresh')
			} catch (err) {
				console.warn('[Wallpaper Btn] 下载记账失败（用户已保存成功，不影响）:', err)
			}

			// 刷新用户信息(更新下载次数) + 插屏广告
			userStore.refreshUserInfo()
			// showInterstitialAdIfNeeded()
			return '保存成功！'
		}, { title: '保存中...' })
	};

	// 分享（仅非小程序端走这里；小程序端由 <button open-type="share"> 直接触发转发，不经 onClick）
	const onShare = () => {
		$u.toast('当前平台暂不支持分享功能')
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
		
		/**
		 * 原来只有 text-align: center，那只管水平方向。
		 * 图标在按钮里是按基线排列的，几个图标尺寸一旦不一致，
		 * 高的那个就会下沉，整排看起来是斜的。这里改成 flex 真正居中，
		 * 以后即使某个图标大小不同也不会错位。
		 */
		&__block {
			flex: 1;
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100%;
		}
	}

	/**
	 * 收藏图标的动画。
	 *
	 * --on   收藏后常驻略放大，静态下也能一眼看出状态，不只靠颜色
	 * --pop  收藏那一下的弹跳，先冲到 1.45 再回落到 1.12，
	 *        用带回弹的缓动（cubic-bezier 第四个值 > 1）而不是线性，手感才不木
	 * 取消收藏走 transition 缩回 1，不播弹跳——取消是个"收回"动作，弹一下反而不对
	 */
	.collect-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

		&--on {
			transform: scale(1.12);
		}

		&--pop {
			animation: collect-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
		}
	}

	@keyframes collect-pop {
		0%   { transform: scale(1); }
		40%  { transform: scale(1.45); }
		70%  { transform: scale(0.94); }
		100% { transform: scale(1.12); }
	}
</style>