<template>
	<page-layout>
		<fu-nav-bar bgColor="transparent" leftIcon="left" :border="false" color="#ffffff" title="搜索" fixed @clickLeft="$mUtil.overBack()" />
		
		<view class="fu-m-x-30">
			<view class="fu-bg-222222 fu-b-r-15">
				<fu-search height="40px" inputAlign="left" bgColor="transparent" color="#ffffff" :showAction="false" @confirm="handleSearch"></fu-search>
			</view>
			
			<block v-if="wallpaperHistoryStorage.length">
				<jc-section title="搜索历史" :family="false" size="30" margin="10rpx 0 0">
					<view class="fu-p-30 fu-m-r--30" @click="handleRemove">
						<fu-icons type="trash-can" color="#ffffff" size="16"></fu-icons>
					</view>
				</jc-section>
				<view class="fu-flex fu-flex-wrap fu-gap-30">
					<view class="fu-bg-222222 fu-p-x-30 fu-p-y-10 fu-font-24 fu-b-r-30 fu-hidden" v-for="(item,index) in wallpaperHistoryStorage" :key="index">
						{{ item.value || '' }}
					</view>
				</view>
			</block>
			
			<view class="">
				<jc-section title="猜你想搜" :family="false" size="30" margin="40rpx 0 30rpx" :showRight="false" />
				<view class="fu-flex fu-flex-wrap fu-gap-30">
					<view class="fu-bg-222222 fu-p-x-30 fu-p-y-10 fu-font-24 fu-b-r-30 fu-hidden" v-for="(item,index) in thinkSearch" :key="index">
						{{ item.name || '' }}
					</view>
				</view>
			</view>
			
			<view class="">
				<jc-section title="猜你喜欢" :family="false" size="30" margin="40rpx 0 0" :showRight="false" />
				<!-- 广告位 -->
			</view>
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, nextTick, ref } from 'vue';
	import { onShow } from '@dcloudio/uni-app';
	
	// data数据
	const { $fu, $mUtil, $openPage } = getCurrentInstance().appContext.config.globalProperties;
	let wallpaperHistoryStorage = ref([]); // 搜索历史
	let thinkSearch = ref([
		{name: '景深'},
		{name: '美女'},
		{name: '风景'},
		{name: '动漫'},
		{name: '简约'},
		{name: '卡通'},
		{name: '素描背景'}
	]); // 猜你想搜
	
	// 生命周期
	onShow(() => {
		uni.getStorage({
			key: 'wallpaperHistoryStorage',
			success: res => {
				wallpaperHistoryStorage.value = res.data;
			}
		})
	});
	
	// methods方法
	// 处理搜索
	const handleSearch = (e) => {
		if(!$fu.trim(e.value)) return $fu.toast('请输入搜索关键词~')
		$mUtil.searchStorage({key: 'wallpaperHistoryStorage', data: e})
		$openPage({name: 'wallpaperSearchList', query: e})
	};
	
	// 清空历史
	const handleRemove = () => {
		uni: uni.removeStorage({
			key: 'wallpaperHistoryStorage',
			success: () => {
				wallpaperHistoryStorage.value = [];
			}
		})
	}
</script>

<style lang="scss" scoped>
	
</style>