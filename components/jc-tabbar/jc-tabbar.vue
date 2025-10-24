<template>
	<view class="tabbar">
		<view class="tabbar__bg" :style="[wrapStyle]"></view>
		<view class="tabbar__list">
			<block v-for="(item, index) in tabbar.list" :key="index">
				<view :id="`tabbar_item_${index}`" class="tabbar__item" :class="[{'tabbar__item--active': index === current}]" @click="change(index)">
					<!-- 可以用字体图标的方式 -->
					<!-- <view class="tabbar__item__icon" :class="[item.icon]"></view> -->

					<!-- 或者放自己喜欢的设计图 -->
					<image class="tabbar__item__image" :src="index === current? item.selectedIconPath: item.iconPath"></image>
					<view class="tabbar__item__text">{{ item.text }}</view>
				</view>
			</block>
		</view>
		<view class="tabbar__select-active-bg" :animation="activeBgAnimation"></view>
	</view>
</template>

<script setup>
	import { ref, computed, getCurrentInstance, nextTick, onMounted } from 'vue';
	
	// props方法
	const props = defineProps({
		list: {
			type: Object,
			default: () => ({})
		}
	});
	
	// emits方法
	const $emits = defineEmits(['change']);

	// data数据
	const instance = getCurrentInstance();
	let current = ref(0);
	let wrapMaskPositionLeft = ref(0);
	let activeBgPositionLeft = ref(0);
	let prevTabbarIndex = ref(0);
	let tabbarRectInfo = ref([]);
	let indicatorOffset = ref({});
	let activeBgAnimation = ref({});
	const tabbar = ref(props.list);
	// 自定义底栏对应页面的加载情况
	let tabberPageLoadFlag = ref([]);

	// 生命周期
	onMounted(() => {
		getRect()
		const index = 0;
		// 根据底部tabbar菜单列表设置对应页面的加载情况
		tabberPageLoadFlag.value = tabbar.value.list.map((item, tabbar_index) => {
			return index === tabbar_index
		});
		change(index)
	});

	// computed计算属性
	const tabbarStyle = computed(() => {
		return {
			background: tabbar.value.backgroundColor
		}
	});
	
	const wrapStyle = computed(() => {
		return {
			'-webkit-mask-position': `${wrapMaskPositionLeft.value}px -1px, 100%`
		}
	});

	// methods方法
	// 切换导航页面
	const _switchTabbarPage = (index) => {
		const selectPageFlag = tabberPageLoadFlag.value[index];
		if (selectPageFlag === undefined) return
		if (!selectPageFlag) tabberPageLoadFlag.value[index] = true
	};
	
	// 获取底部元素的位置
	const getRect = () => {
		const query = uni.createSelectorQuery().in(instance);
		tabbar.value.list.forEach((_, i) => query.select(`#tabbar_item_${i}`).boundingClientRect());
		query.exec(res => {
			if (!res.length) {
				setTimeout(getRect(), 10)
				return
			}

			// 将信息存入数组中
			res.forEach((item, i) => tabbarRectInfo.value[i] = { left: item.left, width: item.width });
			updateHollowsPosition()
			updateActiveBgPosition(true)
		})
	};
	
	// 更新凹陷位置
	const updateHollowsPosition = () => {
		const { width, left } = tabbarRectInfo.value[current.value];
		// 计算定高的宽比
		const imageFixedHeightWidthRatioValue = 300 * (uni.upx2px(64) / 92)
		wrapMaskPositionLeft.value = left - ((imageFixedHeightWidthRatioValue - width) / 2)
	};
	
	// 更新激活时背景的位置
	const updateActiveBgPosition = (init = false) => {
		const { width, left } = tabbarRectInfo.value[current.value];
		const oldActiveBgPositionLeft = activeBgPositionLeft.value;
		activeBgPositionLeft.value = left + ((width - uni.upx2px(100)) / 2)
		const animation = uni.createAnimation({
			duration: init? 100: 200,
			timingFunction: "ease-out"
		});
		if (!init) {
			animation.top(uni.upx2px(50)).left(oldActiveBgPositionLeft + ((activeBgPositionLeft.value - oldActiveBgPositionLeft) / 2)).scale(0.5).step()
			animation.left(activeBgPositionLeft.value).top(uni.upx2px(-54)).scale(1).step()
		} else {
			animation.left(activeBgPositionLeft.value).top(uni.upx2px(-54)).step()
		}
		activeBgAnimation.value = animation.export()
	};
	const change = (index) => {
		if (current.value === index) return
		_switchTabbarPage(index)
		prevTabbarIndex.value = current.value
		current.value = index;
		$emits('change', {...tabbar.value.list[index], current: index})
		nextTick(() => {
			updateHollowsPosition()
			updateActiveBgPosition()
		})
	};
