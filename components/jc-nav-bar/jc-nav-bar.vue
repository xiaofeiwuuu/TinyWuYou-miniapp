<template>
	<fu-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftWidth="0" :rightWidth="navInfo.right" :paddingTitle="5" :border="false" fixed>
		<view class="fu-flex-1 fu-flex fu-flex-column-center fu-gap-20">
			<text class="navbar-title">TinyWuYou-壁纸</text>
			<view class="fu-flex-1">
				<!-- <fu-search height="36px" radius="30px" inputAlign="left" bgColor="transparent" :showAction="false" readonly @click="$openPage('wallpaperSearch')"></fu-search> -->
			</view>
		</view>
	</fu-nav-bar>
</template>

<script setup>
	import { getCurrentInstance, ref, onMounted } from 'vue';
	
	// data数据
	const { $mUtil, $openPage } = getCurrentInstance().appContext.config.globalProperties;
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
		font-family: fontAgile;
	}
</style>