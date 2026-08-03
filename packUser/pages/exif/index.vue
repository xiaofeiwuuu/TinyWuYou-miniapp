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

			<view v-if="picked" class="card fu-border fu-bg-main fu-b-r-10 fu-m-t-20">
				<up-text text="修改为" color="#ffffff" size="28rpx" bold />

				<view class="fu-m-t-10">
					<!-- 机型：品牌 + 型号 两列联动 -->
					<picker
						mode="multiSelector"
						:range="deviceRange"
						:value="deviceIndex"
						@columnchange="onDeviceColumnChange"
						@change="onDeviceChange"
					>
						<view class="field">
							<text class="field__label">机型</text>
							<view class="field__right">
								<text class="field__value" :class="{ 'field__value--dim': !device }">{{ device ? device.label : '请选择' }}</text>
								<up-icon name="arrow-right" color="#666666" size="14" />
							</view>
						</view>
					</picker>

					<!-- 摄像头：单列。没选机型时不给点，避免弹出一个空选择器 -->
					<picker
						v-if="device"
						mode="selector"
						:range="lensLabels"
						:value="lensIndex"
						@change="onLensChange"
					>
						<view class="field">
							<text class="field__label">摄像头</text>
							<view class="field__right">
								<text class="field__value" :class="{ 'field__value--dim': !lens }">{{ lens ? lens.label : '请选择' }}</text>
								<up-icon name="arrow-right" color="#666666" size="14" />
							</view>
						</view>
					</picker>
					<view v-else class="field field--off" @click="$u.toast('请先选择机型')">
						<text class="field__label">摄像头</text>
						<view class="field__right">
							<text class="field__value field__value--dim">请先选机型</text>
							<up-icon name="arrow-right" color="#666666" size="14" />
						</view>
					</view>

					<!-- 日期 -->
					<picker mode="date" :value="dateStr || todayStr" @change="onDateChange">
						<view class="field">
							<text class="field__label">拍摄日期</text>
							<view class="field__right">
								<text class="field__value" :class="{ 'field__value--dim': !dateStr }">{{ dateStr || '保持原样' }}</text>
								<up-icon name="arrow-right" color="#666666" size="14" />
							</view>
						</view>
					</picker>

					<!-- 时刻 -->
					<picker mode="time" :value="timeStr || '12:00'" @change="onTimeChange">
						<view class="field">
							<text class="field__label">拍摄时刻</text>
							<view class="field__right">
								<text class="field__value" :class="{ 'field__value--dim': !timeStr }">{{ timeStr || (dateStr ? '12:00' : '保持原样') }}</text>
								<up-icon name="arrow-right" color="#666666" size="14" />
							</view>
						</view>
					</picker>

					<!-- 地点：地区 + 地点 两列联动 -->
					<picker
						mode="multiSelector"
						:range="placeRange"
						:value="placeIndex"
						@columnchange="onPlaceColumnChange"
						@change="onPlaceChange"
					>
						<view class="field field--last">
							<text class="field__label">拍摄地点</text>
							<view class="field__right">
								<text class="field__value" :class="{ 'field__value--dim': !place }">{{ place ? place.label : '保持原样' }}</text>
								<up-icon name="arrow-right" color="#666666" size="14" />
							</view>
						</view>
					</picker>
				</view>

				<!-- 选好后摊开镜头参数，让人能确认写进去的是什么 -->
				<view v-if="lens" class="detail fu-m-t-20">
					{{ lens.model }}<br />{{ lens.focalLength }}mm　f/{{ lens.fNumber }}　等效 {{ lens.focal35 }}mm
				</view>

				<view v-if="dateStr || timeStr || place" class="fu-m-t-20">
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
	</page-layout>
</template>

