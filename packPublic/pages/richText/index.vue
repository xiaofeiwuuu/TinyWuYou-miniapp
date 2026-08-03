<template>
  <page-layout customClass="navbar__content">
    <app-nav-bar
      bgColor="rgba(0, 0, 0, 0.2)"
      leftIcon="arrow-left"
      :title="navTitle"
      color="#ffffff"
      :border="false"
      fixed
      @clickLeft="$mUtil.overBack()"
    ></app-nav-bar>

    <view class="rich-text-page">
      <view class="content">
        <!-- 用户协议 -->
        <view v-if="contentType === 'user_agreement'" class="text-content">
        <view class="section">
          <view class="title">用户协议</view>
          <view class="update-time">更新日期：2026年8月3日</view>
          <view class="update-time">生效日期：2025年1月1日</view>
        </view>

        <view class="section">
          <view class="section-title">一、协议的接受与修改</view>
          <view class="paragraph">
            1.1 欢迎使用 TinyWuYou
            壁纸小程序（以下简称“本小程序”）。在使用前，请您仔细阅读并充分理解本协议的全部内容。
          </view>
          <view class="paragraph">
            1.2
            当您访问或继续使用本小程序，即表示您已阅读并同意本协议的全部条款。
          </view>
          <view class="paragraph">
            1.3
            我们可能会根据业务或法律要求适时调整本协议，更新后将在小程序内公示并生效。如您不同意修改内容，可停止使用本服务。
          </view>
        </view>

        <view class="section">
          <view class="section-title">二、账号注册与使用</view>
          <view class="paragraph">
            2.1 使用本小程序时，系统将默认授权微信登录，以便提供更好的使用体验。
          </view>
          <view class="paragraph">
            2.2 请妥善保管登录信息。因个人原因造成的账号问题，由您自行负责。
          </view>
          <view class="paragraph">
            2.3 若发现账号异常，请及时联系客服协助处理。
          </view>
        </view>

        <view class="section">
          <view class="section-title">三、服务内容</view>
          <view class="paragraph">
            3.1 本小程序为用户提供头像、壁纸、文案、网名等浏览与下载服务。
          </view>
          <view class="paragraph">
            3.2
            我们会持续优化功能，并可能根据情况调整服务。如有重大变更，将通过公告形式告知。
          </view>
          <view class="paragraph">
            3.3 用户可通过观看广告、完成任务等方式获得额外下载次数奖励。
          </view>
        </view>

        <view class="section">
          <view class="section-title">四、用户行为规范</view>
          <view class="paragraph">
            4.1
            您在使用过程中应遵守中华人民共和国法律法规，不得从事违法违规行为。
          </view>
          <view class="paragraph">
            4.2 请勿传播从本小程序获取的内容用于违法、侵权或其他不当用途。
          </view>
          <view class="paragraph">
            4.3 请勿使用技术手段干扰小程序运行或不当获取服务资源。
          </view>
          <view class="paragraph">
            4.4
            若存在恶意刷量、滥用下载次数等行为，我们有权在核实后采取相应限制措施。
          </view>
        </view>

        <view class="section">
          <view class="section-title">五、版权与来源说明</view>
          <view class="paragraph">
            5.1
            本小程序展示的图片、头像、文案、网名等内容，主要来源于网络公开渠道或用户投稿，仅用于分享与欣赏。
          </view>
          <view class="paragraph">
            5.2 我们尊重原创与版权，所有权利均归原作者或合法权利人所有。
          </view>
          <view class="paragraph">
            5.3 若您认为内容存在侵权或不当，请通过【我的 →
            在线客服】或《侵权联系》页反馈，我们将在核实后及时处理。
          </view>
        </view>

        <view class="section">
          <view class="section-title">六、文字与内容规范</view>
          <view class="paragraph">
            6.1
            部分文案、网名、短句等内容来自互联网，仅供娱乐与交流使用，不代表本小程序立场。
          </view>
          <view class="paragraph">
            6.2 如内容引起不适或存在侵权，请联系删除，我们会尽快处理。
          </view>
          <view class="paragraph">
            6.3 我们将尽力确保内容合规，但因内容量大可能存在遗漏，敬请谅解。
          </view>
        </view>

        <view class="section">
          <view class="section-title">七、免责声明</view>
          <view class="paragraph">
            7.1
            本小程序部分资源来源于互联网，我们尽力确保内容合规，但不保证所有资源均已获完整授权。
          </view>
          <view class="paragraph">
            7.2
            因网络或系统原因导致服务中断、下载失败等情况，我们将尽力修复，但不对由此引发的损失承担责任。
          </view>
        </view>

        <view class="section">
          <view class="section-title">八、账户与协议终止</view>
          <view class="paragraph">
            8.1
            您可随时停止使用本小程序服务。如需删除个人信息或注销账号，
            请通过"在线客服"联系我们，具体处理方式见《隐私政策》。
          </view>
          <view class="paragraph">
            8.2 若严重违反本协议或相关法律法规，我们有权暂停或终止服务。
          </view>
        </view>

        <view class="section">
          <view class="section-title">九、其他</view>
          <view class="paragraph">
            9.1 本协议的订立、执行与解释均适用中华人民共和国法律。
          </view>
          <view class="paragraph">
            9.2 若本协议部分条款无效，不影响其他条款的效力。
          </view>
          <view class="paragraph">
            9.3 本协议最终解释权归 TinyWuYou
            小程序所有，我们将持续优化以保护用户权益。
          </view>
        </view>
      </view>

        <!-- 隐私政策 -->
        <view v-else-if="contentType === 'privacy_policy'" class="text-content">
        <view class="section">
          <view class="title">隐私政策</view>
          <view class="update-time">更新日期: 2026年8月3日</view>
          <view class="update-time">生效日期: 2025年1月1日</view>
        </view>

        <view class="section">
          <view class="section-title">引言</view>
          <view class="paragraph">
            TinyWuYou-壁纸（以下简称“我们”）非常重视用户隐私。本隐私政策说明我们在小程序中如何处理信息，请您仔细阅读。
          </view>
        </view>

        <view class="section">
          <view class="section-title">一、我们收集的信息</view>
          <view class="paragraph">
            1.1 账号信息：您首次使用时，我们通过微信登录获取并存储您的
            微信 OpenID（用于识别账号，不能反查您的微信号）。
            OpenID 是必需信息，不提供则无法使用下载、收藏等功能。
          </view>
          <view class="paragraph">
            1.2 资料信息：昵称与头像。默认为系统生成的默认值，
            您可在【我的 → 设置】中自行修改。此项非必需，不填不影响使用。
          </view>
          <view class="paragraph">
            1.3
            使用记录：为实现下载次数统计、收藏夹、签到与邀请奖励等功能，
            我们会记录您的下载记录、收藏记录、签到日期、邀请关系与广告奖励领取记录。
          </view>
          <view class="paragraph">
            1.4 设备与日志：为保障账号安全与排查故障，我们会记录
            登录时间与访问 IP。
          </view>
          <view class="paragraph">
            1.5
            相册权限：仅在您点击"保存到相册"或使用图片信息编辑功能时申请，
            用于写入或读取您主动选择的那一张照片，
            我们不会浏览、读取或上传相册中的其他内容。
            图片信息编辑全程在您的手机本地完成，照片不会上传到我们的服务器。
          </view>
          <view class="paragraph">
            1.6 剪贴板：仅在您主动点击复制时写入，我们不读取剪贴板内容。
          </view>
          <view class="paragraph">
            1.7
            第三方服务：本小程序接入了微信广告组件。广告的展示与统计由
            微信广告平台处理，其信息处理规则适用《微信隐私保护指引》。
          </view>
        </view>

        <view class="section">
          <view class="section-title">二、信息的使用与保护</view>
          <view class="paragraph">
            2.1 上述信息仅用于实现小程序自身功能，
            我们不会向任何第三方出售、出租或交易您的个人信息。
          </view>
          <view class="paragraph">
            2.2
            信息在传输过程中经过加密，服务端存储于境内服务器，并设有访问权限控制。
          </view>
          <view class="paragraph">
            2.3
            我们仅在实现上述功能所必需的期间内保存您的信息；您注销账号后，
            相关信息将被删除或匿名化处理。
          </view>
        </view>

        <view class="section">
          <view class="section-title">三、您的权利</view>
          <view class="paragraph">
            3.1 查阅与更正：您可在【我的】页面查看账号信息，
            并在【我的 → 设置】中修改昵称和头像。
          </view>
          <view class="paragraph">
            3.2 删除与注销：如需删除个人信息或注销账号，
            请通过小程序内"在线客服"联系我们，我们将在 15 个工作日内处理。
          </view>
          <view class="paragraph">
            3.3 撤回授权：您可在微信"设置 → 隐私 → 授权管理"中
            撤回对本小程序的相册等授权。撤回后相关功能将无法使用，
            但不影响此前基于授权已进行的信息处理。
          </view>
        </view>

        <view class="section">
          <view class="section-title">四、未成年人保护</view>
          <view class="paragraph">
            4.1
            我们重视未成年人隐私保护。未成年人使用本小程序前，应在监护人指导下操作。
          </view>
        </view>

        <view class="section">
          <view class="section-title">五、隐私政策更新</view>
          <view class="paragraph">
            5.1 我们可能会不时更新本隐私政策，更新内容将在小程序内公示。
          </view>
        </view>

        <view class="section">
          <view class="section-title">六、联系我们</view>
          <view class="paragraph">
            如您对隐私政策有疑问或反馈，请通过小程序内“在线客服”联系我们，我们将在15个工作日内回复。
          </view>
        </view>
      </view>

        <!-- 侵权联系 -->
        <view v-else class="text-content">
        <view class="section">
          <view class="title">侵权投诉指引</view>
          <view class="update-time">更新日期: 2026年8月3日</view>
        </view>

        <view class="section">
          <view class="section-title">关于版权</view>
          <view class="paragraph">
            TinyWuYou-壁纸尊重并保护知识产权。小程序内容主要来源于互联网或用户投稿。如您发现内容可能侵犯您的合法权益，请按照下列方式联系我们，我们会及时处理。
          </view>
        </view>

        <view class="section">
          <view class="section-title">一、投诉须知</view>
          <view class="paragraph">
            1.1 权利人/合法授权人可对涉嫌侵权内容提出投诉。
          </view>
          <view class="paragraph">
            1.2 请确保提交的材料真实、完整、有效。
          </view>
          <view class="paragraph">
            1.3 对于恶意或虚假投诉，我们保留追究法律责任的权利。
          </view>
        </view>

        <view class="section">
          <view class="section-title">二、投诉材料</view>
          <view class="paragraph"> 请提供以下信息： </view>
          <view class="paragraph indent">
            •
            权利人身份：个人（身份证）、企业（营业执照及法定代表人身份证）、代理人（授权委托书及身份证）。
          </view>
          <view class="paragraph indent">
            •
            权利证明：著作权登记证书、商标注册证书或其他能证明您享有权利的材料。
          </view>
          <view class="paragraph indent">
            • 侵权内容说明：截图或链接、内容描述、侵权行为说明。
          </view>
          <view class="paragraph indent">
            • 联系方式：联系人姓名、电话、邮箱、通讯地址。
          </view>
          <view class="paragraph indent">
            •
            权利声明：本人保证投诉内容真实、准确、完整，系合法权利人或授权人，因投诉产生的法律责任由本人承担。
          </view>
        </view>

        <view class="section">
          <view class="section-title">三、投诉方式</view>
          <view class="paragraph"> 您可以通过以下方式提交： </view>
          <!--
            原来第一条写的是「我的 → 我要吐槽」，但那个菜单在 constData 里
            一直是注释掉的，用户根本找不到——投诉指引指向一个不存在的入口，
            比不写更糟。已删掉，只保留确实可用的两条。
          -->
          <view class="paragraph indent">
            • 在线客服：进入"我的" → "在线客服"，联系客服提交材料。
          </view>
          <view v-if="contact.email" class="paragraph indent">
            • 邮件投诉：发送至 {{ contact.email }}，邮件主题注明"侵权投诉"。
          </view>
        </view>

        <view class="section">
          <view class="section-title">四、处理流程</view>
          <view class="paragraph">
            收到完整材料后，我们将在7个工作日内核实并处理。如材料不全，将通知您补充。确认侵权后，我们会删除相关内容或断开链接，并通知您处理结果。
          </view>
        </view>

        <view class="section">
          <view class="section-title">五、反通知</view>
          <view class="paragraph">
            如您认为内容被误删除，可提交反通知，包括身份证明、被删除内容说明、理由及证据、联系方式。收到后我们会通知投诉方，如投诉方15个工作日内未提起诉讼，将恢复内容。
          </view>
        </view>

        <view class="section">
          <view class="section-title">六、免责声明</view>
          <view class="paragraph">
            本小程序仅提供信息发布和交流平台，不承担用户上传内容的事先审查义务。收到有效投诉并采取措施后，对由此产生的损失不承担责任。
          </view>
          <view class="paragraph">
            若他人恶意投诉您的内容，请提供相关证明材料，我们将依法核实处理。
          </view>
        </view>

        <!--
          联系方式来自后台「运营管理 → 小程序信息」，改完即时生效。
          原来这里写死的是 copyright@tinywuyou.example.com——
          example.com 是 IANA 的保留域名，那是个永远收不到邮件的假地址，
          而这一页恰恰是给权利人投诉用的，留个假邮箱等于没有投诉渠道。
        -->
        <view class="section contact-box">
          <view class="contact-title">联系我们</view>
          <view v-if="contact.email" class="contact-item" @click="onCopy(contact.email, '邮箱')">
            <text class="label">投诉邮箱:</text>
            <text class="value">{{ contact.email }}</text>
          </view>
          <view v-if="contact.wechat" class="contact-item" @click="onCopy(contact.wechat, '微信号')">
            <text class="label">客服微信:</text>
            <text class="value">{{ contact.wechat }}</text>
          </view>
          <view v-if="contact.workTime" class="contact-item">
            <text class="label">客服时间:</text>
            <text class="value">{{ contact.workTime }}</text>
          </view>
          <view class="contact-item">
            <text class="label">处理时效:</text>
            <text class="value">3-7个工作日</text>
          </view>
          <view v-if="!hasContact" class="contact-item">
            <text class="value">请通过小程序内「我的 → 在线客服」联系我们</text>
          </view>
        </view>
        </view>
      </view>
    </view>
  </page-layout>
