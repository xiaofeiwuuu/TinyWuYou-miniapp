<template>
	<view class="fu-flex fu-flex-column-center" :style="{margin: props.margin}">
		<view class="fu-flex-1">
			<view :class="{'custom-family': family}">
				<!-- emphasize 时标题加粗 + 斜体（首页推荐区用），默认不影响其它调用方 -->
				<up-text
					:text="props.title"
					color="#FFFFFF"
					:size="props.size"
					:bold="emphasize"
					:customStyle="emphasize ? { fontStyle: 'italic' } : {}"
				></up-text>
			</view>
			<!-- 副标题：后台图片类型里配的一句话文案，有才显示 -->
			<up-text
				v-if="subtitle"
				:text="subtitle"
				color="#999999"
				:size="12"
				:customStyle="{ marginTop: '6rpx' }"
			></up-text>
		</view>
		<slot>
			<up-button color="#333333" shape="round" :customStyle="emphasize ? {height: '56rpx', padding: '0 28rpx', width: 'auto'} : {height: '44rpx', padding: '0 20rpx', width: 'auto'}" @click="$emit('click')" v-if="showRight">
				<text class="fu-m-r-4" :style="`color: #999999; font-size: ${emphasize ? '28rpx' : '24rpx'};`">更多</text>
				<up-icon name="arrow-right" color="#999999" :size="emphasize ? 13 : 11"></up-icon>
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
		// 副标题（一句话文案），有值才显示
		subtitle: {
			type: String,
			default: ''
		},
		// 突出标题：加粗 + 斜体，并把"更多"按钮加大。默认关闭，保持其它调用方原样
		emphasize: {
			type: Boolean,
			default: false
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