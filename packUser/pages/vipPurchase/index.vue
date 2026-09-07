<template>
	<page-layout customClass="navbar__content">
		<app-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="arrow-left" title="会员中心" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<view class="purchase fu-m-x-30 fu-m-t-20">
			<!-- VIP 会员套餐 -->
			<view v-if="vipList.length" class="section">
				<text class="section__title">VIP 会员</text>
				<text class="section__sub">无限下载 · 免广告 · 专属壁纸</text>
				<view class="goods">
					<view v-for="p in vipList" :key="p.productId" class="goods-card" @click="handleBuy(p)">
						<view class="goods-card__info">
							<text class="goods-card__name">{{ p.name }}</text>
							<text class="goods-card__desc">{{ p.amount }} 天会员</text>
						</view>
						<view class="goods-card__buy">
							<text class="goods-card__price">¥{{ formatPrice(p.price) }}</text>
							<view class="goods-card__btn"><text class="goods-card__btn-text">购买</text></view>
						</view>
					</view>
				</view>
			</view>

			<!-- 下载次数包 -->
			<view v-if="downloadList.length" class="section">
				<text class="section__title">下载次数包</text>
				<text class="section__sub">按需购买，不含会员权益</text>
				<view class="goods">
					<view v-for="p in downloadList" :key="p.productId" class="goods-card" @click="handleBuy(p)">
						<view class="goods-card__info">
							<text class="goods-card__name">{{ p.name }}</text>
							<text class="goods-card__desc">+{{ p.amount }} 次下载</text>
						</view>
						<view class="goods-card__buy">
							<text class="goods-card__price">¥{{ formatPrice(p.price) }}</text>
							<view class="goods-card__btn"><text class="goods-card__btn-text">购买</text></view>
						</view>
					</view>
				</view>
			</view>

			<view v-if="!loading && !vipList.length && !downloadList.length" class="empty">暂无可购买的商品</view>
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, ref, computed } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import { getVirtualProducts, createVirtualOrder, confirmVirtualOrder } from '@/packUser/api/virtualpay.js';
	import { useUserStore } from '@/stores/user.js';

	const { $mUtil } = getCurrentInstance().appContext.config.globalProperties;
	const userStore = useUserStore();

	let products = ref([]);
	let loading = ref(true);
	let paying = ref(false);

	const vipList = computed(() => products.value.filter((p) => p.type === 'vip'));
	const downloadList = computed(() => products.value.filter((p) => p.type === 'download'));

	onLoad(() => {
		loadProducts();
	});

	const loadProducts = async () => {
		try {
			const res = await getVirtualProducts();
			if (res.code === 0) products.value = res.data || [];
		} catch (error) {
			console.error('[VipPurchase] 加载商品失败:', error);
		} finally {
			loading.value = false;
		}
	};

	// 价格：后端存「分」，展示成「元」
	const formatPrice = (fen) => (Number(fen) / 100).toFixed(2);

	const wxLogin = () =>
		new Promise((resolve, reject) => {
			uni.login({
				success: (r) => (r.code ? resolve(r.code) : reject(new Error('获取登录 code 失败'))),
				fail: reject,
			});
		});

	const handleBuy = async (product) => {
		if (paying.value) return;

		// #ifndef MP-WEIXIN
		uni.showToast({ title: '请在微信小程序中购买', icon: 'none' });
		// #endif

		// #ifdef MP-WEIXIN
		paying.value = true;
		try {
			// 下单前拿一个新鲜的 code，后端用它换 session_key 算 signature
			const code = await wxLogin();
			const res = await createVirtualOrder(product.productId, code);
			if (res.code !== 0) {
				paying.value = false;
				uni.showToast({ title: res.message || '下单失败', icon: 'none' });
				return;
			}
			const { signData, paySig, signature, mode, outTradeNo } = res.data;

			// 虚拟支付需真机 + 已开通虚拟支付的环境；开发者工具通常没有这个 API
			if (typeof wx === 'undefined' || typeof wx.requestVirtualPayment !== 'function') {
				paying.value = false;
				uni.showModal({
					title: '无法拉起支付',
					content: '当前环境不支持虚拟支付。请在真机上、用已开通虚拟支付的小程序测试（微信开发者工具无法测试虚拟支付）。',
					showCancel: false,
				});
				return;
			}

			wx.requestVirtualPayment({
				signData,
				mode,
				paySig,
				signature,
				success: async (res2) => {
					console.log('[VipPurchase] requestVirtualPayment 成功:', res2);
					// 支付成功：主动确认（兜底发货），再刷新用户信息
					try {
						await confirmVirtualOrder(outTradeNo);
					} catch (error) {
						console.error('[VipPurchase] 确认订单失败:', error);
					}
					await userStore.refreshUserInfo();
					uni.showToast({ title: '购买成功', icon: 'success' });
				},
				fail: (err) => {
					console.error('[VipPurchase] requestVirtualPayment 失败:', err);
					const msg = err && err.errMsg ? err.errMsg : '';
					if (msg.includes('cancel')) {
						uni.showToast({ title: '已取消支付', icon: 'none' });
					} else {
						// 真机上把微信返回的原始错误显示出来，便于排查（如未开通/基础库过低）
						uni.showModal({ title: '支付未完成', content: msg || '未知错误', showCancel: false });
					}
				},
				complete: () => {
					paying.value = false;
				},
			});
		} catch (error) {
			paying.value = false;
			uni.showToast({ title: error.message || '购买失败，请重试', icon: 'none' });
		}
		// #endif
	};
</script>

<style scoped lang="scss">
	.purchase {
		color: #ffffff;
		padding-bottom: 60rpx;
	}

	.section {
		margin-bottom: 40rpx;

		&__title {
			display: block;
			font-size: 32rpx;
			font-weight: bold;
			letter-spacing: 1rpx;
			color: #ffffff;
		}

		&__sub {
			display: block;
			font-size: 24rpx;
			color: #a2a7b2;
			margin-top: 8rpx;
			margin-bottom: 24rpx;
		}
	}

	.goods {
		display: flex;
		flex-direction: column;
	}

	.goods-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: rgba(255, 255, 255, 0.05);
		border: 1rpx solid rgba(255, 255, 255, 0.06);
		border-radius: 20rpx;
		padding: 30rpx 32rpx;
		margin-bottom: 20rpx;

		&__info {
			display: flex;
			flex-direction: column;
		}

		&__name {
			font-size: 30rpx;
			font-weight: 600;
			color: #ffffff;
		}

		&__desc {
			font-size: 24rpx;
			color: #a2a7b2;
			margin-top: 10rpx;
		}

		&__buy {
			display: flex;
			align-items: center;
		}

		&__price {
			font-size: 34rpx;
			font-weight: bold;
			color: #ffffff;
			margin-right: 24rpx;
			font-variant-numeric: tabular-nums;
		}

		&__btn {
			background: #ffffff;
			border-radius: 30rpx;
			padding: 12rpx 36rpx;
		}

		&__btn-text {
			font-size: 26rpx;
			font-weight: bold;
			color: #0b0d16;
		}
	}

	.empty {
		padding: 120rpx 0;
		text-align: center;
		font-size: 24rpx;
		color: #676d7c;
	}
</style>
