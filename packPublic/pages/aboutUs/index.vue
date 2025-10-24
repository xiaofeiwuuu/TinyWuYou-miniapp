<template>
	<view class="">
		<view class="fu-flex fu-flex-direction-column fu-flex-column-center fu-p-t-100">
			<view class="fu-w-160 fu-h-160">
				<fu-image width="100%" height="160rpx" :src="$mAssetsPath.appLogo" radius="10"></fu-image>
			</view>
			
			<view class="fu-text-c fu-font-32 fu-font-w-600 fu-m-t-30">{{ sysInfo.appName }}</view>
			<view class="fu-text-c fu-color-999999 fu-m-t-20">{{ '动态壁纸，点亮指尖魔法✨' }}</view>
			<!-- #ifndef H5 -->
			<view class="fu-text-c fu-color-999999 fu-m-t-20">{{ `V${sysInfo.appVersion}` }}</view>
			<!-- #endif -->
		</view>

		<view class="fu-m-x-30 fu-b-r-10 fu-hidden">
			<fu-cell-group :border="false" customClass="fu-bg-ffffff fu-b-r-10 fu-m-t-50">
				<fu-cell :title="item.name || ''" customClass="fu-border-b fu-br-f5f5f5 fu-p-x-30" customStyle="padding: 30rpx 0" :border="index + 1 < $mConstDataConfig.aboutUs.length? true: false" :isLink="true" v-for="(item, index) in $mConstDataConfig.aboutUs" :key="index" @click="$openPage({name: item.url, query: {name: item.name, ...item.params}})">
					<template v-slot:right>
						<fu-icons type="right" color="#999999"></fu-icons>
					</template>
				</fu-cell>
			</fu-cell-group>
		</view>
	</view>
</template>

<script setup>
	import { getCurrentInstance, computed } from 'vue';
	
	// data数据
	const { $fu, $openPage } = getCurrentInstance().appContext.config.globalProperties;
	
	// computed计算属性
	const sysInfo = computed(() => {
		return $fu.sys()
	});
</script>

<style lang="scss">
	page {
		background-color: $bg-color-grey;
		color: $text-color-333333;
	}
</style>