<script setup>
	/**
	 * 修改照片的拍摄信息（机型 / 摄像头 / 时间 / 地点）。
	 *
	 * 全程在本机完成，照片不上传服务器——改的只是几十字节元数据，
	 * 为它上传几 MB 原图既慢又没必要，也不该让用户的私人照片经过我们的服务器。
	 *
	 * ─── 为什么用原生 picker 而不是 uview-plus 的 u-picker ───
	 * u-picker 这条路两头堵：
	 *   常驻挂载  → u-popup 关闭时只把根节点压成 0×0、没有 overflow: hidden，
	 *              选择器内容会整块漏在页面里
	 *   加 v-if   → 组件带着 show=true 挂载，而 u-transition 的 vueEnter 是 async、
	 *              u-popup 挂载后还要递归查询子节点尺寸，这套初始化会被打乱，
	 *              弹窗掉进页面流里，没有遮罩也没有工具栏
	 * 原生 <picker> 由微信自己渲染，没有 popup/transition/尺寸查询这套机制，
	 * 不存在布局风险，而且原生就支持多列联动。
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
	const place = ref(null);
	const dateStr = ref('');   // YYYY-MM-DD，空 = 保持原样
	const timeStr = ref('');   // HH:mm
	const saving = ref(false);

	const pad = (n) => String(n).padStart(2, '0');
	const todayStr = (() => {
		const d = new Date();
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	})();

	/* ── 机型：两列联动 ── */
	const brandIndex = ref(0);
	const modelIndex = ref(0);

	// 原生 picker 的 range 只认字符串数组，所以传 label，回调里按下标取回完整对象
	const deviceRange = computed(() => [
		DEVICE_PRESETS.map((g) => g.brand),
		(DEVICE_PRESETS[brandIndex.value] || DEVICE_PRESETS[0]).items.map((i) => i.label)
	]);
	const deviceIndex = computed(() => [brandIndex.value, modelIndex.value]);

	const onDeviceColumnChange = (e) => {
		const { column, value } = e.detail;
		if (column === 0) {
			brandIndex.value = value;
			// 换品牌后第二列内容整个变了，下标必须归零，
			// 否则会停在一个越界的位置（比如从 7 款的苹果切到 2 款的华为）
			modelIndex.value = 0;
		} else {
			modelIndex.value = value;
		}
	};

	const onDeviceChange = (e) => {
		const [bi, mi] = e.detail.value;
		brandIndex.value = bi;
		modelIndex.value = mi;
		const item = DEVICE_PRESETS[bi] && DEVICE_PRESETS[bi].items[mi];
		if (!item) return;
		device.value = item;
		// 换机型必须重选镜头，否则会出现"iPhone 机身配小米镜头"这种自相矛盾的组合
		lens.value = item.lenses && item.lenses[0];
		lensIndex.value = 0;
	};

	/* ── 摄像头：单列 ── */
	const lensIndex = ref(0);
	const lensLabels = computed(() => (device.value ? device.value.lenses.map((l) => l.label) : []));

	const onLensChange = (e) => {
		const i = Number(e.detail.value);
		lensIndex.value = i;
		lens.value = device.value.lenses[i];
	};

	/* ── 地点：两列联动 ── */
	const regionIndex = ref(0);
	const spotIndex = ref(0);

	const placeRange = computed(() => [
		LOCATION_PRESETS.map((r) => r.region),
		(LOCATION_PRESETS[regionIndex.value] || LOCATION_PRESETS[0]).items.map((i) => i.label)
	]);
	const placeIndex = computed(() => [regionIndex.value, spotIndex.value]);

	const onPlaceColumnChange = (e) => {
		const { column, value } = e.detail;
		if (column === 0) {
			regionIndex.value = value;
			spotIndex.value = 0;
		} else {
			spotIndex.value = value;
		}
	};

	const onPlaceChange = (e) => {
		const [ri, si] = e.detail.value;
		regionIndex.value = ri;
		spotIndex.value = si;
		const item = LOCATION_PRESETS[ri] && LOCATION_PRESETS[ri].items[si];
		if (item) place.value = item;
	};

	/* ── 时间 ── */
	const onDateChange = (e) => { dateStr.value = e.detail.value; };
	const onTimeChange = (e) => { timeStr.value = e.detail.value; };

	/**
	 * 拼成 EXIF 要的格式 "YYYY:MM:DD HH:mm:ss"（分隔符是冒号不是横杠）。
	 * 只选了日期没选时刻就补 12:00——用中午而不是 00:00:00，
	 * 后者看起来像"没有时间信息"，容易让人误会没写进去。
	 */
	const exifDateTime = computed(() => {
		if (!dateStr.value) return '';
		const t = timeStr.value || '12:00';
		return `${dateStr.value.replace(/-/g, ':')} ${t}:00`;
	});

	const onReset = () => {
		dateStr.value = '';
		timeStr.value = '';
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
				place.value = null;
				dateStr.value = '';
				timeStr.value = '';
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
			if (exifDateTime.value) meta.dateTime = exifDateTime.value;
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
		&--off { opacity: 0.5; }

		&__label {
			color: #999999;
			font-size: 26rpx;
		}

		&__right {
			display: flex;
			align-items: center;
			gap: 10rpx;
			// 长机型名不要把左边的标签挤没
			max-width: 62%;
		}

		&__value {
			color: #ffffff;
			font-size: 26rpx;
			// 超长就省略，不要换行把行高撑开
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;

			&--dim { color: #666666; }
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