</template>

<script setup>
import { ref, computed } from "vue";
import { getCurrentInstance } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useAppInfoStore } from "@/stores/appInfo.js";

// data数据
const { $u, $parseURL, $mUtil } = getCurrentInstance().appContext.config.globalProperties;
const appInfoStore = useAppInfoStore();
const contentType = ref("");
const navTitle = ref("");

// store 自带缓存和兜底，拉取之前页面也是好的
appInfoStore.fetchInfo();

const contact = computed(() => appInfoStore.contact);
const hasContact = computed(() => appInfoStore.hasContact);

/** 投诉邮箱要能一键复制——手抄邮箱最容易出错，而这一页的入口本来就少 */
const onCopy = (value, label) => {
  if (!value) return;
  uni.setClipboardData({
    data: value,
    success: () => $u.toast(`${label}已复制`),
    fail: () => $u.toast("复制失败")
  });
};

// 生命周期
onLoad((options) => {
  let query;
  // #ifdef MP
  query = $parseURL(options.query);
  // #endif
  // #ifndef MP
  query = JSON.parse(options.query);
  // #endif

  console.log("richText query:", query);

  // 设置内容类型
  contentType.value = query.type || "";

  // 设置标题
  const titleMap = {
    user_agreement: "用户协议",
    privacy_policy: "隐私政策",
    "": "侵权联系",
  };

  navTitle.value = titleMap[query.type] || query.name || "详情";
});
</script>

<style lang="scss" scoped>
.rich-text-page {
  min-height: 100vh;
  padding: 20rpx;
}

.content {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10rpx);
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  padding: 40rpx;
  transition: all 0.3s ease;
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
  color: #ffffff;
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
  color: #ffffff;
  margin-bottom: 20rpx;
  margin-top: 10rpx;
}

.paragraph {
  font-size: 28rpx;
  color: #cccccc;
  line-height: 1.8;
  margin-bottom: 20rpx;
  text-align: justify;

  &.indent {
    padding-left: 40rpx;
    position: relative;

    &::before {
      content: "·";
      position: absolute;
      left: 20rpx;
      color: #cccccc;
    }
  }
}

.contact-box {
  background: rgba(102, 126, 234, 0.15);
  backdrop-filter: blur(10rpx);
  border: 2rpx solid rgba(102, 126, 234, 0.3);
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
    color: rgba(255, 255, 255, 0.7);
    min-width: 160rpx;
  }

  .value {
    font-size: 28rpx;
    color: #ffffff;
    font-weight: 500;
  }
}
</style>
