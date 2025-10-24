<template>
	<page-layout>
		<fu-nav-bar bgColor="#111111" leftIcon="left" :title="title" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></fu-nav-bar>

		<view class="content-wrapper">
			<!-- 图片网格 -->
			<view class="fu-m-x-30 fu-m-t-20">
				<jc-grid
					v-if="list.length > 0"
					:list="list"
					:column="gridColumn"
					:multiple="gridMultiple"
					@click="handleImageClick"
				/>

				<!-- 加载状态 -->
				<view v-if="loading" class="loading-text">加载中...</view>

				<!-- 空状态 -->
				<view v-if="!loading && list.length === 0" class="empty-text">暂无图片</view>
			</view>

			<!-- 分页控件 -->
			<view class="pagination-wrapper">
				<view class="pagination-info">
					共 {{ totalPages }} 页 / {{ totalCount }} 张图片
				</view>

				<view class="pagination-controls">
					<!-- 上一页 -->
					<view
						class="page-btn"
						:class="{ disabled: currentPage === 1 }"
						@click="goToPage(currentPage - 1)"
					>
						上一页
					</view>

					<!-- 页码列表 -->
					<view class="page-numbers">
						<view
							v-for="page in visiblePages"
							:key="page"
							class="page-number"
							:class="{ active: page === currentPage, ellipsis: page === '...' }"
							@click="page !== '...' && goToPage(page)"
						>
							{{ page }}
						</view>
					</view>

					<!-- 下一页 -->
					<view
						class="page-btn"
						:class="{ disabled: currentPage === totalPages }"
						@click="goToPage(currentPage + 1)"
					>
						下一页
					</view>
				</view>

				<!-- 跳转输入 -->
				<view class="page-jump">
					<text class="jump-label">跳转到</text>
					<input
						class="jump-input"
						type="number"
						v-model="jumpPageInput"
						@confirm="handleJumpPage"
					/>
					<text class="jump-label">页</text>
					<view class="jump-btn" @click="handleJumpPage">确定</view>
				</view>
			</view>
		</view>
	</page-layout>
</template>

<script setup>
import { getCurrentInstance, ref, computed, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getImageList } from '@/api/image.js';

// data数据
const { $fu, $mUtil, $mConstDataConfig, $openPage, $parseURL } = getCurrentInstance().appContext.config.globalProperties;

let title = ref('');
let categoryId = ref(null);
let imageType = ref(''); // avatar/wallpaper/pc_wallpaper 等
let currentPage = ref(1);
let pageSize = ref($mConstDataConfig.pageSize || 20);
let totalPages = ref(0);
let totalCount = ref(0);
let list = ref([]);
let loading = ref(false);
let jumpPageInput = ref('');

// 根据不同图片类型设置网格列数和比例
const gridColumn = computed(() => {
	// PC壁纸用2列,其他用3列
	return imageType.value === 'pc_wallpaper' ? 2 : 3;
});

const gridMultiple = computed(() => {
	// PC壁纸横向比例0.7,其他1:1
	return imageType.value === 'pc_wallpaper' ? 0.7 : 1;
});

// 详情页映射
const detailsPageMap = {
	'avatar': 'avatarDetails',
	'wallpaper': 'mobileDetails',
	'pc_wallpaper': 'desktopDetails',
	'emoji': 'avatarDetails', // 暂用avatar详情页
	'sticker': 'avatarDetails' // 暂用avatar详情页
};

// 计算导航栏高度
const navHeight = computed(() => {
	return $fu.sys().statusBarHeight + 44;
});

// 生成可见页码列表
const visiblePages = computed(() => {
	const pages = [];
	const total = totalPages.value;
	const current = currentPage.value;

	if (total <= 7) {
		// 总页数少于7页,全部显示
		for (let i = 1; i <= total; i++) {
			pages.push(i);
		}
	} else {
		// 总页数大于7页,显示: 1 ... 中间页 ... 最后页
		pages.push(1);

		if (current > 3) {
			pages.push('...');
		}

		// 当前页前后各显示1页
		const start = Math.max(2, current - 1);
		const end = Math.min(total - 1, current + 1);

		for (let i = start; i <= end; i++) {
			pages.push(i);
		}

		if (current < total - 2) {
			pages.push('...');
		}

		pages.push(total);
	}

	return pages;
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

	title.value = query.title || '图片列表';
	categoryId.value = query.categoryId;
	imageType.value = query.imageType || 'avatar';

	console.log('[CommonList] 页面参数:', {
		title: title.value,
		categoryId: categoryId.value,
		imageType: imageType.value
	});

	// 尝试从缓存读取上次浏览的页码
	const cacheKey = `lastPage_${categoryId.value}`;
	const cachedPage = uni.getStorageSync(cacheKey);
	if (cachedPage && cachedPage > 0) {
		currentPage.value = cachedPage;
		console.log('[CommonList] 恢复上次浏览页码:', cachedPage);
	}

	// 加载数据
	await loadImages();
});

