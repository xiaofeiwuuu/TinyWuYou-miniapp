<template>
	<view class="rich-text-page">
		<view class="content">
			<!-- 用户协议 -->
			<view v-if="contentType === 'user_agreement'" class="text-content">
				<view class="section">
					<view class="title">用户协议</view>
					<view class="update-time">更新日期: 2025年1月1日</view>
					<view class="update-time">生效日期: 2025年1月1日</view>
				</view>

				<view class="section">
					<view class="section-title">一、协议的接受与修改</view>
					<view class="paragraph">
						1.1 欢迎使用TinyWuYou-壁纸小程序(以下简称"本小程序")。在使用本小程序之前,请您仔细阅读并充分理解本协议的全部内容。
					</view>
					<view class="paragraph">
						1.2 您点击同意本协议,或者注册、使用本小程序服务,即表示您已充分理解、同意并接受本协议的全部内容。如果您不同意本协议的任何内容,请您立即停止使用本小程序。
					</view>
					<view class="paragraph">
						1.3 我们有权根据需要不时修改本协议条款。修改后的协议一经公布即生效,并取代原来的协议。您可以在本小程序中查阅最新版本的协议条款。
					</view>
				</view>

				<view class="section">
					<view class="section-title">二、账号注册与使用</view>
					<view class="paragraph">
						2.1 您在使用本小程序时,需要授权微信登录以获取您的基本信息(如昵称、头像等)。
					</view>
					<view class="paragraph">
						2.2 您应当对您的账号及密码负责,因您的账号产生的所有行为后果由您自行承担。
					</view>
					<view class="paragraph">
						2.3 您不得将账号转让、出售或出借给他人使用。如发现账号被他人使用,应立即通知我们。
					</view>
				</view>

				<view class="section">
					<view class="section-title">三、服务内容</view>
					<view class="paragraph">
						3.1 本小程序为用户提供壁纸浏览、下载、收藏等服务。
					</view>
					<view class="paragraph">
						3.2 我们有权根据业务需要随时调整、变更或终止部分或全部服务,并保留在不事先通知用户的情况下修改或中断服务的权利。
					</view>
					<view class="paragraph">
						3.3 用户每日可通过完成指定任务(如观看广告、邀请好友等)获得下载次数奖励。
					</view>
				</view>

				<view class="section">
					<view class="section-title">四、用户行为规范</view>
					<view class="paragraph">
						4.1 您在使用本小程序时,应当遵守中华人民共和国相关法律法规,不得利用本小程序从事违法违规活动。
					</view>
					<view class="paragraph">
						4.2 您不得利用本小程序发布、传播任何违法、违规、不良信息。
					</view>
					<view class="paragraph">
						4.3 您不得利用技术手段干扰本小程序的正常运行,或者采取任何可能对本小程序造成损害的行为。
					</view>
					<view class="paragraph">
						4.4 您不得恶意刷取下载次数,或通过不正当手段获取服务。一经发现,我们有权冻结或删除您的账号。
					</view>
				</view>

				<view class="section">
					<view class="section-title">五、知识产权</view>
					<view class="paragraph">
						5.1 本小程序中的所有内容(包括但不限于文字、图片、音频、视频、软件、程序、版面设计等)的知识产权归本小程序或相关权利人所有。
					</view>
					<view class="paragraph">
						5.2 未经本小程序或相关权利人书面同意,您不得擅自使用、修改、复制、传播本小程序中的任何内容。
					</view>
					<view class="paragraph">
						5.3 您下载的壁纸仅供个人使用,不得用于商业用途。如需商业使用,请联系原作者获取授权。
					</view>
				</view>

				<view class="section">
					<view class="section-title">六、免责声明</view>
					<view class="paragraph">
						6.1 本小程序提供的壁纸来源于互联网,我们会尽力确保内容的合法性,但不保证所有内容均已获得版权方授权。
					</view>
					<view class="paragraph">
						6.2 如果您发现本小程序中的内容侵犯了您的合法权益,请及时联系我们,我们将在核实后及时处理。
					</view>
					<view class="paragraph">
						6.3 因网络延迟、系统故障等不可抗力因素导致的服务中断或无法使用,本小程序不承担责任。
					</view>
				</view>

				<view class="section">
					<view class="section-title">七、协议终止</view>
					<view class="paragraph">
						7.1 您有权随时停止使用本小程序服务。
					</view>
					<view class="paragraph">
						7.2 如您违反本协议的任何规定,我们有权立即终止对您提供服务,并删除您的账号及相关数据。
					</view>
				</view>

				<view class="section">
					<view class="section-title">八、其他</view>
					<view class="paragraph">
						8.1 本协议的订立、执行和解释及争议的解决均应适用中华人民共和国法律。
					</view>
					<view class="paragraph">
						8.2 如本协议中的任何条款无论因何种原因完全或部分无效或不具有执行力,本协议的其余条款仍应有效并且有约束力。
					</view>
				</view>
			</view>

			<!-- 隐私政策 -->
			<view v-else-if="contentType === 'privacy_policy'" class="text-content">
				<view class="section">
					<view class="title">隐私政策</view>
					<view class="update-time">更新日期: 2025年1月1日</view>
					<view class="update-time">生效日期: 2025年1月1日</view>
				</view>

				<view class="section">
					<view class="section-title">引言</view>
					<view class="paragraph">
						TinyWuYou-壁纸(以下简称"我们")非常重视用户的隐私保护。本隐私政策详细说明了我们如何收集、使用、存储和保护您的个人信息。请您仔细阅读本隐私政策,以便了解我们对您个人信息的处理方式。
					</view>
				</view>

				<view class="section">
					<view class="section-title">一、我们收集的信息</view>
					<view class="paragraph">
						1.1 账号信息:当您使用微信登录时,我们会收集您的微信昵称、头像等基本信息。
					</view>
					<view class="paragraph">
						1.2 设备信息:我们会收集您的设备型号、操作系统版本、设备标识符等信息,用于优化服务体验。
					</view>
					<view class="paragraph">
						1.3 日志信息:我们会自动收集您使用服务时的操作记录、IP地址、访问时间等日志信息。
					</view>
					<view class="paragraph">
						1.4 使用记录:包括您的浏览记录、下载记录、收藏记录、任务完成记录等。
					</view>
				</view>

				<view class="section">
					<view class="section-title">二、我们如何使用收集的信息</view>
					<view class="paragraph">
						2.1 为您提供、维护和改进我们的服务。
					</view>
					<view class="paragraph">
						2.2 处理您的请求和交易,为您提供客户支持。
					</view>
					<view class="paragraph">
						2.3 向您推荐您可能感兴趣的内容。
					</view>
					<view class="paragraph">
						2.4 分析用户使用情况,优化产品功能和用户体验。
					</view>
					<view class="paragraph">
						2.5 保护服务的安全性和完整性,预防、发现和处理欺诈、违法犯罪等行为。
					</view>
				</view>

				<view class="section">
					<view class="section-title">三、信息的存储和保护</view>
					<view class="paragraph">
						3.1 您的个人信息将存储在中华人民共和国境内的服务器上。
					</view>
					<view class="paragraph">
						3.2 我们采用业界标准的安全措施保护您的个人信息,包括数据加密、访问控制、安全审计等。
					</view>
					<view class="paragraph">
						3.3 我们会在法律法规要求或本隐私政策约定的期限内保留您的个人信息。
					</view>
					<view class="paragraph">
						3.4 当您删除账号或服务终止时,我们将在合理期限内删除或匿名化您的个人信息。
					</view>
				</view>

				<view class="section">
					<view class="section-title">四、信息的共享、转让和披露</view>
					<view class="paragraph">
						4.1 我们不会向任何第三方出售您的个人信息。
					</view>
					<view class="paragraph">
						4.2 我们可能与第三方服务提供商共享必要的信息,以便为您提供服务(如云存储服务、数据分析服务等)。
					</view>
					<view class="paragraph">
						4.3 根据法律法规要求或政府、司法机关的要求,我们可能需要披露您的个人信息。
					</view>
					<view class="paragraph">
						4.4 在涉及合并、收购或破产清算时,我们会要求新的持有您个人信息的公司继续遵守本隐私政策。
					</view>
				</view>

				<view class="section">
					<view class="section-title">五、您的权利</view>
					<view class="paragraph">
						5.1 访问权:您有权访问您的个人信息。
					</view>
					<view class="paragraph">
						5.2 更正权:如果您发现我们收集的个人信息有错误,您有权要求更正。
					</view>
					<view class="paragraph">
						5.3 删除权:在特定情况下,您有权要求删除您的个人信息。
					</view>
					<view class="paragraph">
						5.4 撤回同意:您可以随时撤回对我们处理您个人信息的同意。
					</view>
					<view class="paragraph">
						5.5 注销账号:您可以通过联系客服注销账号,我们将在核实身份后删除您的账号信息。
					</view>
				</view>

				<view class="section">
					<view class="section-title">六、第三方SDK使用说明</view>
					<view class="paragraph">
						6.1 微信SDK:用于微信登录和分享功能,会收集您的微信用户信息。
					</view>
					<view class="paragraph">
						6.2 广告SDK:用于展示广告,可能会收集设备信息和使用行为信息。
					</view>
					<view class="paragraph">
						6.3 这些第三方SDK受其自身隐私政策约束,我们建议您阅读相关的隐私政策。
					</view>
				</view>

				<view class="section">
					<view class="section-title">七、未成年人保护</view>
					<view class="paragraph">
						7.1 我们非常重视未成年人的个人信息保护。
					</view>
					<view class="paragraph">
						7.2 如果您是未成年人,请在监护人的陪同下阅读本隐私政策,并在征得监护人同意后使用我们的服务。
					</view>
					<view class="paragraph">
						7.3 如果您是未成年人的监护人,当您对您所监护的未成年人的个人信息有疑问时,请通过本隐私政策公示的联系方式联系我们。
					</view>
				</view>

				<view class="section">
					<view class="section-title">八、隐私政策的变更</view>
					<view class="paragraph">
						8.1 我们可能会不时修订本隐私政策。
					</view>
					<view class="paragraph">
						8.2 当隐私政策发生重大变更时,我们会通过小程序内通知、弹窗等方式告知您。
					</view>
					<view class="paragraph">
						8.3 未经您明确同意,我们不会削减您按照本隐私政策所应享有的权利。
					</view>
				</view>

				<view class="section">
					<view class="section-title">九、联系我们</view>
					<view class="paragraph">
						如果您对本隐私政策有任何疑问、意见或建议,请通过以下方式联系我们:
					</view>
					<view class="paragraph">
						• 小程序内"在线客服"功能
					</view>
					<view class="paragraph">
						• 小程序内"我要吐槽"反馈功能
					</view>
					<view class="paragraph">
						我们将在15个工作日内回复您的请求。
					</view>
				</view>
			</view>

			<!-- 侵权联系 -->
			<view v-else class="text-content">
				<view class="section">
					<view class="title">侵权投诉指引</view>
					<view class="update-time">更新日期: 2025年1月1日</view>
				</view>

				<view class="section">
					<view class="section-title">关于版权</view>
					<view class="paragraph">
						TinyWuYou-壁纸致力于尊重和保护知识产权。我们提供的壁纸内容来源于互联网,如果您发现本小程序中的内容侵犯了您的合法权益,请按照以下方式联系我们,我们将及时处理。
					</view>
				</view>

				<view class="section">
					<view class="section-title">一、投诉须知</view>
					<view class="paragraph">
						1.1 如果您是知识产权权利人或其合法授权人,发现本小程序中的内容侵犯了您的合法权益,您可以向我们提出投诉。
					</view>
					<view class="paragraph">
						1.2 为保证投诉的有效性,请您务必提供真实、完整、有效的材料。
					</view>
					<view class="paragraph">
						1.3 对于恶意投诉、虚假投诉,我们将保留追究法律责任的权利。
					</view>
				</view>

				<view class="section">
					<view class="section-title">二、投诉材料要求</view>
					<view class="paragraph">
						请您提供以下材料:
					</view>
					<view class="paragraph">
						2.1 权利人身份证明
					</view>
					<view class="paragraph indent">
						• 个人:身份证扫描件或照片
					</view>
					<view class="paragraph indent">
						• 企业:营业执照扫描件、法定代表人身份证明
					</view>
					<view class="paragraph indent">
						• 代理人:授权委托书及代理人身份证明
					</view>

					<view class="paragraph">
						2.2 权利证明材料
					</view>
					<view class="paragraph indent">
						• 著作权登记证书
					</view>
					<view class="paragraph indent">
						• 商标注册证书
					</view>
					<view class="paragraph indent">
						• 其他可以证明您享有相关权利的材料
					</view>

					<view class="paragraph">
						2.3 侵权内容说明
					</view>
					<view class="paragraph indent">
						• 侵权内容在本小程序中的具体位置(如截图、链接等)
					</view>
					<view class="paragraph indent">
						• 侵权内容的具体描述
					</view>
					<view class="paragraph indent">
						• 侵权行为的说明
					</view>

					<view class="paragraph">
						2.4 联系方式
					</view>
					<view class="paragraph indent">
						• 联系人姓名
					</view>
					<view class="paragraph indent">
						• 联系电话
					</view>
					<view class="paragraph indent">
						• 电子邮箱
					</view>
					<view class="paragraph indent">
						• 通讯地址
					</view>

					<view class="paragraph">
						2.5 权利声明
					</view>
					<view class="paragraph indent">
						请在投诉材料中包含以下声明:
					</view>
					<view class="paragraph indent">
						"本人保证:本投诉中所述事实真实、准确、完整,本人是所投诉内容的合法权利人或获得合法授权的投诉人。如因本投诉引起的法律责任,由本人承担。"
					</view>
				</view>

				<view class="section">
					<view class="section-title">三、投诉方式</view>
					<view class="paragraph">
						您可以通过以下方式提交投诉:
					</view>
					<view class="paragraph">
						3.1 小程序内反馈
					</view>
					<view class="paragraph indent">
						进入"我的" → "我要吐槽",选择"侵权投诉"类型,上传相关材料
					</view>

					<view class="paragraph">
						3.2 在线客服
					</view>
					<view class="paragraph indent">
						进入"我的" → "在线客服",联系客服人员提交投诉
					</view>

					<view class="paragraph">
						3.3 邮件投诉
					</view>
					<view class="paragraph indent">
						邮箱: copyright@tinywuyou.example.com
					</view>
					<view class="paragraph indent">
						请在邮件主题中注明"侵权投诉"
					</view>
				</view>

				<view class="section">
					<view class="section-title">四、处理流程</view>
					<view class="paragraph">
						4.1 收到投诉后,我们会在3个工作日内进行初步审核。
					</view>
					<view class="paragraph">
						4.2 材料齐全且符合要求的,我们将在7个工作日内完成核实并作出处理。
					</view>
					<view class="paragraph">
						4.3 材料不齐全或不符合要求的,我们会通知您补充材料。
					</view>
					<view class="paragraph">
						4.4 经核实确认侵权的,我们将立即删除相关内容或断开相关链接。
					</view>
					<view class="paragraph">
						4.5 处理完成后,我们会通过您提供的联系方式告知处理结果。
					</view>
				</view>

				<view class="section">
					<view class="section-title">五、免责声明</view>
					<view class="paragraph">
						5.1 本小程序仅作为信息发布和交流平台,对用户上传的内容不承担事先审查义务。
					</view>
					<view class="paragraph">
						5.2 我们收到有效投诉并采取措施后,对由此产生的损失不承担责任。
					</view>
					<view class="paragraph">
						5.3 如果您发现有他人恶意投诉您的内容,您可以向我们提供相关证明材料,我们将依法核实处理。
					</view>
				</view>

				<view class="section">
					<view class="section-title">六、反通知</view>
					<view class="paragraph">
						6.1 如果您认为您的内容被错误删除或禁止访问,您可以向我们提交反通知。
					</view>
					<view class="paragraph">
						6.2 反通知应当包含:
					</view>
					<view class="paragraph indent">
						• 您的身份证明
					</view>
					<view class="paragraph indent">
						• 被删除内容的说明
					</view>
					<view class="paragraph indent">
						• 认为内容不侵权的理由和证据
					</view>
					<view class="paragraph indent">
						• 联系方式
					</view>
					<view class="paragraph">
						6.3 我们收到反通知后,会将其转送给投诉人。如投诉人未在15个工作日内提起诉讼,我们将恢复被删除的内容。
					</view>
				</view>

				<view class="section">
					<view class="section-title">七、其他说明</view>
					<view class="paragraph">
						7.1 本指引根据《中华人民共和国著作权法》、《信息网络传播权保护条例》等法律法规制定。
					</view>
					<view class="paragraph">
						7.2 我们保留随时修改本指引的权利,修改后的指引将在本小程序内公布。
					</view>
					<view class="paragraph">
						7.3 如有其他疑问,请通过小程序内的客服功能联系我们。
					</view>
				</view>

				<view class="section contact-box">
					<view class="contact-title">联系我们</view>
					<view class="contact-item">
						<text class="label">投诉邮箱:</text>
						<text class="value">copyright@tinywuyou.example.com</text>
					</view>
					<view class="contact-item">
						<text class="label">客服时间:</text>
						<text class="value">工作日 9:00-18:00</text>
					</view>
					<view class="contact-item">
						<text class="label">处理时效:</text>
						<text class="value">3-7个工作日</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue';
	import { getCurrentInstance } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';

	// data数据
	const { $parseURL } = getCurrentInstance().appContext.config.globalProperties;
	const contentType = ref('');

	// 生命周期
	onLoad((options) => {
		let query;
		// #ifdef MP
		query = $parseURL(options.query)
		// #endif
		// #ifndef MP
		query = JSON.parse(options.query)
		// #endif

		console.log('richText query:', query)

		// 设置内容类型
		contentType.value = query.type || '';

		// 设置标题
		const titleMap = {
			'user_agreement': '用户协议',
			'privacy_policy': '隐私政策',
			'': '侵权联系'
		};

		uni.setNavigationBarTitle({
			title: titleMap[query.type] || query.name || '详情'
		})
	})
