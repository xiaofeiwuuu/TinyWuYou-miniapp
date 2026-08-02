<template>
	<!--
		类型配置没到位之前不渲染。
		朝向决定的是整页布局（整屏 / 卡片），先用兜底值画一遍再跳变，
		用户看到的是明显的闪屏，不如空一帧。
	-->
	<view v-if="!ready"></view>

	<!-- 竖图：图本身就是整屏背景，没有导航栏，按钮条浮在底部 -->
	<view v-else-if="orientation === 'portrait'" class="fu-relative">
		<app-image width="100%" height="100vh" bgColor="transparent" :duration="300" :src="data.image"></app-image>
		<view v-if="data.isVip" class="vip-badge">VIP</view>

		<jc-date />

		<jc-wallpaper-btn :data="data" :isCollected="isCollected" :visibleBtn="FULLSCREEN_BTN" />
	</view>

	<!-- 横图 / 方图：卡片式，带自定义导航栏 -->
	<page-layout v-else customClass="navbar__content">
		<app-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="arrow-left" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<!-- 横图：图按窗口高度垂直居中，占满整行宽度 -->
		<view v-if="orientation === 'landscape'" class="detail-landscape" :style="{ height: `${sysInfo.windowHeight}px` }">
			<view class="detail-landscape__image">
				<app-image width="100%" height="100%" bgColor="#222222" radius="15" :src="data.image"></app-image>
				<view v-if="data.isVip" class="vip-badge">VIP</view>
			</view>

			<jc-wallpaper-btn :data="data" :isCollected="isCollected" bgColor="rgba(255, 255, 255, 0.1)" :visibleBtn="FULLSCREEN_BTN" />
		</view>

		<!-- 方图：小卡片 + 推荐九宫格 -->
		<view v-else class="detail-square">
			<view class="detail-square__image">
				<app-image width="100%" height="100%" radius="15" bgColor="#222222" :src="data.image"></app-image>
				<view v-if="data.isVip" class="vip-badge">VIP</view>
			</view>

			<jc-wallpaper-btn bgColor="rgba(255, 255, 255, 0.1)" :data="data" :isCollected="isCollected" :visibleBtn="CARD_BTN" :fixed="false" />

			<view v-if="recommendList.length" class="fu-m-t-30">
				<jc-section :title="`推荐${typeName}`" :showRight="false" />

				<view class="fu-m-t-20 fu-m-x-30">
					<jc-grid :list="recommendList" :column="grid.column" :multiple="grid.multiple" @click="handleRecommendClick" />
				</view>
			</view>
		</view>
	</page-layout>
</template>

