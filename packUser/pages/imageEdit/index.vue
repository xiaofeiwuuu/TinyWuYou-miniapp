<template>
	<view class="ed-page">
		<app-nav-bar leftIcon="arrow-left" title="图片编辑" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<!-- 预览区在普通流里、不参与滚动(canvas 是原生组件,放进 fixed/sticky 里一滚动就错位)。
		     没选图时只放「选择图片」占位;棋盘格背景用来看清 PNG 圆角处的透明。 -->
		<view class="ed-preview">
			<view v-if="!hasUserImg" class="ed-empty" @click="chooseImage">
				<up-icon name="plus" color="#999999" :size="40"></up-icon>
				<text class="ed-empty__t">点击选择图片</text>
			</view>
			<canvas v-show="hasUserImg" type="2d" id="edCanvas" class="ed-canvas" :style="canvasStyle"></canvas>
		</view>

		<scroll-view scroll-y class="ed-scroll">
			<view class="ed-panel">
				<!-- 尺寸 -->
				<view class="ed-block" :class="{ 'ed-block--off': !hasUserImg }">
					<view class="ed-block__head">
						<text class="ed-label">尺寸</text>
						<text class="ed-sub">{{ hasUserImg ? '原图 ' + srcW + '×' + srcH : '选择图片后可调整' }}</text>
					</view>
					<view class="ed-row">
						<slider class="ed-slider" :value="scalePct" :min="5" :max="100" :step="1" :disabled="!hasUserImg" activeColor="#ffffff" block-size="16" @changing="onScale" @change="onScale" />
						<text class="ed-scale">{{ hasUserImg ? scalePct + '%' : '—' }}</text>
					</view>
					<view class="ed-wh">
						<view class="ed-wh__field">
							<text class="ed-wh__k">宽</text>
							<input class="ed-wh__input" type="number" :disabled="!hasUserImg" :value="hasUserImg ? String(targetW) : ''" placeholder="—" @blur="onW" @confirm="onW" />
						</view>
						<view class="ed-lock" :class="{ 'ed-lock--on': lockRatio }" @click="toggleLock">
							<up-icon :name="lockRatio ? 'lock' : 'lock-open'" :color="lockRatio ? '#111111' : '#cccccc'" :size="16"></up-icon>
						</view>
						<view class="ed-wh__field">
							<text class="ed-wh__k">高</text>
							<input class="ed-wh__input" type="number" :disabled="!hasUserImg" :value="hasUserImg ? String(targetH) : ''" placeholder="—" @blur="onH" @confirm="onH" />
						</view>
					</view>
				</view>

				<!-- 导出格式 -->
				<view class="ed-block">
					<text class="ed-label">导出格式</text>
					<view class="ed-seg">
						<view class="ed-seg__item" :class="{ 'ed-seg__item--on': outFormat === 'jpg' }" @click="setFormat('jpg')">JPG</view>
						<view class="ed-seg__item" :class="{ 'ed-seg__item--on': outFormat === 'png' }" @click="setFormat('png')">PNG</view>
					</view>
					<text class="ed-hint">{{ outFormat === 'jpg' ? '可压缩;不支持圆角(透明)' : '无损、体积大;支持圆角,压缩无效' }}</text>
				</view>

				<!-- 压缩程度(仅 JPG) -->
				<view class="ed-row" :class="{ 'ed-row--off': outFormat !== 'jpg' }">
					<text class="ed-label">压缩程度</text>
					<slider class="ed-slider" :value="quality" :min="10" :max="100" :step="1" :disabled="outFormat !== 'jpg'" activeColor="#ffffff" block-size="16" @changing="onQuality" @change="onQuality" />
					<view class="ed-stepper">
						<view class="ed-step__btn" @click="stepQuality(-5)">-</view>
						<text class="ed-step__val">{{ quality }}</text>
						<view class="ed-step__btn" @click="stepQuality(5)">+</view>
					</view>
				</view>

				<!-- 模糊程度 -->
				<view class="ed-row">
					<text class="ed-label">模糊程度</text>
					<slider class="ed-slider" :value="blur" :min="0" :max="100" :step="1" activeColor="#ffffff" block-size="16" @changing="onBlur" @change="onBlur" />
					<view class="ed-stepper">
						<view class="ed-step__btn" @click="stepBlur(-5)">-</view>
						<text class="ed-step__val">{{ blur }}</text>
						<view class="ed-step__btn" @click="stepBlur(5)">+</view>
					</view>
				</view>

				<!-- 圆角程度(仅 PNG) -->
				<view class="ed-row" :class="{ 'ed-row--off': outFormat !== 'png' }">
					<text class="ed-label">圆角程度</text>
					<slider class="ed-slider" :value="radius" :min="0" :max="100" :step="1" :disabled="outFormat !== 'png'" activeColor="#ffffff" block-size="16" @changing="onRadius" @change="onRadius" />
					<view class="ed-stepper">
						<view class="ed-step__btn" @click="stepRadius(-5)">-</view>
						<text class="ed-step__val">{{ radius }}</text>
						<view class="ed-step__btn" @click="stepRadius(5)">+</view>
					</view>
				</view>

				<view class="ed-actions">
					<template v-if="hasUserImg">
						<up-button color="#333333" shape="round" :customStyle="{ flex: 1, height: '80rpx' }" @click="chooseImage">
							<text style="color:#ffffff;">换一张</text>
						</up-button>
						<up-button color="#ffffff" shape="round" :customStyle="{ flex: 1, height: '80rpx', marginLeft: '20rpx' }" :loading="saving" @click="saveImage">
							<text style="color:#000000;font-weight:bold;">保存到相册</text>
						</up-button>
					</template>
					<up-button v-else color="#ffffff" shape="round" :customStyle="{ flex: 1, height: '80rpx' }" @click="chooseImage">
						<text style="color:#000000;font-weight:bold;">选择图片</text>
					</up-button>
				</view>

				<view class="ed-tip">全程在本机处理,不上传服务器;设置会自动记住。</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import { getCurrentInstance, ref, computed } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';

	const { $mUtil } = getCurrentInstance().appContext.config.globalProperties;
	const instance = getCurrentInstance();

	const STORE_KEY = 'image_edit_settings_v1';

	const imgPath = ref('');
	const hasUserImg = ref(false); // false 时预览区只显示「选择图片」占位
	const srcW = ref(0);
	const srcH = ref(0);
	const targetW = ref(0);
	const targetH = ref(0);
	const saving = ref(false);

	// —— 可持久化设置 ——
	const outFormat = ref('png'); // 默认跟随原图,选图时确定
	const quality = ref(80);      // 仅 JPG 生效
	const blur = ref(0);          // 0-100,降采样近似模糊
	const radius = ref(0);        // 0-100,占最短边一半的百分比;仅 PNG 生效
	const lockRatio = ref(true);

	const sysW = ref(375);
	const sysH = ref(667);
	const rpx2px = (rpx) => (rpx * sysW.value) / 750;
	const clampInt = (v, min, max) => Math.max(min, Math.min(max, Math.round(v) || min));

	let canvasNode = null;
	let loadedImg = null;   // 用户图片解码后的 Image,缓存复用
	let offCanvas = null;   // 模糊降采样专用离屏画布

	// —— 格式判定:文件头 magic number 优先 ——
	const sniffFormat = (path) => {
		try {
			const buf = uni.getFileSystemManager().readFileSync(path, undefined, 0, 12);
			const u8 = new Uint8Array(buf);
			if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return 'jpg';
			if (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) return 'png';
		} catch (e) {}
		return '';
	};
	const detectFormat = (path, info) => {
		let f = sniffFormat(path);
		if (!f) {
			const t = (info && info.type ? String(info.type) : '').toLowerCase();
			if (t.includes('png')) f = 'png';
			else if (t.includes('jpg') || t.includes('jpeg')) f = 'jpg';
			else if (/\.png$/i.test(path || '')) f = 'png';
			else if (/\.jpe?g$/i.test(path || '')) f = 'jpg';
		}
		return f === 'jpg' ? 'jpg' : 'png';
	};

	// 预览显示尺寸:按「目标宽高比」等比适配面板宽度与 42% 屏高
	const previewDisp = computed(() => {
		if (!targetW.value || !targetH.value) return { w: 0, h: 0 };
		const ratio = targetH.value / targetW.value;
		const avail = sysW.value - rpx2px(60);
		const maxH = sysH.value * 0.42;
		let w = avail;
		let h = w * ratio;
		if (h > maxH) { h = maxH; w = h / ratio; }
		return { w, h };
	});
	const canvasStyle = computed(() => {
		if (!targetW.value) return 'width:0;height:0;';
		return `width:${previewDisp.value.w.toFixed(0)}px;height:${previewDisp.value.h.toFixed(0)}px;`;
	});
	const scalePct = computed(() => {
		if (!srcW.value || !targetW.value) return 100;
		return Math.max(1, Math.min(100, Math.round((targetW.value / srcW.value) * 100)));
	});

	// —— 持久化(尺寸依赖具体图片,不存;只存风格类设置) ——
	const persist = () => {
		try {
			uni.setStorageSync(STORE_KEY, {
				quality: quality.value,
				blur: blur.value,
				radius: radius.value,
				lockRatio: lockRatio.value,
			});
		} catch (e) {}
	};
	const restore = () => {
		try {
			const s = uni.getStorageSync(STORE_KEY);
			if (!s) return;
			if (s.quality != null) quality.value = s.quality;
			if (s.blur != null) blur.value = s.blur;
			if (s.radius != null) radius.value = s.radius;
			if (typeof s.lockRatio === 'boolean') lockRatio.value = s.lockRatio;
		} catch (e) {}
	};

	onLoad(() => {
		restore();
		try {
			const info = uni.getSystemInfoSync();
			sysW.value = info.windowWidth || sysW.value;
			sysH.value = info.windowHeight || sysH.value;
		} catch (e) {}
	});

	// —— 画布 & 图片准备 ——
	const ensureNode = () =>
		new Promise((resolve) => {
			if (canvasNode) return resolve(canvasNode);
			uni.createSelectorQuery()
				.in(instance.proxy)
				.select('#edCanvas')
				.fields({ node: true })
				.exec((res) => {
					canvasNode = (res && res[0] && res[0].node) || null;
					resolve(canvasNode);
				});
		});
	const ensureImg = (node) =>
		new Promise((resolve, reject) => {
			if (loadedImg) return resolve(loadedImg);
			const img = node.createImage();
			img.onload = () => { loadedImg = img; resolve(img); };
			img.onerror = reject;
			img.src = imgPath.value;
		});
	const getOff = (w, h) => {
		if (!offCanvas) offCanvas = uni.createOffscreenCanvas({ type: '2d', width: w, height: h });
		else { offCanvas.width = w; offCanvas.height = h; }
		return offCanvas;
	};

	const roundRectPath = (ctx, w, h, r) => {
		r = Math.min(r, w / 2, h / 2);
		ctx.beginPath();
		ctx.moveTo(r, 0);
		ctx.lineTo(w - r, 0); ctx.arcTo(w, 0, w, r, r);
		ctx.lineTo(w, h - r); ctx.arcTo(w, h, w - r, h, r);
		ctx.lineTo(r, h); ctx.arcTo(0, h, 0, h - r, r);
		ctx.lineTo(0, r); ctx.arcTo(0, 0, r, 0, r);
		ctx.closePath();
	};

	// 把图片按当前设置画到 (cw,ch)。模糊用「缩小再放大」近似(微信 canvas 的 filter 不可靠)。
	const compose = (ctx, cw, ch) => {
		ctx.clearRect(0, 0, cw, ch);
		ctx.save();
		if (outFormat.value === 'png' && radius.value > 0) {
			const r = (Math.min(cw, ch) * radius.value) / 100 / 2;
			roundRectPath(ctx, cw, ch, r);
			ctx.clip();
		}
		if (blur.value > 0) {
			const f = 1 + blur.value * 0.2;
			const sw = Math.max(1, Math.round(cw / f));
			const sh = Math.max(1, Math.round(ch / f));
			const off = getOff(sw, sh);
			const octx = off.getContext('2d');
			octx.clearRect(0, 0, sw, sh);
			octx.drawImage(loadedImg, 0, 0, sw, sh);
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(off, 0, 0, sw, sh, 0, 0, cw, ch);
		} else {
			ctx.drawImage(loadedImg, 0, 0, cw, ch);
		}
		ctx.restore();
	};

	const render = async () => {
		if (!imgPath.value) return;
		const node = await ensureNode();
		if (!node) return;
		await ensureImg(node);
		const pw = Math.max(1, Math.round(previewDisp.value.w));
		const ph = Math.max(1, Math.round(previewDisp.value.h));
		node.width = pw;
		node.height = ph;
		compose(node.getContext('2d'), pw, ph);
	};

	// —— 交互 ——
	const onGeom = () => { persist(); render(); };
	const onGeomNoRender = () => { persist(); };

	const onScale = (e) => {
		const p = e.detail.value;
		targetW.value = Math.max(1, Math.round((srcW.value * p) / 100));
		targetH.value = Math.max(1, Math.round((srcH.value * p) / 100));
		onGeom();
	};
	const onW = (e) => {
		const v = clampInt(parseInt(e.detail.value, 10), 1, 10000);
		targetW.value = v;
		if (lockRatio.value && srcW.value) targetH.value = Math.max(1, Math.round((v * srcH.value) / srcW.value));
		onGeom();
	};
	const onH = (e) => {
		const v = clampInt(parseInt(e.detail.value, 10), 1, 10000);
		targetH.value = v;
		if (lockRatio.value && srcH.value) targetW.value = Math.max(1, Math.round((v * srcW.value) / srcH.value));
		onGeom();
	};
	const toggleLock = () => {
		lockRatio.value = !lockRatio.value;
		// 重新打开锁定时,以宽为准把高吸附回原始比例
		if (lockRatio.value && srcW.value) targetH.value = Math.max(1, Math.round((targetW.value * srcH.value) / srcW.value));
		onGeom();
	};

	const setFormat = (f) => { outFormat.value = f; render(); }; // 切格式会启停圆角,要重画
	const onQuality = (e) => { quality.value = e.detail.value; onGeomNoRender(); }; // 只影响导出文件,不重画
	const stepQuality = (d) => { quality.value = clampInt(quality.value + d, 10, 100); onGeomNoRender(); };
	const onBlur = (e) => { blur.value = e.detail.value; onGeom(); };
	const stepBlur = (d) => { blur.value = clampInt(blur.value + d, 0, 100); onGeom(); };
	const onRadius = (e) => { radius.value = e.detail.value; onGeom(); };
	const stepRadius = (d) => { radius.value = clampInt(radius.value + d, 0, 100); onGeom(); };

	const chooseImage = () => {
		uni.chooseImage({
			count: 1,
			sizeType: ['original'],
			sourceType: ['album', 'camera'],
			success: (res) => {
				const path = res.tempFilePaths[0];
				uni.getImageInfo({
					src: path,
					success: (info) => {
						imgPath.value = path;
						hasUserImg.value = true;
						srcW.value = info.width;
						srcH.value = info.height;
						targetW.value = info.width;
						targetH.value = info.height;
						outFormat.value = detectFormat(path, info);
						loadedImg = null; // 换图必须重新解码
						setTimeout(render, 120);
					},
					fail: () => uni.showToast({ title: '读取图片失败', icon: 'none' }),
				});
			},
		});
	};

	const saveToAlbum = (filePath) => {
		uni.saveImageToPhotosAlbum({
			filePath,
			success: () => uni.showToast({ title: '已保存到相册', icon: 'success' }),
			fail: (err) => {
				const msg = (err && err.errMsg) || '';
				if (msg.includes('auth') || msg.includes('deny')) {
					uni.showModal({
						title: '需要相册权限',
						content: '保存图片需要你授权「保存到相册」,去设置里打开。',
						confirmText: '去设置',
						success: (m) => { if (m.confirm) uni.openSetting(); },
					});
				} else {
					uni.showToast({ title: '保存失败', icon: 'none' });
				}
			},
			complete: () => { saving.value = false; render(); }, // 还原预览分辨率
		});
	};

	const saveImage = async () => {
		if (!hasUserImg.value) { chooseImage(); return; } // 还没选图,先引导选图
		const node = await ensureNode();
		if (!node || !loadedImg) {
			uni.showToast({ title: '请先选择图片', icon: 'none' });
			return;
		}
		saving.value = true;
		// 导出用真实目标分辨率临时把画布放大,合成、导出后再由 render() 还原到预览尺寸
		const tw = clampInt(targetW.value, 1, 10000);
		const th = clampInt(targetH.value, 1, 10000);
		node.width = tw;
		node.height = th;
		compose(node.getContext('2d'), tw, th);
		uni.canvasToTempFilePath({
			canvas: node,
			x: 0, y: 0, width: tw, height: th, destWidth: tw, destHeight: th,
			fileType: outFormat.value,
			quality: outFormat.value === 'jpg' ? quality.value / 100 : 1,
			success: (r) => saveToAlbum(r.tempFilePath),
			fail: () => {
				saving.value = false;
				uni.showToast({ title: '生成失败,请重试', icon: 'none' });
				render();
			},
		});
	};
