<template>
	<view class="fu-p-b-80">
		<app-nav-bar bgColor="transparent" :border="false" fixed />
		
		<view class="fu-m-x-30">
			<!-- 基础信息 -->
			<view class=" fu-flex fu-flex-column-center">
				<view class="fu-flex-1 fu-flex fu-flex-column-center">
					<up-avatar size="100rpx" :src="userInfo.avatarUrl" />
					<view class="fu-m-l-20">
						<!--
							字号一律写成带 rpx 的字符串，不要写裸数字。
							uview-plus 的 unit 配成了 rpx，addUnit 对裸数字会再乘 2
							（size="32" 实际渲染成 64rpx），本页原来 9 处 up-text 全是意图的两倍，
							和同页纯 CSS 的 26rpx 菜单文字并排就特别扎眼。
							带单位的字符串 addUnit 会原样返回，所见即所得。
						-->
						<view class="fu-flex fu-flex-column-center">
							<up-text :text="userInfo.nickname" color="#ffffff" size="32rpx" bold />
							<!-- VIP标识 -->
							<view v-if="userInfo.isVip === 1" class="vip-badge fu-m-l-10">
								<up-text text="VIP" color="#FFD700" size="20rpx" bold />
							</view>
						</view>
						<view class="fu-flex fu-flex-column-center fu-m-t-10">
							<!--
								Uid 从 #999999 提到 #cccccc：深色底上 #999 的对比度只有 2.8:1，
								低于 WCAG AA 对小字要求的 4.5:1，在户外或低亮度屏上基本看不清。
								复制图标同步收小到 28rpx 并对齐文字大小。
							-->
							<up-text :text="`Uid：${userInfo.uid || '--'}`" color="#cccccc" size="24rpx" margin="0 10rpx 0 0" bold />
							<up-icon name="file-text" color="#55aaff" size="28rpx" @click="onCopyUid" />
						</view>
					</view>
				</view>
				<!-- 齿轮原来没有任何点击事件，纯装饰 -->
				<view class="fu-p-10" @click="onOpenSetting">
					<up-icon name="setting" size="50rpx" color="#999999" />
				</view>
			</view>

			<!-- 下载次数和VIP信息卡片 -->
			<view class="info-card fu-border fu-bg-main fu-b-r-10 fu-m-t-30 fu-p-20">
				<view class="fu-flex fu-flex-row-between fu-flex-column-center">
					<!-- 剩余下载次数 -->
					<view class="info-item fu-flex-1">
						<up-text text="剩余下载" color="#999999" size="24rpx" />
						<view class="fu-m-t-10 fu-flex fu-flex-column-center">
							<up-text :text="`${userInfo.downloadCount}`" color="#ffffff" size="40rpx" bold />
							<up-text text=" 次" color="#999999" size="24rpx" />
						</view>
					</view>

					<!-- 分隔线 -->
					<view class="divider"></view>

					<!-- VIP状态 -->
					<view class="info-item fu-flex-1">
						<up-text text="会员状态" color="#999999" size="24rpx" />
						<view class="fu-m-t-10 fu-flex fu-flex-direction-column fu-flex-column-center">
							<up-text
								:text="userInfo.isVip === 1 ? 'VIP会员' : '普通用户'"
								:color="userInfo.isVip === 1 ? '#FFD700' : '#ffffff'"
								size="28rpx"
								bold
							/>
							<view v-if="userInfo.isVip === 1 && userInfo.vipExpireTime" class="fu-m-t-5">
								<up-text :text="`剩余${getRemainingDays(userInfo.vipExpireTime)}天`" color="#999999" size="20rpx" />
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<!--
				四个入口。

				原来用的是 up-grid + up-grid-item，图标在真机上偏离格子中心。
				那两个组件在小程序端叠了四层条件编译：
				  .u-grid       display: grid !important + grid-template-columns: repeat(v-bind(col), ...)
				  .u-grid-item  width: 100% + float: left（#ifdef MP）
				                margin-top: 1rpx（#ifdef MP-WEIXIN）
				                virtualHost: true
				这里要的只是"四个等宽格子"，用不着这套机制，也不该为它的平台差异买单。
				改成一行 flex：每格 flex: 1 等分，格内 column + center 居中，
				居中由结构保证，没有任何条件编译分支。
			-->
			<view class="entry-grid fu-border fu-bg-main fu-b-r-10 fu-m-t-60">
				<view
					v-for="(item, index) in $mConstDataConfig.userEntrys"
					:key="index"
					class="entry-grid__cell"
					@click="$openPage(item.url)"
				>
					<!--
						尺寸交给外层盒子（fu-w-60 fu-h-60 = 60rpx），图片写 100% 跟着走。
						原来写的是 height="60"：app-image 内部走 addUnit，裸数字在 rpx 单位下会乘 2，
						实际渲染成 120rpx，塞进 60rpx 的盒子里竖向撑爆一倍；
						再叠加默认的 aspectFill（裁剪填充），方形图标被裁成竖条，认不出原样。

						mode 改成 aspectFit：图标要完整显示，宁可留白也不能裁。
					-->
					<view class="fu-w-60 fu-h-60">
						<app-image width="100%" height="100%" mode="aspectFit" radius="10" bgColor="transparent" :src="item.icon"></app-image>
					</view>
					<text class="entry-grid__label fu-font-24 fu-m-t-15">{{ item.name }}</text>
				</view>
			</view>
			
			<view class="fu-border fu-bg-main fu-b-r-10 fu-m-t-20 fu-p-y-10">
				<view v-for="(item, index) in $mConstDataConfig.userRestEntrys" :key="index" class="menu-item">
					<up-button
						:openType="item.openType"
						:customStyle="{width: '100%', height: '88rpx', background: 'transparent', border: 'none'}"
						@click="onClick('userRestEntrys', item)"
					>
						<view class="fu-flex-1 fu-flex fu-flex-column-center fu-font-26 menu-item__content">
							<view class="fu-flex-1 fu-flex fu-flex-column-center">
								<!-- 同上：height="35" 会被放大成 70rpx，塞进 35rpx 的盒子里 -->
								<view class="fu-w-35 fu-h-35 fu-m-r-20">
									<app-image width="100%" height="100%" mode="aspectFit" bgColor="transparent" :src="item.icon"></app-image>
								</view>
								<text class="menu-item__text">{{ item.name }}</text>
							</view>
							<up-icon name="arrow-right" color="#999999" size="15" v-if="item.isIcon"></up-icon>
						</view>
					</up-button>
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
	const { $mUtil, $mConstDataConfig, $openPage, $mAssetsPath } = getCurrentInstance().appContext.config.globalProperties;

	// 使用 user store
	const userStore = useUserStore();

	// 使用 ad store
	const adStore = useAdStore();

	// 直接从 store 获取用户信息,避免重复定义
	const userInfo = computed(() => userStore.userInfo || {
		nickname: '微信用户',
		// 兜底头像必须用本地图：picsum.photos 是外部域名，不在小程序合法域名白名单里，
		// 真机上加载不出来，而这个兜底恰恰只在"没有头像"时才用到
		avatarUrl: $mAssetsPath.defaultAvatar,
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
	/**
	 * 复制 Uid。
	 * 加了空值保护：uid 拿不到时原来会把 undefined 塞进剪贴板，
	 * 还照样弹"复制成功"，用户粘出来是一串 undefined。
	 */
	const onCopyUid = () => {
		if (!userInfo.value.uid) {
			uni.showToast({ title: '用户信息加载中，请稍后', icon: 'none' })
			return
		}
		$mUtil.setClipboard(userInfo.value.uid)
	}

	// 打开资料设置
	const onOpenSetting = () => {
		$openPage('userProfile')
	}

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
/**
 * 四个入口的等分栅格。
 *
 * 没有用固定高度（原来是 fu-h-160）：内容高度 = 图标 60rpx + 间距 15rpx + 文字一行，
 * 写死 160rpx 的话，以后图标或字号一改就会挤出去或留一条空白。
 * 改成上下 padding 撑开，高度跟着内容走。
 */
.entry-grid {
	display: flex;
	padding: 30rpx 0;

	&__cell {
		// 四格等分。用 flex: 1 而不是 width: 25%，
		// 免得以后加减入口还要回来改百分比
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		// 最小宽度归零：否则超长文案会把自己那一格撑宽，四格就不再等分
		min-width: 0;

		&:active {
			opacity: 0.6;
		}
	}

	&__label {
		color: #ffffff;
		// 文案万一超长就省略，不要换行——换行会把这一格顶高，四格顶部不齐
		width: 100%;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
}

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
// 不加固定高度和背景色：广告没拉到时容器就 0 高、什么都不显示，不会留一块空盒子；
// 广告回来后自然撑开。
.ad-container {
	border-radius: 15rpx;
	margin: 40rpx auto;
	display: flex;
	justify-content: center;
	align-items: center;
	overflow: hidden;
}
</style>