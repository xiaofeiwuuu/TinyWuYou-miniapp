<template>
	<view class="fu-p-b-80">
		<fu-nav-bar bgColor="transparent" :border="false" fixed />
		
		<view class="fu-m-x-30">
			<!-- 基础信息 -->
			<view class=" fu-flex fu-flex-column-center">
				<view class="fu-flex-1 fu-flex fu-flex-column-center">
					<fu-avatar size="100rpx" :src="userInfo.avatarUrl" />
					<view class="fu-m-l-20">
						<view class="fu-flex fu-flex-column-center">
							<fu-text :text="userInfo.nickname" color="#ffffff" size="32" bold />
							<!-- VIP标识 -->
							<view v-if="userInfo.isVip === 1" class="vip-badge fu-m-l-10">
								<fu-text text="VIP" color="#FFD700" size="20" bold />
							</view>
						</view>
						<view class="fu-flex fu-flex-column-center fu-m-t-10">
							<fu-text :text="`Uid：${userInfo.id}`" color="#999999" size="24" margin="0 10rpx 0 0" bold />
							<fu-icons type="copy" color="#55aaff" @click="$mUtil.setClipboard(userInfo.id)" />
						</view>
					</view>
				</view>
				<fu-icons type="gear-2" size="50rpx" color="#999999" />
			</view>

			<!-- 下载次数和VIP信息卡片 -->
			<view class="info-card fu-border fu-bg-main fu-b-r-10 fu-m-t-30 fu-p-20">
				<view class="fu-flex fu-flex-row-between fu-flex-column-center">
					<!-- 剩余下载次数 -->
					<view class="info-item fu-flex-1">
						<fu-text text="剩余下载" color="#999999" size="24" />
						<view class="fu-m-t-10 fu-flex fu-flex-column-center">
							<fu-text :text="`${userInfo.downloadCount}`" color="#ffffff" size="40" bold />
							<fu-text text=" 次" color="#999999" size="24" />
						</view>
					</view>

					<!-- 分隔线 -->
					<view class="divider"></view>

					<!-- VIP状态 -->
					<view class="info-item fu-flex-1">
						<fu-text text="会员状态" color="#999999" size="24" />
						<view class="fu-m-t-10 fu-flex fu-flex-direction-column fu-flex-column-center">
							<fu-text
								:text="userInfo.isVip === 1 ? 'VIP会员' : '普通用户'"
								:color="userInfo.isVip === 1 ? '#FFD700' : '#ffffff'"
								size="28"
								bold
							/>
							<view v-if="userInfo.isVip === 1 && userInfo.vipExpireTime" class="fu-m-t-5">
								<fu-text :text="`剩余${getRemainingDays(userInfo.vipExpireTime)}天`" color="#999999" size="20" />
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 其他 -->
			<view class="fu-border fu-h-160 fu-bg-main fu-b-r-10 fu-m-t-60">
				<fu-grid :column="4" :showBorder="false" :highlight="false" @change="(val) => $openPage($mConstDataConfig.userEntrys[val.detail.index].url)">
					<fu-grid-item v-for="(item, index) in $mConstDataConfig.userEntrys" :index="index" :key="index">
						<view class="fu-flex fu-flex-direction-column fu-flex-column-center fu-flex-row-center fu-flex-1">
							<view class="fu-w-60 fu-h-60">
								<fu-image width="100%" height="60" radius="10" bgColor="transparent" :src="item.icon"></fu-image>
							</view>
							<text class="fu-font-24 fu-m-t-15">{{ item.name }}</text>
						</view>
					</fu-grid-item>
				</fu-grid>
			</view>
			
			<view class="fu-border fu-bg-main fu-b-r-10 fu-m-t-20 fu-p-y-10">
				<view v-for="(item, index) in $mConstDataConfig.userRestEntrys" :key="index" class="menu-item">
					<fu-button
						width="100%"
						height="88"
						:openType="item.openType"
						customStyle="background: transparent; border: none;"
						@click="onClick('userRestEntrys', item)"
					>
						<view class="fu-flex-1 fu-flex fu-flex-column-center fu-font-26 menu-item__content">
							<view class="fu-flex-1 fu-flex fu-flex-column-center">
								<view class="fu-w-35 fu-h-35 fu-m-r-20">
									<fu-image width="100%" height="35" bgColor="transparent" :src="item.icon"></fu-image>
								</view>
								<text class="menu-item__text">{{ item.name }}</text>
							</view>
							<fu-icons type="right" color="#999999" size="15" v-if="item.isIcon"></fu-icons>
						</view>
					</fu-button>
				</view>
			</view>

			<!-- 原生模板广告 -->
			<view v-if="adStore.adConfig.nativeTemplateId" class="ad-container fu-m-t-40">
				<ad-custom :unit-id="adStore.adConfig.nativeTemplateId" ad-intervals="30" />
			</view>
		</view>
	</view>
