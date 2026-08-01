<template>
	<view class="find-box">
		<view class="find-box__content">
			<!-- 小程序推荐 -->
			<view class="miniprogram-section">
				<view class="task-section__title">
					<text class="task-section__title-text">小程序推荐</text>
				</view>

				<view class="find-box__item" v-for="(item,index) in list" :key="item.id || index" @click="navigateToMiniProgram(item)">
					<view class="find-box__item--back">
						<app-image width="100%" height="100%" :src="item.coverUrl || $mAssetsPath.find1" />
					</view>

					<view class="fu-flex-1 fu-relative fu-flex fu-flex-direction-column fu-m-x-30 fu-m-y-40">
						<view class="fu-flex-1">
							<view class="fu-font-36 fu-line-1 font-family">{{ item.name || '' }}</view>
							<view class="fu-font-24 fu-m-t-10 fu-line-2">{{ item.description || '' }}</view>
						</view>
						<up-button shape="round" :customStyle="{width: '160rpx', background: 'rgba(255, 255, 255, 0.15)', border: 'none', padding: '10rpx 20rpx', height: 'auto'}" @click.stop="navigateToMiniProgram(item)"><text style="font-size: 26rpx; font-weight: 500; color: #ffffff;">立即查看</text></up-button>
					</view>
				</view>
			</view>

			<!-- 任务列表 -->
			<view class="task-section">
				<view class="task-section__title">
					<text class="task-section__title-text">每日任务</text>
					<text class="task-section__title-desc">完成任务获得下载次数</text>
				</view>

				<view class="task-list">
					<view
						class="task-item"
						v-for="task in taskList"
						:key="task.id"
					>
						<view class="task-item__icon">
							<TaskIcon
								:type="task.taskType"
								:isCompleted="task.isCompleted || isTaskDisabled(task.taskType)"
								:isDisabled="isTaskDisabled(task.taskType)"
							/>
						</view>
						<view class="task-item__content">
							<view class="task-item__title">
								<text>{{ task.taskName }}</text>
								<text class="task-item__reward">+{{ task.rewardCount }}</text>
							</view>
							<view class="task-item__desc">{{ task.taskDesc || getTaskDesc(task) }}</view>
						</view>
						<view class="task-item__action">
							<!-- 邀请任务使用分享按钮 -->
							<button v-if="task.taskType === 'invite' && !task.isCompleted && !isTaskDisabled(task.taskType)" class="task-item__share-btn" open-type="share">
								<view class="task-item__gold-btn">
									<text class="task-item__gold-btn-text">{{ getTaskButtonText(task.taskType) }}</text>
								</view>
							</button>
							<!-- 其他任务普通按钮 -->
							<view v-else-if="!task.isCompleted && !isTaskDisabled(task.taskType)" class="task-item__gold-btn" @click="handleTaskClick(task)">
								<text class="task-item__gold-btn-text">{{ getTaskButtonText(task.taskType) }}</text>
							</view>
							<view v-else-if="isTaskDisabled(task.taskType)" class="task-item__disabled">
								<text class="task-item__disabled-text">已完成</text>
							</view>
							<view v-else class="task-item__completed">
								<text class="task-item__completed-icon">✓</text>
								<text class="task-item__completed-text">已完成</text>
							</view>
						</view>
					</view>
				</view>
			</view>

			<jc-loading-more :loadingType="queryParams.loadingType" />
		</view>
	</view>
</template>

