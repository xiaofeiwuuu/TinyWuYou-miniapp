<template>
	<view class="fu-flex fu-flex-column-center" :style="{margin: props.margin}">
		<view class="fu-flex-1">
			<view :class="{'custom-family': family}">
				<up-text :text="props.title" color="#FFFFFF" :size="props.size"></up-text>
			</view>
		</view>
		<slot>
			<up-button color="#333333" shape="round" :customStyle="{height: '44rpx', padding: '0 20rpx', width: 'auto'}" @click="$emit('click')" v-if="showRight">
				<text class="fu-m-r-4" style="color: #999999; font-size: 24rpx;">更多</text>
				<up-icon name="arrow-right" color="#999999" size="11"></up-icon>
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
		showRight: {
			type: Boolean,
			default: true
		},
		margin: {
			type: String,
			default: '0 30rpx'
		},
		// 注意 main.js 把 uview-plus 的 unit 设成了 rpx，而 addUnit 对 rpx 会再乘 2，
		// 所以这里填 22 实际是 44rpx（≈22px），数值本身按 px 的直觉来估就行
		size: {
			type: [Number,String],
			default: 22
		},
		family: {
			type: Boolean,
			default: true
		}
	});

</script>

<style lang="scss" scoped>
	.custom-family {
		font-family: $font-agile !important;
	}
</style>