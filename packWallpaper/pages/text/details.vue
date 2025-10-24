<template>
	<page-layout>
		<fu-nav-bar bgColor="#111111" leftIcon="left" title="文案详情" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></fu-nav-bar>

		<view class="text-details-container">
			<!-- 文案内容 -->
			<view v-if="!loading && data.id" class="text-content-box">
				<!-- VIP标识 -->
				<view v-if="data.isVip" class="vip-badge">VIP</view>

				<!-- 标题 -->
				<view v-if="data.title" class="text-title">{{ data.title }}</view>

				<!-- 内容 -->
				<view class="text-content">{{ data.content }}</view>

				<!-- 分类标签 -->
				<view v-if="data.category" class="text-category">
					<fu-icons type="tag" color="#999999" size="24"></fu-icons>
					<text class="category-text">{{ data.category.name }}</text>
				</view>

				<!-- 时间 -->
				<view class="text-time">{{ formatTime(data.createdAt) }}</view>

				<!-- 操作按钮 -->
				<view class="action-buttons">
					<view class="action-btn primary-btn" @click="handleCopy">
						<fu-icons type="copy" color="#ffffff" size="28"></fu-icons>
						<text class="btn-text">复制文案</text>
					</view>

					<view class="action-btn secondary-btn" @click="handleShare">
						<fu-icons type="share" color="#ffffff" size="28"></fu-icons>
						<text class="btn-text">分享</text>
					</view>
				</view>
			</view>

			<!-- 加载中 -->
			<view v-if="loading" class="loading-container">
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 推荐文案 -->
			<view v-if="!loading && recommendList.length > 0" class="recommend-section">
				<jc-section title="推荐文案" :showRight="false" />

				<view class="recommend-list">
					<view
						v-for="item in recommendList"
						:key="item.id"
						class="recommend-item"
						@click="handleRecommendClick(item)"
					>
						<!-- VIP标识 -->
						<view v-if="item.isVip" class="mini-vip-badge">VIP</view>

						<!-- 内容预览 -->
						<view class="recommend-content">{{ item.content }}</view>

						<!-- 复制按钮 -->
						<view class="mini-copy-btn" @click.stop="handleCopyRecommend(item)">
							<fu-icons type="copy" color="#999999" size="18"></fu-icons>
						</view>
					</view>
				</view>
			</view>
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, ref } from 'vue';
	import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
	import { getTextDetail, copyText, getRecommendTexts } from '@/api/text.js';

	// data数据
	const { $fu, $mUtil, $parseURL, $openPage } = getCurrentInstance().appContext.config.globalProperties;

	let data = ref({
		id: null,
		title: '',
		content: '',
		isVip: 0,
		category: null,
		createdAt: ''
	});
	let loading = ref(true);
	let recommendList = ref([]);

	// 生命周期
	onLoad(async (options) => {
		let query;
		// #ifdef MP
		query = $parseURL(options.query);
		// #endif
		// #ifndef MP
		query = JSON.parse(options.query);
		// #endif

		const textId = query.textId || query.id;

		if (textId) {
			await Promise.all([
				loadTextDetail(textId),
				loadRecommendList()
			]);
		} else {
			console.error('[TextDetails] 缺少文案ID参数');
		}
	});

	// 加载文案详情
	const loadTextDetail = async (textId) => {
		try {
			loading.value = true;
			console.log('[TextDetails] 加载文案详情:', textId);

			const res = await getTextDetail(textId);

			if (res.code === 0) {
				data.value = {
					id: res.data.id,
					title: res.data.title,
					content: res.data.content,
					isVip: res.data.isVip,
					category: res.data.category,
					createdAt: res.data.createdAt
				};
				console.log('[TextDetails] 文案详情加载成功');
			} else {
				console.error('[TextDetails] 加载失败:', res.message);
				$fu.toast('加载失败');
			}
		} catch (error) {
			console.error('[TextDetails] 加载异常:', error);
			$fu.toast('加载失败');
		} finally {
			loading.value = false;
		}
	};

	// 加载推荐列表
	const loadRecommendList = async () => {
		try {
			console.log('[TextDetails] 加载推荐文案列表');

			const res = await getRecommendTexts(6);

			if (res.code === 0) {
				recommendList.value = res.data || [];
				console.log('[TextDetails] 推荐文案列表加载成功:', recommendList.value.length);
			}
		} catch (error) {
			console.error('[TextDetails] 加载推荐列表异常:', error);
		}
	};

	// 复制文案
	const handleCopy = async () => {
		try {
			// 复制到剪贴板
			uni.setClipboardData({
				data: data.value.content,
				success: async () => {
					$fu.toast('复制成功');

					// 调用后端记录复制
					try {
						await copyText(data.value.id);
					} catch (error) {
						console.error('[TextDetails] 记录复制失败:', error);
					}
				},
				fail: (err) => {
					console.error('[TextDetails] 复制失败:', err);
					$fu.toast('复制失败');
				}
			});
		} catch (error) {
			console.error('[TextDetails] 复制异常:', error);
			$fu.toast('复制失败');
		}
	};

	// 分享文案
	const handleShare = () => {
		// #ifdef MP-WEIXIN
		uni.showShareMenu({
			withShareTicket: true,
			menus: ['shareAppMessage', 'shareTimeline']
		});
		$fu.toast('请点击右上角分享');
		// #endif

		// #ifndef MP-WEIXIN
		$fu.toast('当前平台暂不支持分享功能');
		// #endif
	};

	// 点击推荐文案
	const handleRecommendClick = (item) => {
		if (!item.id) {
			return;
		}

		// 如果点击的是当前文案,不跳转
		if (item.id === data.value.id) {
			console.log('[TextDetails] 点击的是当前文案,不跳转');
			return;
		}

		$openPage({
			name: 'textDetails',
			query: { textId: item.id }
		});
	};

	// 复制推荐文案
	const handleCopyRecommend = async (item) => {
		try {
			uni.setClipboardData({
				data: item.content,
				success: async () => {
					$fu.toast('复制成功');

					try {
						await copyText(item.id);
					} catch (error) {
						console.error('[TextDetails] 记录复制失败:', error);
					}
				},
				fail: (err) => {
					console.error('[TextDetails] 复制失败:', err);
					$fu.toast('复制失败');
				}
			});
		} catch (error) {
			console.error('[TextDetails] 复制异常:', error);
			$fu.toast('复制失败');
		}
	};

	// 格式化时间
	const formatTime = (time) => {
		if (!time) return '';
		const date = new Date(time);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	};

	// 分享给好友
	onShareAppMessage(() => {
		return {
			title: data.value.title || '精美文案分享',
			path: `/packWallpaper/pages/text/details?query=${encodeURIComponent(JSON.stringify({ textId: data.value.id }))}`,
			imageUrl: '' // 文案没有图片,可以使用默认分享图
		};
	});

	// 分享到朋友圈
	onShareTimeline(() => {
		return {
			title: data.value.title || '精美文案分享',
			query: `textId=${data.value.id}`
		};
	});
