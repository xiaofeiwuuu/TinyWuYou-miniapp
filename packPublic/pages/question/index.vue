<template>
	<page-layout customClass="navbar__content">
		<app-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="arrow-left" title="常见问题" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<view class="fu-m-x-30 fu-m-t-20 fu-p-b-50 fu-font-32">
			<view class="fu-m-b-20" v-for="(item,index) in list" :key="index">
				<view class="question-card fu-border fu-bg-main fu-b-r-10 fu-p-30 fu-m-b-20">
					<view class="question-box__title">{{ `${index + 1}、${item.title}` }}</view>
					<view class="question-box__content fu-m-t-15">{{ item.content }}</view>
				</view>
			</view>

			<!-- 后台没配任何问题时的空态。不写死一份兜底内容：
			     那样后台清空了列表，小程序里还留着一份删不掉的旧问题 -->
			<view v-if="!list.length" class="empty">
				<up-text text="暂无常见问题" color="#666666" size="26rpx" />
			</view>
		</view>
	</page-layout>
</template>

<script setup>
	/**
	 * 常见问题。
	 *
	 * 内容由后台「运营管理 → 小程序信息」维护，改完即时生效。
	 * 原来是写死在这个文件里的数组——FAQ 是随用户反馈不断增删改的运营内容，
	 * 改一个错别字都要重新发版 + 走微信审核，短则数小时长则几天，不现实。
	 */
	import { getCurrentInstance, computed } from 'vue';
	import { useAppInfoStore } from '@/stores/appInfo.js';

	// data数据
	const { $mUtil } = getCurrentInstance().appContext.config.globalProperties;
	const appInfoStore = useAppInfoStore();

	// store 自带缓存和兜底，拉取之前页面也是好的
	appInfoStore.fetchInfo();

	const list = computed(() => appInfoStore.faq);
</script>

<style scoped lang="scss">
	.question-card {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10rpx);
		border: 2rpx solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;

		&:active {
			background: rgba(255, 255, 255, 0.08);
		}
	}

	.question-box {
		&__title {
			font-weight: bold;
			color: #ffffff;
			font-size: 32rpx;
			line-height: 1.5;
		}

		&__content {
			color: #999999;
			padding: 10rpx 0;
			line-height: 50rpx;
			font-size: 28rpx;
			text-indent: 0;
		}
	}
</style>