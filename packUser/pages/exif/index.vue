<template>
	<page-layout customClass="navbar__content">
		<app-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="arrow-left" title="修改图片信息" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<view class="fu-m-x-30 fu-m-t-20">
			<!-- 选图 -->
			<view class="card fu-border fu-bg-main fu-b-r-10">
				<view class="card__title">
					<up-text text="1. 选择照片" color="#ffffff" size="28rpx" bold />
				</view>

				<view v-if="!picked" class="picker" @click="onChoose">
					<up-icon name="plus" color="#666666" size="40rpx" />
					<view class="fu-m-t-15">
						<up-text text="点击从相册选择" color="#666666" size="26rpx" />
					</view>
				</view>

				<view v-else>
					<view class="preview">
						<app-image width="100%" height="100%" mode="aspectFit" bgColor="#222222" :src="picked.path"></app-image>
					</view>

					<view class="fu-m-t-20">
						<view class="row">
							<up-text text="当前品牌" color="#999999" size="24rpx" />
							<up-text :text="origin.make || '（无）'" color="#cccccc" size="24rpx" />
						</view>
						<view class="row">
							<up-text text="当前机型" color="#999999" size="24rpx" />
							<up-text :text="origin.model || '（无）'" color="#cccccc" size="24rpx" />
						</view>
						<view class="row">
							<up-text text="拍摄时间" color="#999999" size="24rpx" />
							<up-text :text="origin.dateTime || '（无）'" color="#cccccc" size="24rpx" />
						</view>
					</view>

					<view class="fu-m-t-20">
						<up-button color="#333333" shape="round" :customStyle="{ height: '68rpx' }" @click="onChoose">
							<text style="color: #cccccc; font-size: 26rpx;">重新选择</text>
						</up-button>
					</view>
				</view>
			</view>

			<!-- 选机型 -->
			<view v-if="picked" class="card fu-border fu-bg-main fu-b-r-10 fu-m-t-20">
				<view class="card__title">
					<up-text text="2. 想显示成哪个机型" color="#ffffff" size="28rpx" bold />
				</view>

				<view v-for="group in DEVICE_PRESETS" :key="group.brand" class="fu-m-t-20">
					<up-text :text="group.brand" color="#666666" size="22rpx" />
					<view class="chips fu-m-t-10">
						<view
							v-for="item in group.items"
							:key="item.model"
							class="chip"
							:class="{ 'chip--on': selected && selected.model === item.model }"
							@click="selected = item"
						>{{ item.label }}</view>
					</view>
				</view>
			</view>

			<!-- 保存 -->
			<view v-if="picked" class="fu-m-t-40 fu-m-b-40">
				<up-button
					:disabled="!selected || saving"
					color="linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
					shape="round"
					:customStyle="{ height: '88rpx' }"
					@click="onSave"
				><text style="color: #000000; font-size: 30rpx; font-weight: bold;">保存到相册</text></up-button>

				<view class="fu-m-t-20 tip">
					保存的是一张新照片，原图不会被改动。
					修改的是照片的拍摄设备信息，不影响画面内容。
				</view>
			</view>
		</view>
	</page-layout>
</template>

