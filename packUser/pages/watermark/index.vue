<template>
	<view class="wm-page">
		<app-nav-bar leftIcon="arrow-left" title="图片加水印" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<!-- 预览区在普通流里、不参与滚动（canvas 是原生组件，放进 fixed/sticky 里一滚动就会错位/丢内容）。
		     页面本身不滚，只有下面的 scroll-view 内部滚动，预览就恒定不动。 -->
		<view class="wm-preview">
			<view v-if="!hasUserImg" class="wm-empty" @click="chooseImage">
				<up-icon name="plus" color="#999999" :size="40"></up-icon>
				<text class="wm-empty__t">点击选择图片</text>
			</view>
			<canvas v-show="hasUserImg" type="2d" id="wmCanvas" class="wm-canvas" :style="canvasStyle"></canvas>
		</view>

		<!-- 控件区：只有这一块滚动，canvas 不受影响 -->
		<scroll-view scroll-y class="wm-scroll">
			<view class="wm-panel">
				<!-- 水印文字 -->
				<view class="wm-row">
					<text class="wm-label">水印文字</text>
					<input class="wm-input" v-model="text" placeholder="输入水印文字" :maxlength="30" @input="onChange" />
				</view>

				<!-- 位置 -->
				<view class="wm-block">
					<text class="wm-label">水印位置</text>
					<view class="wm-pos">
						<view
							v-for="p in POSITIONS"
							:key="p.value"
							class="wm-pos__item"
							:class="{ 'wm-pos__item--on': position === p.value }"
							@click="setPosition(p.value)"
						>{{ p.label }}</view>
					</view>
				</view>

				<!-- 平铺时：交错/平铺 + 间距 -->
				<template v-if="position === 'tile'">
					<view class="wm-block">
						<text class="wm-label">排列方式</text>
						<view class="wm-seg">
							<view class="wm-seg__item" :class="{ 'wm-seg__item--on': tileMode === 'stagger' }" @click="setTileMode('stagger')">交错</view>
							<view class="wm-seg__item" :class="{ 'wm-seg__item--on': tileMode === 'plain' }" @click="setTileMode('plain')">平铺</view>
						</view>
					</view>
					<view class="wm-row">
						<text class="wm-label">文字间距</text>
						<slider class="wm-slider" :value="spacing" :min="10" :max="200" :step="5" activeColor="#ffffff" block-size="16" @changing="onSpacing" @change="onSpacing" />
						<view class="wm-stepper">
							<view class="wm-step__btn" @click="stepSpacing(-5)">-</view>
							<text class="wm-step__val">{{ spacing }}</text>
							<view class="wm-step__btn" @click="stepSpacing(5)">+</view>
						</view>
					</view>
				</template>

				<!-- 文字大小 -->
				<view class="wm-row">
					<text class="wm-label">文字大小</text>
					<slider class="wm-slider" :value="fontSize" :min="15" :max="120" :step="1" activeColor="#ffffff" block-size="16" @changing="onFontSize" @change="onFontSize" />
					<view class="wm-stepper">
						<view class="wm-step__btn" @click="stepFontSize(-2)">-</view>
						<text class="wm-step__val">{{ fontSize }}</text>
						<view class="wm-step__btn" @click="stepFontSize(2)">+</view>
					</view>
				</view>

				<!-- 透明度 -->
				<view class="wm-row">
					<text class="wm-label">透明度</text>
					<slider class="wm-slider" :value="opacity" :min="5" :max="100" :step="5" activeColor="#ffffff" block-size="16" @changing="onOpacity" @change="onOpacity" />
					<view class="wm-stepper">
						<view class="wm-step__btn" @click="stepOpacity(-5)">-</view>
						<text class="wm-step__val">{{ opacity }}%</text>
						<view class="wm-step__btn" @click="stepOpacity(5)">+</view>
					</view>
				</view>

				<!-- 颜色：预设 + RGB 调色板 -->
				<view class="wm-block">
					<view class="wm-color-head">
						<text class="wm-label">颜色</text>
						<view class="wm-color-cur" :style="{ background: colorCss }"></view>
					</view>
					<view class="wm-swatches">
						<view
							v-for="c in PRESETS"
							:key="c"
							class="wm-swatch"
							:class="{ 'wm-swatch--on': colorCss === c.toLowerCase() }"
							:style="{ background: c }"
							@click="pickPreset(c)"
						></view>
					</view>
					<view class="wm-rgb">
						<view class="wm-rgb__row">
							<text class="wm-rgb__k">R</text>
							<slider class="wm-slider" :value="rgb.r" :min="0" :max="255" activeColor="#ff4d4f" block-size="14" @changing="onR" @change="onR" />
							<text class="wm-rgb__v">{{ rgb.r }}</text>
						</view>
						<view class="wm-rgb__row">
							<text class="wm-rgb__k">G</text>
							<slider class="wm-slider" :value="rgb.g" :min="0" :max="255" activeColor="#52c41a" block-size="14" @changing="onG" @change="onG" />
							<text class="wm-rgb__v">{{ rgb.g }}</text>
						</view>
						<view class="wm-rgb__row">
							<text class="wm-rgb__k">B</text>
							<slider class="wm-slider" :value="rgb.b" :min="0" :max="255" activeColor="#1890ff" block-size="14" @changing="onB" @change="onB" />
							<text class="wm-rgb__v">{{ rgb.b }}</text>
						</view>
					</view>
				</view>

				<view class="wm-actions">
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

				<view class="wm-tip">水印在你的手机本地生成，不会上传服务器；设置会自动记住。</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
	import { getCurrentInstance, ref, reactive, computed } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';

	const { $mUtil } = getCurrentInstance().appContext.config.globalProperties;
	const instance = getCurrentInstance();

	const MAX_EDGE = 1600; // 导出图最大边
	const STORE_KEY = 'watermark_settings_v1';
	const POSITIONS = [
		{ label: '左上', value: 'tl' },
		{ label: '右上', value: 'tr' },
		{ label: '左下', value: 'bl' },
		{ label: '右下', value: 'br' },
		{ label: '中间', value: 'center' },
		{ label: '铺满', value: 'tile' },
	];
	// 调色板预设（含深浅与常用色）
	const PRESETS = [
		'#ffffff', '#000000', '#bfbfbf', '#ff4d4f', '#fa8c16', '#faad14',
		'#52c41a', '#13c2c2', '#1890ff', '#2f54eb', '#722ed1', '#eb2f96',
	];

	const imgPath = ref('');
	const imgW = ref(0);
	const imgH = ref(0);
	const canvasW = ref(0);
	const canvasH = ref(0);
	const saving = ref(false);
	const hasUserImg = ref(false); // false 时预览区只显示「选择图片」占位
	// 导出格式跟随原图。canvas 只能吐 jpg / png 两种:jpg→jpg、png→png,
	// 其余(webp/gif/bmp/判不出)无法原样保留,统一走 png(无损,不额外掉画质)
	const imgType = ref('png');

	// —— 可持久化的设置 ——
	const text = ref('仅供本人使用');
	const position = ref('tile');
	const tileMode = ref('stagger'); // stagger 交错 / plain 平铺
	const spacing = ref(60);
	const fontSize = ref(40); // 相对字号（占画布宽的比例 × 1000）
	const opacity = ref(40); // %
	const rgb = reactive({ r: 255, g: 255, b: 255 });

	const colorCss = computed(
		() => `#${[rgb.r, rgb.g, rgb.b].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`,
	);

	let canvasNode = null;
	let srcImg = null;      // 用户图片解码后的 Image,缓存复用

	// 屏幕尺寸 & 导航栏高度（吸顶偏移用）
	const sysW = ref(375);
	const sysH = ref(667);
	const navTop = ref(64);

	const rpx2px = (rpx) => (rpx * sysW.value) / 750;

	// 读文件头几字节,靠 magic number 判真实格式(比扩展名 / getImageInfo 可靠)
	const sniffFormat = (path) => {
		try {
			const buf = uni.getFileSystemManager().readFileSync(path, undefined, 0, 12);
			const u8 = new Uint8Array(buf);
			if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) return 'jpg';
			if (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4e && u8[3] === 0x47) return 'png';
			if (u8[0] === 0x47 && u8[1] === 0x49 && u8[2] === 0x46) return 'gif';
			if (u8[0] === 0x42 && u8[1] === 0x4d) return 'bmp';
			if (u8[0] === 0x52 && u8[1] === 0x49 && u8[2] === 0x46 && u8[3] === 0x46 &&
				u8[8] === 0x57 && u8[9] === 0x45 && u8[10] === 0x42 && u8[11] === 0x50) return 'webp';
		} catch (e) {}
		return '';
	};

	// 真实格式 → canvas 支持的导出格式(只有 jpg / png)。
	// 只有确认是 jpg 才导 jpg;png 导 png;其余无法原样保留,一律 png(无损)。
	const detectType = (path, info) => {
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

	// 预览显示尺寸：等比缩放，同时受「面板宽度」和「最高 42% 屏高」约束，
	// 保证竖图也不会占满整屏、下方设置能看见。
	const dispSize = computed(() => {
		if (!canvasW.value) return { w: 0, h: 0 };
		const ratio = canvasH.value / canvasW.value;
		const avail = sysW.value - rpx2px(60); // 减去左右各 30rpx 内边距
		const maxH = sysH.value * 0.42;
		let w = avail;
		let h = w * ratio;
		if (h > maxH) {
			h = maxH;
			w = h / ratio;
		}
		return { w, h };
	});

	const canvasStyle = computed(() => {
		if (!canvasW.value) return 'width:0;height:0;';
		return `width:${dispSize.value.w.toFixed(0)}px;height:${dispSize.value.h.toFixed(0)}px;`;
	});

	// 固定预览区的总高度（含上下 16rpx 内边距）；面板用它做 padding-top 让内容接在下面
	const previewBoxH = computed(() => {
		const padPx = rpx2px(32 + 16); // 上下各 16rpx + 与面板的 16rpx 间距
		if (!imgPath.value) return rpx2px(360) + padPx; // 空态占位盒高
		return dispSize.value.h + padPx;
	});

	// —— 持久化 ——
	const persist = () => {
		try {
			uni.setStorageSync(STORE_KEY, {
				text: text.value,
				position: position.value,
				tileMode: tileMode.value,
				spacing: spacing.value,
				fontSize: fontSize.value,
				opacity: opacity.value,
				rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
			});
		} catch (e) {}
	};
	const restore = () => {
		try {
			const s = uni.getStorageSync(STORE_KEY);
			if (!s) return;
			if (typeof s.text === 'string') text.value = s.text;
			if (s.position) position.value = s.position;
			if (s.tileMode) tileMode.value = s.tileMode;
			if (s.spacing != null) spacing.value = s.spacing;
			if (s.fontSize != null) fontSize.value = s.fontSize;
			if (s.opacity != null) opacity.value = s.opacity;
			if (s.rgb) Object.assign(rgb, s.rgb);
		} catch (e) {}
	};

	onLoad(() => {
		restore();
		try {
			const info = uni.getSystemInfoSync();
			sysW.value = info.windowWidth || sysW.value;
			sysH.value = info.windowHeight || sysH.value;
			navTop.value = (info.statusBarHeight || 20) + 44; // app-nav-bar 默认导航高
		} catch (e) {}
	});

	// 设置变更后：存本地 + 重画
	const onChange = () => {
		persist();
		render();
	};
	const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

	const setPosition = (v) => { position.value = v; onChange(); };
	const setTileMode = (v) => { tileMode.value = v; onChange(); };
	const onFontSize = (e) => { fontSize.value = e.detail.value; onChange(); };
	const stepFontSize = (d) => { fontSize.value = clamp(fontSize.value + d, 15, 120); onChange(); };
	const onOpacity = (e) => { opacity.value = e.detail.value; onChange(); };
	const stepOpacity = (d) => { opacity.value = clamp(opacity.value + d, 5, 100); onChange(); };
	const onSpacing = (e) => { spacing.value = e.detail.value; onChange(); };
	const stepSpacing = (d) => { spacing.value = clamp(spacing.value + d, 10, 200); onChange(); };
	const pickPreset = (hex) => {
		rgb.r = parseInt(hex.slice(1, 3), 16);
		rgb.g = parseInt(hex.slice(3, 5), 16);
		rgb.b = parseInt(hex.slice(5, 7), 16);
		onChange();
	};
	const onR = (e) => { rgb.r = e.detail.value; onChange(); };
	const onG = (e) => { rgb.g = e.detail.value; onChange(); };
	const onB = (e) => { rgb.b = e.detail.value; onChange(); };

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
						imgType.value = detectType(path, info);
						imgW.value = info.width;
						imgH.value = info.height;
						const scale = Math.min(1, MAX_EDGE / Math.max(info.width, info.height));
						canvasW.value = Math.round(info.width * scale);
						canvasH.value = Math.round(info.height * scale);
						srcImg = null; // 换图,强制重新解码
						setTimeout(render, 120);
					},
					fail: () => uni.showToast({ title: '读取图片失败', icon: 'none' }),
				});
			},
		});
	};

	const ensureNode = () =>
		new Promise((resolve) => {
			if (canvasNode) return resolve(canvasNode);
			uni.createSelectorQuery()
				.in(instance.proxy)
				.select('#wmCanvas')
				.fields({ node: true })
				.exec((res) => {
					canvasNode = (res && res[0] && res[0].node) || null;
					resolve(canvasNode);
				});
		});
	// 绘制源:用户图片解码一次后缓存到 srcImg 复用
	const ensureSrc = (node) =>
		new Promise((resolve, reject) => {
			if (srcImg) return resolve(srcImg);
			if (!imgPath.value) return resolve(null);
			const img = node.createImage();
			img.onload = () => { srcImg = img; resolve(img); };
			img.onerror = reject;
			img.src = imgPath.value;
		});

	const render = async () => {
		if (!canvasW.value) return;
		const node = await ensureNode();
		if (!node) return;
		const src = await ensureSrc(node);
		if (!src) return;
		node.width = canvasW.value;
		node.height = canvasH.value;
		const ctx = node.getContext('2d');
		ctx.clearRect(0, 0, canvasW.value, canvasH.value);
		ctx.drawImage(src, 0, 0, canvasW.value, canvasH.value);
		drawWatermark(ctx);
	};

	const drawWatermark = (ctx) => {
		const t = (text.value || '').trim();
		if (!t) return;
		const cw = canvasW.value;
		const ch = canvasH.value;
		const fontPx = Math.max(12, Math.round(cw * (fontSize.value / 1000)));
		ctx.font = `${fontPx}px sans-serif`;
		ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity.value / 100})`;

		if (position.value === 'tile') {
			ctx.textAlign = 'left';
			ctx.textBaseline = 'middle';
			const textW = ctx.measureText(t).width;
			const stepX = textW + fontPx * (spacing.value / 40);
			const stepY = fontPx * (1 + spacing.value / 40);
			ctx.save();
			ctx.translate(cw / 2, ch / 2);
			ctx.rotate((-20 * Math.PI) / 180);
			const diag = Math.sqrt(cw * cw + ch * ch);
			let row = 0;
			for (let y = -diag / 2; y < diag / 2; y += stepY) {
				const offset = tileMode.value === 'stagger' && row % 2 ? stepX / 2 : 0;
				for (let x = -diag / 2 - offset; x < diag / 2; x += stepX) {
					ctx.fillText(t, x, y);
				}
				row++;
			}
			ctx.restore();
			return;
		}

		// 单个：五个锚点
		const pad = fontPx;
		let x = pad;
		let y = pad;
		let align = 'left';
		let baseline = 'top';
		switch (position.value) {
			case 'tl': x = pad; y = pad; align = 'left'; baseline = 'top'; break;
			case 'tr': x = cw - pad; y = pad; align = 'right'; baseline = 'top'; break;
			case 'bl': x = pad; y = ch - pad; align = 'left'; baseline = 'bottom'; break;
			case 'br': x = cw - pad; y = ch - pad; align = 'right'; baseline = 'bottom'; break;
			case 'center': x = cw / 2; y = ch / 2; align = 'center'; baseline = 'middle'; break;
		}
		ctx.textAlign = align;
		ctx.textBaseline = baseline;
		ctx.fillText(t, x, y);
	};

	const saveImage = () => {
		if (!hasUserImg.value) { chooseImage(); return; } // 还没选图,先引导选图
		if (!canvasNode) {
			uni.showToast({ title: '请先选择图片', icon: 'none' });
			return;
		}
		saving.value = true;
		uni.canvasToTempFilePath({
			canvas: canvasNode,
			fileType: imgType.value,          // 跟随原图:png 保透明,其余走 jpg
			quality: imgType.value === 'jpg' ? 0.92 : 1, // quality 只对 jpg 生效
			success: (r) => {
				uni.saveImageToPhotosAlbum({
					filePath: r.tempFilePath,
					success: () => uni.showToast({ title: '已保存到相册', icon: 'success' }),
					fail: (err) => {
						const msg = (err && err.errMsg) || '';
						if (msg.includes('auth') || msg.includes('deny')) {
							uni.showModal({
								title: '需要相册权限',
								content: '保存图片需要你授权「保存到相册」，去设置里打开。',
								confirmText: '去设置',
								success: (m) => { if (m.confirm) uni.openSetting(); },
							});
						} else {
							uni.showToast({ title: '保存失败', icon: 'none' });
						}
					},
					complete: () => (saving.value = false),
				});
			},
			fail: () => {
				saving.value = false;
				uni.showToast({ title: '生成失败，请重试', icon: 'none' });
			},
		});
	};
</script>

<style lang="scss" scoped>
	// 整页占满视口且不滚动：导航占位 + 预览(不动) + 控件 scroll-view(内部滚动)
	.wm-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: #111111;
	}
	.wm-preview {
		position: relative;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16rpx 30rpx;
		background: #111111;
	}
	// 控件滚动区：占满剩余高度，内部滚动
	.wm-scroll {
		flex: 1;
		min-height: 0;
		box-sizing: border-box;
		padding: 4rpx 30rpx 60rpx;
	}
	.wm-empty {
		width: 100%;
		height: 360rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 16rpx;
		background: #1c1c1c;

		&__t {
			margin-top: 16rpx;
			color: #999999;
			font-size: 26rpx;
		}
	}
	.wm-canvas {
		display: block;
		border-radius: 12rpx;
	}
	.wm-panel {
		margin-top: 30rpx;
	}
	.wm-row {
		display: flex;
		align-items: center;
		min-height: 88rpx;
		border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
	}
	.wm-block {
		padding: 20rpx 0;
		border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
	}
	.wm-label {
		width: 140rpx;
		color: #ffffff;
		font-size: 28rpx;
		flex-shrink: 0;
	}
	.wm-input {
		flex: 1;
		color: #ffffff;
		font-size: 28rpx;
	}
	.wm-slider {
		flex: 1;
		margin: 0 16rpx;
	}
	// 位置九宫格
	.wm-pos {
		margin-top: 16rpx;
		display: flex;
		flex-wrap: wrap;
	}
	.wm-pos__item {
		width: calc((100% - 40rpx) / 3);
		margin: 0 20rpx 16rpx 0;
		height: 68rpx;
		line-height: 68rpx;
		text-align: center;
		border-radius: 12rpx;
		background: #262626;
		color: #cccccc;
		font-size: 26rpx;

		&:nth-child(3n) { margin-right: 0; }
		&--on { background: #ffffff; color: #000000; font-weight: bold; }
	}
	// 分段器
	.wm-seg {
		margin-top: 16rpx;
		display: flex;
		background: #262626;
		border-radius: 12rpx;
		overflow: hidden;
	}
	.wm-seg__item {
		flex: 1;
		height: 64rpx;
		line-height: 64rpx;
		text-align: center;
		color: #cccccc;
		font-size: 26rpx;

		&--on { background: #ffffff; color: #000000; font-weight: bold; }
	}
	// 加减步进器
	.wm-stepper {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}
	.wm-step__btn {
		width: 48rpx;
		height: 48rpx;
		line-height: 44rpx;
		text-align: center;
		border-radius: 8rpx;
		background: #262626;
		color: #ffffff;
		font-size: 34rpx;
	}
	.wm-step__val {
		min-width: 72rpx;
		text-align: center;
		color: #ffffff;
		font-size: 26rpx;
	}
	// 颜色
	.wm-color-head {
		display: flex;
		align-items: center;
	}
	.wm-color-cur {
		width: 44rpx;
		height: 44rpx;
		border-radius: 8rpx;
		margin-left: 16rpx;
		border: 2rpx solid rgba(255, 255, 255, 0.3);
	}
	.wm-swatches {
		margin-top: 20rpx;
		display: flex;
		flex-wrap: wrap;
	}
	.wm-swatch {
		width: 56rpx;
		height: 56rpx;
		border-radius: 50%;
		margin: 0 20rpx 20rpx 0;
		border: 2rpx solid rgba(255, 255, 255, 0.25);

		&--on { border-color: #55aaff; transform: scale(1.12); }
	}
	.wm-rgb {
		margin-top: 6rpx;
	}
	.wm-rgb__row {
		display: flex;
		align-items: center;
		height: 64rpx;
	}
	.wm-rgb__k {
		width: 36rpx;
		color: #cccccc;
		font-size: 26rpx;
	}
	.wm-rgb__v {
		width: 60rpx;
		text-align: right;
		color: #ffffff;
		font-size: 24rpx;
	}
	.wm-actions {
		display: flex;
		margin-top: 40rpx;
	}
	.wm-tip {
		margin-top: 24rpx;
		color: #777777;
		font-size: 22rpx;
		text-align: center;
	}
</style>