// methods方法
// 加载图片列表
const loadImages = async () => {
	if (!categoryId.value) {
		console.error('[CommonList] categoryId 为空');
		return;
	}

	loading.value = true;

	try {
		console.log('[CommonList] 加载图片列表:', {
			categoryId: categoryId.value,
			page: currentPage.value,
			pageSize: pageSize.value
		});

		const res = await getImageList({
			categoryId: categoryId.value,
			page: currentPage.value,
			pageSize: pageSize.value
		});

		if (res.code === 0) {
			const data = res.data || {};
			totalCount.value = data.total || 0;
			totalPages.value = Math.ceil(totalCount.value / pageSize.value);

			// 转换数据格式
			list.value = (data.list || []).map(img => ({
				id: img.id,
				image: img.thumbnailUrl || img.imageUrl,
				imageUrl: img.imageUrl,
				title: img.title,
				width: img.width,
				height: img.height
			}));

			// 保存当前页码到缓存
			const cacheKey = `lastPage_${categoryId.value}`;
			uni.setStorageSync(cacheKey, currentPage.value);

			console.log('[CommonList] 加载成功:', {
				total: totalCount.value,
				totalPages: totalPages.value,
				listLength: list.value.length
			});
		} else {
			console.error('[CommonList] 加载失败:', res.message);
			uni.showToast({
				title: res.message || '加载失败',
				icon: 'none'
			});
		}
	} catch (error) {
		console.error('[CommonList] 加载异常:', error);
		uni.showToast({
			title: '加载失败',
			icon: 'none'
		});
	} finally {
		loading.value = false;
	}
};

// 跳转到指定页
const goToPage = async (page) => {
	if (page < 1 || page > totalPages.value || page === currentPage.value) {
		return;
	}

	currentPage.value = page;
	jumpPageInput.value = '';

	// 滚动到顶部
	uni.pageScrollTo({
		scrollTop: 0,
		duration: 300
	});

	await loadImages();
};

// 处理页码跳转
const handleJumpPage = async () => {
	const page = parseInt(jumpPageInput.value);

	if (isNaN(page)) {
		uni.showToast({
			title: '请输入有效页码',
			icon: 'none'
		});
		return;
	}

	if (page < 1 || page > totalPages.value) {
		uni.showToast({
			title: `页码范围: 1-${totalPages.value}`,
			icon: 'none'
		});
		return;
	}

	await goToPage(page);
};

// 点击图片
const handleImageClick = (image) => {
	console.log('[CommonList] 点击图片:', image);

	const detailsPage = detailsPageMap[imageType.value] || 'avatarDetails';

	$openPage(detailsPage, {
		id: image.id,
		imageUrl: image.imageUrl
	});
};
</script>

<style lang="scss" scoped>
.content-wrapper {
	min-height: 100vh;
	background-color: #111111;
	color: #ffffff;
	padding-bottom: 200rpx;
}

.loading-text,
.empty-text {
	text-align: center;
	padding: 100rpx 0;
	font-size: 28rpx;
	color: #999999;
}

.pagination-wrapper {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #1a1a1a;
	border-top: 1rpx solid #333333;
	padding: 20rpx 30rpx;
	z-index: 100;
}

.pagination-info {
	text-align: center;
	font-size: 24rpx;
	color: #999999;
	margin-bottom: 20rpx;
}

.pagination-controls {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	margin-bottom: 20rpx;
}

.page-btn {
	padding: 10rpx 20rpx;
	background: #333333;
	border-radius: 8rpx;
	font-size: 24rpx;
	color: #ffffff;

	&.disabled {
		opacity: 0.3;
		pointer-events: none;
	}
}

.page-numbers {
	display: flex;
	gap: 10rpx;
	flex-wrap: wrap;
	justify-content: center;
}

.page-number {
	min-width: 60rpx;
	height: 60rpx;
	line-height: 60rpx;
	text-align: center;
	background: #333333;
	border-radius: 8rpx;
	font-size: 24rpx;
	color: #ffffff;

	&.active {
		background: #FF6347;
		font-weight: bold;
	}

	&.ellipsis {
		background: transparent;
		pointer-events: none;
	}
}

.page-jump {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
}

.jump-label {
	font-size: 24rpx;
	color: #999999;
}

.jump-input {
	width: 120rpx;
	height: 60rpx;
	background: #333333;
	border-radius: 8rpx;
	text-align: center;
	color: #ffffff;
	font-size: 24rpx;
	padding: 0 10rpx;
}

.jump-btn {
	padding: 10rpx 30rpx;
	height: 60rpx;
	line-height: 40rpx;
	background: #FF6347;
	border-radius: 8rpx;
	font-size: 24rpx;
	color: #ffffff;
}

:deep(.fu-nav-bar-text) {
	font-weight: bold;
}
</style>
