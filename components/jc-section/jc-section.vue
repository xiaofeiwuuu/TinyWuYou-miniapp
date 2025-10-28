<template>
	<view class="fu-flex fu-flex-column-center" :style="{margin: props.margin}">
		<view class="fu-flex-1">
			<view :class="{'custom-family': family}">
				<fu-text :text="props.title" color="#FFFFFF" :size="props.size"></fu-text>
			</view>
			<fu-text :text="props.desc" color="#555555" :size="props.descSize"></fu-text>
		</view>
		<slot>
			<fu-button bgColor="#333333" height="40" padding="0 20rpx" color="#999999" shape="round"  fontSize="28" @click="$emit('click')" v-if="showRight">
				<span class="fu-m-r-5">更多</span>
				<span class="fu-m-t-4">+</span>
			</fu-button>
		</slot>
	</view>
</template>

<script setup>
	import { getCurrentInstance } from 'vue';
	
	// $emit方法
	const $emit = defineEmits(['click']);
	
	// props方法
	const props = defineProps({
		title: {
			type: String,
			default: ''
		},
		desc: {
			type: String,
			default: ''
		},
		showRight: {
			type: Boolean,
			default: true
		},
		margin: {
			type: String,
			default: '0 30rpx'
		},
		size: {
			type: [Number,String],
			default: 44
		},
		descSize: {
			type: [Number,String],
			default: 24
		},
		family: {
			type: Boolean,
			default: true
		}
	});
	
	// data数据
	const { $fu } = getCurrentInstance().appContext.config.globalProperties;
</script>

<style lang="scss" scoped>
	.custom-family {
		font-family: fontAgile !important;
	}
</style>