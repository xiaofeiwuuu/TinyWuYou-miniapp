<template>
	<page-layout customClass="navbar__content">
		<fu-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="left" title="关于我们" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></fu-nav-bar>

		<view class="about-container">
			<view class="fu-flex fu-flex-direction-column fu-flex-column-center fu-p-t-100">
				<view class="fu-w-160 fu-h-160">
					<fu-image width="100%" height="160rpx" :src="$mAssetsPath.appLogo" radius="10"></fu-image>
				</view>

				<view class="fu-text-c fu-font-32 fu-font-w-600 fu-m-t-30 text-white">{{ sysInfo.appName }}</view>
				<view class="fu-text-c fu-m-t-20 text-gray">{{ '用壁纸装点生活，让手机也能表达你的心情✨' }}</view>
				<!-- #ifndef H5 -->
				<view class="fu-text-c fu-m-t-20 text-gray">{{ `V${sysInfo.appVersion}` }}</view>
				<!-- #endif -->
			</view>

			<view class="fu-m-x-30 fu-m-t-50">
				<view class="menu-card">
					<view
						class="menu-item"
						v-for="(item, index) in $mConstDataConfig.aboutUs"
						:key="index"
						:class="{ 'menu-item-border': index + 1 < $mConstDataConfig.aboutUs.length }"
						@click="$openPage({name: item.url, query: {name: item.name, ...item.params}})"
					>
						<view class="menu-title">{{ item.name || '' }}</view>
						<fu-icons type="right" color="#999999"></fu-icons>
					</view>
				</view>
			</view>
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, computed } from 'vue';

	// data数据
	const { $fu, $openPage, $mUtil } = getCurrentInstance().appContext.config.globalProperties;

	// computed计算属性
	const sysInfo = computed(() => {
		return $fu.sys()
	});
</script>

<style scoped lang="scss">
.about-container {
	min-height: 100vh;
}

.text-white {
	color: #ffffff;
}

.text-gray {
	color: #999999;
}

.menu-card {
	background: rgba(255, 255, 255, 0.05);
	backdrop-filter: blur(10rpx);
	border: 2rpx solid rgba(255, 255, 255, 0.1);
	border-radius: 20rpx;
	overflow: hidden;
}

.menu-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	transition: all 0.3s ease;

	&:active {
		background: rgba(255, 255, 255, 0.08);
	}

	&.menu-item-border {
		border-bottom: 2rpx solid rgba(255, 255, 255, 0.1);
	}
}

.menu-title {
	font-size: 30rpx;
	color: #ffffff;
	font-weight: 500;
}
</style>