<template>
	<view class="button-nav-box fu-bottom" :class="{'fu-fixed': props.fixed}" :style="{backgroundColor: fixed? props.backgroundColor: ''}">
		<view class="button-nav-box__item" :style="{margin: `0 ${$fu.addUnit(props.margin)}`}">
			<slot>
				<fu-button width="100%" height="100%" :bgColor="props.bgColor" :radius="props.radius" :color="props.color" :fontSize="props.fontSize" @click="$emit('click')">{{ props.title || '' }}</fu-button>
			</slot>
		</view>
	</view>
</template>

<script setup>
	import { getCurrentInstance } from 'vue';
	/**
	 * @description 按钮
	 * @property {Boolean} fixed 固定 （默认 false）
	 * @property {String} backgroundColor 背景色 仅fixed为true生效 (默认 #ffffff)
	 * @property {String} bgColor 按钮背景色（默认 ‘#ff5500’）
	 * @property {Number,String} margin 左右间距（默认 0）
	 * @property {String} title 按钮名称（默认 ‘确定’）
	 * @property {Number,String} fontSize 字体大小（默认 28）
	 * @property {String} color 字体颜色（默认 ‘#333333’）
	 * @property {Number,String} radius 设置圆角（默认 0）
	 */
	
	// $emit方法
	const $emit = defineEmits(['click']);
	
	// props方法
	const props = defineProps({
		// 是否固定 （默认 false）
		fixed: {
			type: Boolean,
			default: false
		},
		// 背景色 仅fixed为true生效 (默认 #ffffff)
		backgroundColor: {
			type: String,
			default: '#ffffff'
		},
		// 按钮背景色（默认 ‘#ff5500’）
		bgColor: {
			type: String,
			default: '#ff5500'
		},
		// 左右间距（默认 0）
		margin: {
			type: [Number,String],
			default: 0
		},
		// 按钮名称（默认 ‘确定’）
		title: {
			type: String,
			default: '确定'
		},
		// 字体大小（默认 28）
		fontSize: {
			type: [Number,String],
			default: 28
		},
		// 字体颜色（默认 ‘#333333’）
		color: {
			type: String,
			default: '#333333'
		},
		// 设置圆角（默认 0）
		radius: {
			type: [String,Number],
			default: 0
		}
	});
	
	// data数据
	const { $fu } = getCurrentInstance().appContext.config.globalProperties;
</script>

<style lang="scss" scoped>
	.button-nav-box {
		width: 100%;
		height: 50px;
		display: flex;
		align-items: center;
		left: 0;
		
		&__item {
			flex: 1;
			height: 44px;
		}
	}
</style>