<script setup>
	import { getCurrentInstance, ref, onMounted, watch } from 'vue';
	import { onReachBottom, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
	import { getMiniProgramList } from '@/api/miniprogram.js';
	import { getTaskList, signIn, checkSignIn, adReward } from '@/api/task.js';
	import { useAdStore } from '@/stores/ad.js';
	import TaskIcon from './TaskIcon.vue';

	// Props
	const props = defineProps({
		isActive: {
			type: Boolean,
			default: false
		}
	});

	// data数据
	const { $mAssetsPath, $mConstDataConfig } = getCurrentInstance().appContext.config.globalProperties;
	const adStore = useAdStore();

	// 获取当前用户ID (从本地存储获取)
	const getUserId = () => {
		try {
			const userInfo = uni.getStorageSync('userInfo');
			if (userInfo) {
				const parsed = JSON.parse(userInfo);
				return parsed.id || parsed.userId || '';
			}
		} catch (error) {
			console.error('[Find] 获取用户ID失败:', error);
		}
		return '';
	};

	let list = ref([]);
	let taskList = ref([]);
	let queryParams = ref({
		pageNum: 1,
		pageSize: $mConstDataConfig.pageSize,
		loadingType: 0,
		loadMore: true
	});

	// 激励视频广告实例
	let rewardedVideoAd = null;

	// 签到状态
	let isSigned = ref(false);

	// 跳转小程序的防抖标志
	let isNavigating = ref(false);

	// 等待 token 就绪
	const waitForToken = () => {
		return new Promise((resolve) => {
			const checkToken = () => {
				const token = uni.getStorageSync('token');
				if (token) {
					console.log('[Find] Token 已就绪,开始加载任务');
					resolve();
				} else {
					console.log('[Find] 等待 token...');
					setTimeout(checkToken, 100); // 每100ms检查一次
				}
			};
			checkToken();
		});
	};

	// 等待广告配置加载完成
	const waitForAdConfig = () => {
		return new Promise((resolve) => {
			const checkAdConfig = () => {
				if (adStore.isLoaded && adStore.adConfig.rewardVideoId) {
					console.log('[Find] ✅ 广告配置已就绪');
					resolve();
				} else {
					console.log('[Find] ⏳ 等待广告配置加载...');
					setTimeout(checkAdConfig, 100);
				}
			};
			checkAdConfig();
		});
	};

	// 生命周期
	onMounted(() => {
		// 等待 token 就绪后再加载需要登录的接口
		waitForToken().then(() => {
			loadTasks();
			// checkSignStatus();
		});

		// 不需要登录的接口可以立即调用
		initList();

		// 等待广告配置加载完成后再初始化广告
		waitForAdConfig().then(() => {
			initRewardedVideoAd();
		});
	});

	// 监听页面激活状态,每次切换到这个tab时重新加载数据
	watch(() => props.isActive, (newVal) => {
		if (newVal) {
			console.log('[Find] 页面激活,重新加载任务和签到状态');
			// 等待 token 就绪后重新加载
			waitForToken().then(() => {
				loadTasks();        // 重新加载任务列表
				checkSignStatus();  // 重新检查签到状态
			});
		}
	});

	onReachBottom(() => {
		if (queryParams.value.loadMore) {
			queryParams.value.pageNum++;
			setTimeout(() => {
				initList();
			}, 500);
		}
	});

	// 分享给好友
	// onShareAppMessage(() => {
	// 	const userId = getUserId();
	// 	console.log(888, userId);
		
	// 	return {
	// 		title: 'TinyWuYou-壁纸 精美壁纸头像等你来拿！',
	// 		path: `/pages/index/index?inviterId=${userId}`,
	// 		// query: `inviterId=${userId}`,
	// 		imageUrl: $mAssetsPath.banner || ''
	// 	};
	// });

	// 分享到朋友圈
	// onShareTimeline(() => {
	// 	const userId = getUserId();
	// 	return {
	// 		title: 'TinyWuYou-壁纸 精美壁纸头像等你来拿！',
	// 		query: `inviterId=${userId}`,
	// 		imageUrl: $mAssetsPath.banner || ''
	// 	};
	// });

	// 初始化激励视频广告
	const initRewardedVideoAd = () => {
		// #ifdef MP-WEIXIN
		console.log('[Find] ========== 广告初始化调试信息 ==========');
		console.log('[Find] wx 是否存在:', typeof wx !== 'undefined');
		console.log('[Find] wx.createRewardedVideoAd 是否存在:', typeof wx !== 'undefined' && typeof wx.createRewardedVideoAd !== 'undefined');
		console.log('[Find] adStore.adConfig:', JSON.stringify(adStore.adConfig));
		console.log('[Find] adStore.isLoaded:', adStore.isLoaded);
		console.log('[Find] rewardVideoId:', adStore.adConfig.rewardVideoId);
		console.log('[Find] ============================================');

		if (typeof wx !== 'undefined' && wx.createRewardedVideoAd && adStore.adConfig.rewardVideoId) {
			const adUnitId = adStore.adConfig.rewardVideoId;
			console.log('[Find] ✅ 开始初始化激励视频广告, ID:', adUnitId);

			rewardedVideoAd = wx.createRewardedVideoAd({ adUnitId });

			rewardedVideoAd.onLoad(() => {
				console.log('[Find] ✅ 激励视频广告加载成功');
			});

			rewardedVideoAd.onError((err) => {
				console.error('[Find] ❌ 激励视频广告加载失败:', JSON.stringify(err));
			});

			rewardedVideoAd.onClose((res) => {
				if (res && res.isEnded) {
					// 观看完成,增加次数
					console.log('[Find] ✅ 广告观看完成');
					addAdReward();
				} else {
					console.log('[Find] ⚠️ 广告未看完');
					uni.showToast({
						title: '请看完广告获取奖励',
						icon: 'none'
					});
				}
			});
		} else {
			console.error('[Find] ❌ 广告初始化失败,缺少必要条件');
			if (typeof wx === 'undefined') {
				console.error('[Find] 原因: wx 未定义');
			} else if (!wx.createRewardedVideoAd) {
				console.error('[Find] 原因: wx.createRewardedVideoAd 不存在');
			} else if (!adStore.adConfig.rewardVideoId) {
				console.error('[Find] 原因: rewardVideoId 为空');
			}
		}
		// #endif
	};

	// 加载任务列表
	const loadTasks = async () => {
		try {
			console.log('[Find] 加载任务列表');
			const res = await getTaskList();
			if (res.code === 0) {
				taskList.value = res.data || [];
				console.log('[Find] 任务列表加载成功:', taskList.value.length);
			}
		} catch (error) {
			console.error('[Find] 加载任务列表失败:', error);
		}
	};

	// 检查签到状态
	const checkSignStatus = async () => {
		try {
			const res = await checkSignIn();
			if (res.code === 0) {
				isSigned.value = res.data.signed;
				console.log('[Find] 签到状态:', isSigned.value ? '已签到' : '未签到');
			}
		} catch (error) {
			console.error('[Find] 检查签到状态失败:', error);
		}
	};

	// 判断任务是否被禁用
	// 任务类型固定四种：newbie / signin / invite / ad
	const isTaskDisabled = (taskType) => {
		if (taskType === 'signin') {
			return isSigned.value;
		}
		// 新人福利注册时自动发放，不需要点
		return taskType === 'newbie';
	};

	// 获取任务描述
	const getTaskDesc = (task) => {
		const descMap = {
			'ad': '观看广告视频',
			'invite': '邀请好友注册',
			'signin': '每日签到打卡',
			'newbie': '新人专属福利'
		};
		return descMap[task.taskType] || '';
	};

	// 获取任务按钮文字
	const getTaskButtonText = (taskType) => {
		const textMap = {
			'ad': '去观看',
			'invite': '去邀请',
			'signin': '签到',
			'newbie': '领取'
		};
		return textMap[taskType] || '去完成';
	};

	// 处理任务点击
	const handleTaskClick = async (task) => {
		// 禁用的任务不允许点击
		if (isTaskDisabled(task.taskType)) {
			const message = task.taskType === 'signin' ? '今日已签到' : '该任务已自动完成';
			uni.showToast({
				title: message,
				icon: 'none'
			});
			return;
		}

		if (task.isCompleted) {
			uni.showToast({
				title: '已完成该任务',
				icon: 'none'
			});
			return;
		}

		// 按任务类型分发。类型是固定的四种，后台不能新增，
		// 所以这里不会出现"渲染了但点不动"的任务。
		if (task.taskType === 'ad') {
			await showRewardedVideoAd();
		} else if (task.taskType === 'signin') {
			await handleSignIn();
		}
	};

	// 处理签到
	const handleSignIn = async () => {
		try {
			uni.showLoading({ title: '签到中...' });
			const res = await signIn();
			uni.hideLoading();

			if (res.code === 0) {
				if (res.data.alreadySigned) {
					uni.showToast({
						title: '今日已签到',
						icon: 'none'
					});
				} else {
					uni.showToast({
						title: `签到成功!获得 ${res.data.rewardCount} 次下载`,
						icon: 'none',
					});

					// 更新签到状态
					isSigned.value = true;

					// 更新用户信息中的下载次数
					const userInfo = uni.getStorageSync('userInfo');
					if (userInfo) {
						const parsed = JSON.parse(userInfo);
						parsed.downloadCount = res.data.currentDownloadCount;
						uni.setStorageSync('userInfo', JSON.stringify(parsed));
					}

					// 🔧 签到成功后重新加载任务列表,更新任务完成状态
					await loadTasks();
					console.log('[Find] 签到成功,已重新加载任务列表');
				}
			}
		} catch (error) {
			uni.hideLoading();
			uni.showToast({
				title: error.message || '签到失败',
				icon: 'none'
			});
			console.error('[Find] 签到失败:', error);
		}
	};

	// 显示激励视频广告
	const showRewardedVideoAd = async () => {
		console.log('[Find] ========== 点击观看广告 ==========');
		console.log('[Find] rewardedVideoAd 实例是否存在:', rewardedVideoAd !== null);
		console.log('[Find] adStore.adConfig:', JSON.stringify(adStore.adConfig));
		console.log('[Find] adStore.isLoaded:', adStore.isLoaded);
		console.log('[Find] =======================================');

		if (!rewardedVideoAd) {
			console.error('[Find] ❌ 广告实例不存在,无法播放');
			uni.showToast({
				title: '广告加载中,请稍后',
				icon: 'none'
			});
			return;
		}

		console.log('[Find] ✅ 广告实例存在,尝试播放');

		// #ifdef MP-WEIXIN
		rewardedVideoAd
			.show()
			.then(() => {
				console.log('[Find] ✅ 广告开始播放');
			})
			.catch((err) => {
				console.error('[Find] ⚠️ 广告播放失败,尝试重新加载:', JSON.stringify(err));
				// 广告未加载完成,重新加载
				rewardedVideoAd
					.load()
					.then(() => {
						console.log('[Find] ✅ 广告重新加载成功,开始播放');
						return rewardedVideoAd.show();
					})
					.catch((loadErr) => {
						console.error('[Find] ❌ 广告重新加载失败:', JSON.stringify(loadErr));
						uni.showToast({
							title: '广告加载失败',
							icon: 'none'
						});
					});
			});
		// #endif

		// #ifndef MP-WEIXIN
		// 非微信环境模拟广告观看
		uni.showLoading({ title: '加载广告中...' });
		setTimeout(async () => {
			uni.hideLoading();
			await addAdReward();
		}, 1000);
		// #endif
	};

	// 看广告增加次数
	const addAdReward = async () => {
		try {
			const res = await adReward();
			if (res.code === 0) {
				uni.showToast({
					title: `次数 +${res.data.rewardCount}`,
					icon: 'none',
				});

				// 更新用户信息中的下载次数
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo) {
					const parsed = JSON.parse(userInfo);
					parsed.downloadCount = res.data.currentDownloadCount;
					uni.setStorageSync('userInfo', JSON.stringify(parsed));
				}
			}
		} catch (error) {
			console.error('[Find] 看广告增加次数失败:', error);
			uni.showToast({
				title: error.message || '操作失败',
				icon: 'none'
			});
		}
	};

	// 加载小程序列表
	const initList = async () => {
		queryParams.value.loadingType = 1;

		try {
			console.log('[Find] 加载小程序列表:', {
				page: queryParams.value.pageNum,
				pageSize: queryParams.value.pageSize
			});

			const res = await getMiniProgramList(
				queryParams.value.pageNum,
				queryParams.value.pageSize
			);

			if (res.code === 0) {
				const newData = res.data.list || [];

				// 第一页覆盖，后续页追加
				list.value = queryParams.value.pageNum === 1
					? newData
					: list.value.concat(newData);

				// 判断是否还有更多数据
				if (newData.length < queryParams.value.pageSize) {
					queryParams.value.loadingType = 2; // 没有更多了
					queryParams.value.loadMore = false;
				} else {
					queryParams.value.loadingType = 0; // 加载完成
				}

				console.log('[Find] 加载成功，当前列表长度:', list.value.length);
			} else {
				console.error('[Find] 加载失败:', res.message);
				queryParams.value.loadingType = 3; // 加载失败
			}
		} catch (error) {
			console.error('[Find] 加载异常:', error);
			queryParams.value.loadingType = 3; // 加载失败
		}
	};

	// 跳转到其他小程序
	const navigateToMiniProgram = (item) => {
		console.log('[Find] 跳转小程序:', item);

		// 防抖: 如果正在跳转,忽略本次点击
		if (isNavigating.value) {
			console.log('[Find] 跳转进行中,忽略重复点击');
			return;
		}

		if (!item.appId) {
			console.error('[Find] 小程序 appId 不存在');
			uni.showToast({
				title: '小程序配置错误',
				icon: 'none'
			});
			return;
		}

		// 设置跳转标志
		isNavigating.value = true;

		// #ifdef MP-WEIXIN
		uni.navigateToMiniProgram({
			appId: item.appId,
			path: item.path || '',
			success: () => {
				console.log('[Find] ✅ 跳转小程序成功');
				// 重置标志
				setTimeout(() => {
					isNavigating.value = false;
				}, 1000);
			},
			fail: (err) => {
				console.error('[Find] ❌ 跳转小程序失败:', err);
				// 重置标志
				setTimeout(() => {
					isNavigating.value = false;
				}, 1000);
			}
		});
		// #endif

		// #ifndef MP-WEIXIN
		isNavigating.value = false;
		uni.showToast({
			title: '仅支持微信小程序',
			icon: 'none'
		});
		// #endif
	};
