<template>
	<view class="fu-p-b-30">
		<!-- <view class="fu-m-x-30 fu-m-t-20">
			<fu-swiper :list="[{image: $mAssetsPath.banner}]" height="320" radius="15" :showIndicator="false" />
		</view> -->
		
		<jc-wallpaper-rec />
			
		<!-- <fu-tabs :list="tabsList" activeStyle="#FFFFFF" inactiveStyle="#a7a7a7" lineColor="#FFFFFF" size="30" @click="onClick('tabs', $event)" /> -->
		
		<!-- <view class="fu-m-x-30 fu-m-t-20" style="color: #FFFFFF;">
			<jc-grid :list="list" @click="onClick('mobileDetails', $event)" />
			<jc-loading-more :loadingType="queryParams.loadingType" />
		</view> -->
	</view>
</template>

<script setup>
	import { getCurrentInstance, ref, computed, onMounted } from 'vue';
	import { onReachBottom } from '@dcloudio/uni-app';
	import { useCategoryStore } from '@/stores/category.js';
	import { useAdStore } from '@/stores/ad.js';
	import { keyManager } from '@/util/key-manager.js';

	// data数据
	const { $mAssetsPath, $mConstDataConfig, $openPage } = getCurrentInstance().appContext.config.globalProperties;
	const categoryStore = useCategoryStore();
	const adStore = useAdStore();
	const tabsList = computed(() => categoryStore.wallpaperList);
	let list = ref([]);
	let queryParams = ref({
		pageNum: 1,
		pageSize: $mConstDataConfig.pageSize,
		loadingType: 0,
		loadMore: true
	});

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

		// 加载广告配置
		await initAdConfig();

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

	// methods方法
	const initCategories = async () => {
		try {
			await categoryStore.fetchCategories();
			console.log('[Page] 分类数据已加载，tabs 数量:', tabsList.value.length);
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

	const onClick = (state, e) => {
		switch(state) {
			case 'tabs':
				init()
				break
			default:
				$openPage({name: state, query: e})
				break
		}
	};

	const init = () => {
		queryParams.value.pageNum = 1;
		list.value = [];
		initList()
	};

	const initList = () => {
		queryParams.value.loadingType = 1;
		const newData = [
			{ image: $mAssetsPath.mobile },
			{ image: $mAssetsPath.mobile1 },
			{ image: $mAssetsPath.mobile2 },
			{ image: $mAssetsPath.mobile1 },
			{ image: $mAssetsPath.mobile },
			{ image: $mAssetsPath.mobile2 },
			{ image: $mAssetsPath.mobile1 },
			{ image: $mAssetsPath.mobile },
			{ image: $mAssetsPath.mobile2 },
			{ image: $mAssetsPath.mobile1 },
			{ image: $mAssetsPath.mobile },
			{ image: $mAssetsPath.mobile2 },
		];
		
		if(!newData.length) {
			queryParams.value.loadingType = 2;
			queryParams.value.loadMore = false;
			return
		}
		
		list.value = queryParams.value.pageNum === 1? newData: list.value.concat(newData);
		
		if(newData.length < queryParams.value.pageSize) {
			queryParams.value.loadingType = 2;
			queryParams.value.loadMore = false;
			return
		}
		
		queryParams.value.loadingType = 0;
	};
</script>

<style lang="scss" scoped>
	
</style>