<template>
	<view class="date-box">
		{{ time }}
		<p class="date-box__time">{{ date }}</p>
	</view>
</template>

<script setup>
	import { getCurrentInstance, computed } from 'vue';
	
	// data数据
	const { $u } = getCurrentInstance().appContext.config.globalProperties;
	
	// computed计算属性
	const timestamp = computed(() => {
		return Math.floor(new Date().getTime() / 1000)
	});
	const time = computed(() => {
		return $u.timeFormat(timestamp.value, 'hh:MM')
	});
	const date = computed(() => {
		return $u.timeFormat(timestamp.value, 'mm月dd日')
	});
</script>

<style lang="scss" scoped>
	.date-box {
		position: absolute;
		top: 200rpx;
		left: 0;
		right: 0;
		text-align: center;
		font-size: 160rpx;
		color: $text-color-ffffff;
		font-weight: bold;
		opacity: .9;
		text-shadow: 
		    1px 1px #666,
		    1px 1px #666,
		    2px 2px #666,
		    1px 1px #666;
		
		&__time {
			font-size: 40rpx;
			font-weight: normal;
			margin-top: 20rpx;
		}
	}
</style>