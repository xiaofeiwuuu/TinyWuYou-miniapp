<template>
	<view class="fu-p-b-80 fu-m-30">
		<!-- 文案分类 -->
		<jc-section title="文案分类" margin="30rpx 0" :showRight="false" size="36" />
		<view class="fu-m-t-20">
			<jc-grid :list="textList" :column="2" multiple="0.5" @click="handleTextClick">
				<template v-slot:default="scope">
					<view class="fu-absolute fu-l-20 fu-b-20 category-name">
						{{ scope.data.name || '' }}
					</view>
				</template>
			</jc-grid>
		</view>
	</view>
</template>

<script setup>
	import { getCurrentInstance, computed, onMounted } from 'vue';
	import { useCategoryStore } from '@/stores/category.js';

	// data数据
	const { $mAssetsPath, $openPage } = getCurrentInstance().appContext.config.globalProperties;
	const categoryStore = useCategoryStore();

	// 从 store 中获取文案分类列表
	const textList = computed(() => {
		if (!categoryStore.categories?.text) return [];

		// 为每个文案分类添加默认图片
		return categoryStore.categories.text.map((item, index) => ({
			id: item.id,
			name: item.name,
			// 使用轮换的默认图片
			image: index % 3 === 0 ? $mAssetsPath.mobile :
			       index % 3 === 1 ? $mAssetsPath.mobile1 :
			       $mAssetsPath.mobile2
		}));
	});

	// 点击文案分类
	const handleTextClick = (item) => {
		console.log('[Classify] 点击文案分类:', item);

		if (!item.id) {
			console.error('[Classify] 文案分类缺少ID');
			return;
		}

		// 跳转到文案列表页
		$openPage({
			name: 'textList',
			query: {
				categoryId: item.id,
				title: item.name || '文案'
			}
		});
	};

	// 生命周期
	onMounted(async () => {
		console.log('[Classify] 组件加载，检查分类数据');

		// 如果 store 中还没有数据，则加载
		if (!categoryStore.isLoaded) {
			console.log('[Classify] 分类数据未加载，开始加载...');
			try {
				await categoryStore.fetchCategories();
				console.log('[Classify] ✅ 分类数据加载成功');
			} catch (error) {
				console.error('[Classify] ❌ 分类数据加载失败:', error);
				uni.showToast({
					title: '分类加载失败',
					icon: 'none'
				});
			}
		} else {
			console.log('[Classify] 使用已缓存的分类数据');
			console.log('[Classify] - 文案分类数量:', textList.value.length);
		}
	});
</script>

<style lang="scss" scoped>
	.text-category-list {
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: 20rpx;
		overflow: hidden;
	}

	.text-category-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 30rpx 40rpx;
		border-bottom: 1rpx solid rgba(255, 255, 255, 0.05);

		&:last-child {
			border-bottom: none;
		}

		&:active {
			background-color: rgba(255, 255, 255, 0.05);
		}
	}

	.text-category-name {
		color: #ffffff;
		font-size: 30rpx;
		font-weight: 400;
	}

	.category-name {
		color: #ffffff;
		font-size: 28rpx;
		font-weight: 500;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
	}
</style>