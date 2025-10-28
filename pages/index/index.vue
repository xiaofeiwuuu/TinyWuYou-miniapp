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
import { onShareAppMessage } from "@dcloudio/uni-app";

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
let pagePath = ref("index");

// methods方法
// 处理tabbar切换事件
const handleChangeTabbar = (e) => {
  pagePath.value = e.pagePath;
};

const getUserId = () => {
  try {
    const userInfo = uni.getStorageSync("userInfo");
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      return parsed.id || parsed.userId || "";
    }
  } catch (error) {
    console.error("[Find] 获取用户ID失败:", error);
  }
  return "";
};

onShareAppMessage(() => {
  const userId = getUserId();
  console.log(888, userId);

  return {
    title: "TinyWuYou-壁纸 精美壁纸头像等你来拿！",
    path: `/pages/index/index?inviterId=${userId}`,
    query: `inviterId=${userId}`,
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

:deep(.fu-search__box) {
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
}
</style>
