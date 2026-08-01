<template>
	<view class="fu-flex fu-flex-column-center" :style="{margin: props.margin}">
		<view class="fu-flex-1">
			<view :class="{'custom-family': family}">
				<up-text :text="props.title" color="#FFFFFF" :size="props.size"></up-text>
			</view>
			<up-text :text="props.desc" color="#555555" :size="props.descSize"></up-text>
		</view>
		<slot>
			<up-button color="#333333" shape="round" :customStyle="{height: '40rpx', padding: '0 20rpx', width: 'auto'}" @click="$emit('click')" v-if="showRight">
				<text class="fu-m-r-5" style="color: #999999; font-size: 28rpx;">更多</text>
				<text class="fu-m-t-4" style="color: #999999; font-size: 28rpx;">+</text>
			</up-button>
		</slot>
	</view>
</template>

<script setup>
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

</script>

<style lang="scss" scoped>
	.custom-family {
		font-family: fontAgile !important;
	}
</style>