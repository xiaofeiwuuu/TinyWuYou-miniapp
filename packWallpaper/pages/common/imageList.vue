<template>
	<page-layout>
		<app-nav-bar bgColor="#111111" leftIcon="arrow-left" :title="title" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<up-sticky bgColor="#111111" :customNavHeight="customNavHeight">
			<up-tabs :list="tabsList" activeStyle="#FFFFFF" inactiveStyle="#a7a7a7" lineColor="#FFFFFF" size="30" @click="handleTabs" />
		</up-sticky>

		<view class="fu-m-x-30 fu-m-t-20" style="color: #FFFFFF;">
			<!--
				virtual：列表会随下拉不断累加，几万张图的分类里节点会线性增长到卡顿。
				等高网格可以精确算出可视行，只渲染窗口内的格子，节点数恒定。
			-->
			<jc-grid
				:list="list"
				:column="grid.column"
				:multiple="grid.multiple"
				virtual
				:scroll-top="scrollTop"
				@click="handleImageClick"
			/>
			<jc-loading-more :loadingType="queryParams.loadingType" />
		</view>
	</page-layout>
</template>

<script setup>
	/**
	 * 通用图片列表页。
	 *
	 * 原来 avatar / mobile / desktop / emoji / sticker 五个页面各有一份 index.vue，
	 * 彼此只差标题、类型名、日志前缀和网格参数（emoji 与 sticker 仅相差 24 行），
	 * 现在合并成这一个页面：
	 *   - 类型和标题从路由参数来
	 *   - 网格布局由后端配置的朝向决定（竖图/横图/方图），后台加类型不用发版
	 */
	import { getCurrentInstance, ref, computed } from 'vue';
	import { onLoad, onReachBottom, onPageScroll } from '@dcloudio/uni-app';
	import { useCategoryStore } from '@/stores/category.js';
	import { useImageTypeStore } from '@/stores/imageType.js';
	import { getImageList } from '@/packWallpaper/api/image.js';

	// data数据
	const { $u, $mUtil, $mConstDataConfig, $openPage, $parseURL } = getCurrentInstance().appContext.config.globalProperties;
	const categoryStore = useCategoryStore();
	const imageTypeStore = useImageTypeStore();

	let title = ref('');
	let imageType = ref(''); // 当前图片类型
	let currentCategoryId = ref(null); // 当前选中的分类ID

	// 网格布局（列数与高宽比）由该类型的朝向决定
	const grid = computed(() => imageTypeStore.getGridConfig(imageType.value));

	// 分类标签列表 - 从 store 动态获取
	const tabsList = computed(() => {
		if (!categoryStore.categories || !imageType.value) return [];
		const categories = categoryStore.categories[imageType.value] || [];
		return categories.map(cat => ({ id: cat.id, name: cat.name }));
	});

	// 页面滚动距离，传给 jc-grid 做虚拟滚动
	let scrollTop = ref(0);

	let list = ref([]);
	let queryParams = ref({
		pageNum: 1,
		pageSize: $mConstDataConfig.pageSize,
		loadingType: 0,
		loadMore: true
	});

	// 生命周期
	onLoad(async (options) => {
		let query;
		// #ifdef MP
		query = $parseURL(options.query);
		// #endif
		// #ifndef MP
		query = JSON.parse(options.query)
		// #endif

		imageType.value = query.type;
		// 标题优先用路由传来的，没传就用后台配的类型名
		title.value = query.title || '';

		// 类型配置要先到位，否则首屏会用兜底布局渲染一次再跳变
		await imageTypeStore.fetchTypes();
		if (!title.value) title.value = imageTypeStore.getTypeName(imageType.value);

		console.log('[ImageList] 页面参数:', {
			title: title.value,
			type: imageType.value,
			orientation: imageTypeStore.getOrientation(imageType.value)
		});

		await categoryStore.fetchCategories();

		// 默认选中第一个分类
		if (tabsList.value.length > 0) {
			currentCategoryId.value = tabsList.value[0].id;
		}

		init();
	});

	onPageScroll((e) => {
		scrollTop.value = e.scrollTop;
	});

	onReachBottom(() => {
		if (queryParams.value.loadMore) {
			queryParams.value.pageNum++
			setTimeout(() => {
				initList()
			}, 500)
		}
	});

	/**
	 * 吸顶偏移 = 状态栏高度 + 导航栏 44。
	 *
	 * 这里必须给 px，不能给 rpx：u-sticky 内部是 getPx(customNavHeight)，
	 * 而 getPx 对纯数字一律当 px 处理（带 'rpx' 后缀的字符串才会转换）。
	 * 原来写的是 pxToRpx(...)，传进去的数值被当成 px，偏移量放大约一倍，
	 * tab 停在远低于导航栏的位置，中间空出的一条正好露出滚动的图片。
	 */
	const customNavHeight = computed(() => {
		return $u.sys().statusBarHeight + 44
	});

	// methods方法
	// tabs切换
	const handleTabs = (e) => {
		currentCategoryId.value = e.id;
		init();
	};

	// 初始化
	const init = () => {
		queryParams.value.pageNum = 1;
		queryParams.value.loadMore = true;
		list.value = [];
		initList();
	};

	const initList = async () => {
		if (!currentCategoryId.value) {
			console.log('[ImageList] 分类ID为空，跳过加载');
			return;
		}

		queryParams.value.loadingType = 1;

		try {
			const res = await getImageList({
				categoryId: currentCategoryId.value,
				page: queryParams.value.pageNum,
				pageSize: queryParams.value.pageSize
			});

			if (res.code === 0) {
				const newData = res.data.list || [];

				const formattedData = newData.map(img => ({
					id: img.id,
					image: img.thumbnailUrl || img.imageUrl,
					imageUrl: img.imageUrl,
					title: img.title,
					width: img.width,
					height: img.height,
					isVip: img.isVip
				}));

				// 第一页覆盖，后续页追加
				list.value = queryParams.value.pageNum === 1
					? formattedData
					: list.value.concat(formattedData);

				// 判断是否还有更多数据
				if (formattedData.length < queryParams.value.pageSize) {
					queryParams.value.loadingType = 2; // 没有更多了
					queryParams.value.loadMore = false;
				} else {
					queryParams.value.loadingType = 0; // 加载完成
				}
			} else {
				console.error('[ImageList] 加载失败:', res.message);
				queryParams.value.loadingType = 3;
			}
		} catch (error) {
			console.error('[ImageList] 加载异常:', error);
			queryParams.value.loadingType = 3;
		}
	};

	// 点击图片跳转到详情页
	const handleImageClick = (item) => {
		if (!item || !item.id) {
			console.error('[ImageList] 图片数据缺少ID:', item);
			return;
		}
		// 详情页只有一个，布局由图片朝向决定；type 传过去只是让它首屏不闪
		$openPage({ name: 'imageDetail', query: { imageId: item.id, type: imageType.value } });
	};
</script>

<style lang="scss" scoped>
	:deep(.app-nav-bar-text) {
		font-weight: bold;
	}
</style>
