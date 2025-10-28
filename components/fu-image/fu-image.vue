<template>
	<fu-transition mode="fade" :show="show" :duration="fade? duration : 0" :styles="wrapStyle" v-if="show">
		<view class="fu-image" :class="[`fu-image--${elId}`]" :style="[wrapStyle, backgroundStyle]" @tap="onClick">
			<image 
				class="fu-image__image" 
				:src="src" 
				:mode="mode" 
				@error="onErrorHandler" 
				@load="onLoadHandler"
				:show-menu-by-longpress="showMenuByLongpress" 
				:lazy-load="lazyLoad" 
				:style="[imageStyle]" 
				v-if="!isError && observeShow"></image>
			<view v-if="showLoading && loading" class="fu-image__loading"
				:style="{borderRadius: shape == 'circle' ? '50%' : $fu.addUnit(this.radius), backgroundColor: this.bgColor}">
				<slot name="loading">
					<fu-icons :type="loadingIcon" size="20" color="#999999"></fu-icons>
				</slot>
			</view>
			<view v-if="showError && isError && !loading" class="fu-image__error"
				:style="{borderRadius: shape == 'circle' ? '10000px' : $fu.addUnit(this.radius)}">
				<slot name="error">
					<fu-icons :type="errorIcon" size="20" color="#999999"></fu-icons>
				</slot>
			</view>
			<view class="fu-image__inner" :style="[wrapStyle]" v-if="dim"></view>
		</view>
	</fu-transition>
</template>

