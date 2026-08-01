<template>
	<view class="fu-m-x-30">
		<up-button :customStyle="{width: '100%', height: '88rpx', backgroundColor: '#ffffff', padding: '0 10px', borderRadius: '15rpx', margin: '30rpx 0 0', border: 'none'}" @click="$openPage('question')">
			<view class="fu-flex-1 fu-flex fu-flex-column-center fu-font-26" >
				<view class="fu-flex-1 fu-flex fu-flex-column-center">
					<up-icon name="question-circle" color="#999999" size="20"></up-icon>
					<text class="fu-m-l-10">常见问题</text>
				</view>
				<up-icon name="arrow-right" color="#999999" size="15"></up-icon>
			</view>
		</up-button>
		
		<view class="fu-m-t--40">
			<up-form :model="form.data" labelPosition="top" labelWidth="300">
				<block v-for="(item, index) in form.columns" :key="index">
					<up-form-item :label="item.name">
						<up-textarea v-model="form.data.content" :placeholder="item.tips" height="260" maxlength="500" count :customStyle="{borderRadius: '15rpx', border: '1rpx solid #f3f3f3'}" border="none" v-if="item.key == 'content'"></up-textarea>
						<view class="fu-bg-ffffff fu-b-r-15 fu-p-20" v-if="item.key == 'image'">
							<up-upload :fileList="fileList" :maxCount="6" @afterRead="handleUpload" @delete="handleUploadDel" width="160rpx" height="160rpx"></up-upload>
						</view>
						<up-input v-model="form.data.contact" type="text" :placeholder="item.tips" border="none" :customStyle="{backgroundColor: '#ffffff', height: '50rpx', borderRadius: '15rpx', padding: '10rpx 20rpx'}" v-if="item.key === 'contact'"></up-input>
					</up-form-item>
				</block>
			</up-form>
		</view>
		
		<jc-button-nav color="#ffffff" radius="15" margin="30" fixed @click="handleSubmit"></jc-button-nav>
	</view>
</template>

<script setup>
	import { getCurrentInstance, ref } from 'vue';

	// data数据
	const { $openPage } = getCurrentInstance().appContext.config.globalProperties;
	// 上传组件的文件列表（uview-plus up-upload 需要受控的 fileList）
	const fileList = ref([]);
	let form = ref({
		data: {},
		columns: [
			{ key: 'content', tips: '请填写你想吐槽的问题，以便我们提供更好的帮助' },
			{ key: 'image', name: '相关截图（选填）（0/6）' },
			{ key: 'contact', name: '联系方式（选填）', tips: '邮箱/手机号' }
		]
	});
	
	// methods方法
	// 处理上传图片（up-upload 的 afterRead：e.file 可能是单个对象或数组）
	const handleUpload = (e) => {
		const files = Array.isArray(e.file) ? e.file : [e.file];
		files.forEach(file => {
			fileList.value.push({ url: file.url });
		});
		form.value.data.image = fileList.value.map(item => item.url);
	};

	// 处理删除的图片（up-upload 的 delete：e.index 为被删项下标）
	const handleUploadDel = (e) => {
		fileList.value.splice(e.index, 1);
		form.value.data.image = fileList.value.map(item => item.url);
	};
	
	// 提交反馈
	const handleSubmit = () => {
		
	};
</script>

<style lang="scss">
	page {
		background-color: $bg-color-grey;
		color: $text-color-333333;
	}
	
	:deep(.u-form-item) {
		margin-bottom: 20rpx;
	}

	:deep(.u-form-item__body__left__content__label) {
		font-weight: bold;
	}

	:deep(.u-upload__wrap__preview),
	:deep(.u-upload__wrap__preview__image),
	:deep(.u-upload__button) {
		border-radius: 15rpx !important;
	}
</style>