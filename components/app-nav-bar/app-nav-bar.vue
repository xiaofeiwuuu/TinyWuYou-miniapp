<template>
	<view class="app-navbar" :class="{'app-dark': dark, 'app-nvue-fixed': fixed}">
		<view :class="{ 'app-navbar--fixed': fixed, 'app-navbar--shadow': shadow, 'app-navbar--border': border }" :style="{ 'background': themeBgColor }" class="app-navbar__content">
			<view v-if="statusBar" :style="{ height: statusBarHeight }" class="app-status-bar"></view>
			<view class="app-navbar__header" :style="{ color: themeColor, height: navbarHeight}">
				<view @tap="onClickLeft" class="app-navbar__header-btns app-navbar__header-btns-left" :style="{width: leftIconWidth}">
					<slot name="left">
						<view class="app-navbar__content_view" v-if="leftIcon.length > 0">
							<up-icon :color="themeColor" :name="leftIcon" size="24" />
						</view>
						<view class="app-navbar-btn-text" :class="{ 'app-navbar-btn-icon-left': !leftIcon.length > 0 }" v-if="leftText.length">
							<text :style="{ color: themeColor, fontSize: '12px' }">{{ leftText }}</text>
						</view>
					</slot>
				</view>
				<view class="app-navbar__header-container" :style="{'padding': '0 ' + paddingTitle + 'px'}" @tap="onClickTitle">
					<slot>
						<view class="app-navbar__header-container-inner" v-if="title.length>0">
							<text class="app-nav-bar-text app-ellipsis-1" :style="{color: themeColor }">{{ title }}</text>
						</view>
					</slot>
				</view>
				<view class="app-navbar__header-btns app-navbar__header-btns-right" :style="{width:rightIconWidth}" @click="onClickRight">
					<slot name="right">
						<view v-if="rightIcon.length">
							<up-icon :color="themeColor" :name="rightIcon" size="24" />
						</view>
						<view class="app-navbar-btn-text" v-if="rightText.length && !rightIcon.length">
							<text class="app-nav-bar-right-text" :style="{ color: themeColor}">{{ rightText }}</text>
						</view>
					</slot>
				</view>
			</view>
		</view>
		<!-- #ifndef APP-NVUE -->
		<view class="app-navbar__placeholder" v-if="fixed">
			<view v-if="statusBar" :style="{ height: statusBarHeight }" class="app-status-bar"></view>
			<view class="app-navbar__placeholder-view" :style="{ height: navbarHeight }" />
		</view>
		<!-- #endif -->
	</view>
</template>

<script>
	import { getPx } from 'uview-plus/libs/function/index.js'
	/**
	 * NavBar 自定义导航栏（原 fusions-ui fu-nav-bar 收编移植版，图标名使用 uview-plus 图标集）
	 * @property {Boolean} dark 开启黑暗模式
	 * @property {String} title 标题文字
	 * @property {String} leftText / rightText 左右侧按钮文本
	 * @property {String} leftIcon / rightIcon 左右侧按钮图标（uview-plus 图标名，如 arrow-left）
	 * @property {String} color 图标和文字颜色
	 * @property {String} bgColor 导航栏背景颜色，transparent 为透明
	 * @property {Boolean} fixed 是否固定顶部
	 * @property {Boolean} statusBar 是否包含状态栏
	 * @property {Boolean} shadow / border 阴影 / 边框
	 * @property {String|Number} height 导航栏高度（默认 44）
	 * @property {String|Number} leftWidth / rightWidth 左右侧宽度（默认 60）
	 * @property {String|Number} paddingTitle 标题左右内间距（默认 10）
	 * @event {Function} clickLeft / clickRight / clickTitle
	 */
	export default {
		name: 'AppNavBar',
		// #ifdef MP-WEIXIN
		options: {
			virtualHost: true
		},
		// #endif
		emits: ['clickLeft', 'clickRight', 'clickTitle'],
		props: {
			dark: { type: Boolean, default: false },
			title: { type: String, default: '' },
			leftText: { type: String, default: '' },
			rightText: { type: String, default: '' },
			leftIcon: { type: String, default: '' },
			rightIcon: { type: String, default: '' },
			fixed: { type: [Boolean, String], default: false },
			color: { type: String, default: '' },
			bgColor: { type: String, default: '' },
			statusBar: { type: [Boolean, String], default: true },
			shadow: { type: [Boolean, String], default: false },
			border: { type: [Boolean, String], default: true },
			height: { type: [Number, String], default: 44 },
			leftWidth: { type: [Number, String], default: 60 },
			rightWidth: { type: [Number, String], default: 60 },
			stat: { type: [Boolean, String], default: '' },
			paddingTitle: { type: [Number, String], default: 10 }
		},
		data() {
			return {
				statusBarHeight: '20px'
			}
		},
		created() {
			this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight + 'px'
		},
		computed: {
			themeBgColor() {
				if (this.dark) {
					return this.bgColor || '#333'
				}
				return this.bgColor || '#FFF'
			},
			themeColor() {
				if (this.dark) {
					return this.color || '#fff'
				}
				return this.color || '#333'
			},
			navbarHeight() {
				return getPx(this.height, true)
			},
			leftIconWidth() {
				return getPx(this.leftWidth, true)
			},
			rightIconWidth() {
				return getPx(this.rightWidth, true)
			}
		},
		mounted() {
			if (uni.report && this.stat && this.title !== '') {
				uni.report('title', this.title)
			}
		},
		methods: {
			onClickLeft(e) {
				this.$emit("clickLeft", e);
			},
			onClickRight(e) {
				this.$emit("clickRight", e);
			},
			onClickTitle(e) {
				this.$emit("clickTitle", e);
			}
		}
	};
