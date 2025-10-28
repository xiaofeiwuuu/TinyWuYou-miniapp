<template>
	<page-layout customClass="navbar__content">
		<fu-nav-bar bgColor="rgba(0, 0, 0, 0.2)" leftIcon="left" title="常见问题" color="#ffffff" :border="false" fixed @clickLeft="$mUtil.overBack()"></fu-nav-bar>

		<view class="fu-m-x-30 fu-m-t-20 fu-p-b-50 fu-font-32">
			<view class="fu-m-b-20" v-for="(item,index) in list" :key="index">
				<view class="question-card fu-border fu-bg-main fu-b-r-10 fu-p-30 fu-m-b-20">
					<view class="question-box__title">{{ `${index + 1}、${item.title}` }}</view>
					<view class="question-box__content fu-m-t-15">{{ item.content }}</view>
				</view>
			</view>
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, ref } from 'vue';

	// data数据
	const { $mUtil } = getCurrentInstance().appContext.config.globalProperties;

	// data数据
	let list = ref([
  { 
    title: '提示“下载成功”，但相册中找不到图片怎么办？', 
    content: '该问题偶尔会发生，主要是宿主程序兼容性导致。请打开相册并翻到最后一页，通常能找到刚下载的图片。' 
  },
  { 
    title: '提示“下载失败”怎么办？', 
    content: '请确认是否点击了下载按钮进行下载。长按图片保存会提示“下载失败”，只有通过点击下载按钮才能正确保存。若网络不稳定，也可能导致下载失败，建议在WiFi环境下重试。' 
  },
  { 
    title: '下载失败后扣了下载次数怎么办？', 
    content: '若出现下载失败但仍被扣除下载次数的情况，请通过【我的 → 联系客服】反馈，我们会核实后为您补回次数。' 
  },
  { 
    title: '为什么加载速度有时较慢？', 
    content: '高清图片体积较大，在网络不佳或高峰期时可能加载偏慢。建议在网络稳定时浏览或下载。' 
  },
  { 
    title: '为什么会有广告？', 
    content: '图片展示与下载会消耗服务器资源，广告收益可用于维持运营与素材更新，请理解和支持。' 
  },
  { 
    title: '为什么每天下载次数有限？', 
    content: '为防止恶意刷量、保障公平使用，每日下载次数有限。我们会根据用户反馈持续优化。' 
  },
//   { 
//     title: '下载次数什么时候会恢复？', 
//     content: '下载次数会在每日凌晨自动重置。如未恢复，请尝试重新进入小程序或联系客服核实。' 
//   },
//   { 
//     title: '下载后在哪里查看图片？', 
//     content: '下载成功的图片会保存到手机相册中，部分机型可能在“下载”或“小程序”相册目录下，请检查相关相册文件夹。' 
//   },
  { 
    title: '我有建议或问题想反馈', 
    content: '欢迎通过【我的 → 联系客服】反馈您的使用体验或建议，我们非常重视每位用户的意见。' 
  },
  { 
    title: '我想上传自己的头像或壁纸', 
    content: '目前暂未开放创作者入驻，但可通过【我的 → 联系客服】上传您的图片。若作品被选中，将获得相应的下载次数奖励！' 
  }
]
);
</script>

<style scoped lang="scss">
	.question-card {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10rpx);
		border: 2rpx solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;

		&:active {
			background: rgba(255, 255, 255, 0.08);
		}
	}

	.question-box {
		&__title {
			font-weight: bold;
			color: #ffffff;
			font-size: 32rpx;
			line-height: 1.5;
		}

		&__content {
			color: #999999;
			padding: 10rpx 0;
			line-height: 50rpx;
			font-size: 28rpx;
			text-indent: 0;
		}
	}
</style>