</script>

<style lang="scss" scoped>
	page {
		background-color: #f5f5f5;
	}

	.rich-text-page {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding: 20rpx;
	}

	.content {
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 40rpx;
	}

	.text-content {
		line-height: 1.8;
	}

	.section {
		margin-bottom: 40rpx;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.title {
		font-size: 40rpx;
		font-weight: bold;
		color: #333333;
		text-align: center;
		margin-bottom: 20rpx;
	}

	.update-time {
		font-size: 24rpx;
		color: #999999;
		text-align: center;
		margin-bottom: 10rpx;
	}

	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333333;
		margin-bottom: 20rpx;
		margin-top: 10rpx;
	}

	.paragraph {
		font-size: 28rpx;
		color: #666666;
		line-height: 1.8;
		margin-bottom: 20rpx;
		text-align: justify;

		&.indent {
			padding-left: 40rpx;
			position: relative;

			&::before {
				content: '·';
				position: absolute;
				left: 20rpx;
			}
		}
	}

	.contact-box {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
		padding: 40rpx;
		margin-top: 40rpx;
	}

	.contact-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #ffffff;
		margin-bottom: 30rpx;
		text-align: center;
	}

	.contact-item {
		display: flex;
		align-items: center;
		margin-bottom: 20rpx;

		&:last-child {
			margin-bottom: 0;
		}

		.label {
			font-size: 28rpx;
			color: rgba(255, 255, 255, 0.8);
			min-width: 160rpx;
		}

		.value {
			font-size: 28rpx;
			color: #ffffff;
			font-weight: 500;
		}
	}
</style>
