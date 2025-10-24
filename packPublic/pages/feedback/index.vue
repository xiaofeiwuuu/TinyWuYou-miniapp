<template>
	<view class="fu-m-x-30">
		<fu-button width="100%" height="88" bgColor="#ffffff" padding="0 10px" radius="15" margin="30rpx 0 0" @click.native="$openPage('question')">
			<view class="fu-flex-1 fu-flex fu-flex-column-center fu-font-26" >
				<view class="fu-flex-1 fu-flex fu-flex-column-center">
					<fu-icons type="help" color="#999999" size="20"></fu-icons>
					<text class="fu-m-l-10">常见问题</text>
				</view>
				<fu-icons type="right" color="#999999" size="15"></fu-icons>
			</view>
		</fu-button>
		
		<view class="fu-m-t--40">
			<fu-form labelPosition="top" labelWidth="300">
				<block v-for="(item, index) in form.columns" :key="index">
					<fu-form-item :label="item.name">
						<fu-textarea :placeholder="item.tips" height="260" radius="15" maxlength="500" borderColor="#f3f3f3" count v-if="item.key == 'content'"></fu-textarea>
						<view class="fu-bg-ffffff fu-b-r-15 fu-p-20" v-if="item.key == 'image'">
							<fu-upload ref="upload" :limit="6" @select="handleUpload" :imageStyles="{border: {borderRadius: '15rpx'}}" @delete="handleUploadDel"></fu-upload>
						</view>
						<fu-input height="50" :customStyle="{backgroundColor: '#ffffff'}" radius="15" type="text" :placeholder="item.tips" v-if="item.key === 'contact'"></fu-input>
					</fu-form-item>
				</block>
			</fu-form>
		</view>
		
		<jc-button-nav color="#ffffff" radius="15" margin="30" fixed @click="handleSubmit"></jc-button-nav>
	</view>
</template>

<script setup>
	import { getCurrentInstance, ref } from 'vue';

	// data数据
	const { $openPage } = getCurrentInstance().appContext.config.globalProperties;
	let form = ref({
		data: {},
		columns: [
			{ key: 'content', tips: '请填写你想吐槽的问题，以便我们提供更好的帮助' },
			{ key: 'image', name: '相关截图（选填）（0/6）' },
			{ key: 'contact', name: '联系方式（选填）', tips: '邮箱/手机号' }
		]
	});
	
	// methods方法
	// 处理上传图片
	const handleUpload = (e) => {
		const newImagePath = e.tempFiles[0].path;
		form.value.data.image = form.value.data.image ? [...form.value.data.image, newImagePath]: [newImagePath];
	};
	
	// 处理删除的图片
	const handleUploadDel = (e) => {
		const targetPath = e.tempFile.path;
		if (!form.value.data.image || !targetPath) return;
		form.value.data.image = form.value.data.image.filter(item => item !== targetPath);
		console.log(form.value.data.image)
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
	
	:deep(.fu-forms-item) {
		margin-bottom: 20rpx;
	}
	
	:deep(.fu-forms-item__label) {
		font-weight: bold;
	}
	
	:deep(.fu-border) {
		border-color: #f3f3f3 !important;
	}
	
	:deep(.fu-upload-image__box-content) {
		border-radius: 15rpx !important;
	}
	
	:deep(.icon-add) {
		width: 30px !important;
	}
	
	:deep(.icon-del-box) {
		width: 40rpx;
		height: 40rpx;
	}
	
	:deep(.icon-del) {
		width: 13px;
	}
</style>