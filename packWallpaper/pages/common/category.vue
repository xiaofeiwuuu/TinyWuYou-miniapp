<template>
	<page-layout>
		<fu-nav-bar bgColor="#111111" leftIcon="left" :title="title" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></fu-nav-bar>

		<view class="fu-p-b-80 fu-m-30">
			<view class="fu-m-t-20">
				<jc-grid :list="categoryList" :column="2" multiple="0.5" @click="handleCategoryClick">
					<template v-slot:default="scope">
						<view class="fu-absolute fu-l-20 fu-b-20 category-name">
							{{ scope.data.name || '' }}
						</view>
					</template>
				</jc-grid>
			</view>
		</view>
	</page-layout>
</template>

<script setup>
import { getCurrentInstance, ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { useCategoryStore } from '@/stores/category.js';

// data数据
const { $mUtil, $mAssetsPath, $parseURL, $openPage } = getCurrentInstance().appContext.config.globalProperties;
const categoryStore = useCategoryStore();

let title = ref('');
let imageType = ref(''); // 图片类型: avatar/wallpaper/pc_wallpaper/emoji/sticker

// 分类列表 - 从 store 获取并添加默认图片
const categoryList = computed(() => {
	if (!categoryStore.categories || !imageType.value) return [];

	const categories = categoryStore.categories[imageType.value] || [];

	// 为每个分类添加默认图片 (轮换使用三张图片)
	return categories.map((item, index) => ({
		id: item.id,
		name: item.name,
		image: index % 3 === 0 ? $mAssetsPath.mobile :
		       index % 3 === 1 ? $mAssetsPath.mobile1 :
		       $mAssetsPath.mobile2
	}));
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

	title.value = query.title || '分类';
	imageType.value = query.type || '';

	console.log('[CommonCategory] 页面参数:', { title: title.value, type: imageType.value });

	// 加载分类数据
	if (!categoryStore.isLoaded) {
		await categoryStore.fetchCategories();
	}
});

// methods方法
// 点击分类卡片
const handleCategoryClick = (category) => {
	console.log('[CommonCategory] 点击分类:', category);

	// 跳转到图片列表页
	$openPage({
		name: 'commonList',
		query: {
			title: category.name,
			categoryId: category.id,
			imageType: imageType.value
		}
	});
};
</script>

<style lang="scss" scoped>
.category-name {
	color: #ffffff;
	font-size: 28rpx;
	font-weight: 500;
	text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
	z-index: 2;
}

:deep(.fu-nav-bar-text) {
	font-weight: bold;
}
</style>
