<template>
	<page-layout customClass="navbar__content">
		<fu-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="left" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></fu-nav-bar>

		<view class="emoji-box">
			<view class="emoji-box__now">
				<view class="emoji-box__now--image">
					<fu-image width="100%" height="100%" radius="15" bgColor="#222222" :src="data.image"></fu-image>
					<view v-if="data.isVip" class="vip-badge">VIP</view>
				</view>
			</view>

			<jc-wallpaper-btn bgColor="rgba(255, 255, 255, 0.1)" :data="data" :visibleBtn="['download', 'collect', 'share']" :fixed="false" :isCollected="isCollected" />

			<view v-if="list.length > 0" class="fu-m-t-30">
				<jc-section title="推荐表情" :showRight="false" />

				<view class="fu-m-t-20 fu-m-x-30">
					<jc-grid :list="list" :column="3" multiple="1" @click="handleImageClick" />
				</view>
			</view>
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, ref } from 'vue';
	import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
	import { getImageDetail, getRecommendImages } from '@/packWallpaper/api/image.js';
	import { checkCollected } from '@/api/user.js';

	// data数据
	const { $parseURL, $openPage, $mUtil } = getCurrentInstance().appContext.config.globalProperties;
	let data = ref({
		image: '',
		title: '',
		id: null
	});
	let list = ref([]);
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

		const imageId = query.imageId || query.id;

		if (imageId) {
			await Promise.all([
				loadImageDetail(imageId),
				loadRecommendList()
			]);
		} else {
			console.error('[EmojiDetails] 缺少图片ID参数');
		}
	});

	// 加载图片详情
	const loadImageDetail = async (imageId) => {
		try {
			console.log('[EmojiDetails] 加载图片详情:', imageId);

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
				console.log('[EmojiDetails] 图片详情加载成功');

				// 检查收藏状态
				await loadCollectionStatus(imageId);
			} else {
				console.error('[EmojiDetails] 加载失败:', res.message);
			}
		} catch (error) {
			console.error('[EmojiDetails] 加载异常:', error);
		}
	};

	// 加载收藏状态
	const loadCollectionStatus = async (imageId) => {
		try {
			const res = await checkCollected(imageId);
			if (res.code === 0) {
				isCollected.value = res.data.isCollected || false;
				console.log('[EmojiDetails] 收藏状态:', isCollected.value);
			}
		} catch (error) {
			console.error('[EmojiDetails] 加载收藏状态失败:', error);
			isCollected.value = false;
		}
	};

	// 加载推荐列表
	const loadRecommendList = async () => {
		try {
			console.log('[EmojiDetails] 加载推荐表情列表');

			const res = await getRecommendImages('emoji', 9);

			if (res.code === 0) {
				const images = res.data || [];
				list.value = images.map(img => ({
					id: img.id,
					image: img.thumbnailUrl || img.imageUrl,
					imageUrl: img.imageUrl,
					title: img.title,
					isVip: img.isVip
				}));
				console.log('[EmojiDetails] 推荐表情列表加载成功:', list.value.length);
			}
		} catch (error) {
			console.error('[EmojiDetails] 加载推荐表情列表异常:', error);
		}
	};

	// 点击推荐图片
	const handleImageClick = (item) => {
		if (!item.id) {
			return;
		}

		// 如果点击的是当前图片,不跳转
		if (item.id === data.value.id) {
			console.log('[EmojiDetails] 点击的是当前图片,不跳转');
			return;
		}

		$openPage({
			name: 'emojiDetails',
			query: { imageId: item.id }
		});
	};

	// 分享给好友
	onShareAppMessage(() => {
		return {
			title: data.value.title || '精美表情分享',
			path: `/packWallpaper/pages/emoji/details?query=${encodeURIComponent(JSON.stringify({ imageId: data.value.id }))}`,
			imageUrl: data.value.image
		};
	});

	// 分享到朋友圈
	onShareTimeline(() => {
		return {
			title: data.value.title || '精美表情分享',
			query: `imageId=${data.value.id}`,
			imageUrl: data.value.image
		};
	});
</script>

<style lang="scss" scoped>
	.emoji-box {
		padding-bottom: 30rpx;

		&__now {

			&--image {
				width: 300rpx;
				height: 300rpx;
				border-radius: 15rpx;
				margin: 50rpx auto;
				position: relative;
			}
		}
	}

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
