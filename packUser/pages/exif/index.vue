<template>
	<page-layout customClass="navbar__content">
		<app-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="arrow-left" title="修改图片信息" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<view class="fu-m-x-30 fu-m-t-20">
			<!-- 1. 选图 -->
			<view class="card fu-border fu-bg-main fu-b-r-10">
				<up-text text="1. 选择照片" color="#ffffff" size="28rpx" bold />

				<view v-if="!picked" class="picker fu-m-t-20" @click="onChoose">
					<up-icon name="plus" color="#666666" size="40rpx" />
					<view class="fu-m-t-15">
						<up-text text="点击从相册选择（仅支持 JPG）" color="#666666" size="26rpx" />
					</view>
				</view>

				<block v-else>
					<view class="preview fu-m-t-20">
						<app-image width="100%" height="100%" mode="aspectFit" bgColor="#222222" :src="picked.path"></app-image>
					</view>
					<view class="fu-m-t-20">
						<view class="row"><up-text text="当前机型" color="#999999" size="24rpx" /><up-text :text="originText" color="#cccccc" size="24rpx" /></view>
						<view class="row"><up-text text="当前时间" color="#999999" size="24rpx" /><up-text :text="origin.dateTime || '（无）'" color="#cccccc" size="24rpx" /></view>
						<view class="row"><up-text text="当前坐标" color="#999999" size="24rpx" /><up-text :text="originGps" color="#cccccc" size="24rpx" /></view>
					</view>
					<view class="fu-m-t-20">
						<up-button color="#333333" shape="round" :customStyle="{ height: '68rpx' }" @click="onChoose">
							<text style="color: #cccccc; font-size: 26rpx;">重新选择</text>
						</up-button>
					</view>
				</block>
			</view>

			<block v-if="picked">
				<!-- 2. 机型 -->
				<view class="card fu-border fu-bg-main fu-b-r-10 fu-m-t-20">
					<up-text text="2. 机型" color="#ffffff" size="28rpx" bold />
					<view v-for="g in DEVICE_PRESETS" :key="g.brand" class="fu-m-t-20">
						<up-text :text="g.brand" color="#666666" size="22rpx" />
						<view class="chips fu-m-t-10">
							<view
								v-for="it in g.items" :key="it.model"
								class="chip" :class="{ 'chip--on': device && device.model === it.model }"
								@click="onPickDevice(it)"
							>{{ it.label }}</view>
						</view>
					</view>
				</view>

				<!-- 3. 摄像头 -->
				<view v-if="device" class="card fu-border fu-bg-main fu-b-r-10 fu-m-t-20">
					<up-text text="3. 摄像头" color="#ffffff" size="28rpx" bold />
					<view class="chips fu-m-t-20">
						<view
							v-for="l in device.lenses" :key="l.key"
							class="chip" :class="{ 'chip--on': lens && lens.key === l.key }"
							@click="lens = l"
						>{{ l.label }}</view>
					</view>
					<view v-if="lens" class="fu-m-t-15">
						<up-text :text="`${lens.focalLength}mm  f/${lens.fNumber}  等效${lens.focal35}mm`" color="#666666" size="22rpx" />
					</view>
				</view>

				<!-- 4. 拍摄时间 -->
				<view class="card fu-border fu-bg-main fu-b-r-10 fu-m-t-20">
					<view class="row row--head">
						<up-text text="4. 拍摄时间" color="#ffffff" size="28rpx" bold />
						<view v-if="dateTime" @click="dateTime = ''">
							<up-text text="不修改" color="#666666" size="22rpx" />
						</view>
					</view>
					<view class="fu-m-t-20" @click="showTimePicker = true">
						<view class="field">
							<up-text :text="dateTime || '点击选择（不选则保留原时间）'" :color="dateTime ? '#cccccc' : '#666666'" size="26rpx" />
							<up-icon name="arrow-right" color="#666666" size="14" />
						</view>
					</view>
				</view>

				<!-- 5. 拍摄地点 -->
				<view class="card fu-border fu-bg-main fu-b-r-10 fu-m-t-20">
					<view class="row row--head">
						<up-text text="5. 拍摄地点" color="#ffffff" size="28rpx" bold />
						<view v-if="place" @click="place = null">
							<up-text text="不修改" color="#666666" size="22rpx" />
						</view>
					</view>
					<view v-for="r in LOCATION_PRESETS" :key="r.region" class="fu-m-t-20">
						<up-text :text="r.region" color="#666666" size="22rpx" />
						<view class="chips fu-m-t-10">
							<view
								v-for="it in r.items" :key="it.label"
								class="chip" :class="{ 'chip--on': place && place.label === it.label }"
								@click="place = it"
							>{{ it.label }}</view>
						</view>
					</view>
				</view>

				<!-- 保存 -->
				<view class="fu-m-t-40 fu-m-b-40">
					<up-button
						:disabled="!device || saving"
						color="linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
						shape="round" :customStyle="{ height: '88rpx' }"
						@click="onSave"
					><text style="color: #000000; font-size: 30rpx; font-weight: bold;">保存到相册</text></up-button>
					<view class="fu-m-t-20 tip">
						保存的是一张新照片，原图不会被改动。<br />
						只修改照片的拍摄信息，不影响画面内容。
					</view>
				</view>
			</block>
		</view>

		<up-datetime-picker
			:show="showTimePicker"
			v-model="pickerValue"
			mode="datetime"
			:formatter="pickerFormatter"
			@confirm="onTimeConfirm"
			@cancel="showTimePicker = false"
			@close="showTimePicker = false"
			closeOnClickOverlay
		/>
	</page-layout>
