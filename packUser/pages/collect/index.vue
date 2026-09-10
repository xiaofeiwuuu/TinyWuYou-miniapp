<template>
	<page-layout customClass="navbar__content">
		<app-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="arrow-left" title="我的收藏" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<!-- 图片类型切换 -->
		<view class="fu-m-t-20">
			<up-tabs
				:list="imageTypeTabs"
				activeStyle="#FFFFFF"
				inactiveStyle="#a7a7a7"
				lineColor="#FFFFFF"
				size="30"
				@click="onTabChange"
			/>
		</view>

		<!-- 瀑布流:每张按自己朝向的高宽比显示(方图/横图/竖图各自比例),不再统一竖图 -->
		<view class="fu-m-x-30 fu-m-t-20">
			<view class="masonry">
				<view class="masonry__col" v-for="(col, ci) in columns" :key="ci" :style="{ width: colW + 'px' }">
					<view class="masonry__item" v-for="item in col" :key="item.id" @click="onClick(item)">
						<app-image width="100%" :height="item._h + 'px'" radius="12" mode="aspectFill" bgColor="#222222" :src="item.image"></app-image>
						<view v-if="item.isVip" class="vip-badge">VIP</view>
					</view>
				</view>
			</view>
			<jc-loading-more :loadingType="queryParams.loadingType" />
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, ref, computed } from 'vue';
	import { onLoad, onReachBottom } from '@dcloudio/uni-app';
	import { getCollections } from '@/api/user.js';
	import { useImageTypeStore } from '@/stores/imageType.js';

	// data数据
	const { $mUtil, $openPage, $mConstDataConfig } = getCurrentInstance().appContext.config.globalProperties;
	const imageTypeStore = useImageTypeStore();
	let list = ref([]);
	let currentImageType = ref(''); // 当前选中的图片类型,空字符串表示全部
	let queryParams = ref({
		pageNum: 1,
		pageSize: $mConstDataConfig.pageSize,
		loadingType: 0,
		loadMore: true
	});

	/**
	 * 图片类型 Tabs，从后端配置读取。
	 *
	 * 原来是写死的六项，有两个问题：
	 * 1. 名字和后台配置对不上（这里叫「PC壁纸」「表情」，后台是「平板/电脑壁纸」「表情包」）
	 * 2. 后台新增类型时这里不会出现，收藏了也筛不出来
	 */
	const imageTypeTabs = computed(() => [
		{ id: '', name: '全部' },
		...imageTypeStore.types.map((t) => ({ id: t.code, name: t.name }))
	]);

	// —— 瀑布流布局 ——
	// 列宽按屏宽算死:容器左右各 30rpx 外边距,两列之间 20rpx 间距。
	const COLS = 2;
	const GAP_RPX = 20;
	const SIDE_RPX = 30;
	const sys = uni.getSystemInfoSync();
	const rpx2px = (r) => (r * (sys.windowWidth || 375)) / 750;
	const colW = computed(() => {
		const w = sys.windowWidth || 375;
		return (w - rpx2px(SIDE_RPX) * 2 - rpx2px(GAP_RPX) * (COLS - 1)) / COLS;
	});

	// 把 list 按「朝向高宽比」分配到最矮的列,得到两列各自的项(带算好的像素高度 _h)。
	// 高度倍率复用 store 里既有的朝向约定:方图 1 / 竖图 2 / 横图 0.7。
	const columns = computed(() => {
		const cw = colW.value;
		const cols = Array.from({ length: COLS }, () => []);
		const heights = new Array(COLS).fill(0);
		for (const it of list.value) {
			const mult = imageTypeStore.getGridConfig(it.imageType).multiple || 1;
			const h = Math.round(cw * mult);
			let idx = 0;
			for (let i = 1; i < COLS; i++) if (heights[i] < heights[idx]) idx = i;
			cols[idx].push({ ...it, _h: h });
			heights[idx] += h + rpx2px(GAP_RPX);
		}
		return cols;
	});

	// 生命周期
	onLoad(async () => {
		// 类型配置要先到位，否则 tabs 是空的
		await imageTypeStore.fetchTypes()
		init()
	});

	onReachBottom(() => {
		if(queryParams.value.loadMore) {
			queryParams.value.pageNum++
			setTimeout(() => {
				initList()
			}, 500)
		}
	});

	// methods
	const init = () => {
		queryParams.value.pageNum = 1;
		list.value = [];
		initList()
	};

	// Tab切换
	const onTabChange = (tab) => {
		console.log('[Collect] 切换Tab:', tab);
		currentImageType.value = tab.id;
		init(); // 重新加载数据
	};

	const initList = async () => {
		queryParams.value.loadingType = 1;

		try {
			console.log('[Collect] 加载收藏列表, 页码:', queryParams.value.pageNum, '类型:', currentImageType.value);

			const res = await getCollections(queryParams.value.pageNum, queryParams.value.pageSize);

			if (res.code === 0) {
				const collections = res.data.list || [];
				console.log('[Collect] 加载成功, 数量:', collections.length);

				// 转换数据格式为瀑布流所需格式
				let newData = collections
					.filter(item => item.image) // 过滤掉没有图片的数据
					.map(item => ({
						id: item.image.id,
						image: item.image.thumbnailUrl || item.image.imageUrl,
						imageUrl: item.image.imageUrl,
						title: item.image.title,
						imageType: item.image.imageType,
						isVip: item.image.isVip
					}));

				// 根据选中的类型筛选
				if (currentImageType.value) {
					newData = newData.filter(item => item.imageType === currentImageType.value);
					console.log('[Collect] 筛选后数量:', newData.length);
				}

				if (!newData.length) {
					queryParams.value.loadingType = 2;
					queryParams.value.loadMore = false;
					return
				}

				list.value = queryParams.value.pageNum === 1 ? newData : list.value.concat(newData);

				if (newData.length < queryParams.value.pageSize) {
					queryParams.value.loadingType = 2;
					queryParams.value.loadMore = false;
					return
				}

				queryParams.value.loadingType = 0;
			} else {
				console.error('[Collect] 加载失败:', res.message);
				queryParams.value.loadingType = 2;
				queryParams.value.loadMore = false;
			}
		} catch (error) {
			console.error('[Collect] 加载异常:', error);
			queryParams.value.loadingType = 2;
			queryParams.value.loadMore = false;
		}
	};

	// 点击图片
	const onClick = (item) => {
		if (!item || !item.id) return;

		/**
		 * 详情页只有一个，布局由图片自己的朝向决定。
		 *
		 * 原来这里有一张映射表，把 pc_wallpaper / emoji / sticker 全指向了
		 * 竖图的整屏壁纸详情页（注释写着"暂时用"），横图被拉满屏、方图没有推荐位。
		 */
		$openPage({
			name: 'imageDetail',
			query: { imageId: item.id, type: item.imageType }
		});
	};
</script>

<style lang="scss" scoped>
	.masonry {
		display: flex;
		gap: 20rpx;
		align-items: flex-start;
	}
	.masonry__col {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}
	.masonry__item {
		position: relative;
		line-height: 0; // 去掉 image 下方基线留白
	}
	.vip-badge {
		position: absolute;
		top: 8rpx;
		right: 8rpx;
		background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
		color: #000000;
		font-size: 20rpx;
		font-weight: bold;
		line-height: 1.4;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		z-index: 10;
	}
</style>