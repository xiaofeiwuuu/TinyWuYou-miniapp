<template>
	<view class="fu-m-x-30 fu-p-b-50 fu-font-32">
		<view class="fu-m-b-20" v-for="(item,index) in list" :key="index">
			<view class="question-box__title">{{ `${index + 1 + '、'}${item.title}` }}</view>
			<p class="question-box__content">{{ item.content }}</p>
		</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue';

	// data数据
	let list = ref([
		{ title: '提示“下载成功”，在相册中找不到怎么办？', content: '问题偶尔发生，是宿主程序（非小程序）接口兼容性问题造成，图片被设置成了最早的日期，可打开相册，并翻到最后一页，尝试查找刚才已下载的图片。' },
		{ title: '提示“下载失败”怎么办？', content: '问题偶有发生，且多见于网络环境差的情况，请尝试WiFi环境或网络稳定的地方下载。' },
		{ title: '动态视频看不到下载按钮是怎么回事？', content: '本小程序仅提供现今最为通用的视频格式动态壁纸，因手机型号及版本多样化，对动态视频的支持不尽相同，此问题偶有出现在oppo/vivo部分机型，如遇此问题，可尝试使用其他机型下载。' },
		{ title: '动态壁纸下载后如何在手机设置？', content: '基于小程序的权限框架原因，本小程序无法直接设置手机动态壁纸，可下载三方软件进行设置，如：Vmoon等。' },
		{ title: '下载的素材不是高清是怎么回事？', content: '所有素材由创作者上传，我们不做压缩和改变，普通下载的素材非原图，高清下载的素材均为原图，如该原图不是高清素材，请联系我们，我们将督促创作者重新上传。' },
		{ title: '为什么有时候加载较慢？', content: '在4G或WiFi网络环境下，正常的加载速度应是极快的，但如果网络状态不佳，加上高清素材的尺寸较大，会偶尔出现加载时间过长。' },
		{ title: '为什么要看广告？', content: '图片存储和下载都是需要消耗服务器资源的，广告是创作者积极创作的动力来源，请理解和支持！' },
		{ title: '为什么每天下载次数有限？', content: '为防止恶意刷量，保证良好的用户使用体验，当天下载次数均会设限，对此我们也将积极优化，感谢理解和支持！' },
		{ title: '我有产品使用体验的建议', content: '我们非常重视产品体验，可联系我们（小程序菜单：我的-联系客服）私信联系，在此感谢您的反馈！' },
		{ title: '我想入驻壁纸平台成为创作者', content: '我们欢迎符合条件的小伙伴入驻，可联系我们（小程序菜单：我的-联系客服）私信申请。另外，入驻平台是完全免费的，需特别甄别，谨防上当！' }
	]);
</script>

<style lang="scss">
	page {
		background-color: $bg-color;
		color: $text-color-333333;
	}
	
	.question-box {
		
		&__title {
			font-weight: bold;
		}
		
		&__content {
			text-indent: 60rpx;
			color: $text-color-999999;
			padding: 10rpx 0;
			line-height: 55rpx;
			font-size: 30rpx;
		}
	}
</style>