</template>

<script setup>
	/**
	 * 修改照片的拍摄信息（机型 / 摄像头 / 时间 / 地点）。
	 *
	 * 全程在本机完成，照片不上传服务器——改的只是几十字节元数据，
	 * 为它上传几 MB 原图既慢又没必要，也不该让用户的私人照片经过我们的服务器。
	 *
	 * 关键约束：选图必须 sizeType: ['original']。
	 * 微信默认返回压缩图，而压缩会把 EXIF 整段丢掉，
	 * 那样读到的永远是"无信息"，原有的拍摄参数也全没了。
	 */
	import { getCurrentInstance, ref, computed } from 'vue';
	import { readMeta, writeMeta } from '@/packUser/util/exif.js';
	import { DEVICE_PRESETS, LOCATION_PRESETS } from '@/packUser/util/devicePresets.js';

	const { $u, $mUtil } = getCurrentInstance().appContext.config.globalProperties;

	const picked = ref(null);
	const origin = ref({});
	const device = ref(null);
	const lens = ref(null);
	const dateTime = ref('');       // 空表示不修改
	const place = ref(null);        // null 表示不修改
	const saving = ref(false);

	const showTimePicker = ref(false);
	const pickerValue = ref(Date.now());

	const originText = computed(() => {
		const m = origin.value;
		if (!m.make && !m.model) return '（无）';
		return `${m.make || ''} ${m.model || ''}`.trim();
	});

	const originGps = computed(() => {
		const m = origin.value;
		if (typeof m.lat !== 'number' || typeof m.lng !== 'number') return '（无）';
		return `${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}`;
	});

	const pickerFormatter = (type, value) => {
		const unit = { year: '年', month: '月', day: '日', hour: '时', minute: '分' }[type];
		return unit ? `${value}${unit}` : value;
	};

	const onPickDevice = (item) => {
		device.value = item;
		// 换机型后镜头要跟着换，否则会出现"iPhone 机身配小米镜头"这种自相矛盾的组合
		lens.value = item.lenses && item.lenses[0];
	};

	const onTimeConfirm = (e) => {
		const d = new Date(e.value);
		const p = (n) => String(n).padStart(2, '0');
		// EXIF 时间格式是固定的 "YYYY:MM:DD HH:mm:ss"，分隔符是冒号不是横杠
		dateTime.value = `${d.getFullYear()}:${p(d.getMonth() + 1)}:${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
		showTimePicker.value = false;
	};

	const isJpeg = (path) => /\.(jpe?g)$/i.test(path || '');

	const onChoose = () => {
		uni.chooseImage({
			count: 1,
			sizeType: ['original'],   // 压缩图会丢掉整段 EXIF
			sourceType: ['album'],
			success: async (res) => {
				const path = res.tempFilePaths[0];
				if (!isJpeg(path)) return $u.toast('只支持 JPG 格式的照片');

				picked.value = { path };
				device.value = null;
				lens.value = null;
				dateTime.value = '';
				place.value = null;
				origin.value = {};

				try {
					origin.value = readMeta(await readFile(path)) || {};
				} catch (error) {
					// 读不出不算错：可能本来就没有 EXIF，照样能写入
					console.error('[Exif] 读取失败:', error);
					origin.value = {};
				}
			},
			fail: (err) => {
				if (err && /cancel/i.test(err.errMsg || '')) return;
				$u.toast('选择照片失败');
			}
		});
	};

	const readFile = (filePath) =>
		new Promise((resolve, reject) => {
			uni.getFileSystemManager().readFile({ filePath, success: (r) => resolve(r.data), fail: reject });
		});

	const writeTempFile = (data) =>
		new Promise((resolve, reject) => {
			const target = `${wx.env.USER_DATA_PATH}/exif_${Date.now()}.jpg`;
			uni.getFileSystemManager().writeFile({ filePath: target, data, success: () => resolve(target), fail: reject });
		});

	const onSave = async () => {
		if (saving.value || !picked.value || !device.value) return;
		saving.value = true;
		uni.showLoading({ title: '处理中...', mask: true });

		let tip = '';
		try {
			const meta = {
				make: device.value.make,
				model: device.value.model,
				software: device.value.software
			};
			if (lens.value) {
				meta.lens = {
					model: lens.value.model,
					focalLength: lens.value.focalLength,
					fNumber: lens.value.fNumber,
					focal35: lens.value.focal35
				};
			}
			// 没选就不传，writeMeta 会保留原值
			if (dateTime.value) meta.dateTime = dateTime.value;
			if (place.value) meta.gps = { lat: place.value.lat, lng: place.value.lng };

			const out = writeMeta(await readFile(picked.value.path), meta);
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
	.card { padding: 30rpx; }

	.picker {
		height: 200rpx;
		border: 2rpx dashed #444444;
		border-radius: 15rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.preview { height: 400rpx; border-radius: 15rpx; overflow: hidden; }

	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12rpx 0;
		border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);

		&--head { padding: 0; border-bottom: none; }
	}

	.field {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #2a2a2a;
		border-radius: 10rpx;
		padding: 20rpx 24rpx;
	}

	.chips { display: flex; flex-wrap: wrap; gap: 16rpx; }

	.chip {
		padding: 12rpx 24rpx;
		border-radius: 30rpx;
		background-color: #2a2a2a;
		color: #cccccc;
		font-size: 24rpx;
		border: 2rpx solid transparent;

		&--on { border-color: #FFD700; color: #FFD700; }
	}

	.tip {
		color: #666666;
		font-size: 22rpx;
		line-height: 1.6;
		text-align: center;
	}
</style>
