<template>
	<page-layout customClass="navbar__content">
		<app-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="arrow-left" title="VIP卡兑换" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<view class="redeem-container fu-m-x-30 fu-m-t-20">
			<!-- 会员卡：磨砂玻璃黑卡，细白边，无金色，和首页/我的页的玻璃卡同材质 -->
			<view class="vip-card">
				<view class="vip-card__top">
					<view class="vip-card__brand">
						<text class="vip-card__crown">♛</text>
						<text class="vip-card__brand-name">壁纸会员</text>
					</view>
					<text class="vip-card__tier">PREMIUM</text>
				</view>
				<view class="vip-card__glyph"></view>
				<view class="vip-card__bottom">
					<text class="vip-card__headline">尊享 · 无限下载</text>
					<text class="vip-card__sub">解锁全部高清壁纸 · 会员期内免费保存</text>
				</view>
			</view>

			<!-- 会员权益对比表：每日下载 / 广告，普通 vs VIP -->
			<view class="panel benefits">
				<text class="benefits__head">会员权益</text>
				<!-- 表头 -->
				<view class="benefits__row benefits__row--head">
					<text class="benefits__item"></text>
					<text class="benefits__col">普通用户</text>
					<text class="benefits__col benefits__col--vip">VIP 会员</text>
				</view>
				<!-- 每日下载 -->
				<view class="benefits__row">
					<text class="benefits__item">每日下载</text>
					<text class="benefits__col">{{ normalLimitText }}</text>
					<text class="benefits__col benefits__col--vip">{{ vipLimitText }}</text>
				</view>
				<!-- 广告 -->
				<view class="benefits__row">
					<text class="benefits__item">观看广告</text>
					<text class="benefits__col">有广告</text>
					<text class="benefits__col benefits__col--vip">无广告</text>
				</view>
			</view>

			<!-- 兑换面板 -->
			<view class="panel">
				<text class="panel__label">输入你的 VIP 卡密</text>
				<view class="code-slot">
					<input
						v-model="vipCode"
						class="code-slot__input"
						placeholder="输入 VIP 卡密"
						placeholder-style="color: #676d7c; letter-spacing: 2rpx;"
						maxlength="32"
					/>
				</view>
				<!-- 主操作用白底黑字反白：深色界面里对比最强的主按钮，呼应全站「白为强调」 -->
				<up-button
					:disabled="!vipCode || loading"
					color="#ffffff"
					:customStyle="{height: '96rpx', borderRadius: '16rpx'}"
					@click="handleActivate"
				><text class="activate-text">立即激活</text></up-button>
			</view>

			<!-- 温馨提示：中性玻璃底，标题白色，无金 -->
			<view class="panel tips">
				<text class="tips__head">温馨提示</text>
				<view class="tips__item">
					<view class="tips__dot"></view>
					<text class="tips__text">每个 VIP 卡密仅可使用一次</text>
				</view>
				<view class="tips__item">
					<view class="tips__dot"></view>
					<text class="tips__text">激活成功后立即生效，会员期内免费使用</text>
				</view>
				<view class="tips__item">
					<view class="tips__dot"></view>
					<text class="tips__text">请妥善保管您的卡密，避免泄露</text>
				</view>
			</view>

			<!-- 激活记录 -->
			<view class="history-section">
				<view class="history-section__head">
					<text class="history-section__title">激活记录</text>
					<text class="history-section__count" v-if="historyList.length > 0">共 {{ historyList.length }} 条</text>
				</view>

				<view v-if="historyList.length > 0" class="history-list">
					<view
						v-for="(item, index) in historyList"
						:key="index"
						class="history-item"
					>
						<view class="history-item__left">
							<text class="history-item__code">{{ maskCode(item.cardCode) }}</text>
							<text class="history-item__time">{{ formatTime(item.activatedAt) }}</text>
						</view>
						<view class="history-item__badge">
							<text class="history-item__badge-text">{{ item.days }}天VIP</text>
						</view>
					</view>
				</view>

				<view v-else class="empty-box">
					<text class="empty-box__text">暂无激活记录</text>
				</view>
			</view>
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, ref, computed } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import { activateVipCardApi, getVipHistoryApi } from '@/packUser/api/vip.js';
	import { useUserStore } from '@/stores/user.js';
	import { useAppInfoStore } from '@/stores/appInfo.js';

	// data数据
	const { $mUtil } = getCurrentInstance().appContext.config.globalProperties;
	const userStore = useUserStore();
	const appInfoStore = useAppInfoStore();
	let vipCode = ref('');
	let loading = ref(false);
	let historyList = ref([]);

	// 会员权益：每日下载上限（0 = 不限），来自后台系统设置，经 /app/info 下发
	// 用在对比表的列里，行标签已写「每日下载」，值只留「N 次 / 不限」
	const formatLimit = (n) => (n > 0 ? `${n} 次` : '不限');
	const normalLimitText = computed(() => formatLimit(appInfoStore.downloadLimits.normal));
	const vipLimitText = computed(() => formatLimit(appInfoStore.downloadLimits.vip));

	// 生命周期
	onLoad(() => {
		loadHistory();
		// 拉取小程序信息（含每日下载上限），已缓存/已加载则不会重复请求
		appInfoStore.fetchInfo();
	});

	// methods
	const handleActivate = async () => {
		if (!vipCode.value) {
			uni.showToast({ title: '请输入VIP卡密', icon: 'none' });
			return;
		}

		loading.value = true;
		try {
			const res = await activateVipCardApi(vipCode.value);

			if (res.code === 0) {
				// 激活成功后刷新用户信息
				try {
					await userStore.refreshUserInfo();
				} catch (err) {
					console.error('[VipRedeem] 更新用户信息失败:', err);
				}

				// 构建成功提示信息
				let successMsg = `VIP激活成功!获得${res.data.days}天VIP`;
				if (res.data.rewardCount > 0) {
					successMsg += `,下载次数+${res.data.rewardCount}`;
				}

				uni.showToast({
					title: successMsg,
					icon: 'none',
					duration: 3000
				});
				vipCode.value = '';
				loadHistory(); // 刷新激活记录
			} else {
				uni.showToast({ title: res.message || '激活失败', icon: 'none' });
			}
		} catch (error) {
			console.error('[VipRedeem] 激活失败:', error);
			// request.js 已把后端的业务提示（如「卡密不存在」「卡密已被使用」）放进 error.message，
			// 优先原样展示；只有网络异常等没有具体消息时才用兜底文案。
			uni.showToast({ title: error.message || '激活失败，请稍后重试', icon: 'none' });
		} finally {
			loading.value = false;
		}
	};

	const loadHistory = async () => {
		try {
			const res = await getVipHistoryApi();
			if (res.code === 0) {
				historyList.value = res.data || [];
			}
		} catch (error) {
			console.error('[VipRedeem] 加载激活记录失败:', error);
		}
	};

	const maskCode = (code) => {
		if (!code) return '';
		if (code.length <= 8) return code;
		return code.substring(0, 4) + '****' + code.substring(code.length - 4);
	};

	const formatTime = (time) => {
		if (!time) return '';
		const date = new Date(time);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hour = String(date.getHours()).padStart(2, '0');
		const minute = String(date.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day} ${hour}:${minute}`;
	};
</script>

<style scoped lang="scss">
	.redeem-container {
		color: #ffffff;
		padding-bottom: 60rpx;
	}

	/* ── 会员卡：磨砂玻璃黑卡，细白边，无金 ── */
	.vip-card {
		position: relative;
		height: 340rpx;
		border-radius: 24rpx;
		padding: 40rpx;
		overflow: hidden;
		border: 1rpx solid rgba(255, 255, 255, 0.1);
		background: linear-gradient(150deg, rgba(255, 255, 255, 0.11) 0%, rgba(255, 255, 255, 0.04) 42%, rgba(255, 255, 255, 0.015) 100%);
		box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.14), 0 20rpx 50rpx -28rpx rgba(0, 0, 0, 0.8);
		display: flex;
		flex-direction: column;
		justify-content: space-between;

		/* 极淡白色高光缓慢扫过，给卡一点反光质感（不是金） */
		&::after {
			content: '';
			position: absolute;
			top: -60%;
			left: -30%;
			width: 55%;
			height: 220%;
			background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
			transform: rotate(18deg);
			animation: cardSheen 6s ease-in-out infinite;
		}

		&__top {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			position: relative;
			z-index: 1;
		}

		&__brand {
			display: flex;
			align-items: center;
		}

		&__crown {
			font-size: 40rpx;
			margin-right: 16rpx;
			color: #ffffff;
		}

		&__brand-name {
			font-size: 38rpx;
			font-weight: bold;
			letter-spacing: 2rpx;
			color: #ffffff;
		}

		&__tier {
			font-size: 20rpx;
			letter-spacing: 5rpx;
			color: #a2a7b2;
			padding: 6rpx 18rpx;
			border-radius: 30rpx;
			border: 1rpx solid rgba(255, 255, 255, 0.06);
		}

		&__glyph {
			position: relative;
			z-index: 1;
			width: 80rpx;
			height: 60rpx;
			border-radius: 14rpx;
			border: 1rpx solid rgba(255, 255, 255, 0.1);
			background: rgba(255, 255, 255, 0.05);
		}

		&__bottom {
			position: relative;
			z-index: 1;
		}

		&__headline {
			display: block;
			font-size: 34rpx;
			font-weight: bold;
			letter-spacing: 1rpx;
			color: #ffffff;
		}

		&__sub {
			display: block;
			font-size: 24rpx;
			margin-top: 10rpx;
			color: #a2a7b2;
			letter-spacing: 1rpx;
		}
	}

	@keyframes cardSheen {
		0%, 60% { left: -40%; }
		100% { left: 130%; }
	}

	/* ── 玻璃面板 ── */
	.panel {
		margin-top: 30rpx;
		background: rgba(255, 255, 255, 0.05);
		border: 1rpx solid rgba(255, 255, 255, 0.06);
		border-radius: 20rpx;
		padding: 30rpx;

		&__label {
			display: block;
			font-size: 26rpx;
			color: #a2a7b2;
			letter-spacing: 1rpx;
			margin-bottom: 24rpx;
		}
	}

	.code-slot {
		display: flex;
		align-items: center;
		height: 96rpx;
		border-radius: 16rpx;
		background: rgba(0, 0, 0, 0.28);
		border: 1rpx solid rgba(255, 255, 255, 0.06);
		padding: 0 30rpx;
		margin-bottom: 28rpx;

		&__input {
			flex: 1;
			height: 100%;
			color: #ffffff;
			font-size: 30rpx;
			letter-spacing: 2rpx;
		}
	}

	.activate-text {
		color: #0b0d16;
		font-size: 32rpx;
		font-weight: bold;
		letter-spacing: 6rpx;
	}

	/* ── 会员权益对比表：项目 × (普通 / VIP) ── */
	.benefits {
		&__head {
			display: block;
			font-size: 24rpx;
			letter-spacing: 2rpx;
			color: #ffffff;
			opacity: 0.9;
			margin-bottom: 20rpx;
		}

		&__row {
			display: flex;
			align-items: center;
			padding: 16rpx 0;

			/* 数据行之间的极淡分隔线，表格感 */
			& + & {
				border-top: 1rpx solid rgba(255, 255, 255, 0.06);
			}
		}

		/* 表头：小字、不强调 */
		&__row--head {
			padding-top: 0;

			.benefits__col {
				font-size: 22rpx;
			}
		}

		/* 左列：权益名 */
		&__item {
			flex: 1.3;
			font-size: 26rpx;
			color: #a2a7b2;
		}

		/* 普通 / VIP 两个值列，右对齐 */
		&__col {
			flex: 1;
			text-align: right;
			font-size: 26rpx;
			color: #a2a7b2;

			/* VIP 列强调：白色加粗，突出「更划算」 */
			&--vip {
				color: #ffffff;
				font-weight: bold;
			}
		}
	}

	/* ── 温馨提示 ── */
	.tips {
		&__head {
			display: block;
			font-size: 24rpx;
			letter-spacing: 2rpx;
			color: #ffffff;
			opacity: 0.9;
			margin-bottom: 22rpx;
		}

		&__item {
			display: flex;
			align-items: flex-start;
			margin-bottom: 16rpx;

			&:last-child {
				margin-bottom: 0;
			}
		}

		&__dot {
			width: 8rpx;
			height: 8rpx;
			border-radius: 50%;
			background: #a2a7b2;
			margin-top: 14rpx;
			margin-right: 16rpx;
			flex-shrink: 0;
		}

		&__text {
			flex: 1;
			font-size: 25rpx;
			color: #a2a7b2;
			line-height: 1.5;
		}
	}

	/* ── 激活记录 ── */
	.history-section {
		margin-top: 50rpx;

		&__head {
			display: flex;
			align-items: baseline;
		}

		&__title {
			font-size: 32rpx;
			font-weight: bold;
			letter-spacing: 1rpx;
			color: #ffffff;
		}

		&__count {
			font-size: 24rpx;
			color: #676d7c;
			margin-left: 18rpx;
		}
	}

	.history-list {
		margin-top: 28rpx;
	}

	.history-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: rgba(255, 255, 255, 0.05);
		border: 1rpx solid rgba(255, 255, 255, 0.06);
		border-radius: 20rpx;
		padding: 32rpx 36rpx;
		margin-bottom: 20rpx;

		&__left {
			display: flex;
			flex-direction: column;
			flex: 1;
			min-width: 0;
			margin-right: 20rpx;
		}

		&__code {
			font-family: 'SF Mono', Menlo, monospace;
			font-size: 28rpx;
			letter-spacing: 2rpx;
			color: #ffffff;
		}

		&__time {
			font-size: 24rpx;
			color: #676d7c;
			margin-top: 14rpx;
		}

		&__badge {
			flex-shrink: 0;
			background: rgba(255, 255, 255, 0.08);
			border: 1rpx solid rgba(255, 255, 255, 0.1);
			border-radius: 40rpx;
			padding: 12rpx 26rpx;
		}

		&__badge-text {
			font-size: 26rpx;
			font-weight: 600;
			color: #ffffff;
			letter-spacing: 1rpx;
		}
	}

	.empty-box {
		padding: 120rpx 0;
		text-align: center;

		&__text {
			font-size: 24rpx;
			color: #676d7c;
		}
	}
</style>
