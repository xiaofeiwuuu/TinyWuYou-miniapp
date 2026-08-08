<template>
	<view class="fu-p-b-30">
		<!-- 首页轮播图：后台「内容管理 → 首页轮播图」配置，点击跳到关联的图片分类 -->
		<view class="fu-m-x-30 fu-m-t-20 banner-wrap" v-if="bannerList.length">
			<swiper
				class="banner-swiper"
				:current="currentBanner"
				:circular="true"
				:autoplay="true"
				:interval="3000"
				@change="onBannerChange"
			>
				<swiper-item
					v-for="(item, i) in bannerList"
					:key="i"
					@tap="onBannerClick(i)"
				>
					<!-- 当前图 scale 1 撑满，非当前图 scale 0.9 缩小；不露边，切换时缩放过渡 -->
					<image
						class="banner-img"
						:class="{ 'banner-img--active': i === currentBanner }"
						:src="item.imageUrl"
						mode="aspectFill"
					/>
				</swiper-item>
			</swiper>
			<!-- 自定义指示点：当前项长+高亮，其余短+半透明（uview 自带 line 是等长滑块，dot 是圆点，都不满足） -->
			<view class="banner-dots">
				<view
					v-for="(item, i) in bannerList"
					:key="i"
					class="banner-dot"
					:class="{ 'banner-dot--active': i === currentBanner }"
				></view>
			</view>
		</view>

		<jc-wallpaper-rec />

		<!-- 推荐壁纸：随机竖图九宫格，标题右侧「换一批」刷新 -->
		<view class="fu-m-t-30">
			<jc-section title="推荐壁纸" subtitle="每日随机精选，总有一张打动你" :emphasize="true" margin="0 30rpx">
				<up-button
					color="#333333"
					shape="round"
					:loading="recommendLoading"
					:customStyle="{ height: '56rpx', padding: '0 28rpx', width: 'auto' }"
					@click="refreshRecommend"
				>
					<text class="fu-m-r-4" style="color: #999999; font-size: 28rpx;">换一批</text>
					<up-icon name="reload" color="#999999" size="13"></up-icon>
				</up-button>
			</jc-section>

			<view class="fu-m-x-30 fu-m-t-20">
				<jc-grid :list="recommendList" :column="3" :multiple="1.5" @click="onRecommendClick" />
			</view>
		</view>

	</view>
</template>

