<script>
	import { wxLogin } from '@/api/auth.js'
	import { keyManager } from '@/util/key-manager.js'
	import { useUserStore } from '@/stores/user.js'

	export default {
		onLaunch: async function() {
			console.log('App Launch')

			// 初始化密钥管理器
			// await keyManager.init()

			// 自动登录
			await this.autoLogin()

			// 初始化用户 store (从缓存加载)
			const userStore = useUserStore()
			userStore.loadFromCache()
		},
		onShow: function() {
			console.log('App Show')
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
						title: '已经有新版本了哟\~',
						content: '新版本已经上线啦\~,请您删除当前小程序,重新搜索打开哟\~'
					});
			    });
			}
			// #endif
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			/**
			 * 自动登录
			 */
			async autoLogin() {
				try {
					// 检查是否已有 token
					// const token = uni.getStorageSync('token')
					// if (token) {
					// 	console.log('[App] 已有 token，跳过登录')
					// 	return
					// }

					// 获取当前平台标识
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

					console.log('[App] 开始小程序登录, 平台:', platform)

					// 调用小程序登录获取 code
					const loginRes = await new Promise((resolve, reject) => {
						uni.login({
							success: resolve,
							fail: reject
						})
					})

					if (!loginRes.code) {
						console.error('[App] 获取登录 code 失败')
						return
					}

					console.log('[App] 获取到 code:', loginRes.code)

					// 从启动参数获取邀请者ID
					const launchOptions = uni.getLaunchOptionsSync && uni.getLaunchOptionsSync()
					const inviterId = launchOptions?.query?.inviterId || ''

					if (inviterId) {
						console.log('[App] 检测到邀请者ID:', inviterId)
					}

					// 调用后端登录接口,传入平台标识和邀请者ID
					const res = await wxLogin(loginRes.code, '', '', platform, inviterId)

					if (res.code === 0 && res.data.accessToken) {
						// 保存 token
						uni.setStorageSync('token', res.data.accessToken)
						console.log('[App] 登录成功，token 已保存')

						// 保存用户信息
						if (res.data.userInfo) {
							uni.setStorageSync('userInfo', JSON.stringify(res.data.userInfo))
							console.log('[App] 用户信息已保存:', res.data.userInfo)

							// 同步更新到 store
							const userStore = useUserStore()
							userStore.loadFromCache()
						}
					} else {
						console.error('[App] 登录失败:', res.message)
					}
				} catch (error) {
					console.error('[App] 登录异常:', error)
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
