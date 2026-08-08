<template>
	<page-layout customClass="navbar__content">
		<app-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="arrow-left" title="关于我们" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<view class="about-container">
			<view class="fu-flex fu-flex-direction-column fu-flex-column-center fu-p-t-100">
				<view class="fu-w-160 fu-h-160">
					<!--
						Logo、名称、标语都来自后台「运营管理 → 小程序信息」，改完即时生效。
						原来分别是本地静态图、$u.sys().appName（读的是 manifest 里编译期写死的名字）
						和一句硬编码文案，改任何一处都要重新发版并走微信审核。
					-->
					<app-image width="100%" height="100%" mode="aspectFit" bgColor="transparent" :src="appInfoStore.logo" radius="10"></app-image>
				</view>

				<view class="fu-text-c fu-font-32 fu-font-w-600 fu-m-t-30 text-white">{{ appInfoStore.appName }}</view>
				<view class="fu-text-c fu-m-t-20 fu-m-x-60 text-gray">{{ appInfoStore.slogan }}</view>
				<!-- #ifndef H5 -->
				<view class="fu-text-c fu-m-t-20 text-gray">{{ `V${sysInfo.appVersion}` }}</view>
				<!-- #endif -->
			</view>

			<!-- 联系方式：后台一项都没配就整块不显示，避免出现一排空值 -->
			<view v-if="appInfoStore.hasContact" class="fu-m-x-30 fu-m-t-50">
				<view class="menu-card">
					<!-- 微信号和邮箱直接点整行复制，不再显示「复制」二字 -->
					<view v-if="appInfoStore.contact.wechat" class="menu-item menu-item-border" @click="onCopy(appInfoStore.contact.wechat, '微信号')">
						<view class="menu-title">客服微信</view>
						<view class="menu-value">
							<text class="menu-value__text">{{ appInfoStore.contact.wechat }}</text>
						</view>
					</view>
					<view v-if="appInfoStore.contact.email" class="menu-item" :class="{ 'menu-item-border': !!appInfoStore.contact.workTime }" @click="onCopy(appInfoStore.contact.email, '邮箱')">
						<view class="menu-title">邮箱</view>
						<view class="menu-value">
							<text class="menu-value__text">{{ appInfoStore.contact.email }}</text>
						</view>
					</view>
					<view v-if="appInfoStore.contact.workTime" class="menu-item">
						<view class="menu-title">工作时间</view>
						<view class="menu-value">
							<text class="menu-value__text">{{ appInfoStore.contact.workTime }}</text>
						</view>
					</view>
				</view>
			</view>

			<view class="fu-m-x-30 fu-m-t-30">
				<view class="menu-card">
					<view
						class="menu-item"
						v-for="(item, index) in $mConstDataConfig.aboutUs"
						:key="index"
						:class="{ 'menu-item-border': index + 1 < $mConstDataConfig.aboutUs.length }"
						@click="$openPage({name: item.url, query: {name: item.name, ...item.params}})"
					>
						<view class="menu-title">{{ item.name || '' }}</view>
						<up-icon name="arrow-right" color="#999999"></up-icon>
					</view>
				</view>
			</view>
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, computed } from 'vue';
	import { useAppInfoStore } from '@/stores/appInfo.js';

	// data数据
	const { $u, $openPage, $mUtil, $mConstDataConfig } = getCurrentInstance().appContext.config.globalProperties;
	const appInfoStore = useAppInfoStore();

	// store 自带缓存和兜底，拉取之前页面也是好的，所以不需要 loading 态
	appInfoStore.fetchInfo();

	// computed计算属性
	const sysInfo = computed(() => {
		return $u.sys()
	});

	/** 微信号和邮箱都不好手抄，点一下直接复制 */
	const onCopy = (value, label) => {
		if (!value) return;
		uni.setClipboardData({
			data: value,
			success: () => $u.toast(`${label}已复制`),
			fail: () => $u.toast('复制失败')
		});
	};
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
	// background: rgba(255, 255, 255, 0.05);
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

.menu-value {
	display: flex;
	align-items: center;
	gap: 16rpx;
	// 邮箱可能很长，限制宽度免得把左边的标签挤没
	max-width: 60%;

	&__text {
		color: #999999;
		font-size: 26rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&__copy {
		color: #55aaff;
		font-size: 24rpx;
		flex-shrink: 0;
	}
}
</style>