</script>

<style lang="scss" scoped>
	.ed-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: #111111;
	}
	.ed-preview {
		position: relative;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16rpx 30rpx;
		background: #111111;
	}
	.ed-scroll {
		flex: 1;
		min-height: 0;
		box-sizing: border-box;
		padding: 4rpx 30rpx 60rpx;
	}
	.ed-empty {
		width: 100%;
		height: 360rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 16rpx;
		background: #1c1c1c;

		&__t { margin-top: 16rpx; color: #999999; font-size: 26rpx; }
	}
	// 棋盘格,用来看清 PNG 圆角的透明区
	.ed-canvas {
		display: block;
		border-radius: 4rpx;
		background-color: #2a2a2a;
		background-image:
			linear-gradient(45deg, #3a3a3a 25%, transparent 25%),
			linear-gradient(-45deg, #3a3a3a 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #3a3a3a 75%),
			linear-gradient(-45deg, transparent 75%, #3a3a3a 75%);
		background-size: 24rpx 24rpx;
		background-position: 0 0, 0 12rpx, 12rpx -12rpx, -12rpx 0;
	}
	.ed-panel { margin-top: 30rpx; }
	.ed-row {
		display: flex;
		align-items: center;
		min-height: 88rpx;
		border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);

		&--off { opacity: 0.35; }
	}
	.ed-block {
		padding: 20rpx 0;
		border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);

		&__head { display: flex; align-items: center; justify-content: space-between; }
		&--off { opacity: 0.4; }
	}
	.ed-label { width: 150rpx; color: #ffffff; font-size: 28rpx; flex-shrink: 0; }
	.ed-sub { color: #888888; font-size: 24rpx; }
	.ed-hint { display: block; margin-top: 12rpx; color: #777777; font-size: 22rpx; }
	.ed-slider { flex: 1; margin: 0 16rpx; }
	.ed-scale { width: 84rpx; text-align: right; color: #ffffff; font-size: 26rpx; }
	// 宽高输入
	.ed-wh { display: flex; align-items: center; margin-top: 20rpx; }
	.ed-wh__field {
		flex: 1;
		display: flex;
		align-items: center;
		background: #262626;
		border-radius: 12rpx;
		padding: 0 20rpx;
		height: 72rpx;

		&__k { color: #888888; font-size: 26rpx; margin-right: 12rpx; }
	}
	.ed-wh__input { flex: 1; color: #ffffff; font-size: 28rpx; }
	.ed-lock {
		width: 64rpx;
		height: 64rpx;
		margin: 0 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 12rpx;
		background: #262626;
		flex-shrink: 0;

		&--on { background: #ffffff; }
	}
	.ed-seg {
		margin-top: 16rpx;
		display: flex;
		background: #262626;
		border-radius: 12rpx;
		overflow: hidden;
	}
	.ed-seg__item {
		flex: 1;
		height: 64rpx;
		line-height: 64rpx;
		text-align: center;
		color: #cccccc;
		font-size: 26rpx;

		&--on { background: #ffffff; color: #000000; font-weight: bold; }
	}
	.ed-stepper { display: flex; align-items: center; flex-shrink: 0; }
	.ed-step__btn {
		width: 48rpx;
		height: 48rpx;
		line-height: 44rpx;
		text-align: center;
		border-radius: 8rpx;
		background: #262626;
		color: #ffffff;
		font-size: 34rpx;
	}
	.ed-step__val { min-width: 60rpx; text-align: center; color: #ffffff; font-size: 26rpx; }
	.ed-actions { display: flex; margin-top: 40rpx; }
	.ed-tip { margin-top: 24rpx; color: #777777; font-size: 22rpx; text-align: center; }
</style>
