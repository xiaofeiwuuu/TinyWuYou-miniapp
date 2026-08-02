<template>
	<view class="grid-container">
		<!-- 被裁掉的上半部分，用占位块撑住高度，保证滚动条位置正确 -->
		<view v-if="padTop > 0" :style="{ height: padTop + 'px' }"></view>

		<view :id="elId" class="grid-box" :style="[gridStyle]">
			<!--
				key 不能用切片内的相对下标：虚拟滚动下窗口一移动，同一个下标就指向了
				不同的数据，Vue 会复用错节点导致图片串位。
				优先用数据自身的 id；没有 id 的调用方退回“绝对下标”，
				也就是窗口起点加偏移，同样保持稳定（非虚拟模式下起点恒为 0）。
			-->
			<view
				class="grid-box__item"
				:style="[itemStyle]"
				v-for="(item, i) in visibleList"
				:key="item.id ?? (winStart * column + i)"
				@click="onClick(item)"
			>
				<app-image width="100%" :height="height" bgColor="#222222" :radius="radius" :src="item.image"></app-image>
				<view v-if="item.isVip" class="vip-badge">VIP</view>
				<!--
					只在调用方真的传了插槽时才渲染。
					uni-app 编译到小程序时，v-for 里的作用域插槽会按下标生成 d-0/d-1/d-2 这类名字，
					列表一重渲染就会刷 "More than one slot named d-0" 警告；
					而 12 个调用方里只有 2 个用到插槽，其余白白付出这个代价。
				-->
				<slot v-if="$slots.default" :data="item" />
			</view>
		</view>

		<!-- 被裁掉的下半部分 -->
		<view v-if="padBottom > 0" :style="{ height: padBottom + 'px' }"></view>
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
	import { getCurrentInstance, ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from 'vue';
	
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
		},
		/**
		 * 开启虚拟滚动。默认关闭，不影响现有调用方。
		 *
		 * 本组件是等高网格（height 由容器宽度算出，所有格子共用一个值），
		 * 所以可以精确算出任意滚动位置对应的可视行，用上下两个占位块撑住
		 * 总高度，只渲染窗口内的格子。几万张图片时节点数恒定，不再线性增长。
		 */
		virtual: {
			type: Boolean,
			default: false
		},
		// 页面滚动距离，由使用方通过 onPageScroll 传入（仅 virtual 时需要）
		scrollTop: {
			type: [Number, String],
			default: 0
		},
		// 视口上下各多渲染几行，避免快速滑动时露白
		bufferRows: {
			type: Number,
			default: 2
		}
	});
	
	const $emit = defineEmits(['click']);

	// data数据
	const instance = getCurrentInstance();
	const { $u } = instance.appContext.config.globalProperties;
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

	/* ---------------- 虚拟滚动 ---------------- */

	// 网格顶部相对页面的距离，用来把页面滚动距离换算成网格内部的偏移
	let gridTop = ref(0);
	// 视口高度，用来算一屏能放几行
	const windowHeight = ref(uni.getSystemInfoSync().windowHeight || 0);
	// 尺寸是否已经量出来。量到之前一律不裁剪，否则会拿着未初始化的值算出空窗口
	const measured = ref(false);

	/**
	 * 一行的占位高度 = 格子高度 + 间隔。
	 *
	 * 注意 height 在 getSize 回调里被赋成了带单位的字符串（'236px'），
	 * 直接参与算术会变成字符串拼接（'236px' + 10 === '236px10'），
	 * 后面 offset / rowHeight 全是 NaN，slice(NaN, NaN) 返回空数组 —— 整个列表消失。
	 * 这里统一用 parseFloat 取数值。
	 */
	const rowHeight = computed(() => {
		const h = parseFloat(height.value);
		return (Number.isFinite(h) ? h : 0) + Number(props.gutter);
	});

	/** 总行数 */
	const totalRows = computed(() => Math.ceil(props.list.length / props.column));

	/**
	 * 当前应该渲染的行区间。尺寸没量出来之前返回全量，避免首屏空白。
	 *
	 * 起止行拆成两个返回「数字」的 computed，不要合成一个对象返回。
	 * 返回对象的话每次滚动都是一个新引用，下游 computed 全部失效、整个网格重渲染；
	 * 拆成数字后 Vue 的缓存生效，只有真正跨过一行边界时才会重新渲染。
	 */
	const winStart = computed(() => {
		if (!props.virtual || !measured.value || rowHeight.value <= 0) return 0;
		const offset = Number(props.scrollTop) - gridTop.value;
		const firstVisible = Math.floor(offset / rowHeight.value);
		return Math.max(0, firstVisible - props.bufferRows);
	});

	const winEnd = computed(() => {
		if (!props.virtual || !measured.value || rowHeight.value <= 0) return totalRows.value;
		const offset = Number(props.scrollTop) - gridTop.value;
		const firstVisible = Math.floor(offset / rowHeight.value);
		const rowsPerScreen = Math.ceil(windowHeight.value / rowHeight.value);
		const end = Math.min(totalRows.value, firstVisible + rowsPerScreen + props.bufferRows);
		return Math.max(winStart.value, end);
	});

	/** 只渲染窗口内的数据 */
	const visibleList = computed(() => {
		if (!props.virtual) return props.list;
		return props.list.slice(winStart.value * props.column, winEnd.value * props.column);
	});

	/** 上下占位块，撑住被裁掉那部分的高度，保证滚动条长度和位置正确 */
	const padTop = computed(() => (props.virtual ? winStart.value * rowHeight.value : 0));
	const padBottom = computed(() => {
		if (!props.virtual) return 0;
		return Math.max(0, (totalRows.value - winEnd.value) * rowHeight.value);
	});

	/**
	 * 挂载时列表通常还是空的（数据是异步拉的），那一次量不到有效尺寸，
	 * gridTop 也可能不准。等第一批数据到达后再量一次。
	 *
	 * 必须放在 measured 声明之后：写在文件靠前的位置会踩到暂时性死区，
	 * 数据到达时抛 "Cannot access 'measured' before initialization"。
	 */
	watch(
		() => props.list.length,
		(len, prev) => {
			if (len > 0 && (!measured.value || !prev)) initChildren();
		}
	);
	
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
			// boundingClientRect 给的是相对视口的 top，加上当前滚动距离才是相对页面的位置。
			// 量的时候页面通常还在顶部，但加上更稳妥。
			gridTop.value = ret[0].top + Number(props.scrollTop);
			measured.value = height.value > 0;
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