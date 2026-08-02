<template>
	<page-layout customClass="navbar__content">
		<app-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="arrow-left" title="编辑资料" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<view class="fu-m-x-30 fu-m-t-20">
			<!-- 头像 -->
			<view class="row fu-border fu-bg-main fu-b-r-10 fu-p-30" @click="openPicker">
				<up-text text="头像" color="#ffffff" size="28rpx" />
				<view class="row__right">
					<view class="avatar">
						<app-image width="100%" height="100%" mode="aspectFill" shape="circle" bgColor="#222222" :src="avatarPreview"></app-image>
					</view>
					<up-icon name="arrow-right" color="#999999" size="15" />
				</view>
			</view>

			<!-- 昵称 -->
			<view class="row fu-border fu-bg-main fu-b-r-10 fu-p-30 fu-m-t-20">
				<up-text text="昵称" color="#ffffff" size="28rpx" />
				<view class="row__right">
					<!--
						type="nickname" 是微信的昵称填写能力：聚焦时会把用户的微信昵称
						作为候选带出来，用户点一下就填好，不用手打。
						非微信端会退化成普通输入框，不影响使用。
					-->
					<input
						v-model="nickname"
						class="nickname-input"
						type="nickname"
						placeholder="请输入昵称"
						placeholder-style="color: #666666;"
						:maxlength="NICKNAME_MAX"
					/>
				</view>
			</view>

			<view class="fu-m-t-15 fu-m-l-10">
				<up-text :text="`${nicknameLength}/${NICKNAME_MAX}`" :color="nicknameLength > NICKNAME_MAX ? '#FF725D' : '#666666'" size="22rpx" />
			</view>

			<view class="fu-m-t-60">
				<up-button
					:disabled="!canSave"
					color="linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
					shape="round"
					:customStyle="{ height: '88rpx' }"
					@click="onSave"
				><text style="color: #000000; font-size: 30rpx; font-weight: bold;">保存</text></up-button>
			</view>
		</view>

		<!-- 头像选择：只能从自己的收藏里挑 -->
		<up-popup :show="pickerVisible" mode="bottom" round="20" bgColor="#111111" closeable @close="pickerVisible = false">
			<!--
				必须加 v-if，不能只靠 up-popup 的 show。
				u-popup 关闭时只是把根节点压成 0×0（源码里 width/height 直接置 '0px'），
				内容照样渲染，而 .u-popup 没有 overflow: hidden——
				于是弹窗内容溢出到页面上，又因为容器宽度是 0，每个字被挤成一行，
				页面底部就出现一条竖排的"从我的收藏中选择头像"。
				顺带的好处：没打开选择器时不渲染这一整个九宫格。
			-->
			<view v-if="pickerVisible" class="picker">
				<view class="picker__title">
					<up-text text="从我的收藏中选择头像" color="#ffffff" size="30rpx" bold />
				</view>

				<scroll-view class="picker__body" scroll-y @scrolltolower="loadMore">
					<view v-if="collections.length" class="picker__grid">
						<view
							v-for="item in collections"
							:key="item.id"
							class="picker__cell"
							:class="{ 'picker__cell--on': item.id === pickedId }"
							@click="pickedId = item.id"
						>
							<app-image width="100%" height="100%" mode="aspectFill" radius="10" bgColor="#222222" :src="item.image"></app-image>
						</view>
					</view>

					<view v-else-if="!loading" class="picker__empty">
						<up-text text="还没有收藏任何图片" color="#666666" size="26rpx" />
						<view class="fu-m-t-10">
							<up-text text="先去收藏几张喜欢的图吧" color="#444444" size="24rpx" />
						</view>
					</view>

					<jc-loading-more v-if="collections.length" :loadingType="loadingType" />
				</scroll-view>

				<view class="picker__footer">
					<up-button
						:disabled="!pickedId"
						color="linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
						shape="round"
						:customStyle="{ height: '80rpx' }"
						@click="confirmPick"
					><text style="color: #000000; font-size: 28rpx; font-weight: bold;">确定</text></up-button>
				</view>
			</view>
		</up-popup>
	</page-layout>
</template>

