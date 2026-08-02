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

		<view class="fu-m-x-30 fu-m-t-20" style="color: #FFFFFF;">
			<jc-grid :list="list" @click="onClick" />
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
						imageType: item.image.imageType
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

</style>