<template>
	<view class="">
		<fu-nav-bar bgColor="#111111" leftWidth="0" :rightWidth="navInfo.right" :paddingTitle="5" :border="false" fixed>
			<view class="fu-flex-1 fu-flex fu-flex-column-center fu-gap-20 fu-m-l--10">
				<fu-icons type="left" color="#ffffff" size="24" @click="$mUtil.overBack()"></fu-icons>
				<fu-search v-model="queryParams.keyword" height="36px" radius="30px" inputAlign="left" bgColor="#222222" color="#ffffff" :showAction="false" @clear="handleSearchClear" @confirm="handleSearch"></fu-search>
			</view>
		</fu-nav-bar>
			
		<fu-sticky :customNavHeight="customNavHeight" bgColor="#111111">
			<fu-tabs :list="tabsList" activeStyle="#FFFFFF" inactiveStyle="#a7a7a7" lineColor="#FFFFFF" size="30" @click="onClick('tabs', $event)" />
		</fu-sticky>
		
		<view class="fu-m-x-30 fu-m-t-20" style="color: #FFFFFF;">
			<jc-grid :list="list" @click="onClick('mobileDetails', $event)" />
			<jc-loading-more :loadingType="queryParams.loadingType" />
		</view>
	</view>
</template>

<script setup>
	import { getCurrentInstance, ref, computed } from 'vue';
	import { onLoad, onReachBottom } from '@dcloudio/uni-app';
	
	// data数据
	const { $fu, $mUtil, $parseURL, $mAssetsPath, $mConstDataConfig } = getCurrentInstance().appContext.config.globalProperties;
	let navInfo = ref({});
	const tabsList = ref([
		{ id: 0, name: '推荐' },
		{ id: 1, name: '动漫卡通' },
		{ id: 2, name: '唯美风景' },
		{ id: 3, name: '美女达人' },
		{ id: 4, name: '动物萌宠' },
		{ id: 5, name: '创意设计' },
		{ id: 6, name: '节日节气' },
		{ id: 7, name: '打工人' },
		{ id: 8, name: '其他' }
	]);
	let list = ref([]);
	let queryParams = ref({
		pageNum: 1,
		pageSize: $mConstDataConfig.pageSize,
		loadingType: 0,
		loadMore: true
	});
	
	// 生命周期
	onLoad(async (options) => {
		navInfo.value = await $mUtil.getSystemInfo();
		let query;
		// #ifdef MP
		query = $parseURL(options.query);
		// #endif
		// #ifndef MP
		query = JSON.parse(options.query);
		// #endif
		queryParams.value['keyword'] = query.value;
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
	
	// computed计算属性
	const customNavHeight = computed(() => {
		return $mUtil.pxToRpx($fu.sys().statusBarHeight + 44);
	});
	
	// methods方法
	// 处理搜索
	const handleSearch = (e) => {
		init()
		if($fu.trim(e.value)) return $mUtil.searchStorage({key: 'wallpaperHistoryStorage', data: e})
	};
	
	// 清空搜索
	const handleSearchClear = () => {
		init()
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