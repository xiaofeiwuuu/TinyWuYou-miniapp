<template>
	<view class="fu-relative">
		<fu-image width="100%" height="100vh" bgColor="transparent" :duration="300" :src="data.image"></fu-image>
		<view v-if="data.isVip" class="vip-badge">VIP</view>

		<jc-date />

		<jc-wallpaper-btn :data="data" :isCollected="isCollected" :visibleBtn="['overBack', 'download', 'collect', 'share']" />
	</view>
</template>

<script setup>
	import { getCurrentInstance, computed, ref } from 'vue';
	import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
	import { getImageDetail } from '@/packWallpaper/api/image.js';
	import { checkCollected } from '@/api/user.js';

	// data数据
	const { $mAssetsPath, $parseURL } = getCurrentInstance().appContext.config.globalProperties;
	let queryParams = ref({});
	let data = ref({
		image: '', // 默认空，加载后填充
		title: '',
		id: null
	});
	let loading = ref(true);
	let isCollected = ref(false);

	// 生命周期
	onLoad(async (options) => {
		let query;
		// #ifdef MP
		query = $parseURL(options.query);
		// #endif
		// #ifndef MP
		query = JSON.parse(options.query);
		// #endif

		queryParams.value = query;
		const imageId = query.imageId || query.id;

		if (imageId) {
			await loadImageDetail(imageId);
		} else {
			console.error('[MobileDetails] 缺少图片ID参数');
		}
	});

	// 加载图片详情
	const loadImageDetail = async (imageId) => {
		try {
			loading.value = true;
			console.log('[MobileDetails] 加载图片详情:', imageId);

			const res = await getImageDetail(imageId);

			if (res.code === 0) {
				const imgData = res.data;
				data.value = {
					id: imgData.id,
					image: imgData.imageUrl,
					title: imgData.title,
					width: imgData.width,
					height: imgData.height,
					description: imgData.description,
					isVip: imgData.isVip,
					hotScore: imgData.hotScore,
					downloadCount: imgData.downloadCount,
					collectCount: imgData.collectCount
				};
				console.log('[MobileDetails] 图片详情加载成功');

				// 加载收藏状态
				await loadCollectionStatus(imageId);
			} else {
				console.error('[MobileDetails] 加载失败:', res.message);
			}
		} catch (error) {
			console.error('[MobileDetails] 加载异常:', error);
		} finally {
			loading.value = false;
		}
	};

	// 加载收藏状态
	const loadCollectionStatus = async (imageId) => {
		try {
			const res = await checkCollected(imageId);
			if (res.code === 0) {
				isCollected.value = res.data.isCollected || false;
				console.log('[MobileDetails] 收藏状态:', isCollected.value);
			}
		} catch (error) {
			console.error('[MobileDetails] 加载收藏状态失败:', error);
		}
	};

	// 分享给好友
	onShareAppMessage(() => {
		return {
			title: data.value.title || '精美壁纸分享',
			path: `/packWallpaper/pages/mobile/details?query=${encodeURIComponent(JSON.stringify({ imageId: data.value.id }))}`,
			imageUrl: data.value.image
		};
	});

	// 分享到朋友圈
	onShareTimeline(() => {
		return {
			title: data.value.title || '精美壁纸分享',
			query: `imageId=${data.value.id}`,
			imageUrl: data.value.image
		};
	});
</script>

<style lang="scss" scoped>
	.vip-badge {
		position: absolute;
		top: 8rpx;
		right: 8rpx;
		background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
		color: #000000;
		font-size: 20rpx;
		font-weight: bold;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		box-shadow: 0 2rpx 8rpx rgba(255, 215, 0, 0.4);
		z-index: 10;
	}
</style>