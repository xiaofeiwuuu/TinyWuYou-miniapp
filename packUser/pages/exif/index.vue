<template>
	<page-layout customClass="navbar__content">
		<app-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="arrow-left" title="修改图片信息" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<view class="fu-m-x-30 fu-m-t-20">
			<!-- 选图 -->
			<view class="card fu-border fu-bg-main fu-b-r-10">
				<up-text text="选择照片" color="#ffffff" size="28rpx" bold />

				<view v-if="!picked" class="picker fu-m-t-20" @click="onChoose">
					<up-icon name="plus" color="#666666" size="40rpx" />
					<view class="fu-m-t-15">
						<up-text text="点击从相册选择（仅支持 JPG）" color="#666666" size="26rpx" />
					</view>
				</view>

				<block v-else>
					<view class="preview fu-m-t-20" @click="onChoose">
						<app-image width="100%" height="100%" mode="aspectFit" bgColor="#222222" :src="picked.path"></app-image>
					</view>
					<view class="fu-m-t-20">
						<view class="row"><up-text text="原机型" color="#999999" size="24rpx" /><up-text :text="originText" color="#cccccc" size="24rpx" /></view>
						<view class="row"><up-text text="原时间" color="#999999" size="24rpx" /><up-text :text="origin.dateTime || '（无）'" color="#cccccc" size="24rpx" /></view>
						<view class="row"><up-text text="原坐标" color="#999999" size="24rpx" /><up-text :text="originGps" color="#cccccc" size="24rpx" /></view>
					</view>
				</block>
			</view>

			<!-- 修改项：统一做成"点一行 → 底部弹窗选择" -->
			<view v-if="picked" class="card fu-border fu-bg-main fu-b-r-10 fu-m-t-20">
				<up-text text="修改为" color="#ffffff" size="28rpx" bold />

				<view class="fu-m-t-10">
					<view class="field" @click="openDevice">
						<up-text text="机型" color="#999999" size="26rpx" />
						<view class="field__right">
							<up-text :text="device ? device.label : '请选择'" :color="device ? '#ffffff' : '#666666'" size="26rpx" />
							<up-icon name="arrow-right" color="#666666" size="14" />
						</view>
					</view>

					<view class="field" :class="{ 'field--off': !device }" @click="openLens">
						<up-text text="摄像头" color="#999999" size="26rpx" />
						<view class="field__right">
							<up-text :text="lens ? lens.label : (device ? '请选择' : '请先选机型')" :color="lens ? '#ffffff' : '#666666'" size="26rpx" />
							<up-icon name="arrow-right" color="#666666" size="14" />
						</view>
					</view>

					<view class="field" @click="openTime">
						<up-text text="拍摄时间" color="#999999" size="26rpx" />
						<view class="field__right">
							<up-text :text="dateTime || '保持原样'" :color="dateTime ? '#ffffff' : '#666666'" size="26rpx" />
							<up-icon name="arrow-right" color="#666666" size="14" />
						</view>
					</view>

					<view class="field field--last" @click="openPlace">
						<up-text text="拍摄地点" color="#999999" size="26rpx" />
						<view class="field__right">
							<up-text :text="place ? place.label : '保持原样'" :color="place ? '#ffffff' : '#666666'" size="26rpx" />
							<up-icon name="arrow-right" color="#666666" size="14" />
						</view>
					</view>
				</view>

				<!-- 选好后把镜头参数摊开，让人能确认写进去的是什么 -->
				<view v-if="lens" class="detail fu-m-t-20">
					{{ lens.model }}<br />{{ lens.focalLength }}mm　f/{{ lens.fNumber }}　等效 {{ lens.focal35 }}mm
				</view>

				<view v-if="dateTime || place" class="fu-m-t-20">
					<up-button color="#333333" shape="round" :customStyle="{ height: '60rpx' }" @click="onReset">
						<text style="color: #999999; font-size: 24rpx;">时间和地点恢复原样</text>
					</up-button>
				</view>
			</view>

			<!-- 保存 -->
			<view v-if="picked" class="fu-m-t-40 fu-m-b-40">
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
		</view>

		<!--
			三个选择器都加 v-if：u-picker 的内容挂在 u-popup 里且没有 v-if 保护，
			而 u-popup 关闭时只是把根节点压成 0×0、并没有 overflow: hidden，
			内容会溢出到页面上（之前编辑资料页就这么漏出过一条竖排文字）。
			u-transition 的 show 监听带 immediate: true，
			所以挂载时 show 已为 true 也能正常播放进入动画。
		-->
		<up-picker
			v-if="showDevice"
			ref="devicePickerRef"
			:show="showDevice"
			:columns="deviceColumns"
			keyName="label"
			title="选择机型"
			@change="onDeviceChange"
			@confirm="onDeviceConfirm"
			@cancel="showDevice = false"
			@close="showDevice = false"
			closeOnClickOverlay
		/>

		<up-picker
			v-if="showLens"
			:show="showLens"
			:columns="lensColumns"
			keyName="label"
			title="选择摄像头"
			@confirm="onLensConfirm"
			@cancel="showLens = false"
			@close="showLens = false"
			closeOnClickOverlay
		/>

		<up-picker
			v-if="showPlace"
			ref="placePickerRef"
			:show="showPlace"
			:columns="placeColumns"
			keyName="label"
			title="选择拍摄地点"
			@change="onPlaceChange"
			@confirm="onPlaceConfirm"
			@cancel="showPlace = false"
			@close="showPlace = false"
			closeOnClickOverlay
		/>

		<up-datetime-picker
			v-if="showTime"
			:show="showTime"
			v-model="timeValue"
			mode="datetime"
			title="选择拍摄时间"
			:formatter="timeFormatter"
			@confirm="onTimeConfirm"
			@cancel="showTime = false"
			@close="showTime = false"
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
	const dateTime = ref('');   // 空 = 保持原样
	const place = ref(null);    // null = 保持原样
	const saving = ref(false);

	const showDevice = ref(false);
	const showLens = ref(false);
	const showTime = ref(false);
	const showPlace = ref(false);
	const timeValue = ref(Date.now());

	// 两列联动需要调用组件的 setColumnValues，微信小程序下事件不回传实例，只能靠 ref
	const devicePickerRef = ref(null);
	const placePickerRef = ref(null);

	/* ── 机型：品牌 + 型号 两列联动 ── */
	const brandIndex = ref(0);
	const deviceColumns = ref([
		DEVICE_PRESETS.map((g) => ({ label: g.brand })),
		DEVICE_PRESETS[0].items
	]);

	const openDevice = () => {
		// 打开时定位到当前已选项，而不是每次都回到第一个
		if (device.value) {
			const bi = DEVICE_PRESETS.findIndex((g) => g.items.some((i) => i.model === device.value.model));
			if (bi >= 0) {
				brandIndex.value = bi;
				deviceColumns.value = [DEVICE_PRESETS.map((g) => ({ label: g.brand })), DEVICE_PRESETS[bi].items];
			}
		}
		showDevice.value = true;
	};

	/**
	 * 第一列（品牌）变了才刷新第二列，否则滚第二列时它会被不断重置。
	 *
	 * 用 ref 调组件方法而不是 e.picker：u-picker 的源码里明确写着
	 * "微信小程序不能传递 this，会因为循环引用而报错"，
	 * 所以 MP-WEIXIN 下 change 事件的载荷里根本没有 picker 字段。
	 */
	const onDeviceChange = (e) => {
		if (e.columnIndex !== 0) return;
		brandIndex.value = e.index;
		devicePickerRef.value?.setColumnValues(1, DEVICE_PRESETS[e.index].items);
	};

	const onDeviceConfirm = (e) => {
		const picked2 = e.value[1];
		if (picked2) {
			device.value = picked2;
			// 换机型必须重选镜头，否则会出现"iPhone 机身配小米镜头"这种自相矛盾的组合
			lens.value = picked2.lenses && picked2.lenses[0];
		}
		showDevice.value = false;
	};

	/* ── 摄像头：单列 ── */
	const lensColumns = computed(() => [device.value ? device.value.lenses : []]);

	const openLens = () => {
		if (!device.value) return $u.toast('请先选择机型');
		showLens.value = true;
	};

	const onLensConfirm = (e) => {
		if (e.value[0]) lens.value = e.value[0];
		showLens.value = false;
	};

	/* ── 地点：地区 + 地点 两列联动 ── */
	const placeColumns = ref([
		LOCATION_PRESETS.map((r) => ({ label: r.region })),
		LOCATION_PRESETS[0].items
	]);

	const openPlace = () => {
		if (place.value) {
			const ri = LOCATION_PRESETS.findIndex((r) => r.items.some((i) => i.label === place.value.label));
			if (ri >= 0) {
				placeColumns.value = [LOCATION_PRESETS.map((r) => ({ label: r.region })), LOCATION_PRESETS[ri].items];
			}
		}
		showPlace.value = true;
	};

	const onPlaceChange = (e) => {
		if (e.columnIndex !== 0) return;
		placePickerRef.value?.setColumnValues(1, LOCATION_PRESETS[e.index].items);
	};

	const onPlaceConfirm = (e) => {
		if (e.value[1]) place.value = e.value[1];
		showPlace.value = false;
	};

	/* ── 时间 ── */
	const openTime = () => {
		timeValue.value = Date.now();
		showTime.value = true;
	};

	const timeFormatter = (type, value) => {
		const unit = { year: '年', month: '月', day: '日', hour: '时', minute: '分' }[type];
		return unit ? `${value}${unit}` : value;
	};

	const onTimeConfirm = (e) => {
		const d = new Date(e.value);
		const p = (n) => String(n).padStart(2, '0');
		// EXIF 时间格式固定是 "YYYY:MM:DD HH:mm:ss"，分隔符是冒号不是横杠
		dateTime.value = `${d.getFullYear()}:${p(d.getMonth() + 1)}:${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
		showTime.value = false;
	};

	const onReset = () => {
		dateTime.value = '';
		place.value = null;
	};

	/* ── 原信息展示 ── */
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

	/* ── 选图与保存 ── */
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
	}

	.field {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 26rpx 0;
		border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);

		&--last { border-bottom: none; }

		// 未满足前置条件时变暗，但仍可点击——点了会提示"请先选机型"，
		// 比直接无响应更容易理解
		&--off { opacity: 0.5; }

		&__right {
			display: flex;
			align-items: center;
			gap: 10rpx;
			// 长机型名不要把左边的标签挤没
			max-width: 60%;
		}
	}

	.detail {
		background-color: #222222;
		border-radius: 10rpx;
		padding: 20rpx;
		color: #888888;
		font-size: 22rpx;
		line-height: 1.7;
	}

	.tip {
		color: #666666;
		font-size: 22rpx;
		line-height: 1.6;
		text-align: center;
	}
</style>
