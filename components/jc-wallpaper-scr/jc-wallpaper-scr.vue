<template>
	<view>
		<scroll-view scroll-x :style="[wallpaperStyle]">
			<view :id="elId" class="wallpaper-scr-box" >
				<view
					class="wallpaper-scr-box__item"
					v-for="(item,index) in displayList"
					:key="item.id || index"
					@click="$emit('click', item)"
				>
					<view class="fu-relative" :style="{marginRight: index + 1 < displayList.length? `${props.gutter}px`: `${$fu.addUnit(props.margin)}`}">
						<fu-image
							:width="width"
							:height="height"
							bgColor="#222222"
							:radius="radius"
							:src="item.thumbnailUrl || item.imageUrl || `https://picsum.photos/200/200?${index}`"
						></fu-image>
						<slot :data="item" />
					</view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import { getCurrentInstance, ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue';
	/**
	 * @property {Array} list 数据数组
	 * @property {String} mode 形状类型 square 正方形 standard 横向 vertical 纵向
	 * 	@value square 正方形
	 * 	@value standard 横向（比例：4:3）
	 * 	@value vertical 纵向（比例：9:16）
	 */
	// $emit方法
	const $emit = defineEmits(['click']);
	// props方法
	const props = defineProps({
		list: {
			type: Array,
			default: () => ([])
		},
		// 形状类型 square 正方形 standard 横向 vertical 纵向
		mode: {
			type: String,
			default: 'standard'
		},
		// standard横向比例（宽）仅mode=standard生效
		standardRatioW: {
			type: [Number, String],
			default: '1.1'
		},
		// standard横向比例（高）仅mode=standard生效
		standardRatioH: {
			type: [Number, String],
			default: '2.2'
		},
		// 自定义间隔
		gutter: {
			type: Number,
			default: 10
		},
		// 外间距
		margin: {
			type: [Number,String],
			default: 15
		},
		// 每列显示个数（仅mode="vertical"有效）
		column: {
			type: [Number],
			default: 3
		},
		// 圆角大小
		radius: {
			type: [Number,String],
			default: 15
		},
		// 根据宽度计算高度（默认 2）（仅mode="vertical"有效）
		multiple: {
			type: [Number,String],
			default: 2
		}
	})
	
	// data数据
	const instance = getCurrentInstance();
	const { $fu } = instance.appContext.config.globalProperties;
	const elId = ref(`fu_${Math.ceil(Math.random() * 10e5).toString(36)}`);
	let width = ref(0);
	let height = ref(0);

	// 计算属性 - 显示列表（如果没有传入 list，显示 10 个占位图）
	const displayList = computed(() => {
		if (props.list && props.list.length > 0) {
			return props.list
		}
		// 没有数据时，返回 10 个占位对象
		return Array.from({ length: 10 }, (_, index) => ({ index }))
	})
	
	// 生命周期
	onMounted(() => {
		initChildren()
		window.addEventListener('resize', initChildren);
	});
	
	onBeforeUnmount(() => {
		window.removeEventListener('resize', initChildren);
	});
	
	// computed计算属性
	const wallpaperStyle = computed(() => {
		return {
			margin: `${$fu.getPx(props.gutter)}px ${$fu.addUnit(props.margin)} 0`,
		}
	});
	
	// methods方法
	const initChildren = () => {
		nextTick(() => {
			getSize((e) => {
				width.value = e.width;
				height.value = e.height;
			})
		})
	};
	
	const getSize = (fn) => {
		const unit = "px";
		// #ifndef APP-NVUE
		uni.createSelectorQuery().in(instance).select(`#${elId.value}`).boundingClientRect().exec(ret => {
			const totalGap = (props.column - 1) * Number(props.gutter); // 计算所有间隔的总和
			const containerWidth = ret[0].width - totalGap; // 减去间隔，计算可用宽度
			const modeDimensions = {
				standard: { width: `${Math.floor(containerWidth / Number(props.standardRatioW))}${unit}`, height: `${Math.floor(containerWidth / Number(props.standardRatioH))}${unit}` },
				square:    { width: `${Math.floor(containerWidth / 4)}${unit}`, height: `${Math.floor(containerWidth / 4)}${unit}` },
				vertical:  { width: `${Math.floor(containerWidth / props.column)}${unit}`, height: `${Math.floor(containerWidth / props.column * Number(props.multiple))}${unit}` }
			};
			const dimensions = modeDimensions[props.mode];
			fn(dimensions)
		})
		// #endif
	}
</script>

<style lang="scss" scoped>
	.wallpaper-scr-box {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
	
		&__item {
			overflow: hidden;
			flex-shrink: 0;
			position: relative;
		}
	}
</style>