<script setup>
	/**
	 * 通用图片详情页。
	 *
	 * 原来 avatar / mobile / desktop / emoji / sticker 五个页面各有一份 details.vue，
	 * 彼此只差 CSS 类名、标题文案和日志前缀（emoji 与 sticker 仅相差 42 行），
	 * 真正的差异只有三种，而且是沿朝向分的，不是沿类型分的：
	 *   竖图   整屏铺满 + 日期挂件，没有推荐位（整屏就是图，放不下）
	 *   横图   图按窗口高度居中的卡片，同样没有推荐位
	 *   方图   小卡片 + 推荐九宫格
	 * 所以这里按朝向分三套布局，类型本身不再参与判断，后台新增类型不用发版。
	 *
	 * 布局取自图片自己的 imageType：下载历史、搜索结果、收藏这些混合列表
	 * 事先并不知道点的是哪种图，路由上的 type 只用来避免首屏闪一下。
	 */
	import { getCurrentInstance, ref, computed } from 'vue';
	import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
	import { getImageDetail, getRecommendImages } from '@/packWallpaper/api/image.js';
	import { checkCollected } from '@/api/user.js';
	import { useImageTypeStore } from '@/stores/imageType.js';

	// data数据
	const { $u, $mUtil, $parseURL, $openPage } = getCurrentInstance().appContext.config.globalProperties;
	const imageTypeStore = useImageTypeStore();

	/** 整屏布局（竖图/横图）：返回键要放在按钮条里，因为竖图没有导航栏 */
	const FULLSCREEN_BTN = ['overBack', 'download', 'collect', 'share'];
	/** 卡片布局（方图）：导航栏已有返回键，按钮条里不再重复 */
	const CARD_BTN = ['download', 'collect', 'share'];

	/** 哪些朝向带推荐位。要给横图也加推荐，改这一行即可 */
	const ORIENTATION_WITH_RECOMMEND = ['square'];
	const RECOMMEND_LIMIT = 9;

	const PAGE_PATH = '/packWallpaper/pages/common/imageDetail';

	let data = ref({
		image: '',
		title: '',
		id: null
	});
	let imageType = ref('');
	let recommendList = ref([]);
	let isCollected = ref(false);
	let ready = ref(false);

	const sysInfo = computed(() => $u.sys());
	const orientation = computed(() => imageTypeStore.getOrientation(imageType.value));
	const typeName = computed(() => imageTypeStore.getTypeName(imageType.value) || '图片');
	const grid = computed(() => imageTypeStore.getGridConfig(imageType.value));

	// 生命周期
	onLoad(async (options) => {
		let query;
		// #ifdef MP
		// 走 $openPage 进来的参数在 options.query 里；朋友圈分享回流是平铺的
		query = options.query ? $parseURL(options.query) : (options || {});
		// #endif
		// #ifndef MP
		query = options.query ? JSON.parse(options.query) : (options || {});
		// #endif

		const imageId = query.imageId || query.id;
		if (!imageId) {
			console.error('[ImageDetail] 缺少图片ID参数');
			ready.value = true;
			return;
		}

		imageType.value = query.type || '';

		// 朝向配置要先到位，否则会先按兜底布局渲染一次再跳变
		await imageTypeStore.fetchTypes();
		// 调用方传了 type 就能立刻按正确布局渲染；没传就等详情回来再渲染
		if (imageType.value) ready.value = true;

		await loadImageDetail(imageId);
		ready.value = true;
	});

	// methods方法
	// 加载图片详情
	const loadImageDetail = async (imageId) => {
		try {
			const res = await getImageDetail(imageId);

			if (res.code !== 0) {
				console.error('[ImageDetail] 加载失败:', res.message);
				return;
			}

			const imgData = res.data;
			// 以图片自己的类型为准，路由传的只是首屏的预判
			if (imgData.imageType) imageType.value = imgData.imageType;

			data.value = {
				id: imgData.id,
				// image 用于页面展示和分享卡片，走压缩图（720px）
				image: imgData.previewUrl || imgData.imageUrl,
				// downloadUrl 是未经处理的原图，"保存到相册"必须用它——
				// 壁纸应用下载到压缩图是不能接受的
				downloadUrl: imgData.imageUrl,
				title: imgData.title,
				width: imgData.width,
				height: imgData.height,
				description: imgData.description,
				isVip: imgData.isVip,
				hotScore: imgData.hotScore,
				downloadCount: imgData.downloadCount,
				collectCount: imgData.collectCount
			};

			await loadCollectionStatus(imageId);

			if (ORIENTATION_WITH_RECOMMEND.includes(orientation.value)) {
				await loadRecommendList();
			}
		} catch (error) {
			console.error('[ImageDetail] 加载异常:', error);
		}
	};

	// 加载收藏状态
	const loadCollectionStatus = async (imageId) => {
		try {
			const res = await checkCollected(imageId);
			if (res.code === 0) {
				isCollected.value = res.data.isCollected || false;
			}
		} catch (error) {
			console.error('[ImageDetail] 加载收藏状态失败:', error);
			isCollected.value = false;
		}
	};

	// 加载推荐列表
	const loadRecommendList = async () => {
		try {
			const res = await getRecommendImages(imageType.value, RECOMMEND_LIMIT);

			if (res.code === 0) {
				const images = res.data || [];
				recommendList.value = images.map(img => ({
					id: img.id,
					image: img.thumbnailUrl || img.imageUrl,
					imageUrl: img.imageUrl,
					title: img.title,
					isVip: img.isVip
				}));
			}
		} catch (error) {
			console.error('[ImageDetail] 加载推荐列表异常:', error);
		}
	};

	// 点击推荐图片
	const handleRecommendClick = (item) => {
		if (!item || !item.id) return;

		// 点的是当前这张就不跳了
		if (item.id === data.value.id) return;

		/**
		 * 用 redirectTo 替换当前详情页，而不是继续压栈。
		 *
		 * 1. 返回时直接回到列表/首页，不会在一串详情页里逐个退回
		 * 2. 微信页面栈上限是 10 层，连续点推荐图超过 10 次会跳转失败
		 */
		$openPage({
			name: 'imageDetail',
			query: { imageId: item.id, type: imageType.value },
			type: 'redirectTo'
		});
	};

	// 分享给好友
	onShareAppMessage(() => {
		const query = encodeURIComponent(JSON.stringify({
			imageId: data.value.id,
			type: imageType.value
		}));
		return {
			title: data.value.title || `精美${typeName.value}分享`,
			path: `${PAGE_PATH}?query=${query}`,
			imageUrl: data.value.image
		};
	});

	// 分享到朋友圈
	onShareTimeline(() => {
		return {
			title: data.value.title || `精美${typeName.value}分享`,
			query: `imageId=${data.value.id}&type=${imageType.value}`,
			imageUrl: data.value.image
		};
	});
</script>

<style lang="scss" scoped>
	// 横图：整屏高度里垂直居中一条通栏的图
	.detail-landscape {
		margin: 0 30rpx;
		display: flex;
		align-items: center;

		&__image {
			flex: 1;
			height: 400rpx;
			position: relative;
		}
	}

	// 方图：居中的小卡片，下面接推荐九宫格
	.detail-square {
		padding-bottom: 30rpx;

		&__image {
			width: 300rpx;
			height: 300rpx;
			border-radius: 15rpx;
			margin: 50rpx auto;
			position: relative;
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
