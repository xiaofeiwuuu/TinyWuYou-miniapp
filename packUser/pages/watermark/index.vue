<template>
	<view class="wm-page">
		<app-nav-bar leftIcon="arrow-left" title="图片加水印" :border="false" fixed @clickLeft="$mUtil.overBack()"></app-nav-bar>

		<view class="wm-body">
			<!-- 预览区：canvas 直接当预览，导出的就是它 -->
			<view class="wm-preview">
				<view v-if="!imgPath" class="wm-empty" @click="chooseImage">
					<up-icon name="plus" color="#999999" :size="40"></up-icon>
					<text class="wm-empty__t">点击选择图片</text>
				</view>
				<!-- canvas 必须真实渲染才能导出；未选图时用 0 尺寸占位 -->
				<canvas
					type="2d"
					id="wmCanvas"
					class="wm-canvas"
					:style="canvasStyle"
				></canvas>
			</view>

			<view v-if="imgPath" class="wm-panel">
				<view class="wm-row">
					<text class="wm-label">水印文字</text>
					<input
						class="wm-input"
						v-model="text"
						placeholder="输入水印文字，如 仅供本人使用"
						:maxlength="30"
						@input="render"
					/>
				</view>

				<view class="wm-row">
					<text class="wm-label">铺满整图</text>
					<switch :checked="tiled" color="#ffffff" @change="onTiledChange" />
				</view>

				<view class="wm-row">
					<text class="wm-label">文字大小</text>
					<slider class="wm-slider" :value="sizeLevel" :min="1" :max="5" :step="1" activeColor="#ffffff" block-size="18" @changing="onSize" @change="onSize" />
				</view>

				<view class="wm-row">
					<text class="wm-label">透明度</text>
					<slider class="wm-slider" :value="opacity" :min="10" :max="90" :step="10" activeColor="#ffffff" block-size="18" @changing="onOpacity" @change="onOpacity" />
				</view>

				<view class="wm-row">
					<text class="wm-label">颜色</text>
					<view class="wm-colors">
						<view
							v-for="c in COLORS"
							:key="c.value"
							class="wm-color"
							:class="{ 'wm-color--on': color === c.value }"
							:style="{ background: c.css }"
							@click="pickColor(c.value)"
						></view>
					</view>
				</view>

				<view class="wm-actions">
					<up-button color="#333333" shape="round" :customStyle="{ flex: 1, height: '80rpx' }" @click="chooseImage">
						<text style="color:#ffffff;">换一张</text>
					</up-button>
					<up-button color="#ffffff" shape="round" :customStyle="{ flex: 1, height: '80rpx', marginLeft: '20rpx' }" :loading="saving" @click="saveImage">
						<text style="color:#000000;font-weight:bold;">保存到相册</text>
					</up-button>
				</view>

				<view class="wm-tip">水印在你的手机本地生成，不会上传服务器。</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { getCurrentInstance, ref, computed } from 'vue';

	const { $mUtil } = getCurrentInstance().appContext.config.globalProperties;
	const instance = getCurrentInstance();

	// 导出图的最大边（原图可能几千像素，限一下省内存、够清晰）
	const MAX_EDGE = 1600;
	const COLORS = [
		{ value: 'white', css: '#ffffff' },
		{ value: 'black', css: '#000000' },
		{ value: 'red', css: '#ff4d4f' },
	];
	const COLOR_RGB = { white: '255,255,255', black: '0,0,0', red: '255,77,79' };

	const imgPath = ref('');
	const imgW = ref(0); // 原图宽高
	const imgH = ref(0);
	const canvasW = ref(0); // 画布(导出)像素宽高，等比缩到 MAX_EDGE 内
	const canvasH = ref(0);

	const text = ref('仅供本人使用');
	const tiled = ref(true);
	const sizeLevel = ref(3); // 1~5
	const opacity = ref(40); // 10~90
	const color = ref('white');
	const saving = ref(false);

	let canvasNode = null; // 缓存 canvas 节点，导出时用

	// 预览显示尺寸：按画布宽高比自适应，宽度撑满面板
	const canvasStyle = computed(() => {
		if (!canvasW.value) return 'width:0;height:0;';
		const ratio = canvasH.value / canvasW.value;
		return `width:100%;height:${(ratio * 100).toFixed(2)}vw;`;
	});

	const onTiledChange = (e) => {
		tiled.value = e.detail.value;
		render();
	};
	const onSize = (e) => {
		sizeLevel.value = e.detail.value;
		render();
	};
	const onOpacity = (e) => {
		opacity.value = e.detail.value;
		render();
	};
	const pickColor = (v) => {
		color.value = v;
		render();
	};

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
						imgW.value = info.width;
						imgH.value = info.height;
						// 等比缩到最大边以内
						const scale = Math.min(1, MAX_EDGE / Math.max(info.width, info.height));
						canvasW.value = Math.round(info.width * scale);
						canvasH.value = Math.round(info.height * scale);
						// 等 canvas 按新尺寸渲染后再画
						setTimeout(render, 100);
					},
					fail: () => uni.showToast({ title: '读取图片失败', icon: 'none' }),
				});
			},
		});
	};

	// 核心：把图片 + 水印画到 canvas
	const render = () => {
		if (!imgPath.value || !canvasW.value) return;
		uni.createSelectorQuery()
			.in(instance.proxy)
			.select('#wmCanvas')
			.fields({ node: true, size: true })
			.exec((res) => {
				const node = res && res[0] && res[0].node;
				if (!node) return;
				canvasNode = node;
				node.width = canvasW.value;
				node.height = canvasH.value;
				const ctx = node.getContext('2d');
				const img = node.createImage();
				img.onload = () => {
					ctx.clearRect(0, 0, canvasW.value, canvasH.value);
					ctx.drawImage(img, 0, 0, canvasW.value, canvasH.value);
					drawWatermark(ctx);
				};
				img.src = imgPath.value;
			});
	};

	const drawWatermark = (ctx) => {
		const t = (text.value || '').trim();
		if (!t) return;
		// 字号按画布宽度比例，再乘用户档位
		const fontPx = Math.max(12, Math.round((canvasW.value * 0.035) * (0.6 + sizeLevel.value * 0.25)));
		ctx.font = `${fontPx}px sans-serif`;
		ctx.fillStyle = `rgba(${COLOR_RGB[color.value]}, ${opacity.value / 100})`;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';

		if (tiled.value) {
			// 铺满：整块画布旋转 -20°，网格重复
			const textW = ctx.measureText(t).width;
			const stepX = textW + fontPx * 2;
			const stepY = fontPx * 3.2;
			ctx.save();
			ctx.translate(canvasW.value / 2, canvasH.value / 2);
			ctx.rotate((-20 * Math.PI) / 180);
			const diag = Math.sqrt(canvasW.value ** 2 + canvasH.value ** 2);
			for (let y = -diag / 2; y < diag / 2; y += stepY) {
				for (let x = -diag / 2; x < diag / 2; x += stepX) {
					ctx.fillText(t, x, y);
				}
			}
			ctx.restore();
		} else {
			// 单个：右下角
			const pad = fontPx;
			ctx.textAlign = 'right';
			ctx.textBaseline = 'bottom';
			ctx.fillText(t, canvasW.value - pad, canvasH.value - pad);
		}
	};

	const saveImage = () => {
		if (!canvasNode) {
			uni.showToast({ title: '请先选择图片', icon: 'none' });
			return;
		}
		saving.value = true;
		uni.canvasToTempFilePath({
			canvas: canvasNode,
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
								success: (m) => {
									if (m.confirm) uni.openSetting();
								},
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
	.wm-page {
		min-height: 100vh;
		background: #111111;
	}
	.wm-body {
		padding: 20rpx 30rpx 60rpx;
	}
	.wm-preview {
		width: 100%;
		border-radius: 16rpx;
		overflow: hidden;
		background: #1c1c1c;
	}
	.wm-empty {
		height: 400rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		&__t {
			margin-top: 16rpx;
			color: #999999;
			font-size: 26rpx;
		}
	}
	.wm-canvas {
		display: block;
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
	.wm-label {
		width: 140rpx;
		color: #ffffff;
		font-size: 28rpx;
	}
	.wm-input {
		flex: 1;
		color: #ffffff;
		font-size: 28rpx;
	}
	.wm-slider {
		flex: 1;
		margin: 0 10rpx;
	}
	.wm-colors {
		display: flex;
		flex: 1;
	}
	.wm-color {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		margin-right: 24rpx;
		border: 2rpx solid rgba(255, 255, 255, 0.3);

		&--on {
			border-color: #55aaff;
			transform: scale(1.1);
		}
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
