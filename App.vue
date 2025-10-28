<script>
	import { wxLogin } from '@/api/auth.js'
	import { useUserStore } from '@/stores/user.js'

	export default {
		globalData: {
			hasAutoLogin: false // 标记是否已经自动登录过
		},

		onLaunch: async function(options) {
			// 初始化用户 store (从缓存加载)
			const userStore = useUserStore()
			userStore.loadFromCache()

			// 尝试自动登录
			await this.tryAutoLogin(options)
		},

		onShow: async function(options) {
			// #ifndef H5 || APP || MP-HARMONY
			if (uni.canIUse('getUpdateManager')) {
			    const updateManager = uni.getUpdateManager();
			    updateManager.onCheckForUpdate(function(res) {
					if (res.hasUpdate) {
						updateManager.onUpdateReady(function() {
							uni.showModal({
								title: '版本更新',
								content: '新版本已经准备好,确定重启应用?',
								showCancel: false,
								success: function(res) {
									if (res.confirm) {
										updateManager.applyUpdate();
									}
								}
							});
						});
					}
			    });
			    updateManager.onUpdateFailed(function() {
					uni.showModal({
						title: '已经有新版本了哟~',
						content: '新版本已经上线啦~,请您删除当前小程序,重新搜索打开哟~'
					});
			    });
			}
			// #endif
		},

		onHide: function() {
			console.log('[App] 👋 App Hide')
		},

		methods: {
			/**
			 * 尝试自动登录
			 */
			async tryAutoLogin(options) {
				try {
					// 检查用户是否已登录
					const userStore = useUserStore()
					if (userStore.isLogin && userStore.token) {
						this.globalData.hasAutoLogin = true
						return
					}

					// 获取平台标识
					let platform = 'weixin'
					// #ifdef MP-WEIXIN
					platform = 'weixin'
					// #endif
					// #ifdef MP-XHS
					platform = 'xiaohongshu'
					// #endif
					// #ifdef MP-DOUYIN
					platform = 'douyin'
					// #endif
					// #ifdef MP-ALIPAY
					platform = 'alipay'
					// #endif

					// 调用小程序登录获取 code
					const loginRes = await new Promise((resolve, reject) => {
						uni.login({
							success: resolve,
							fail: reject
						})
					})

					if (!loginRes.code) {
						return
					}

					// 获取邀请者ID (从启动参数)
					let inviterId = ''

					// 方式1: 从启动 options 的 query 获取
					if (options && options.query && options.query.inviterId) {
						inviterId = options.query.inviterId
					}

					const res = await wxLogin(loginRes.code, '', '', platform, inviterId || '')

					if (res && res.code === 0 && res.data && res.data.accessToken) {
						// 保存 token
						uni.setStorageSync('token', res.data.accessToken)

						// 保存用户信息
						if (res.data.userInfo) {
							uni.setStorageSync('userInfo', JSON.stringify(res.data.userInfo))
							// 更新 store
							userStore.loadFromCache()
						}

						// 标记已登录
						this.globalData.hasAutoLogin = true
					} else {
						console.error('[App] ❌ 登录失败，返回数据:', res)
					}
				} catch (error) {
					console.error('[App] ❌ 自动登录异常:', error)
					console.error('[App] 错误堆栈:', error.stack)
				}
			}
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import "fusions-ui/index.scss";
	@import "static/css/fontFamily.scss";
	@import "static/css/main.scss";

	page {
		background-color: #111111;
		color: $text-color-ffffff;
		font-family: "黑体", "Microsoft YaHei", "STHeiti", sans-serif;
		font-size: 28rpx;
	}

	/* 全局隐藏滚动条 */
	/* #ifndef APP-NVUE */
	::-webkit-scrollbar {
		width: 0px;
		height: 0px;
		color: transparent;
	}
	/* #endif */

	.button-hover {
		background-color: transparent !important;
	}

	.font-family {
		font-family: fontAgile;
	}

	:deep(.fu-nav-bar-text) {
		font-weight: bold;
	}

	.navbar__content {
		:deep(.fu-navbar__content) {
		  @media (prefers-reduced-motion: no-preference) {
		    backdrop-filter: blur(10px) !important;
		  }
		}
	}
</style>
