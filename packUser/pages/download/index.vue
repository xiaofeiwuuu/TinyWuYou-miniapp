<template>
	<page-layout customClass="navbar__content">
		<fu-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="left" title="我的下载" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></fu-nav-bar>
	
		<view class="fu-m-x-30 fu-m-t-20" style="color: #FFFFFF;">
			<jc-grid :list="list" @click="onClick('mobileDetails', $event)" />
			<jc-loading-more :loadingType="queryParams.loadingType" />
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, ref } from 'vue';
	import { onLoad, onReachBottom } from '@dcloudio/uni-app';
	
	// data数据
	const { $mUtil, $mAssetsPath, $mConstDataConfig } = getCurrentInstance().appContext.config.globalProperties;
	let list = ref([]);
	let queryParams = ref({
		pageNum: 1,
		pageSize: $mConstDataConfig.pageSize,
		loadingType: 0,
		loadMore: true
	});
	
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