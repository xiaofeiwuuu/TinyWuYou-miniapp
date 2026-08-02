<template>
	<view>
		<view class="fu-m-t-30" v-for="(item, index) in list" :key="item.id || index">
			<jc-section :title="item.title" @click="$openPage({name: item.url, query: item})"></jc-section>

			<jc-wallpaper-scr
				:list="item.images || []"
				:mode="item.mode"
				margin="30rpx"
				:standardRatioW="item.ratioW"
				:standardRatioH="item.ratioH"
				@click="onClick(item, $event)"
			>
			</jc-wallpaper-scr>
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

	// 首页各区块的标题。展示模式不再写死，改由后端配置的朝向决定
	const TYPE_CONFIG = {
		avatar: { title: '头像百变' },
		wallpaper: { title: '手机壁纸' },
		pc_wallpaper: { title: '电脑壁纸' },
		emoji: { title: '表情包' },
		sticker: { title: '精美贴纸' }
	};

	/**
	 * 朝向 → 横向滚动条的展示模式与比例。
	 * 五个列表页已经合并成一个 imageList，这里同样按朝向取布局，
	 * 后台新增类型时不需要改这份表。
	 */
	const SCROLL_BY_ORIENTATION = {
		square: { mode: 'square', ratioW: '1.1', ratioH: '2.2' },
		portrait: { mode: 'vertical', ratioW: '1.1', ratioH: '2.2' },
		landscape: { mode: 'standard', ratioW: '2.1', ratioH: '2.8' }
	};

	// 推荐列表数据 - 从 store 计算生成
	const list = computed(() => {
		if (!categoryStore.recommendData) return [];

		const result = [];
		/**
		 * 类型与顺序都以后端配置为准（已按 sortOrder 排好），不再写死数组。
		 * 后台新增类型时首页会自动多一块，不需要发版。
		 * TYPE_CONFIG 只保留运营文案，取不到就退回后台配的类型名。
		 */
		imageTypeStore.types.forEach(type => {
			const imageType = type.code;
			const images = categoryStore.recommendData[imageType]; // 直接是图片数组
			const config = TYPE_CONFIG[imageType] || { title: type.name };

			// 如果该类型有图片，添加到结果中
			if (images && images.length > 0) {
				const orientation = imageTypeStore.getOrientation(imageType);
				const scroll = SCROLL_BY_ORIENTATION[orientation] || SCROLL_BY_ORIENTATION.square;
				result.push({
					id: imageType, // 使用类型名作为 ID
					title: config.title,
					type: imageType,
					mode: scroll.mode,
					ratioW: scroll.ratioW,
					ratioH: scroll.ratioH,
					// 五个专属列表页已合并为一个，类型通过参数传过去
					url: 'imageList',
					images: images // 图片数组
				});
			}
		});

		return result;
	});

	// 生命周期
	onMounted(async () => {
		// 类型配置要先到位，否则首屏会先用兜底布局渲染一次再跳变
		await imageTypeStore.fetchTypes();
		await categoryStore.fetchRecommendData();
	});

	// methods方法
	// e: 当前推荐块的配置（包含 type, images 等）
	// j: 被点击的具体图片对象
	const onClick = (e, j) => {
		if (!j || !j.id) return console.error('[WallpaperRec] 图片缺少 ID:', j)
		/**
		 * 五个专属详情页已合并为一个，布局由图片朝向决定。
		 * 原来这里有一张类型 → 详情页的映射表，后台新增类型时表里没有对应项，
		 * 首页那一块点进去只会打印 Navigation failed，等于是死的。
		 */
		$openPage({
		    name: 'imageDetail',
		    query: { imageId: j.id, type: e.type }
		});
	};
</script>

<style lang="scss" scoped>
	.album-box {
		
		&__content {
			position: absolute;
			width: 100%;
			height: 100%;
			top: 0;
			left: 0;
		}
		
		&__tag {
			background-color: $bg-color-mask;
			width: fit-content;
			padding: 10rpx 25rpx;
			border-radius: 30rpx;
			font-size: 24rpx;
			margin: 30rpx;
		}
		
		&__badge {
			position: absolute;
			top: 20rpx;
			right: 0;
			background-color: $bg-color-mask;
			padding: 2rpx 20rpx;
			font-size: 24rpx;
			border-radius: 30rpx 0 0 30rpx;
		}
	}
</style>