<script setup>
	/**
	 * 编辑资料页。
	 *
	 * 头像只能从"我的收藏"里选，不开放上传：
	 * 用户自传的图走不了审核，头像会成为违规内容最容易的投放口，
	 * 而小程序被举报是整个账号受罚，不是删一张图的事。
	 * 收藏里的图都是后台已上架的素材，来源可控。
	 * 后端同样只接受"已收藏图片的 ID"，不接受 URL，两头都不留口子。
	 */
	import { getCurrentInstance, ref, computed } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import { getCollections, updateUserProfile } from '@/api/user.js';
	import { useUserStore } from '@/stores/user.js';

	const { $u, $mUtil, $mConstDataConfig } = getCurrentInstance().appContext.config.globalProperties;
	const userStore = useUserStore();

	/** 与后端 UpdateProfileDto 的 @Length(1, 20) 保持一致 */
	const NICKNAME_MAX = 20;

	const nickname = ref('');
	/** 已选中的头像图片 ID；null 表示没改过头像 */
	const avatarImageId = ref(null);
	const avatarPreview = ref('');

	const pickerVisible = ref(false);
	const pickedId = ref(null);
	const collections = ref([]);
	const loading = ref(false);
	const loadingType = ref(0);
	const page = ref(1);
	const hasMore = ref(true);
	const saving = ref(false);

	// 进页面时的原值，用来判断有没有真的改动
	let originNickname = '';

	const nicknameLength = computed(() => (nickname.value || '').trim().length);

	const canSave = computed(() => {
		if (saving.value) return false;
		const name = (nickname.value || '').trim();
		if (!name || name.length > NICKNAME_MAX) return false;
		// 什么都没改就不给点，省一次无意义的请求
		return name !== originNickname || avatarImageId.value !== null;
	});

	onLoad(() => {
		const info = userStore.userInfo || {};
		nickname.value = info.nickname || '';
		originNickname = nickname.value;
		avatarPreview.value = info.avatarUrl || '';
	});

	// 打开选择器时才拉收藏，没点进来就不请求
	const openPicker = () => {
		pickerVisible.value = true;
		pickedId.value = avatarImageId.value;
		if (!collections.value.length) loadCollections();
	};

	const loadCollections = async () => {
		if (loading.value || !hasMore.value) return;
		loading.value = true;
		loadingType.value = 1;

		try {
			const res = await getCollections(page.value, $mConstDataConfig.pageSize);
			if (res.code !== 0) {
				loadingType.value = 3;
				return;
			}

			const list = (res.data.list || [])
				// 收藏记录里图片可能已被下架删除，过滤掉，否则会渲染出空格子
				.filter((item) => item.image)
				.map((item) => ({
					id: item.image.id,
					image: item.image.thumbnailUrl || item.image.imageUrl
				}));

			collections.value = page.value === 1 ? list : collections.value.concat(list);

			if (list.length < $mConstDataConfig.pageSize) {
				hasMore.value = false;
				loadingType.value = 2;
			} else {
				loadingType.value = 0;
			}
		} catch (error) {
			console.error('[Profile] 加载收藏失败:', error);
			loadingType.value = 3;
		} finally {
			loading.value = false;
		}
	};

	const loadMore = () => {
		if (!hasMore.value || loading.value) return;
		page.value++;
		loadCollections();
	};

	const confirmPick = () => {
		if (!pickedId.value) return;
		const hit = collections.value.find((x) => x.id === pickedId.value);
		if (hit) {
			avatarImageId.value = hit.id;
			avatarPreview.value = hit.image;
		}
		pickerVisible.value = false;
	};

	const onSave = async () => {
		// 防重入：保存期间禁用按钮之外再加一道，避免快速双击发两次
		if (saving.value) return;
		const name = (nickname.value || '').trim();
		if (!name) return $u.toast('昵称不能为空');

		saving.value = true;
		uni.showLoading({ title: '保存中...', mask: true });

		let tip = '';
		try {
			const payload = {};
			if (name !== originNickname) payload.nickname = name;
			if (avatarImageId.value !== null) payload.avatarImageId = avatarImageId.value;

			const res = await updateUserProfile(payload);
			if (res.code !== 0) throw new Error(res.message || '保存失败');

			// 用服务端返回的资料刷新 store，避免本地和服务端不一致
			await userStore.refreshUserInfo();
			tip = '保存成功';
		} catch (error) {
			console.error('[Profile] 保存失败:', error);
			tip = error.message || '保存失败';
		} finally {
			uni.hideLoading();
			saving.value = false;
		}

		// 提示放在 hideLoading 之后：showToast 会顶掉 showLoading，
		// 先弹提示再 hideLoading 会触发"必须配对使用"的警告
		$u.toast(tip);
		if (tip === '保存成功') {
			setTimeout(() => $mUtil.overBack(), 600);
		}
	};
</script>

<style lang="scss" scoped>
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;

		&__right {
			display: flex;
			align-items: center;
			gap: 15rpx;
		}
	}

	.avatar {
		width: 88rpx;
		height: 88rpx;
		border-radius: 50%;
		overflow: hidden;
	}

	.nickname-input {
		width: 360rpx;
		color: #ffffff;
		font-size: 28rpx;
		text-align: right;
	}

	.picker {
		display: flex;
		flex-direction: column;
		// 定高，否则 scroll-view 在 popup 里撑不开、滚不动
		height: 900rpx;

		&__title {
			padding: 30rpx;
			text-align: center;
		}

		&__body {
			flex: 1;
			padding: 0 30rpx;
		}

		&__grid {
			display: flex;
			flex-wrap: wrap;
			gap: 16rpx;
		}

		&__cell {
			// 三列：(100% - 两个间隙) / 3
			width: calc((100% - 32rpx) / 3);
			height: 210rpx;
			border-radius: 10rpx;
			overflow: hidden;
			position: relative;
			border: 4rpx solid transparent;
			box-sizing: border-box;

			&--on {
				border-color: #FFD700;
			}
		}

		&__empty {
			padding: 160rpx 0;
			display: flex;
			flex-direction: column;
			align-items: center;
		}

		&__footer {
			padding: 20rpx 30rpx 40rpx;
		}
	}
</style>
