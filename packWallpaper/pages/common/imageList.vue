<template>
	<page-layout>
		<app-nav-bar bgColor="#111111" leftIcon="arrow-left" :title="title" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<!-- 0 高度探测点：紧跟导航栏占位之后，onReady 实测它到视口顶的距离 = 导航栏真实底部 -->
		<view id="nav-probe" style="height: 0;"></view>

		<!-- 用 offsetTop 传实测导航高：u-sticky 只 watch offsetTop，onReady 更新后能触发重算；
		     customNavHeight 置 0，避免叠加（stickyTop = offsetTop + customNavHeight） -->
		<!-- 只有一个分类时不显示顶部分类 tab（连同吸顶背景条一起隐藏） -->
		<up-sticky v-if="tabsList.length > 1" bgColor="#111111" :offsetTop="customNavHeight" :customNavHeight="0">
			<up-tabs :list="tabsList" :current="currentTabIndex" activeStyle="#FFFFFF" inactiveStyle="#a7a7a7" lineColor="#FFFFFF" size="30" @click="handleTabs" />
		</up-sticky>

		<view id="il-content" class="fu-m-x-30 fu-m-t-20" style="color: #FFFFFF;">
			<!-- 分类没有图片：显示"暂无数据"，而不是 jc-loading-more 的"已经到底了" -->
			<view v-if="list.length === 0 && queryParams.loadingType !== 1" class="empty-tip">
				暂无数据
			</view>
			<template v-else>
				<!--
					virtual：列表会随下拉不断累加，几万张图的分类里节点会线性增长到卡顿。
					等高网格可以精确算出可视行，只渲染窗口内的格子，节点数恒定。
				-->
				<view id="il-grid">
					<jc-grid
						:list="list"
						:column="grid.column"
						:multiple="grid.multiple"
						virtual
						:scroll-top="scrollTop"
						@click="handleImageClick"
					/>
				</view>
				<jc-loading-more :loadingType="queryParams.loadingType" />
			</template>
		</view>
		<view v-if="showBackTop" class="back-top" @click="backToTop">
			<up-icon name="arrow-upward" color="#ffffff" :size="20"></up-icon>
			<!-- 当前页 / 总页数（总页数拿不到时只显示当前页） -->
			<text v-if="totalPages > 0" class="back-top__page">{{ currentPage }}/{{ totalPages }}</text>
			<text v-else class="back-top__page">{{ currentPage }}</text>
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

	// 请求序号：切分类时自增，让切换前还没返回的旧分类请求能识别出自己已经过期。
	// 没有这个的话，旧分类的响应回来时会读到已经被新分类重置成 1 的 pageNum，
	// 被误判成"第1页"直接覆盖掉刚显示出来的新分类图片——概率性地把图冲掉，
	// 具体会不会触发只取决于新旧两个请求谁先返回。
	let requestSeq = ref(0);

	// 分页显示：总条数（后端返回）与实测单行高度，用来在「回到顶部」按钮上显示 当前页/总页数
	let totalCount = ref(0);
	let rowHeightPx = ref(0);

	const totalPages = computed(() => {
		const size = queryParams.value.pageSize || 1;
		return totalCount.value > 0 ? Math.ceil(totalCount.value / size) : 0;
	});

	// 当前页：按滚动高度换算——顶部可视行 = scrollTop / 行高，再换算成第几张、第几页。
	// 行高等高，实测一次即可；拿不到行高时退回「已加载到第几页」。
	const currentPage = computed(() => {
		const size = queryParams.value.pageSize || 1;
		const col = grid.value.column || 1;
		if (rowHeightPx.value > 0) {
			const topRow = Math.floor(scrollTop.value / rowHeightPx.value);
			const topIndex = topRow * col; // 顶部可视图片在 list 中的序号
			let p = Math.floor(topIndex / size) + 1;
			if (totalPages.value > 0) p = Math.min(p, totalPages.value);
			return Math.max(1, p);
		}
		return queryParams.value.pageNum;
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

	// 触底前 400px（见 pages.json 里这个页面的 onReachBottomDistance）就预加载下一页，
	// 而不是等真正滚到底部才发请求，减少"刷到底卡一下"的等待感。
	// loadingType !== 1 是防抖：放大了触发距离后，一次快速滑动可能在这段区间内多次
	// 触发 onReachBottom，没有这个判断会把 pageNum 重复递增、漏页或并发多个请求。
	onReachBottom(() => {
		if (queryParams.value.loadMore && queryParams.value.loadingType !== 1) {
			queryParams.value.pageNum++;
			initList();
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
		requestSeq.value++;
		queryParams.value.pageNum = 1;
		queryParams.value.loadMore = true;
		list.value = [];
		initList();
	};

	/**
	 * 内容不足一屏时自动补页。
	 * 页面级 onReachBottom 只有在页面能滚动时才会触发；首屏图太少（如 4 列 × 5 行 = 20 张）
	 * 撑不满一屏就永远滚不到底、加载不了后续。这里测量内容底部是否还在可视区内，是则再拉一页。
	 */
	// 实测单行高度：#il-grid 是等高虚拟网格，整体高度 / 行数 = 行高。
	// 内容越多测得越准；用于把 scrollTop 换算成「当前第几页」。
	const measureRowHeight = () => {
		setTimeout(() => {
			const col = grid.value.column || 1;
			const rows = Math.ceil(list.value.length / col);
			if (rows <= 0) return;
			uni.createSelectorQuery()
				.select('#il-grid')
				.boundingClientRect((rect) => {
					if (rect && rect.height > 0) rowHeightPx.value = rect.height / rows;
				})
				.exec();
		}, 300);
	};

	const autoFillScreen = () => {
		if (!queryParams.value.loadMore) return;
		setTimeout(() => {
			uni.createSelectorQuery()
				.select('#il-content')
				.boundingClientRect((rect) => {
					if (!rect) return;
					const wh = uni.getSystemInfoSync().windowHeight || 0;
					// 内容底部仍在一屏之内（留 20px 容差）→ 页面不可滚动，继续补下一页
					if (
						rect.bottom <= wh + 20 &&
						queryParams.value.loadMore &&
						queryParams.value.loadingType !== 1
					) {
						queryParams.value.pageNum++;
						initList();
					}
				})
				.exec();
		}, 300);
	};

	const initList = async () => {
		if (!currentCategoryId.value) {
			console.log('[ImageList] 分类ID为空，跳过加载');
			return;
		}

		// 请求发出前把这一刻的序号/分类/页码都固定下来：
		// await 期间用户可能已经切了分类（init() 会让 requestSeq 自增），
		// 响应回来后绝不能再去读 queryParams.value.pageNum / currentCategoryId.value 这些实时值——
		// 它们此时可能已经被新分类的 init() 改掉了。
		const seq = requestSeq.value;
		const categoryId = currentCategoryId.value;
		const pageNum = queryParams.value.pageNum;

		queryParams.value.loadingType = 1;

		try {
			const res = await getImageList({
				categoryId,
				page: pageNum,
				pageSize: queryParams.value.pageSize
			});

			// 分类已经切换，这条响应过期了，不能再写 list/loadingType，
			// 否则会把旧分类的图片覆盖到刚显示出来的新分类上（概率性，取决于新旧请求谁先回来）。
			if (seq !== requestSeq.value) return;

			if (res.code === 0) {
				// 总条数（用于算总页数）；后端未返回时保持原值
				if (typeof res.data.total === 'number') totalCount.value = res.data.total;
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
				list.value = pageNum === 1
					? formattedData
					: list.value.concat(formattedData);

				// 实测单行高度（等高，测一次即可，用于按滚动位置算当前页）
				measureRowHeight();

				// 判断是否还有更多数据
				if (formattedData.length < queryParams.value.pageSize) {
					queryParams.value.loadingType = 2; // 没有更多了
					queryParams.value.loadMore = false;
				} else {
					queryParams.value.loadingType = 0; // 加载完成
					// 首屏内容不足一屏时页面不可滚动，onReachBottom 永远不触发（多列/大图时尤甚）。
					// 这里主动测量：内容没填满一屏就自动补下一页，直到填满或没有更多。
					autoFillScreen();
				}
			} else {
				console.error('[ImageList] 加载失败:', res.message);
				queryParams.value.loadingType = 3;
			}
		} catch (error) {
			if (seq !== requestSeq.value) return;
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
		// 竖向胶囊：窄宽 + 上下全圆角，箭头在上、页码在下。
		// 用 min-width 而不是 width：页码是"当前/总页数"，图片多的分类总页数会到3位数
		// （比如情侣头像 5671 张、每页20条，总页数284），固定宽度会把文字挤出胶囊。
		min-width: 64rpx;
		padding: 18rpx 10rpx;
		box-sizing: border-box;
		border-radius: 32rpx;
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 100;

		&__page {
			margin-top: 8rpx;
			padding-top: 8rpx;
			// 与箭头之间一条细分隔线，胶囊层次更清晰
			border-top: 1rpx solid rgba(255, 255, 255, 0.25);
			min-width: 40rpx;
			white-space: nowrap;
			text-align: center;
			font-size: 18rpx;
			line-height: 1;
			color: rgba(255, 255, 255, 0.85);
		}
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
