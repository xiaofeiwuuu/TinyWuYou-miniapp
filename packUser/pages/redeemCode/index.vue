<template>
	<page-layout customClass="navbar__content">
		<fu-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="left" title="VIP卡兑换" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></fu-nav-bar>

		<view class="redeem-container fu-m-x-30 fu-m-t-20">
			<!-- 兑换卡片 -->
			<view class="redeem-card fu-border fu-bg-main fu-b-r-10 fu-p-30">
				<view class="fu-m-b-20">
					<fu-text text="请输入您的VIP卡密" color="#ffffff" size="32" bold />
				</view>

				<!-- 卡密输入框 -->
				<view class="input-wrapper fu-m-b-30">
					<input
						v-model="vipCode"
						class="code-input"
						placeholder="请输入VIP卡密"
						placeholder-style="color: #999999;"
						maxlength="32"
					/>
				</view>

				<!-- 兑换按钮 -->
				<view class="fu-m-b-20">
					<fu-button
						text="立即激活"
						:disabled="!vipCode || loading"
						bgColor="linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
						color="#000000"
						fontSize="32"
						height="100"
						shape="round"
						customTextStyle="font-weight: bold;"
						@click="handleActivate"
					/>
				</view>

				<!-- 提示信息 -->
				<view class="tips-box">
					<fu-text text="温馨提示:" color="#FFD700" size="28" bold />
					<view class="fu-m-t-10">
						<fu-text text="1. 每个VIP卡密仅可使用一次" color="#999999" size="26" />
					</view>
					<view class="fu-m-t-8">
						<fu-text text="2. 激活成功后立即生效,VIP期间免费使用" color="#999999" size="26" />
					</view>
					<view class="fu-m-t-8">
						<fu-text text="3. 请妥善保管您的卡密,避免泄露" color="#999999" size="26" />
					</view>
				</view>
			</view>

			<!-- 激活记录 -->
			<view class="history-section fu-m-t-40">
				<view class="fu-m-b-30">
					<fu-text text="激活记录" color="#ffffff" size="32" bold />
				</view>

				<view v-if="historyList.length > 0" class="history-list">
					<view
						v-for="(item, index) in historyList"
						:key="index"
						class="history-item fu-border fu-bg-main fu-b-r-10 fu-p-30 fu-m-b-20"
					>
						<view class="fu-flex fu-flex-row-between fu-flex-column-center">
							<view class="info-section">
								<fu-text :text="`卡密: ${maskCode(item.cardCode)}`" color="#ffffff" size="28" />
								<view class="fu-m-t-15">
									<fu-text :text="`激活时间: ${formatTime(item.activatedAt)}`" color="#999999" size="24" />
								</view>
							</view>
							<view class="reward-badge">
								<fu-text :text="`${item.days}天VIP`" color="#FFD700" size="26" bold />
							</view>
						</view>
					</view>
				</view>

				<view v-else class="empty-box fu-flex fu-flex-direction-column fu-flex-column-center fu-p-t-60 fu-p-b-60">
					<fu-text text="暂无激活记录" color="#999999" size="24" />
				</view>
			</view>
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, ref } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import { activateVipCardApi, getVipHistoryApi } from '@/packUser/api/vip.js';
	import { useUserStore } from '@/stores/user.js';

	// data数据
	const { $mUtil } = getCurrentInstance().appContext.config.globalProperties;
	const userStore = useUserStore();
	let vipCode = ref('');
	let loading = ref(false);
	let historyList = ref([]);

	// 生命周期
	onLoad(() => {
		loadHistory();
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
			uni.showToast({ title: '激活失败,请稍后重试', icon: 'none' });
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
		color: #FFFFFF;

		.redeem-card {
			.input-wrapper {
				.code-input {
					width: 100%;
					height: 90rpx;
					background: rgba(255, 255, 255, 0.1);
					border-radius: 10rpx;
					padding: 0 30rpx;
					color: #ffffff;
					font-size: 28rpx;
					box-sizing: border-box;
				}
			}

			.tips-box {
				background: rgba(255, 215, 0, 0.1);
				border-radius: 10rpx;
				padding: 20rpx;
			}
		}

		.history-section {
			.history-item {
				.info-section {
					flex: 1;
					margin-right: 20rpx;
				}

				.reward-badge {
					background: rgba(255, 215, 0, 0.2);
					padding: 15rpx 25rpx;
					border-radius: 30rpx;
					border: 2rpx solid rgba(255, 215, 0, 0.3);
					white-space: nowrap;
				}
			}
		}
	}
</style>
