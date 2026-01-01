<template>
	<view class="grid-container">
		<view :id="elId" class="grid-box" :style="[gridStyle]">
			<view class="grid-box__item" :style="[itemStyle]" v-for="(item, index) in props.list" :key="index" @click="onClick(item)">
				<fu-image width="100%" :height="height" bgColor="#222222" :radius="radius" :src="item.image"></fu-image>
				<view v-if="item.isVip" class="vip-badge">VIP</view>
				<slot :data="item" />
			</view>
		</view>
	</view>
</template>

<script setup>
	/**
	 * @description 宫格组件
	 * @property {Array} list 数组数据（默认 []）
	 * @property {Number} column 每列显示个数（默认 3）
	 * @property {Number,String} gutter 自定义间隔（默认 10）
	 * @property {Boolean} square 是否方形显示（默认 false）
	 * @property {Number,String} radius 圆角大小（默认 15）
	 * @property {Number,String} multiple 根据宽度计算高度（默认 2）仅square为false时生效
	 */
	import { getCurrentInstance, ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue';
	
	// props方法
	const props = defineProps({
		list: {
			type: Array,
			default: () => ([])
		},
		// 每列显示个数
		column: {
			type: [Number],
			default: 3
		},
		// 自定义间隔
		gutter: {
			type: [Number, String],
			default: 10
		},
		// 是否方形显示
		square: {
			type: Boolean,
			default: false
		},
		// 圆角大小
		radius: {
			type: [Number,String],
			default: 15
		},
		// 根据宽度计算高度（默认 2）仅square为false时生效
		multiple: {
			type: [Number,String],
			default: 2
		}
	});
	
	const $emit = defineEmits(['click']);

	// data数据
	const instance = getCurrentInstance();
	const { $fu } = instance.appContext.config.globalProperties;
	const elId = ref(`fu_${Math.ceil(Math.random() * 10e5).toString(36)}`);
	let gridStyle = ref({});
	let width = ref(0);
	let height = ref(0);
	
	// 生命周期
	onMounted(() => {
		initChildren()
		// #ifdef H5
		window.addEventListener('resize', initChildren);
		// #endif
	});

	onBeforeUnmount(() => {
		// #ifdef H5
		window.removeEventListener('resize', initChildren);
		// #endif
	});
	
	// computed计算属性
	const itemStyle = computed(() => {
		return {
			width: width.value
		}
	});
	
	// methods方法
	const onClick = (item) => {
		$emit('click', item)
	};
	
	const initChildren = () => {
		nextTick(() => {
			getSize((e) => {
				width.value = e.width;
				height.value = e.height;
			})
		})
	};
	
	const getSize = (fn) => {
		// #ifndef APP-NVUE
		uni.createSelectorQuery().in(instance).select(`#${elId.value}`).boundingClientRect().exec(ret => {
			const totalGap = (props.column - 1) * Number(props.gutter); // 计算所有间隔的总和
			// const totalBorder = (props.column * 2); // 计算所有边框的总和
			const containerWidth = ret[0].width - totalGap; // 减去间隔，计算可用宽度
			width.value = Math.floor(containerWidth / props.column);
			height.value = props.square? width.value: Math.floor(containerWidth / props.column * Number(props.multiple));
			fn({width: width.value + 'px', height: height.value + 'px'})
			gridStyle.value = { gap: `${props.gutter}px` };
		})
		// #endif
	}
</script>

<style lang="scss">
	.grid-container {
		position: relative;
		width: 100%;
	}

	.grid-box {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		width: 100%;

		&__item {
			overflow: hidden;
			position: relative;
			box-sizing: border-box;
		}
	}

	.vip-badge {
		position: absolute;
		top: 8rpx;
		right: 8rpx;
		background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
		color: #000000;
		font-size: 20rpx;
		font-weight: bold;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		box-shadow: 0 2rpx 8rpx rgba(255, 215, 0, 0.4);
		z-index: 10;
	}
</style>