</script>

<style lang="scss" scoped>
	.text-details-container {
		min-height: 100vh;
		padding: 20rpx 30rpx;
		padding-bottom: 100rpx;
	}

	.text-content-box {
		position: relative;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 20rpx;
		padding: 40rpx;
		margin-bottom: 40rpx;
	}

	.vip-badge {
		position: absolute;
		top: 30rpx;
		right: 30rpx;
		background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
		color: #000000;
		font-size: 24rpx;
		font-weight: bold;
		padding: 6rpx 16rpx;
		border-radius: 10rpx;
		box-shadow: 0 2rpx 8rpx rgba(255, 215, 0, 0.4);
	}

	.text-title {
		color: #ffffff;
		font-size: 36rpx;
		font-weight: 600;
		margin-bottom: 30rpx;
		padding-right: 100rpx;
		line-height: 1.4;
	}

	.text-content {
		color: rgba(255, 255, 255, 0.9);
		font-size: 32rpx;
		line-height: 1.8;
		margin-bottom: 30rpx;
		word-wrap: break-word;
		white-space: pre-wrap;
	}

	.text-category {
		display: flex;
		align-items: center;
		gap: 10rpx;
		margin-bottom: 20rpx;
	}

	.category-text {
		color: #999999;
		font-size: 26rpx;
	}

	.text-time {
		color: rgba(255, 255, 255, 0.4);
		font-size: 24rpx;
		margin-bottom: 40rpx;
	}

	.action-buttons {
		display: flex;
		gap: 20rpx;
	}

	.action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10rpx;
		padding: 24rpx 0;
		border-radius: 50rpx;
		transition: all 0.2s;

		&:active {
			transform: scale(0.95);
		}
	}

	.primary-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		box-shadow: 0 8rpx 20rpx rgba(102, 126, 234, 0.3);
	}

	.secondary-btn {
		background: rgba(255, 255, 255, 0.1);
	}

	.btn-text {
		color: #ffffff;
		font-size: 28rpx;
		font-weight: 500;
	}

	.loading-container {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 100rpx 0;
	}

	.loading-text {
		color: rgba(255, 255, 255, 0.4);
		font-size: 28rpx;
	}

	.recommend-section {
		margin-top: 40rpx;
	}

	.recommend-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
		margin-top: 20rpx;
	}

	.recommend-item {
		position: relative;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 16rpx;
		padding: 24rpx;
		display: flex;
		align-items: flex-start;
		gap: 20rpx;
		transition: all 0.2s;

		&:active {
			background: rgba(255, 255, 255, 0.06);
		}
	}

	.mini-vip-badge {
		position: absolute;
		top: 16rpx;
		right: 16rpx;
		background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
		color: #000000;
		font-size: 18rpx;
		font-weight: bold;
		padding: 2rpx 8rpx;
		border-radius: 6rpx;
	}

	.recommend-content {
		flex: 1;
		color: rgba(255, 255, 255, 0.7);
		font-size: 26rpx;
		line-height: 1.6;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		overflow: hidden;
		text-overflow: ellipsis;
		padding-right: 60rpx;
	}

	.mini-copy-btn {
		flex-shrink: 0;
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 50%;
		transition: all 0.2s;

		&:active {
			background: rgba(255, 255, 255, 0.1);
		}
	}
</style>
