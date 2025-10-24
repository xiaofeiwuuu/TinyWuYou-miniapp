<template>
	<page-layout>
		<fu-nav-bar bgColor="#111111" leftIcon="left" :title="title" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></fu-nav-bar>

		<view class="text-list-container">
			<!-- 文案列表 -->
			<view v-if="list.length > 0" class="text-list">
				<view
					v-for="(item, index) in list"
					:key="item.id"
					class="text-item"
					@click="handleTextClick(item)"
				>
					<!-- VIP标识 -->
					<view v-if="item.isVip" class="vip-badge">VIP</view>

					<!-- 标题 -->
					<view v-if="item.title" class="text-title">{{ item.title }}</view>

					<!-- 内容 -->
					<view class="text-content">{{ item.content }}</view>
				</view>
			</view>

			<!-- 加载中 -->
			<view v-if="loading" class="loading-container">
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 空状态 -->
			<view v-if="!loading && list.length === 0" class="empty-container">
				<text class="empty-text">暂无文案</text>
			</view>

			<!-- 加载更多 -->
			<jc-loading-more :loadingType="loadingType" />
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, ref } from 'vue';
	import { onLoad, onReachBottom } from '@dcloudio/uni-app';
	import { getTextList, copyText } from '@/api/text.js';

	// data数据
	const { $fu, $mUtil, $mConstDataConfig, $openPage, $parseURL } = getCurrentInstance().appContext.config.globalProperties;

	let title = ref('文案');
	let categoryId = ref(null);
	let list = ref([]);
	let loading = ref(false);
	let loadingType = ref(0); // 0:加载完成 1:加载中 2:没有更多 3:加载失败
	let queryParams = ref({
		pageNum: 1,
		pageSize: 50,
		loadMore: true
	});

	// 生命周期
	onLoad(async (options) => {
		let query;
		// #ifdef MP
		query = $parseURL(options.query);
		// #endif
		// #ifndef MP
		query = JSON.parse(options.query);
		// #endif

		categoryId.value = query.categoryId;
		title.value = query.title || '文案';

		console.log('[TextList] 页面参数:', { categoryId: categoryId.value, title: title.value });

		init();
	});

	// 触底加载更多
	onReachBottom(() => {
		if (queryParams.value.loadMore) {
			queryParams.value.pageNum++;
			setTimeout(() => {
				initList();
			}, 500);
		}
	});

	// 初始化
	const init = () => {
		queryParams.value.pageNum = 1;
		queryParams.value.loadMore = true;
		list.value = [];
		initList();
	};

	// 加载文案列表
	const initList = async () => {
		if (!categoryId.value) {
			console.error('[TextList] 缺少分类ID');
			return;
		}

		loadingType.value = 1;
		loading.value = true;

		try {
			console.log('[TextList] 加载文案列表:', {
				categoryId: categoryId.value,
				page: queryParams.value.pageNum,
				pageSize: queryParams.value.pageSize
			});

			const res = await getTextList({
				categoryId: categoryId.value,
				page: queryParams.value.pageNum,
				pageSize: queryParams.value.pageSize,
				sortBy: 'latest'
			});

			if (res.code === 0) {
				const newData = res.data.list || [];

				// 第一页覆盖，后续页追加
				list.value = queryParams.value.pageNum === 1
					? newData
					: list.value.concat(newData);

				// 判断是否还有更多数据
				if (newData.length < queryParams.value.pageSize) {
					loadingType.value = 2; // 没有更多了
					queryParams.value.loadMore = false;
				} else {
					loadingType.value = 0; // 加载完成
				}

				console.log('[TextList] 加载成功，当前列表长度:', list.value.length);
			} else {
				console.error('[TextList] 加载失败:', res.message);
				loadingType.value = 3; // 加载失败
			}
		} catch (error) {
			console.error('[TextList] 加载异常:', error);
			loadingType.value = 3;
		} finally {
			loading.value = false;
		}
	};

	// 点击文案 - 有标题跳转详情,无标题直接复制
	const handleTextClick = (item) => {
		console.log('[TextList] 点击文案:', item);

		if (!item.id) {
			return;
		}

		// 如果有标题且标题不为空,跳转到详情页
		if (item.title && item.title.trim() !== '') {
			console.log('[TextList] 有标题,跳转详情页');
			$openPage({
				name: 'textDetails',
				query: { textId: item.id }
			});
		} else {
			// 没有标题或标题为空,直接复制
			console.log('[TextList] 无标题,直接复制');
			handleCopy(item);
		}
	};

	// 复制文案
	const handleCopy = async (item) => {
		console.log('[TextList] 复制文案:', item);

		try {
			// 复制到剪贴板
			uni.setClipboardData({
				data: item.content,
				success: async () => {
					$fu.toast('复制成功');

					// 调用后端记录复制
					try {
						await copyText(item.id);
					} catch (error) {
						console.error('[TextList] 记录复制失败:', error);
					}
				},
				fail: (err) => {
					console.error('[TextList] 复制失败:', err);
					$fu.toast('复制失败');
				}
			});
		} catch (error) {
			console.error('[TextList] 复制异常:', error);
			$fu.toast('复制失败');
		}
	};

	// 格式化时间
	const formatTime = (time) => {
		if (!time) return '';
		const date = new Date(time);
		const now = new Date();
		const diff = now - date;

		// 1分钟内
		if (diff < 60 * 1000) {
			return '刚刚';
		}
		// 1小时内
		if (diff < 60 * 60 * 1000) {
			return Math.floor(diff / (60 * 1000)) + '分钟前';
		}
		// 24小时内
		if (diff < 24 * 60 * 60 * 1000) {
			return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
		}
		// 7天内
		if (diff < 7 * 24 * 60 * 60 * 1000) {
			return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
		}
		// 超过7天显示日期
		return `${date.getMonth() + 1}-${date.getDate()}`;
	};
</script>

<style lang="scss" scoped>
	.text-list-container {
		min-height: 100vh;
		padding: 20rpx 30rpx;
		padding-bottom: 100rpx;
	}

	.text-list {
		display: flex;
		flex-direction: column;
		gap: 20rpx;
	}

	.text-item {
		position: relative;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 20rpx;
		padding: 30rpx;
		transition: all 0.3s;

		&:active {
			background: rgba(255, 255, 255, 0.08);
			transform: scale(0.98);
		}
	}

	.vip-badge {
		position: absolute;
		top: 20rpx;
		right: 20rpx;
		background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
		color: #000000;
		font-size: 20rpx;
		font-weight: bold;
		padding: 4rpx 12rpx;
		border-radius: 8rpx;
		box-shadow: 0 2rpx 8rpx rgba(255, 215, 0, 0.4);
		z-index: 10;
	}

	.text-title {
		color: #ffffff;
		font-size: 32rpx;
		font-weight: 600;
		margin-bottom: 20rpx;
		padding-right: 80rpx;
	}

	.text-content {
		color: rgba(255, 255, 255, 0.85);
		font-size: 28rpx;
		line-height: 1.6;
		word-wrap: break-word;
		white-space: pre-wrap;
	}

	.loading-container,
	.empty-container {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 100rpx 0;
	}

	.loading-text,
	.empty-text {
		color: rgba(255, 255, 255, 0.4);
		font-size: 28rpx;
	}
</style>
