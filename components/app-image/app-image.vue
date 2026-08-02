<template>
	<!--
		根节点必须始终存在，不能挂 v-if。
		原来外层是 <up-transition v-if="show">，而 show 要等 mounted() 才置 true，
		意味着首次渲染这个组件什么都不输出；再叠加 MP-WEIXIN 的 virtualHost，
		图片加载失败时又把 <image> 整个移除、换成错误占位，
		节点在渲染层被大量增删，就会出现
		"insertTextView:fail parent xxx not found" 直至整页渲染不出来。
		现在改成：结构固定，加载状态只驱动样式，不增删节点。
		淡入用 wrapStyle 里已有的 opacity + transition 完成，不再需要 up-transition。
	-->
	<view class="app-image" :class="[`app-image--${elId}`]" :style="[wrapStyle, backgroundStyle]" @tap="onClick">
		<image
			v-if="observeShow && src"
			class="app-image__image"
			:src="src"
			:mode="mode"
			@error="onErrorHandler"
			@load="onLoadHandler"
			:show-menu-by-longpress="showMenuByLongpress"
			:lazy-load="lazyLoad"
			:style="[imageStyle, { opacity: isError ? 0 : 1 }]"></image>

		<!-- 加载中占位 -->
		<view v-if="showLoading && loading && !isError" class="app-image__loading"
			:style="{borderRadius: shape == 'circle' ? '50%' : addUnit(radius), backgroundColor: bgColor}">
			<slot name="loading">
				<up-icon :name="loadingIcon" size="20" color="#999999"></up-icon>
			</slot>
		</view>

		<!-- 失败占位：优先用占位图，没有配置才退回图标 -->
		<view v-if="showError && isError" class="app-image__error"
			:style="{borderRadius: shape == 'circle' ? '10000px' : addUnit(radius)}">
			<slot name="error">
				<image
					v-if="errorSrc"
					class="app-image__error-img"
					:src="errorSrc"
					mode="aspectFill"
					:style="{borderRadius: shape == 'circle' ? '10000px' : addUnit(radius)}"></image>
				<up-icon v-else :name="errorIcon" size="20" color="#999999"></up-icon>
			</slot>
		</view>

		<view class="app-image__inner" :style="[wrapStyle]" v-if="dim"></view>
	</view>
</template>

