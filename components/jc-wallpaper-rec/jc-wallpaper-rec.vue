<template>
	<view>
		<view class="fu-m-t-30" v-for="(item, index) in list" :key="item.id || index">
			<jc-section :title="item.title" :desc="item.desc" @click="$openPage({name: item.url, query: item})"></jc-section>

			<jc-wallpaper-scr
				:list="item.images || []"
				:mode="item.mode"
				margin="30rpx"
				:standardRatioW="item.type == 'pc_wallpaper'? '2.1': '1.1'"
				:standardRatioH="item.type == 'pc_wallpaper'? '2.8': '2.2'"
				@click="onClick(item, $event)"
			>
			</jc-wallpaper-scr>
		</view>
	</view>
</template>

<script setup>
	import { getCurrentInstance, computed, onMounted } from 'vue';
	import { useCategoryStore } from '@/stores/category.js';

	// data数据
	const { $mAssetsPath, $openPage } = getCurrentInstance().appContext.config.globalProperties;
	const categoryStore = useCategoryStore();

	const PAGE_MAP = {
		avatar: 'avatarDetails',
		wallpaper: 'mobileDetails',
		pc_wallpaper: 'desktopDetails',
		emoji: 'emojiDetails',
		sticker: 'stickerDetails'
	};

	// 类型配置（标题、描述、展示模式）
	const TYPE_CONFIG = {
		avatar: { title: '头像百变', desc: '用头像告诉crush：我超难追的', mode: 'square', url: 'avatarList' },
		wallpaper: { title: '手机壁纸', desc: '精选高清壁纸 点亮你的屏幕', mode: 'vertical', url: 'mobileList' },
		pc_wallpaper: { title: '电脑壁纸', desc: '打造极致全新电脑iPad桌面', mode: 'standard', url: 'desktopList' },
		emoji: { title: '表情包', desc: '斗图必备 让聊天更有趣', mode: 'square', url: 'emojiList' },
		sticker: { title: '精美贴纸', desc: '装饰你的照片和视频', mode: 'square', url: 'stickerList' }
	};

	// 推荐列表数据 - 从 store 计算生成
	const list = computed(() => {
		if (!categoryStore.recommendData) return [];

		const result = [];
		// 按照预定义的顺序处理每个类型
		['avatar', 'wallpaper', 'pc_wallpaper', 'emoji', 'sticker'].forEach(imageType => {
			const images = categoryStore.recommendData[imageType]; // 直接是图片数组
			const config = TYPE_CONFIG[imageType];

			// 如果该类型有图片，添加到结果中
			if (images && images.length > 0) {
				result.push({
					id: imageType, // 使用类型名作为 ID
					title: config.title,
					desc: config.desc,
					type: imageType,
					mode: config.mode,
					url: config.url,
					images: images // 图片数组
				});
			}
		});

		return result;
	});

	// 生命周期
	onMounted(async () => {
		await categoryStore.fetchRecommendData();
	});

	// methods方法
	// e: 当前推荐块的配置（包含 type, images 等）
	// j: 被点击的具体图片对象
	const onClick = (e, j) => {
		if(!PAGE_MAP[e.type]) return console.error('Navigation failed: ', e.type)
		$openPage({
		    name: PAGE_MAP[e.type],
		    query: { imageId: j.id } // 使用图片 ID 而不是 categoryId
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