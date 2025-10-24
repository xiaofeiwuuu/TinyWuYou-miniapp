<template>
	<page-layout>
		<view class="album-box fu-bottom">
			<view class="album-box__top">
				<view class="album-box__top--back">
					<fu-image width="100%" height="100%" bgColor="transparent"></fu-image>
				</view>
				
				<view class="album-box__top--content">
					<view class="fu-flex-1 fu-m-x-30 fu-m-b-20 fu-flex fu-flex-column-end">
						<view class="fu-flex-1 fu-flex fu-flex-column-center">
							<view class="fu-flex-1">
								<view class="font-family fu-font-36">小米10S Pro内置壁纸</view>
								<view class="fu-m-t-10 fu-color-b1b1b1">Civi 5 Pro</view>
							</view>
							<fu-button bgColor="rgba(255, 255, 255, 0.1)" color="#ffffff" shape="round" @click="onClick('praise')">
								<view class="fu-flex fu-flex-column-center">
									<fu-icons :type="isPraise? 'hand-up-fill': 'hand-up'" size="30rpx" :color="isPraise? '#ff5500': '#ffffff'" />
									<text class="fu-m-l-10">100</text>
								</view>
							</fu-button>
						</view>
					</view>
				</view>
			</view>
			
			<view class="fu-m-x-30 fu-m-t-20" style="color: #FFFFFF;">
				<jc-grid :list="list" @click="onClick('mobileDetails', $event)" />
				<jc-loading-more :loadingType="queryParams.loadingType" />
			</view>
			
			<jc-wallpaper-btn :visibleBtn="['overBack', 'index', 'share']" />
		</view>
	</page-layout>
</template>

<script setup>
	import { getCurrentInstance, ref } from 'vue';
	import { onLoad, onReachBottom } from '@dcloudio/uni-app';
	
	// data数据
	const { $fu, $mAssetsPath, $mConstDataConfig, $openPage } = getCurrentInstance().appContext.config.globalProperties;
	let isPraise = ref(false);
	let list = ref([]);
	let queryParams = ref({
		pageNum: 1,
		pageSize: $mConstDataConfig.pageSize,
		loadingType: 0,
		loadMore: true
	});
	
	onLoad(() => {
		init()
	});
	
	// methods方法
	const onClick = (state) => {
		switch(state) {
			case 'praise':
				if(isPraise.value) return $fu.toast('你已经点过赞啦~')
				isPraise.value = !isPraise.value;
				$fu.toast('感谢你的赞赏~')
				break
			case 'mobileDetails':
				$openPage({name: state})
				break
			default:
				break
		}
	}
	
	const init = () => {
		queryParams.value.pageNum = 1;
		list.value = [];
		initList()
	};
		
	const initList = () => {
		queryParams.value.loadingType = 1;
		const newData = [
			{ image: $mAssetsPath.mobile },
			{ image: $mAssetsPath.mobile1 },
			{ image: $mAssetsPath.mobile2 },
			{ image: $mAssetsPath.mobile1 },
			{ image: $mAssetsPath.mobile },
			{ image: $mAssetsPath.mobile2 },
			{ image: $mAssetsPath.mobile1 },
			{ image: $mAssetsPath.mobile },
			{ image: $mAssetsPath.mobile2 },
			{ image: $mAssetsPath.mobile1 },
			{ image: $mAssetsPath.mobile },
			{ image: $mAssetsPath.mobile2 },
		];
		
		if(!newData.length) {
			queryParams.value.loadingType = 2;
			queryParams.value.loadMore = false;
			return
		}
		
		list.value = queryParams.value.pageNum === 1? newData: list.value.concat(newData);
		
		if(newData.length < queryParams.value.pageSize) {
			queryParams.value.loadingType = 2;
			queryParams.value.loadMore = false;
			return
		}
		
		queryParams.value.loadingType = 0;
	};
</script>

<style lang="scss" scoped>
	.album-box {
		padding-bottom: 140rpx;
		
		&__top {
			height: 560rpx;
			position: relative;
			
			&--back {
				position: absolute;
				width: 100%;
				height: 100%;
				bottom: 0;
				left: 0;
			}
			
			&--content {
				position: relative;
				height: 100%;
				display: flex;
			}
		}
	}
</style>