<script>
	import mpMixin from 'fusions-ui/libs/mixin/mpMixin.js'
	import mixin from 'fusions-ui/libs/mixin/mixin.js'
	import props from './props.js';
	/**
	 * Image 图片
	 * @description 此组件为uni-app的image组件的加强版，在继承了原有功能外，还支持淡入动画、加载中、加载失败提示、圆角值和形状等。
	 * @property {String} src 图片地址
	 * @property {String} mode 裁剪模式（默认 'aspectFill' ），详细见官网说明 https://uniapp.dcloud.net.cn/component/image.html#image
	 * 	@value scaleToFill 缩放	不保持纵横比缩放图片，使图片的宽高完全拉伸至填满 image 元素
	 * 	@value aspectFit 缩放 保持纵横比缩放图片，使图片的长边能完全显示出来。也就是说，可以完整地将图片显示出来。
	 * 	@value aspectFill 缩放 保持纵横比缩放图片，只保证图片的短边能完全显示出来。也就是说，图片通常只在水平或垂直方向是完整的，另一个方向将会发生截取。
	 * 	@value widthFix 缩放 宽度不变，高度自动变化，保持原图宽高比不变
	 * 	@value heightFix 缩放 高度不变，宽度自动变化，保持原图宽高比不变 App 和 H5 平台 HBuilderX 2.9.3+ 支持、微信小程序需要基础库 2.10.3
	 * 	@value top 裁剪	不缩放图片，只显示图片的顶部区域
	 * 	@value bottom 裁剪 不缩放图片，只显示图片的底部区域
	 * 	@value center 裁剪 不缩放图片，只显示图片的中间区域
	 * 	@value left 裁剪 不缩放图片，只显示图片的左边区域
	 * 	@value right 裁剪 不缩放图片，只显示图片的右边区域
	 * 	@value top left 裁剪 不缩放图片，只显示图片的左上边区域
	 * 	@value top right 裁剪 不缩放图片，只显示图片的右上边区域
	 * 	@value bottom left 裁剪	不缩放图片，只显示图片的左下边区域
	 * 	@value bottom right 裁剪 不缩放图片，只显示图片的右下边区域
	 * @property {String,Number} width 宽度，单位任意，如果为数值，则为px单位 （默认 '150' ）
	 * @property {String,Number} height 高度，单位任意，如果为数值，则为px单位 （默认 'auto' ）
	 * @property {String} shape = [circle|square] 图片形状，circle-圆形，square-方形 （默认 'square' ）
	 * @property {String,Number} radius	圆角值，单位任意，如果为数值，则为px单位 （默认 0 ）
	 * @property {Boolean} lazyLoad = [true|false] 是否懒加载，仅微信小程序、App、百度小程序、字节跳动小程序有效 （默认 true ）
	 * @property {Boolean} observeLazyLoad = [true|false] 是否开启observer懒加载，nvue不生效（默认 false）
	 * @property {Boolean} showMenuByLongpress = [true|false] 是否开启长按图片显示识别小程序码菜单，仅微信小程序有效 （默认 true ）
	 * @property {String} loadingIcon 加载中的图标 （默认 'photo' ）
	 * @property {String} errorIcon 加载失败的图标 （默认 'error' ）
	 * @property {Boolean} showLoading = [true|false] 是否显示加载中的图标或者自定义的slot （默认 true ）
	 * @property {Boolean} showError = [true|false] 是否显示加载错误的图标或者自定义的slot （默认 true ）
	 * @property {Boolean} fade = [true|false] 是否需要淡入效果 （默认 true ）
	 * @property {Boolean} webp = [true|false] 只支持网络资源，只对微信小程序有效 （默认 false ）
	 * @property {String,Number} duration 搭配fade参数的过渡时间，单位ms （默认 500 ）
	 * @property {String} bgColor 背景颜色，用于深色页面加载图片时，为了和背景色融合 (默认 '#f3f4f6' )
	 * @property {String,Number} dim 定义图片模糊 默认0
	 * @property {Object,String} customStyle 定义需要用到的外部样式
	 * @event {Function} click 点击图片时触发
	 * @event {Function} error 图片加载失败时触发
	 * @event {Function} load 图片加载成功时触发
	 * @example <fu-image width="100%" height="300px" :src="src"></fu-image>
	 */
	export default {
		name: 'FuImage',
		emits: ['click', 'load', 'error'],
		mixins: [mpMixin, mixin, props],
		data() {
			const elId = this.$fu.uuid()
			return {
				// 图片是否加载错误，如果是，则显示错误占位图
				isError: false,
				// 初始化组件时，默认为加载中状态
				loading: true,
				// 不透明度，为了实现淡入淡出的效果
				opacity: 1,
				// 过渡时间，因为props的值无法修改，故需要一个中间值
				durationTime: this.duration,
				// 图片加载完成时，去掉背景颜色，因为如果是png图片，就会显示灰色的背景
				backgroundStyle: {},
				// 用于fade模式的控制组件显示与否
				show: false,
				// 是否开启图片出现在可视范围进行加载（另一种懒加载）
				observeShow: !this.observeLazyLoad,
				elId,
				// 因为props的值无法修改，故需要一个中间值
				imgWidth: this.width,
				// 因为props的值无法修改，故需要一个中间值
				imgHeight: this.height
			};
		},
		watch: {
			src: {
				immediate: true,
				handler(n) {
					if (!n) {
						// 如果传入null或者''，或者false，或者undefined，标记为错误状态
						this.isError = true
					} else {
						this.isError = false;
						this.loading = true;
					}
				}
			}
		},
		computed: {
			wrapStyle() {
				let style = {};
				// 通过调用addUnit()方法，如果有单位，如百分比，px单位等，直接返回，如果是纯粹的数值，则加上px单位
				style.width = this.$fu.addUnit(this.width);
				style.height = this.mode !== 'widthFix'? this.height? this.$fu.addUnit(this.height): 'auto': 'auto';
				style['backdrop-filter'] = `blur(${this.$fu.addUnit(this.dim)})`;
				// 如果是显示圆形，设置一个很多的半径值即可
				style.borderRadius = this.shape == 'circle' ? '10000px' : this.$fu.addUnit(this.radius)
				// 如果设置圆角，必须要有hidden，否则可能圆角无效
				style.overflow = this.radius > 0 ? 'hidden' : 'visible';
				if (this.fade) {
					style.opacity = this.opacity
					// nvue下，这几个属性必须要分开写
					style.transitionDuration = `${this.durationTime}ms`
					style.transitionTimingFunction = 'ease-in-out'
					style.transitionProperty = 'opacity'
				}
				return this.$fu.deepMerge(style, this.$fu.addStyle(this.customStyle));
			},
			imageStyle() {
				let style = {};
				style.borderRadius = this.shape == 'circle' ? '10000px' : this.$fu.addUnit(this.radius);
				// #ifdef APP-NVUE
				style.width = this.$fu.addUnit(this.imgWidth);
				style.height = this.$fu.addUnit(this.imgHeight);
				// #endif
				return style;
			}
		},
		mounted() {
			this.show = true;
			this.$nextTick(()=>{
				if(this.observeLazyLoad) this.observerFn();
			})
		},
		methods: {
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
				// 在需要用到懒加载的页面，在触发底部的时候触发tOnLazyLoadReachBottom事件，保证所有图片进行加载
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
					}).observe(`.fu-image--${this.elId}`, (res) => {
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
	$fu-image-error-top:0px !default;
	$fu-image-error-left:0px !default;
	$fu-image-error-width:100% !default;
	$fu-image-error-hight:100% !default;
	$fu-image-error-background-color: #f3f4f6 !default;
	$fu-image-error-color: #909193 !default;
	$fu-image-error-font-size: 23px !default;

	.fu-image {
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
			top: $fu-image-error-top;
			left: $fu-image-error-left;
			width: $fu-image-error-width;
			height: $fu-image-error-hight;
			display: flex;
			/* #ifdef APP-NVUE */
			flex-direction: row;
			/* #endif */
			align-items: center;
			justify-content: center;
			background-color: $fu-image-error-background-color;
			color: $fu-image-error-color;
			font-size: $fu-image-error-font-size;
		}
		
		&__inner {
			position: fixed;
			top: 0;
			left: 0;
		}
	}
</style>