<script setup>
	import { getCurrentInstance, ref, onMounted } from 'vue';
	import { useCategoryStore } from '@/stores/category.js';
	import { useAdStore } from '@/stores/ad.js';
	import { keyManager } from '@/util/key-manager.js';
	import { getBanners } from '@/api/banner.js';
	import { getRandomImages } from '@/api/image.js';

	// data数据
	const { $openPage } = getCurrentInstance().appContext.config.globalProperties;
	const categoryStore = useCategoryStore();
	const adStore = useAdStore();
	// 首页轮播图数据
	let bannerList = ref([]);
	// 轮播当前索引（驱动自定义指示点高亮）
	let currentBanner = ref(0);
	// 推荐壁纸（随机竖图九宫格）
	let recommendList = ref([]);
	let recommendLoading = ref(false);

	// 生命周期
	onMounted(async () => {
		// 确保密钥已交换再加载数据
		console.log('[Page] 页面加载，检查密钥状态');
		if (!keyManager.isKeyExchanged()) {
			try {
				console.log('[Page] 密钥不存在，开始交换');
				await keyManager.exchangeKey();
				console.log('[Page] 密钥交换完成');
			} catch (error) {
				console.error('[Page] 密钥交换失败:', error);
			}
		} else {
			console.log('[Page] 密钥已存在，直接加载数据');
		}

		// 从 store 获取分类数据
		await initCategories();

		// 加载轮播图（失败不影响首页其它内容）
		await initBanners();

		// 加载推荐壁纸九宫格
		await initRecommend();

		// 加载广告配置
		await initAdConfig();
	});

	// methods方法
	const initCategories = async () => {
		try {
			// 预热分类缓存：点"更多"进 imageList 时 tab 能立即出来
			await categoryStore.fetchCategories();
			console.log('[Page] 分类数据已加载');
		} catch (error) {
			console.error('[Page] 获取分类失败:', error);
		}
	};

	const initAdConfig = async () => {
		try {
			if (!adStore.isLoaded) {
				await adStore.fetchAdConfig();
				console.log('[Page] 广告配置已加载');
			}
		} catch (error) {
			console.error('[Page] 获取广告配置失败:', error);
		}
	};

	// 拉取首页轮播图
	const initBanners = async () => {
		try {
			const res = await getBanners();
			if (res && res.code === 0) {
				// 小程序公开接口直接返回 data 数组；兼容一下 {list} 结构以防将来改动
				bannerList.value = Array.isArray(res.data)
					? res.data
					: res.data?.list || [];
				console.log('[Page] 轮播图已加载，数量:', bannerList.value.length);
			}
		} catch (error) {
			// 轮播是锦上添花，失败就不显示，不打断首页
			console.error('[Page] 获取轮播图失败:', error);
		}
	};

	// 拉取推荐壁纸：随机 9 张竖图（orientation=portrait 由后台类型朝向决定）
	const initRecommend = async () => {
		if (recommendLoading.value) return;
		recommendLoading.value = true;
		try {
			const res = await getRandomImages({ orientation: 'portrait', limit: 9 });
			if (res && res.code === 0) {
				const arr = Array.isArray(res.data) ? res.data : res.data?.list || [];
				recommendList.value = arr.map(img => ({
					id: img.id,
					image: img.thumbnailUrl || img.imageUrl,
					imageUrl: img.imageUrl,
					title: img.title,
					isVip: img.isVip
				}));
			}
		} catch (error) {
			console.error('[Page] 获取推荐壁纸失败:', error);
		} finally {
			recommendLoading.value = false;
		}
	};

	// 「换一批」：重新随机；loading 期间按钮禁用，避免连点重复请求
	const refreshRecommend = () => {
		initRecommend();
	};

	// 点击推荐壁纸：进图片详情（都是竖图，type 固定 wallpaper 让详情页首屏不闪）
	const onRecommendClick = (item) => {
		if (!item || !item.id) return;
		$openPage({ name: 'imageDetail', query: { imageId: item.id, type: 'wallpaper' } });
	};

	// 轮播切换（含自动播放）：原生 swiper 的 change 事件是 e.detail.current
	const onBannerChange = (e) => {
		currentBanner.value = e.detail.current;
	};

	// 点击轮播图：跳到关联的图片分类；没有关联分类的只展示不跳
	const onBannerClick = (index) => {
		const item = bannerList.value[index];
		if (!item) return;
		if (!item.categoryId || !item.imageType) {
			console.log('[Page] 该轮播图未关联可跳转分类，忽略点击');
			return;
		}
		$openPage({
			name: 'imageList',
			query: {
				type: item.imageType,
				categoryId: item.categoryId,
				title: item.categoryName
			}
		});
	};

</script>

<style lang="scss" scoped>
	.banner-wrap {
		position: relative;
	}

	.banner-swiper {
		height: 300rpx;
	}

	.banner-img {
		display: block;
		width: 100%;
		height: 300rpx;
		border-radius: 16rpx;
		// 默认(非当前)缩小到 0.9，四周自然留空隙；不露相邻图
		transform: scale(0.9);
		transition: transform 0.35s ease;

		// 当前项放大到 1，撑满
		&--active {
			transform: scale(1);
		}
	}

	// 指示点叠在图片内底部居中
	.banner-dots {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 16rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.banner-dot {
		width: 12rpx;
		height: 6rpx;
		margin: 0 5rpx;
		border-radius: 3rpx; // 小圆角的长方形
		background-color: rgba(255, 255, 255, 0.5);
		transition: width 0.3s ease;

		// 当前项：更长 + 高亮
		&--active {
			width: 30rpx;
			background-color: #ffffff;
		}
	}
</style>