</script>

<style lang="scss" scoped>
	.find-box {
		padding-bottom: 80rpx;

		&__content {
			margin: 0 30rpx;
		}

		&__item {
			position: relative;
			height: 300rpx;
			border-radius: 15rpx;
			margin-top: 30rpx;
			overflow: hidden;
			display: flex;

			&--back {
				position: absolute;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
			}
		}
	}

	// 小程序推荐区域
	.miniprogram-section {
		margin-top: 30rpx;
	}

	// 任务区域
	.task-section {
		margin-top: 60rpx;

		&__title {
			display: flex;
			align-items: baseline;
			margin-bottom: 20rpx;

			&-text {
				font-size: 36rpx;
				font-weight: bold;
				color: #ffffff;
				margin-right: 20rpx;
			}

			&-desc {
				font-size: 24rpx;
				color: #999999;
			}
		}
	}

	// 任务列表
	.task-list {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 15rpx;
		overflow: hidden;
	}

	// 任务项
	.task-item {
		display: flex;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);

		&:last-child {
			border-bottom: none;
		}

		&__icon {
			width: 80rpx;
			height: 80rpx;
			display: flex;
			align-items: center;
			justify-content: center;
			margin-right: 20rpx;
		}

		&__content {
			flex: 1;
			min-width: 0;
		}

		&__title {
			display: flex;
			align-items: center;
			font-size: 32rpx;
			font-weight: bold;
			color: #ffffff;
			margin-bottom: 10rpx;
		}

		&__reward {
			font-size: 28rpx;
			font-weight: bold;
			color: #FF6347;
			margin-left: 12rpx;
		}

		&__desc {
			font-size: 24rpx;
			color: #999999;
		}

		&__action {
			display: flex;
			align-items: center;
			justify-content: center;
			margin-left: 20rpx;
		}

		&__button {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		&__disabled {
			display: flex;
			align-items: center;
			padding: 10rpx 30rpx;
			background: rgba(255, 255, 255, 0.1);
			border-radius: 28rpx;

			&-text {
				font-size: 24rpx;
				color: #666666;
			}
		}

		&__completed {
			display: flex;
			align-items: center;
			font-size: 24rpx;
			color: #00C853;

			&-icon {
				font-size: 28rpx;
				font-weight: bold;
				margin-right: 5rpx;
			}

			&-text {
				margin-left: 5rpx;
			}
		}
	}

	// 分享按钮 (清除原生样式)
	.task-item__share-btn {
		background: transparent;
		border: none;
		padding: 0;
		margin: 0;
		line-height: 1;

		&::after {
			border: none;
		}
	}

	// 金色标签按钮
	.task-item__gold-btn {
		display: flex;
		align-items: center;
		padding: 10rpx 30rpx;
		background: rgba(255, 215, 0, 0.2);
		border-radius: 28rpx;
		border: 2rpx solid rgba(255, 215, 0, 0.3);
		white-space: nowrap;
	}

	.task-item__gold-btn-text {
		color: #FFD700;
		font-size: 24rpx;
		font-weight: bold;
	}
</style>
