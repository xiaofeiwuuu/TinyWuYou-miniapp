<template>
	<page-layout>
		<fu-nav-bar bgColor="#111111" leftIcon="left" :title="title" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></fu-nav-bar>
				
		<fu-sticky bgColor="#111111" :customNavHeight="customNavHeight">
			<fu-tabs :list="tabsList" activeStyle="#FFFFFF" inactiveStyle="#a7a7a7" lineColor="#FFFFFF" size="30" @click="handleTabs" />
		</fu-sticky>
		
		<view class="fu-m-x-30 fu-m-t-20" style="color: #FFFFFF;">
			<jc-grid :list="list" :column="3" multiple="1" @click="handleImageClick" />
			<jc-loading-more :loadingType="queryParams.loadingType" />
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, ref, computed } from 'vue';
	import { onLoad, onReachBottom } from '@dcloudio/uni-app';
	import { useCategoryStore } from '@/stores/category.js';
	import { getImageList } from '@/api/image.js';

	// data数据
	const { $fu, $mUtil, $mConstDataConfig, $openPage, $parseURL } = getCurrentInstance().appContext.config.globalProperties;
	const categoryStore = useCategoryStore();

	let title = ref('');
	let imageType = ref(''); // 当前图片类型 (avatar/wallpaper/emoji等)
	let currentCategoryId = ref(null); // 当前选中的分类ID

	// 分类标签列表 - 从 store 动态获取
	const tabsList = computed(() => {
		if (!categoryStore.categories || !imageType.value) return [];

		// 获取对应类型的分类列表
		const categories = categoryStore.categories[imageType.value] || [];

		// 转换为 tabs 格式
		return categories.map(cat => ({
			id: cat.id,
			name: cat.name
		}));
	});

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

		title.value = query.title;
		imageType.value = query.type; // 获取图片类型

		console.log('[AvatarIndex] 页面参数:', { title: title.value, type: imageType.value });

		// 先加载分类数据
		await categoryStore.fetchCategories();

		// 设置默认选中第一个分类
		if (tabsList.value.length > 0) {
			currentCategoryId.value = tabsList.value[0].id;
		}

		init();
	});
	
	onReachBottom(() => {
		if(queryParams.value.loadMore) {
			queryParams.value.pageNum++
			setTimeout(() => {
				initList()
			}, 500)
		}
	});
	
	// computed计算属性
	const customNavHeight = computed(() => {
		return $mUtil.pxToRpx($fu.sys().statusBarHeight + 44)
	});
	
	// methods方法
	// tabs切换
	const handleTabs = (e) => {
		console.log('[AvatarIndex] 切换分类:', e);
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
			console.log('[AvatarIndex] 分类ID为空，跳过加载');
			return;
		}

		queryParams.value.loadingType = 1;

		try {
			console.log('[AvatarIndex] 加载图片列表:', {
				categoryId: currentCategoryId.value,
				page: queryParams.value.pageNum,
				pageSize: queryParams.value.pageSize
			});

			const res = await getImageList({
				categoryId: currentCategoryId.value,
				page: queryParams.value.pageNum,
				pageSize: queryParams.value.pageSize
			});

			if (res.code === 0) {
				const newData = res.data.list || [];

				// 转换数据格式
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

				console.log('[AvatarIndex] 加载成功，当前列表长度:', list.value.length);
			} else {
				console.error('[AvatarIndex] 加载失败:', res.message);
				queryParams.value.loadingType = 3; // 加载失败
			}
		} catch (error) {
			console.error('[AvatarIndex] 加载异常:', error);
			queryParams.value.loadingType = 3; // 加载失败
		}
	};

	// 点击图片跳转到详情页
	const handleImageClick = (item) => {
		console.log('[AvatarIndex] 点击图片:', item);
		if (item && item.id) {
			$openPage({
				name: 'avatarDetails',
				query: { imageId: item.id }
			});
		} else {
			console.error('[AvatarIndex] 图片数据缺少ID:', item);
		}
	};
</script>

<style lang="scss" scoped>
	:deep(.fu-nav-bar-text) {
		font-weight: bold;
	}
</style>