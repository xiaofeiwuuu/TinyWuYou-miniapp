<template>
	<page-layout customClass="navbar__content">
		<fu-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="left" :title="title" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></fu-nav-bar>
		<view class="fu-m-x-30">
			<view class="album-box__item" v-for="(item,index) in 6" :key="index" @click="$openPage('albumDetails')">
				<view class="album-box__back">
					<fu-image width="100%" height="100%" bgColor="transparent"></fu-image>
				</view>
				<view class="album-box__content fu-flex fu-flex-direction-column">
					<view class="fu-flex-1">
						<view class="font-family fu-font-36">小米10S Pro内置壁纸</view>
						<view class="fu-m-t-20">原生炫彩</view>
					</view>
					<view class="album-box__tag">160人喜欢</view>
				</view>
				<view class="album-box__badge">6</view>
			</view>
			
			<jc-loading-more :loadingType="queryParams.loadingType" />
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, ref } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';

	// data数据
	const { $mUtil, $openPage, $parseURL, $mConstDataConfig } = getCurrentInstance().appContext.config.globalProperties;
	let title = ref('');
	let list = ref([]);
	let queryParams = ref({
		pageNum: 1,
		pageSize: $mConstDataConfig.pageSize,
		loadingType: 0,
		loadMore: true
	});
	
	// 生命周期
	onLoad((options) => {
		let query;
		// #ifdef MP
		query = $parseURL(options.query);
		// #endif
		// #ifndef MP
		query = JSON.parse(options.query)
		// #endif
		title.value = query.title;
	});
</script>

<style lang="scss" scoped>
	.album-box {
		
		&__item {
			height: 268rpx;
			margin-top: 30rpx;
			border-radius: 15rpx;
			position: relative;
			overflow: hidden;
			padding: 30rpx 0 30rpx 30rpx;
			background-color: #222222;
		}
		
		&__back {
			position: absolute;
			width: 100%;
			height: 100%;
			top: 0;
			left: 0;
		}
		
		&__content {
			position: relative;
			height: 100%;
		}
		
		&__tag {
			background-color: $bg-color-mask;
			width: fit-content;
			padding: 10rpx 25rpx;
			border-radius: 30rpx;
			font-size: 24rpx;
		}
		
		&__badge {
			position: absolute;
			top: 20rpx;
			right: 0;
			background-color: $bg-color-mask;
			padding: 2rpx 20rpx;
			font-size: 24rpx;
			border-radius: 30rpx 0 0 30rpx;
		}
	}
</style>