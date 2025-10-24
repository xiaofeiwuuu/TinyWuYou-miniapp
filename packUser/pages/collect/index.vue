<template>
	<page-layout customClass="navbar__content">
		<fu-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="left" title="我的收藏" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></fu-nav-bar>

		<!-- 图片类型切换 -->
		<view class="fu-m-t-20">
			<fu-tabs
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
	import { getCurrentInstance, ref } from 'vue';
	import { onLoad, onReachBottom } from '@dcloudio/uni-app';
	import { getCollections } from '@/api/user.js';

	// data数据
	const { $mUtil, $openPage, $mConstDataConfig } = getCurrentInstance().appContext.config.globalProperties;
	let list = ref([]);
	let currentImageType = ref(''); // 当前选中的图片类型,空字符串表示全部
	let queryParams = ref({
		pageNum: 1,
		pageSize: $mConstDataConfig.pageSize,
		loadingType: 0,
		loadMore: true
	});

	// 图片类型 Tabs (根据数据库定义的所有图片类型)
	const imageTypeTabs = ref([
		{ id: '', name: '全部' },
		{ id: 'avatar', name: '头像' },
		{ id: 'wallpaper', name: '手机壁纸' },
		{ id: 'pc_wallpaper', name: 'PC壁纸' },
		{ id: 'emoji', name: '表情' },
		{ id: 'sticker', name: '贴纸' }
	]);

	// 生命周期
	onLoad(() => {
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

		console.log('[Collect] 点击图片:', item);

		// 根据图片类型跳转到不同详情页
		const detailPageMap = {
			'avatar': 'avatarDetails',
			'wallpaper': 'mobileDetails',
			'pc_wallpaper': 'mobileDetails', // PC壁纸也用壁纸详情页
			'emoji': 'mobileDetails', // 表情暂时用壁纸详情页
			'sticker': 'mobileDetails' // 贴纸暂时用壁纸详情页
		};

		const pageToOpen = detailPageMap[item.imageType] || 'mobileDetails';

		$openPage({
			name: pageToOpen,
			query: { imageId: item.id }
		});
	};
</script>

<style lang="scss" scoped>

</style>