</template>

<script setup>
	import { getCurrentInstance, computed, onMounted, watch } from 'vue';
	import { useUserStore } from '@/stores/user.js';
	import { useAdStore } from '@/stores/ad.js';

	// 接收父组件传递的 isActive prop
	const props = defineProps({
		isActive: {
			type: Boolean,
			default: false
		}
	});

	// data数据
	const { $mUtil, $mConstDataConfig, $openPage } = getCurrentInstance().appContext.config.globalProperties;

	// 使用 user store
	const userStore = useUserStore();

	// 使用 ad store
	const adStore = useAdStore();

	// 直接从 store 获取用户信息,避免重复定义
	const userInfo = computed(() => userStore.userInfo || {
		nickname: '微信用户',
		avatarUrl: 'https://picsum.photos/200/200',
		id: '',
		downloadCount: 0,
		userLevel: 1,
		isVip: 0,
		vipExpireTime: null,
	});

	// 格式化VIP过期时间 (简短格式,用于左侧卡片)
	const formatVipExpireDate = (time) => {
		if (!time) return '--';
		const date = new Date(time);
		const now = new Date();
		const year = date.getFullYear();
		const currentYear = now.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');

		// 如果是当年就不显示年份,跨年则显示年份
		if (year === currentYear) {
			return `${month}月${day}日`;
		} else {
			return `${year}年${month}月${day}日`;
		}
	};

	// 格式化VIP过期时间 (完整格式)
	const formatVipExpireTime = (time) => {
		if (!time) return '';
		const date = new Date(time);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	// 计算VIP剩余天数
	const getRemainingDays = (time) => {
		if (!time) return 0;
		const now = new Date();
		const expireDate = new Date(time);
		const diffTime = expireDate.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays > 0 ? diffDays : 0;
	};

	// 刷新用户信息的函数
	const refreshUserInfo = async () => {
		console.log('[User] 刷新用户信息');

		// 先从缓存加载(快速显示,避免闪烁)
		if (!userStore.userInfo) {
			userStore.loadFromCache();
		}

		// 然后从服务器获取最新数据
		try {
			await userStore.fetchUserInfo();
			console.log('[User] ✅ 用户信息加载成功');
		} catch (error) {
			console.error('[User] ❌ 加载用户信息失败:', error);
		}
	};

	// 组件首次挂载时获取用户信息
	onMounted(async () => {
		console.log('[User] 组件挂载,开始加载用户信息');
		await refreshUserInfo();
	});

	// 监听 isActive 变化,当组件变为激活状态时刷新数据
	watch(() => props.isActive, async (newValue, oldValue) => {
		if (newValue && !oldValue) {
			console.log('[User] 组件被激活,刷新用户信息');
			await refreshUserInfo();
		}
	});

	// methods方法
	const onClick = (state, e) => {
		switch(state) {
			case 'userRestEntrys':
				if(!e.url) return
				$openPage(e.url)
				break
			default:
				break
		}
	}
</script>

<style lang="scss" scoped>
.vip-badge {
	background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
	padding: 4rpx 12rpx;
	border-radius: 8rpx;
	box-shadow: 0 2rpx 8rpx rgba(255, 215, 0, 0.3);
}

.info-card {
	.divider {
		width: 2rpx;
		height: 80rpx;
		background: rgba(255, 255, 255, 0.1);
		margin: 0 20rpx;
	}

	.info-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
}

.menu-item {
	&__content {
		color: #ffffff;
	}

	&__text {
		color: #ffffff;
		font-size: 26rpx;
	}
}

// 广告容器
.ad-container {
	border-radius: 15rpx;
	margin: 40rpx auto;
	display: flex;
	justify-content: center;
}
</style>