<script setup>
	/**
	 * 修改图片的拍摄设备信息（EXIF）。
	 *
	 * 全程在本机完成，照片不会上传到服务器——这类操作只是改几十字节的
	 * 元数据，为它上传几 MB 的原图既慢又没必要，也不该让用户的私人照片
	 * 经过我们的服务器。
	 *
	 * 关键约束：选图必须用 sizeType: ['original']。
	 * 微信默认返回压缩图，而压缩过程会把 EXIF 整段丢掉，
	 * 那样读到的永远是"无信息"，写回去也只剩我们新加的那几个标签。
	 */
	import { getCurrentInstance, ref } from 'vue';
	import { readDeviceInfo, writeDeviceInfo } from '@/packUser/util/exif.js';
	import { DEVICE_PRESETS } from '@/packUser/util/devicePresets.js';

	const { $u, $mUtil } = getCurrentInstance().appContext.config.globalProperties;

	const picked = ref(null);      // { path, size }
	const origin = ref({});        // 原图的机型信息
	const selected = ref(null);    // 选中的目标机型
	const saving = ref(false);

	/** 只处理 JPEG：EXIF 是 JPEG/TIFF 的机制，PNG 没有这个段 */
	const isJpeg = (path) => /\.(jpe?g)$/i.test(path || '');

	const onChoose = () => {
		uni.chooseImage({
			count: 1,
			// 必须要原图：压缩图的 EXIF 会被微信丢掉
			sizeType: ['original'],
			sourceType: ['album'],
			success: async (res) => {
				const file = res.tempFiles && res.tempFiles[0];
				const path = res.tempFilePaths[0];

				if (!isJpeg(path)) {
					$u.toast('只支持 JPG 格式的照片');
					return;
				}

				picked.value = { path, size: file ? file.size : 0 };
				selected.value = null;
				origin.value = {};

				try {
					const buf = await readFile(path);
					origin.value = readDeviceInfo(buf) || {};
				} catch (error) {
					console.error('[Exif] 读取失败:', error);
					// 读不出来不算错：可能这张图本来就没有 EXIF，照样可以写入
					origin.value = {};
				}
			},
			fail: (err) => {
				// 用户主动取消不提示
				if (err && /cancel/i.test(err.errMsg || '')) return;
				$u.toast('选择照片失败');
			}
		});
	};

	const readFile = (path) =>
		new Promise((resolve, reject) => {
			uni.getFileSystemManager().readFile({
				filePath: path,
				success: (res) => resolve(res.data),
				fail: reject
			});
		});

	const writeTempFile = (buffer) =>
		new Promise((resolve, reject) => {
			// 写到用户目录下的临时文件，保存到相册后由系统接管
			const target = `${wx.env.USER_DATA_PATH}/exif_${Date.now()}.jpg`;
			uni.getFileSystemManager().writeFile({
				filePath: target,
				data: buffer,
				success: () => resolve(target),
				fail: reject
			});
		});

	const onSave = async () => {
		if (saving.value || !picked.value || !selected.value) return;
		saving.value = true;
		uni.showLoading({ title: '处理中...', mask: true });

		let tip = '';
		try {
			const src = await readFile(picked.value.path);
			const out = writeDeviceInfo(src, {
				make: selected.value.make,
				model: selected.value.model,
				software: selected.value.software
			});
			const tempPath = await writeTempFile(out);

			await new Promise((resolve, reject) => {
				uni.saveImageToPhotosAlbum({ filePath: tempPath, success: resolve, fail: reject });
			});
			tip = '已保存到相册';
		} catch (error) {
			console.error('[Exif] 保存失败:', error);
			const msg = (error && (error.errMsg || error.message)) || '';
			tip = /auth|deny|permission/i.test(msg) ? '需要相册权限才能保存' : '保存失败，请重试';
		} finally {
			uni.hideLoading();
			saving.value = false;
		}

		// 提示放在 hideLoading 之后：showToast 会顶掉 showLoading，
		// 反过来会触发"必须配对使用"的警告
		$u.toast(tip);
	};
</script>

<style lang="scss" scoped>
	.card {
		padding: 30rpx;

		&__title {
			margin-bottom: 10rpx;
		}
	}

	.picker {
		height: 200rpx;
		border: 2rpx dashed #444444;
		border-radius: 15rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-top: 20rpx;
	}

	.preview {
		height: 400rpx;
		border-radius: 15rpx;
		overflow: hidden;
		margin-top: 20rpx;
	}

	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12rpx 0;
		border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.chip {
		padding: 12rpx 24rpx;
		border-radius: 30rpx;
		background-color: #2a2a2a;
		color: #cccccc;
		font-size: 24rpx;
		border: 2rpx solid transparent;

		&--on {
			border-color: #FFD700;
			color: #FFD700;
		}
	}

	.tip {
		color: #666666;
		font-size: 22rpx;
		line-height: 1.6;
		text-align: center;
	}
</style>
