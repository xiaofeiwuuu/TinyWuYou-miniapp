<template>
  <view
    class="task-icon-wrapper"
    :class="{ completed: isCompleted, disabled: isDisabled }"
  >
    <image
      class="task-icon-image"
      :src="getIconPath()"
      mode="aspectFit"
    ></image>
  </view>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  // 任务类型: watch_ad, ad, invite, sign_in, signin, newbie
  type: {
    type: String,
    required: true,
  },
  // 是否已完成
  isCompleted: {
    type: Boolean,
    default: false,
  },
  // 是否禁用 (针对新人福利)
  isDisabled: {
    type: Boolean,
    default: false,
  },
});

// 获取图标路径
const getIconPath = () => {
  const iconMap = {
    watch_ad: "/static/img/ad.png",
    ad: "/static/img/ad.png",
    invite: "/static/img/invite.png",
    sign_in: "/static/img/signin.png",
    signin: "/static/img/signin.png",
    newbie: "/static/img/newbie.png",
  };
  return iconMap[props.type] || "/static/img/ad.png";
};
</script>

<style lang="scss" scoped>
.task-icon-wrapper {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &.completed {
    opacity: 0.6;
  }

  &.disabled {
    opacity: 0.4;
  }
}

.task-icon-image {
  width: 60rpx;
  height: 60rpx;
}
</style>
