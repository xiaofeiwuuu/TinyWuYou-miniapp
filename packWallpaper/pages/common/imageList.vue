<template>
	<page-layout>
		<app-nav-bar bgColor="#111111" leftIcon="arrow-left" :title="title" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<!-- 0 高度探测点：紧跟导航栏占位之后，onReady 实测它到视口顶的距离 = 导航栏真实底部 -->
		<view id="nav-probe" style="height: 0;"></view>

		<!-- 用 offsetTop 传实测导航高：u-sticky 只 watch offsetTop，onReady 更新后能触发重算；
		     customNavHeight 置 0，避免叠加（stickyTop = offsetTop + customNavHeight） -->
		<up-sticky bgColor="#111111" :offsetTop="customNavHeight" :customNavHeight="0">
			<up-tabs :list="tabsList" :current="currentTabIndex" activeStyle="#FFFFFF" inactiveStyle="#a7a7a7" lineColor="#FFFFFF" size="30" @click="handleTabs" />
		</up-sticky>

		<view class="fu-m-x-30 fu-m-t-20" style="color: #FFFFFF;">
			<!-- 分类没有图片：显示"暂无数据"，而不是 jc-loading-more 的"已经到底了" -->
			<view v-if="list.length === 0 && queryParams.loadingType !== 1" class="empty-tip">
				暂无数据
			</view>
			<template v-else>
				<!--
					virtual：列表会随下拉不断累加，几万张图的分类里节点会线性增长到卡顿。
					等高网格可以精确算出可视行，只渲染窗口内的格子，节点数恒定。
				-->
				<jc-grid
					:list="list"
					:column="grid.column"
					:multiple="grid.multiple"
					virtual
					:scroll-top="scrollTop"
					@click="handleImageClick"
				/>
				<jc-loading-more :loadingType="queryParams.loadingType" />
			</template>
		</view>
		<view v-if="showBackTop" class="back-top" @click="backToTop">
			<up-icon name="arrow-upward" color="#ffffff" :size="20"></up-icon>
		</view>
	</page-layout>
</template>