<script>
	import { addUnit, addStyle, deepMerge, guid } from 'uview-plus/libs/function/index.js'
	import props from './props.js';
	/**
	 * Image 图片（原 fusions-ui 本地增强版 fu-image 收编移植，底层改用 uview-plus）
	 * 支持淡入动画、加载中/失败占位、圆角、observer 懒加载、模糊 dim 等
	 * @example <app-image width="100%" height="300px" :src="src"></app-image>
	 */
	export default {
		name: 'AppImage',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		},
		// #endif
		emits: ['click', 'load', 'error'],
		mixins: [props],
		data() {
			const elId = guid()
			return {
				// 图片是否加载错误，如果是，则显示错误占位图
				isError: false,
				// 初始化组件时，默认为加载中状态
				loading: true,
				// 不透明度，为了实现淡入淡出的效果。
				// 开了 fade 就从 0 开始，mounted 后置 1 触发 CSS 过渡
				opacity: this.fade ? 0 : 1,
				// 过渡时间，因为props的值无法修改，故需要一个中间值
				durationTime: this.duration,
				// 图片加载完成时，去掉背景颜色，因为如果是png图片，就会显示灰色的背景
				backgroundStyle: {},
				// 是否开启图片出现在可视范围进行加载（另一种懒加载）
				observeShow: !this.observeLazyLoad,
				observerName: 'contentObserver',
				thresholdValue: 100,
				elId,
				// 因为props的值无法修改，故需要一个中间值
				imgWidth: this.width,
				imgHeight: this.height
			};
		},
		watch: {
			src: {
				immediate: true,
				handler(n) {
					/**
					 * 空 src 是"地址还没拿到"，不是"加载失败"。
					 *
					 * 原来一律置 isError=true，于是详情页从打开到 /image/:id 返回的
					 * 那一两秒里显示的是灰底 + error-circle 报错图标，
					 * 看上去像图挂了——用户以为没点上，就会退出去重新点。
					 * 现在归到加载中（photo 图标），有地址了再切正常流程。
					 */
					this.isError = false;
					this.loading = true;
				}
			}
		},
		computed: {
			wrapStyle() {
				let style = {};
				// 通过调用addUnit()方法，如果有单位，如百分比，px单位等，直接返回，如果是纯粹的数值，则加上px单位
				style.width = addUnit(this.width);
				style.height = this.mode !== 'widthFix'? this.height? addUnit(this.height): 'auto': 'auto';
				style['backdrop-filter'] = `blur(${addUnit(this.dim)})`;
				// 如果是显示圆形，设置一个很大的半径值即可
				style.borderRadius = this.shape == 'circle' ? '10000px' : addUnit(this.radius)
				// 如果设置圆角，必须要有hidden，否则可能圆角无效
				style.overflow = this.radius > 0 ? 'hidden' : 'visible';
				if (this.fade) {
					style.opacity = this.opacity
					// nvue下，这几个属性必须要分开写
					style.transitionDuration = `${this.durationTime}ms`
					style.transitionTimingFunction = 'ease-in-out'
					style.transitionProperty = 'opacity'
				}
				return deepMerge(style, addStyle(this.customStyle));
			},
			imageStyle() {
				let style = {};
				style.borderRadius = this.shape == 'circle' ? '10000px' : addUnit(this.radius);
				// #ifdef APP-NVUE
				style.width = addUnit(this.imgWidth);
				style.height = addUnit(this.imgHeight);
				// #endif
				return style;
			}
		},
		mounted() {
			this.$nextTick(() => {
				// 下一帧再置 1，让 CSS 过渡真正跑起来（首帧就是 1 的话不会有淡入）
				this.opacity = 1;
				if (this.observeLazyLoad) this.observerFn();
			})
		},
		methods: {
			addUnit,
			// 点击图片
			onClick() {
				this.$emit('click')
			},
			// 图片加载失败
			onErrorHandler(err) {
				this.loading = false
				this.isError = true
				this.$emit('error', err)
			},
			// 图片加载完成，标记loading结束
			onLoadHandler() {
				this.loading = false
				this.isError = false
				this.$emit('load')
				this.removeBgColor()
			},
			// 移除图片的背景色
			removeBgColor() {
				// 淡入动画过渡完成后，将背景设置为透明色，否则png图片会看到灰色的背景
				this.backgroundStyle = {
					backgroundColor: 'transparent'
				};
			},
			// 观察图片是否在可见视口
			observerFn(){
				// 在需要用到懒加载的页面，在触发底部的时候触发onLazyLoadReachBottom事件，保证所有图片进行加载
				this.$nextTick(() => {
					uni.$once('onLazyLoadReachBottom', () => {
						if (!this.observeShow) this.observeShow = true
					})
				})
				setTimeout(() => {
					// #ifndef APP-NVUE
					this.disconnectObserver(this.observerName)
					const contentObserver = uni.createIntersectionObserver(this)
					contentObserver.relativeToViewport({
						bottom: this.thresholdValue
					}).observe(`.app-image--${this.elId}`, (res) => {
						if (res.intersectionRatio > 0) {
							// 懒加载状态改变
							this.observeShow = true
							// 如果图片已经加载，去掉监听，减少性能消耗
							this.disconnectObserver(this.observerName)
						}
					})
					this[this.observerName] = contentObserver
					// #endif
					// #ifdef APP-NVUE
					this.observeShow = true;
					// #endif
				}, 50)
			},

			disconnectObserver(observerName) {
				const observer = this[observerName]
				observer && observer.disconnect()
			}
		}
	};
</script>

<style lang="scss" scoped>
	$app-image-error-top:0px !default;
	$app-image-error-left:0px !default;
	$app-image-error-width:100% !default;
	$app-image-error-hight:100% !default;
	$app-image-error-background-color: #f3f4f6 !default;
	$app-image-error-color: #909193 !default;
	$app-image-error-font-size: 23px !default;

	.app-image {
		position: relative;
		transition: opacity 0.5s ease-in-out;

		&__image {
			width: 100%;
			height: 100%;
			display: block;
		}

		&__loading,
		&__error {
			position: absolute;
			top: $app-image-error-top;
			left: $app-image-error-left;
			width: $app-image-error-width;
			height: $app-image-error-hight;
			display: flex;
			/* #ifdef APP-NVUE */
			flex-direction: row;
			/* #endif */
			align-items: center;
			justify-content: center;
			background-color: $app-image-error-background-color;
			color: $app-image-error-color;
			font-size: $app-image-error-font-size;
		}

		/* 自定义占位图铺满容器 */
		&__error-img {
			width: 100%;
			height: 100%;
			display: block;
		}

		&__inner {
			position: fixed;
			top: 0;
			left: 0;
		}
	}
</style>