</script>

<style lang="scss" scoped>
	$nav-height: 44px;

	.app-nvue-fixed {
		/* #ifdef APP-NVUE */
		position: sticky;
		/* #endif */
	}

	.app-status-bar {
		height: 20px;
	}

	.app-nav-bar-text {
		/* #ifdef APP-PLUS */
		font-size: 17px;
		/* #endif */
		/* #ifndef APP-PLUS */
		font-size: 16px;
		/* #endif */
	}

	.app-nav-bar-right-text {
		font-size: 12px;
	}

	.app-navbar__content {
		position: relative;
		background-color: transparent;
	}

	.app-navbar-btn-text {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: column;
		justify-content: flex-start;
		align-items: center;
		line-height: 12px;
	}

	.app-navbar__header {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		padding: 0 10px;
		flex-direction: row;
		height: $nav-height;
		font-size: 12px;
	}

	.app-navbar__header-btns {
		/* #ifndef APP-NVUE */
		overflow: hidden;
		display: flex;
		/* #endif */
		flex-wrap: nowrap;
		flex-direction: row;
		width: 120rpx;
		justify-content: center;
		align-items: center;
		/* #ifdef H5 */
		cursor: pointer;
		/* #endif */
	}

	.app-navbar__header-btns-left {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		width: 120rpx;
		justify-content: flex-start;
		align-items: center;
	}

	.app-navbar__header-btns-right {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex-direction: row;
		justify-content: flex-end;
		align-items: center;
	}

	.app-navbar__header-container {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex: 1;
		padding: 0 10px;
		overflow: hidden;
	}

	.app-navbar__header-container-inner {
		/* #ifndef APP-NVUE */
		display: flex;
		/* #endif */
		flex: 1;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		overflow: hidden;
	}

	.app-navbar__placeholder-view {
		height: $nav-height;
	}

	.app-navbar--fixed {
		position: fixed;
		z-index: 99;
		top: 0;
		/* #ifdef H5 */
		left: var(--window-left);
		right: var(--window-right);
		/* #endif */
		/* #ifndef H5 */
		left: 0;
		right: 0;
		/* #endif */
	}

	.app-navbar--shadow {
		box-shadow: 0 1px 6px #ccc;
	}

	.app-navbar--border {
		border-bottom-width: 1rpx;
		border-bottom-style: solid;
		border-bottom-color: #f5f5f5;
	}

	.app-ellipsis-1 {
		overflow: hidden;
		/* #ifndef APP-NVUE */
		white-space: nowrap;
		text-overflow: ellipsis;
		/* #endif */
		/* #ifdef APP-NVUE */
		lines: 1;
		text-overflow: ellipsis;
		/* #endif */
	}

	// 暗主题配置
	.app-dark {}
</style>