<script setup>
	/**
	 * 通用图片列表页。
	 *
	 * 原来 avatar / mobile / desktop / emoji / sticker 五个页面各有一份 index.vue，
	 * 彼此只差标题、类型名、日志前缀和网格参数（emoji 与 sticker 仅相差 24 行），
	 * 现在合并成这一个页面：
	 *   - 类型和标题从路由参数来
	 *   - 网格布局由后端配置的朝向决定（竖图/横图/方图），后台加类型不用发版
	 */
	import { getCurrentInstance, ref, computed } from 'vue';
	import { onLoad, onReachBottom, onPageScroll, onReady } from '@dcloudio/uni-app';
	import { useCategoryStore } from '@/stores/category.js';
	import { useImageTypeStore } from '@/stores/imageType.js';
	import { getImageList } from '@/packWallpaper/api/image.js';

	// data数据
	const { $u, $mUtil, $mConstDataConfig, $openPage, $parseURL } = getCurrentInstance().appContext.config.globalProperties;
	const categoryStore = useCategoryStore();
	const imageTypeStore = useImageTypeStore();

	let title = ref('');
	let imageType = ref(''); // 当前图片类型
	let currentCategoryId = ref(null); // 当前选中的分类ID

	// 网格布局（列数与高宽比）由该类型的朝向决定
	const grid = computed(() => {
		// 列数优先用当前分类在后台配的 gridColumns；没配则回退到该图片类型朝向的默认列数
		const base = imageTypeStore.getGridConfig(imageType.value);
		const cats = (categoryStore.categories && categoryStore.categories[imageType.value]) || [];
		const cur = cats.find((c) => Number(c.id) === Number(currentCategoryId.value));
		const column = cur && cur.gridColumns ? cur.gridColumns : base.column;
		return { column, multiple: base.multiple };
	});

	// 分类标签列表 - 从 store 动态获取
	const tabsList = computed(() => {
		if (!categoryStore.categories || !imageType.value) return [];
		const categories = categoryStore.categories[imageType.value] || [];
		return categories.map(cat => ({ id: cat.id, name: cat.name }));
	});

	// up-tabs 的高亮由 current(下标)控制，要把选中的分类 id 映射成它在 tabsList 里的下标。
	// 否则轮播图跳转虽然指定了分类、列表数据也对，但顶部 tab 高亮仍停在第 0 个。
	const currentTabIndex = computed(() => {
		const i = tabsList.value.findIndex(
			(t) => Number(t.id) === Number(currentCategoryId.value),
		);
		return i < 0 ? 0 : i;
	});

	// 页面滚动距离，传给 jc-grid 做虚拟滚动
	let scrollTop = ref(0);
	// 是否显示「回到顶部」按钮
	let showBackTop = ref(false);

	let list = ref([]);
	let queryParams = ref({
		pageNum: 1,
		pageSize: $mConstDataConfig.pageSize,
		loadingType: 0,
		loadMore: true
	});

	// 生命周期
	onLoad(async (options) => {
		let query;
		// #ifdef MP
		query = $parseURL(options.query);
		// #endif
		// #ifndef MP
		query = JSON.parse(options.query)
		// #endif

		imageType.value = query.type;
		// 标题优先用路由传来的，没传就用后台配的类型名
		title.value = query.title || '';
		// 轮播图跳转会指定要落在哪个分类；推荐区跳转不带，走默认第一个
		const targetCategoryId = query.categoryId;

		// 类型配置要先到位，否则首屏会用兜底布局渲染一次再跳变
		await imageTypeStore.fetchTypes();
		if (!title.value) title.value = imageTypeStore.getTypeName(imageType.value);

		console.log('[ImageList] 页面参数:', {
			title: title.value,
			type: imageType.value,
			orientation: imageTypeStore.getOrientation(imageType.value)
		});

		await categoryStore.fetchCategories();

		// 优先选中轮播图指定的分类（用 Number 归一，路由里可能是数字或字符串）；
		// 没指定、或该分类不在当前类型下时，退回默认第一个
		const matched =
			targetCategoryId != null &&
			tabsList.value.find((t) => Number(t.id) === Number(targetCategoryId));
		if (matched) {
			currentCategoryId.value = matched.id;
		} else if (tabsList.value.length > 0) {
			currentCategoryId.value = tabsList.value[0].id;
		}

		init();
	});

	onPageScroll((e) => {
		scrollTop.value = e.scrollTop;
		// 往下滑超过约一屏就显示回到顶部
		showBackTop.value = e.scrollTop > 600;
	});

	onReachBottom(() => {
		if (queryParams.value.loadMore) {
			queryParams.value.pageNum++
			setTimeout(() => {
				initList()
			}, 500)
		}
	});

	// 吸顶偏移：导航栏真实高度。硬算"状态栏+44"跨机型有 1~2px 出入会露缝，
	// 所以初值只作兜底，onReady 里用 #nav-probe 实测后覆盖（见下方 onReady）。
	let customNavHeight = ref($u.sys().statusBarHeight + 44); // 兜底初值

	onReady(() => {
		// 实测导航栏占位底部：不管导航栏实际多高，tab 都精确吸附在它正下方，不留缝
		uni.createSelectorQuery()
			.select('#nav-probe')
			.boundingClientRect((rect) => {
				if (rect && rect.top > 0) customNavHeight.value = rect.top;
			})
			.exec();
	});

	// methods方法
	// tabs切换
	const handleTabs = (e) => {
		currentCategoryId.value = e.id;
		init();
	};

	// 初始化
	const init = () => {
		queryParams.value.pageNum = 1;
		queryParams.value.loadMore = true;
		list.value = [];
		initList();
	};

	const initList = async () => {
		if (!currentCategoryId.value) {
			console.log('[ImageList] 分类ID为空，跳过加载');
			return;
		}

		queryParams.value.loadingType = 1;

		try {
			const res = await getImageList({
				categoryId: currentCategoryId.value,
				page: queryParams.value.pageNum,
				pageSize: queryParams.value.pageSize
			});

			if (res.code === 0) {
				const newData = res.data.list || [];

				const formattedData = newData.map(img => ({
					id: img.id,
					image: img.thumbnailUrl || img.imageUrl,
					imageUrl: img.imageUrl,
					title: img.title,
					width: img.width,
					height: img.height,
					isVip: img.isVip
				}));

				// 第一页覆盖，后续页追加
				list.value = queryParams.value.pageNum === 1
					? formattedData
					: list.value.concat(formattedData);

				// 判断是否还有更多数据
				if (formattedData.length < queryParams.value.pageSize) {
					queryParams.value.loadingType = 2; // 没有更多了
					queryParams.value.loadMore = false;
				} else {
					queryParams.value.loadingType = 0; // 加载完成
				}
			} else {
				console.error('[ImageList] 加载失败:', res.message);
				queryParams.value.loadingType = 3;
			}
		} catch (error) {
			console.error('[ImageList] 加载异常:', error);
			queryParams.value.loadingType = 3;
		}
	};

	// 回到顶部
	const backToTop = () => {
		uni.pageScrollTo({ scrollTop: 0, duration: 300 });
	};

	// 点击图片跳转到详情页
	const handleImageClick = (item) => {
		if (!item || !item.id) {
			console.error('[ImageList] 图片数据缺少ID:', item);
			return;
		}
		// 详情页只有一个，布局由图片朝向决定；type 传过去只是让它首屏不闪
		$openPage({ name: 'imageDetail', query: { imageId: item.id, type: imageType.value } });
	};
</script>

<style lang="scss" scoped>
.back-top {
		position: fixed;
		right: 30rpx;
		bottom: 120rpx;
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	:deep(.app-nav-bar-text) {
		font-weight: bold;
	}

	// 空状态：该分类没有图片时的提示
	.empty-tip {
		padding: 120rpx 0;
		text-align: center;
		color: #666666;
		font-size: 28rpx;
	}
</style>
