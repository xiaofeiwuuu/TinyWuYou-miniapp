<template>
	<up-loadmore :status="status" fontSize="24rpx" iconSize="24" loadmoreText="上拉显示更多" loadingText="正在努力加载" nomoreText="已经到底了" line></up-loadmore>
</template>

<script setup>
	import { computed } from 'vue';

	// props方法
	const props = defineProps({
		// 0-loading前；1-loading中；2-没有更多了（沿用原 fu-loading-more 的数字状态）
		loadingType: {
			type: Number,
			default: 0
		}
	})

	const status = computed(() => {
		return ['loadmore', 'loading', 'nomore'][props.loadingType] || 'loadmore'
	})
</script>

<style>

</style>
