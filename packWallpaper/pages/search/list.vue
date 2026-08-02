<template>
	<view class="">
		<app-nav-bar bgColor="#111111" leftWidth="0" :rightWidth="navInfo.right" :paddingTitle="5" :border="false" fixed>
			<view class="fu-flex-1 fu-flex fu-flex-column-center fu-gap-20 fu-m-l--10">
				<up-icon name="arrow-left" color="#ffffff" size="24" @click="$mUtil.overBack()"></up-icon>
				<up-search v-model="queryParams.keyword" height="36px" shape="round" inputAlign="left" bgColor="#222222" color="#ffffff" :showAction="false" @clear="handleSearchClear" @search="handleSearch"></up-search>
			</view>
		</app-nav-bar>
			
		<up-sticky :customNavHeight="customNavHeight" bgColor="#111111">
			<up-tabs :list="tabsList" activeStyle="#FFFFFF" inactiveStyle="#a7a7a7" lineColor="#FFFFFF" size="30" @click="onClick('tabs', $event)" />
		</up-sticky>
		
		<view class="fu-m-x-30 fu-m-t-20" style="color: #FFFFFF;">
			<jc-grid :list="list" @click="onClick('imageDetail', $event)" />
			<jc-loading-more :loadingType="queryParams.loadingType" />
		</view>
	</view>
</template>

<script setup>
	import { getCurrentInstance, ref, computed } from 'vue';
	import { onLoad, onReachBottom } from '@dcloudio/uni-app';
	
	// data数据
	const { $u, $mUtil, $parseURL, $mAssetsPath, $mConstDataConfig, $openPage } = getCurrentInstance().appContext.config.globalProperties;
	let navInfo = ref({});
	const tabsList = ref([
		{ id: 0, name: '推荐' },
		{ id: 1, name: '动漫卡通' },
		{ id: 2, name: '唯美风景' },
		{ id: 3, name: '美女达人' },
		{ id: 4, name: '动物萌宠' },
		{ id: 5, name: '创意设计' },
		{ id: 6, name: '节日节气' },
		{ id: 7, name: '打工人' },
		{ id: 8, name: '其他' }
	]);
	let list = ref([]);
	let queryParams = ref({
		pageNum: 1,
		pageSize: $mConstDataConfig.pageSize,
		loadingType: 0,
		loadMore: true
	});
	
	// 生命周期
	onLoad(async (options) => {
		navInfo.value = await $mUtil.getSystemInfo();
		let query;
		// #ifdef MP
		query = $parseURL(options.query);
		// #endif
		// #ifndef MP
		query = JSON.parse(options.query);
		// #endif
		queryParams.value['keyword'] = query.value;
		init()
	});
	
	onReachBottom(() => {
		if(queryParams.value.loadMore) {
			queryParams.value.pageNum++
			setTimeout(() => {
				initList()
			}, 500)
		}
	});
	
	// computed计算属性
	// 必须给 px：u-sticky 内部用 getPx()，纯数字一律按 px 处理，
	// 传 rpx 数值会让吸顶偏移放大约一倍，tab 下面会露出滚动的内容
	const customNavHeight = computed(() => {
		return $u.sys().statusBarHeight + 44;
	});
	
	// methods方法
	/**
	 * 模板里一直在调 onClick，但这个函数从来没有定义过——
	 * 点图片和切 tab 都会直接抛 "onClick is not a function"。
	 *
	 * 注意：这个页面的列表还是模板自带的假数据（$mAssetsPath.mobile 等本地图），
	 * 没有 id，所以补上这个函数只是让它不再报错，搜索本身还没接后端。
	 */
	const onClick = (state, e) => {
		switch(state) {
			case 'tabs':
				init()
				break
			case 'imageDetail':
				if(!e || !e.id) return console.error('[SearchList] 图片缺少 ID:', e)
				// 详情页只有一个，布局由图片自己的 imageType 决定，这里不用判断类型
				$openPage({name: 'imageDetail', query: { imageId: e.id, type: e.imageType }})
				break
			default:
				break
		}
	};

	// 处理搜索
	const handleSearch = (value) => {
		init()
		if($u.trim(value)) return $mUtil.searchStorage({key: 'wallpaperHistoryStorage', data: {value}})
	};
	
	// 清空搜索
	const handleSearchClear = () => {
		init()
	};
	
	const init = () => {
		queryParams.value.pageNum = 1;
		list.value = [];
		initList()
	};
	
	const initList = () => {
		queryParams.value.loadingType = 1;
		const newData = [
			{ image: $mAssetsPath.mobile },
			{ image: $mAssetsPath.mobile1 },
			{ image: $mAssetsPath.mobile2 },
			{ image: $mAssetsPath.mobile1 },
			{ image: $mAssetsPath.mobile },
			{ image: $mAssetsPath.mobile2 },
			{ image: $mAssetsPath.mobile1 },
			{ image: $mAssetsPath.mobile },
			{ image: $mAssetsPath.mobile2 },
			{ image: $mAssetsPath.mobile1 },
			{ image: $mAssetsPath.mobile },
			{ image: $mAssetsPath.mobile2 },
		];
		
		if(!newData.length) {
			queryParams.value.loadingType = 2;
			queryParams.value.loadMore = false;
			return
		}
		
		list.value = queryParams.value.pageNum === 1? newData: list.value.concat(newData);
		
		if(newData.length < queryParams.value.pageSize) {
			queryParams.value.loadingType = 2;
			queryParams.value.loadMore = false;
			return
		}
		
		queryParams.value.loadingType = 0;
	};
</script>

<style lang="scss" scoped>
	
</style>