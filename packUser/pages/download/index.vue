<template>
	<page-layout customClass="navbar__content">
		<app-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="arrow-left" title="我的下载" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>
	
		<view class="fu-m-x-30 fu-m-t-20" style="color: #FFFFFF;">
			<jc-grid :list="list" @click="onClick($event)" />
			<jc-loading-more :loadingType="queryParams.loadingType" />
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, ref } from 'vue';
	import { onLoad, onReachBottom } from '@dcloudio/uni-app';
	
	// data数据
	const { $mUtil, $mAssetsPath, $mConstDataConfig, $openPage } = getCurrentInstance().appContext.config.globalProperties;
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
	/**
	 * 模板里一直在调 onClick，但这个函数从来没有定义过——
	 * 点任何一张图都会直接抛 "onClick is not a function"。
	 *
	 * 注意：这个页面的列表还是模板自带的假数据（$mAssetsPath.mobile 等本地图），
	 * 没有 id，所以补上这个函数只是让它不再报错，下载历史本身还没接后端。
	 */
	const onClick = (item) => {
		if(!item || !item.id) return console.error('[Download] 图片缺少 ID:', item)
		// 详情页只有一个，布局由图片自己的 imageType 决定
		$openPage({name: 'imageDetail', query: { imageId: item.id, type: item.imageType }})
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