</script>

<style lang="scss" scoped>
	$height: 110rpx;
	
	.tabbar {
		width: 100%;
		height: $height;
		height: calc($height + constant(safe-area-inset-bottom));
		height: calc($height + env(safe-area-inset-bottom));
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: transparent;
		z-index: 10024;

		&__bg {
			position: absolute;
			width: 100%;
			height: 100%;
			bottom: 0;
			left: 0;
			background-color: #302F36;
			-webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 61.5'%3E%3Cpath d='M100 0H0c32.9 0 49.3 61.5 100 61.5S167.1 0 200 0H100z'/%3E%3C/svg%3E"), linear-gradient(#000, #000);
			-webkit-mask-size: auto 64rpx, cover;
			-webkit-mask-repeat: no-repeat;
			-webkit-mask-composite: xor;
			/*只显示不重合的地方， chorem 、safari 支持*/
			z-index: 998;
			transition: 0.5s;
		}

		&__list {
			position: absolute;
			z-index: 999;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		&__item {
			height: 100%;
			width: 100%;
			flex: 1;
			text-align: center;
			font-size: 28rpx;
			position: relative;

			&--active {
				.tabbar__item__icon {
					top: -33rpx;
					color: #16151C;
				}

				.tabbar__item__image {
					top: -33rpx;
				}

				.tabbar__item__text {
					opacity: 1;
					color: #FFFFFFE6;
				}
			}

			&__icon {
				font-size: 56rpx;
				position: absolute;
				left: 0;
				right: 0;
				top: 20rpx;
				transition: 0.5s;
				color: #989ba3;
			}

			&__image {
				width: 58rpx;
				height: 58rpx;
				position: absolute;
				left: 0;
				right: 0;
				top: 20rpx;
				transition: 0.5s;
				margin: 0 auto;
			}

			&__text {
				position: absolute;
				left: 0;
				right: 0;
				bottom: 10rpx;
				bottom: calc(10rpx + constant(safe-area-inset-bottom));
				bottom: calc(10rpx + env(safe-area-inset-bottom));
				transition: 0.5s;
				opacity: 0;
			}
		}

		&__select-active-bg {
			position: absolute;
			width: 100rpx;
			height: 100rpx;
			border-radius: 50%;
			background-color: #FFFFFFF2;
			// transition: 0.5s;
			z-index: -1;
			// box-shadow: 0rpx 0rpx 50rpx 0rpx rgba(0, 0, 0, 0.05);
			// box-shadow: inset 0rpx 0rpx 50rpx 0rpx rgba(0, 0, 0, 0.05);
			box-shadow: 0rpx 10rpx 30rpx rgba(70, 23, 129, 0.07),
				0rpx -8rpx 40rpx rgba(255, 255, 255, 0.07),
				inset 0rpx -10rpx 10rpx rgba(70, 23, 129, 0.07),
				inset 0rpx 10rpx 20rpx rgba(255, 255, 255, 1);
			transition: box-shadow .2s ease-out;

			&--hide {
				top: calc($height + 50rpx);
			}

			&--show {
				top: -54rpx;
			}
		}
	}
</style>