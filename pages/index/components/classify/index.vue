<template>
	<view class="fu-p-b-80 fu-m-30">
		<!-- 文案分类：没数据就不显示，别只剩一个标题干挂着 -->
		<view v-if="textList.length">
			<!--
				标题用 jc-section 默认字号（22→44rpx≈22px），和全站统一。
				emphasize：加粗 + 斜体，和首页各区块标题一致。
			-->
			<jc-section title="文案" :emphasize="true" margin="30rpx 0" :showRight="false" />
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

		<!-- 后台「图片类型」里勾选了「分类页展示」的类型（如专辑），各展示其下所有分类 -->
		<view v-for="section in imageCategorySections" :key="section.type" class="fu-m-t-30">
			<jc-section :title="section.title" :emphasize="true" margin="30rpx 0" :showRight="false" />
			<view class="fu-m-t-20">
				<jc-grid :list="section.categories" :column="2" multiple="0.5" @click="handleImageCategoryClick">
					<template v-slot:default="scope">
						<view class="fu-absolute fu-l-20 fu-b-20 category-name">
							{{ scope.data.name || '' }}
						</view>
					</template>
				</jc-grid>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { getCurrentInstance, computed, onMounted } from 'vue';
	import { useCategoryStore } from '@/stores/category.js';
	import { useImageTypeStore } from '@/stores/imageType.js';

	// data数据
	const { $mAssetsPath, $openPage } = getCurrentInstance().appContext.config.globalProperties;
	const categoryStore = useCategoryStore();
	const imageTypeStore = useImageTypeStore();

	// 文案分类（上）
	const textList = computed(() => {
		if (!categoryStore.categories?.text) return [];
		return categoryStore.categories.text.map((item, index) => ({
			id: item.id,
			name: item.name,
			// 优先用后台配置的图标(iconUrl)，没配才退回默认轮换图
			image: item.iconUrl || (index % 3 === 0 ? $mAssetsPath.mobile : index % 3 === 1 ? $mAssetsPath.mobile1 : $mAssetsPath.mobile2)
		}));
	});

	// 图片类型分类（下）：后台勾选了「分类页展示」(showInCategory=1) 的图片类型，
	// 各取其下所有分类做成卡片，和文案分类同样的卡片样式。
	const imageCategorySections = computed(() => {
		if (!categoryStore.categories) return [];
		return imageTypeStore.types
			.filter((t) => Number(t.showInCategory) === 1)
			.map((t) => {
				const cats = (categoryStore.categories[t.code] || []).map((c, index) => ({
					id: c.id,
					name: c.name,
					image: c.iconUrl || (index % 3 === 0 ? $mAssetsPath.mobile : index % 3 === 1 ? $mAssetsPath.mobile1 : $mAssetsPath.mobile2),
					// 点击跳 imageList 需要知道属于哪个图片类型
					type: t.code
				}));
				return { type: t.code, title: t.name, categories: cats };
			})
			// 该类型下没有分类就不展示这一块
			.filter((s) => s.categories.length > 0);
	});

	// 点击文案分类 → 文案列表
	const handleTextClick = (item) => {
		if (!item.id) return;
		$openPage({
			name: 'textList',
			query: { categoryId: item.id, title: item.name || '文案' }
		});
	};

	// 点击图片类型下的分类 → 图片列表（按该分类筛图）
	const handleImageCategoryClick = (item) => {
		if (!item.id) return;
		$openPage({
			name: 'imageList',
			query: { type: item.type, categoryId: item.id, title: item.name }
		});
	};

	// 生命周期
	onMounted(async () => {
		// 分类页要用「图片类型」判断哪些 showInCategory，也要分类数据。
		// 两者都有 SWR 本地缓存，有缓存时几乎瞬间返回、再后台刷新。
		try {
			await imageTypeStore.fetchTypes();
			await categoryStore.fetchCategories();
		} catch (error) {
			console.error('[Classify] 分类数据加载失败:', error);
		}
	});
</script>

<style lang="scss" scoped>
	.category-name {
		color: #ffffff;
		font-size: 28rpx;
		font-weight: 500;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
	}
</style>
