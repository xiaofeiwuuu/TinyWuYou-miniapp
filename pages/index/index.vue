<template>
  <page-layout customClass="navbar__content">
    <jc-nav-bar v-if="pagePath != 'user'" />

    <view class="index-box">
      <index v-show="pagePath === 'index'" />
      <classify v-if="pagePath === 'classify'" />
      <find v-show="pagePath === 'find'" :isActive="pagePath === 'find'" />
      <user v-if="pagePath === 'user'" :isActive="pagePath === 'user'" />
    </view>

    <jc-tabbar :list="$mConstDataConfig.tabbar" @change="handleChangeTabbar" />
  </page-layout>
</template>

<script setup>
import { getCurrentInstance, defineComponent, ref } from "vue";
import index from "./components/index/index.vue";
import classify from "./components/classify/index.vue";
import find from "./components/find/index.vue";
import user from "./components/user/index.vue";
import { onShareAppMessage, onLoad } from "@dcloudio/uni-app";
import { useAppInfoStore } from "@/stores/appInfo.js";

// 注册组件
defineComponent({
  index,
  classify,
  find,
  user,
});

// data数据
const { $mConstDataConfig } =
  getCurrentInstance().appContext.config.globalProperties;
const appInfoStore = useAppInfoStore();
let pagePath = ref("index");

/**
 * 小程序信息（名称/分享文案/公告/联系方式）在首页统一拉一次。
 *
 * 放首页而不是 App.vue 的 onLaunch：onLaunch 里发请求时密钥交换可能还没完成，
 * 而这是个公开接口，等首页起来再拉不影响任何东西，还能少一条竞态。
 * store 有缓存和兜底，拉之前界面也是好的。
 */
onLoad(() => {
  appInfoStore.fetchInfo().then(showAnnouncementIfNeeded);
});

// 公告弹窗。用系统 modal 而不是自绘弹窗：只有标题和正文，
// 自绘还要处理层级、滚动和安全区，不值当
const showAnnouncementIfNeeded = () => {
  const announcement = appInfoStore.pendingAnnouncement;
  if (!announcement) return;

  uni.showModal({
    title: announcement.title || "公告",
    content: announcement.content,
    showCancel: false,
    confirmText: "我知道了",
    // 无论用户怎么关掉都算已读，否则点遮罩关闭后下次进来还会弹
    complete: () => appInfoStore.markAnnouncementSeen(),
  });
};

// methods方法
// 处理tabbar切换事件
const handleChangeTabbar = (e) => {
  pagePath.value = e.pagePath;
};

const getInviteCode = () => {
  try {
    const userInfo = uni.getStorageSync("userInfo");
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      return parsed.inviteCode || "";
    }
  } catch (error) {
    console.error("[Find] 获取用户ID失败:", error);
  }
  return "";
};

onShareAppMessage(() => {
  const inviteCode = getInviteCode();
  

  return {
    // 分享文案由后台配置，没配就退回小程序名（store 里做的兜底）
    title: appInfoStore.shareTitle,
    path: `/pages/index/index?inviteCode=${inviteCode}`,
    query: `inviteCode=${inviteCode}`,
    // imageUrl: $mAssetsPath.banner || "",
  };
});
</script>

<style lang="scss" scoped>
$height: 100rpx;
.index-box {
  position: relative;
  padding-bottom: $height;
  padding-bottom: calc($height + constant(safe-area-inset-bottom));
  padding-bottom: calc($height + env(safe-area-inset-bottom));

  // 给每个子组件设置绝对定位,确保它们不会重叠
  > view {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
  }
}

:deep(.u-search__content) {
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
</style>
