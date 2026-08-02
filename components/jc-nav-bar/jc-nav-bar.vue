<template>
	<app-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftWidth="0" :rightWidth="navInfo.right" :paddingTitle="5" :border="false" fixed>
		<view class="fu-flex-1 fu-flex fu-flex-column-center fu-gap-20">
			<!-- 名称由后台「运营管理 → 小程序信息」配置，取不到时 store 会退回本地兜底 -->
			<text class="navbar-title">{{ appInfoStore.appName }}</text>
			<view class="fu-flex-1">
				<!-- <up-search height="36px" radius="30px" inputAlign="left" bgColor="transparent" :showAction="false" readonly @click="$openPage('wallpaperSearch')"></up-search> -->
			</view>
		</view>
	</app-nav-bar>
</template>

<script setup>
	import { getCurrentInstance, ref, onMounted } from 'vue';
	import { useAppInfoStore } from '@/stores/appInfo.js';

	// data数据
	const { $mUtil, $openPage } = getCurrentInstance().appContext.config.globalProperties;
	const appInfoStore = useAppInfoStore();
	let navInfo = ref({});

	// 生命周期
	onMounted(async () => {
		navInfo.value = await $mUtil.getSystemInfo();
	});
</script>

<style lang="scss" scoped>
	.navbar-title {
		font-size: 20px;
		color: #FFFFFF;
		font-family: $font-agile;
	}
</style>