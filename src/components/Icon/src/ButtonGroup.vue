<template>
  <div :class="['button-group', css]">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps({
  direction: {
    type: String,
    default: 'vertical'
  }
})
const css = computed(() => {
  if (props.direction === 'vertical') {
    return 'v'
  } else {
    return 'h'
  }
})
</script>
<style lang="less">
@prefix-cls: ~'button-group';
@prefix-btn: ~'icon-button';

.@{prefix-cls} {
  display: flex;

  // 重置边框半径
  & > div,
  & > div > .@{prefix-btn} {
    border-radius: 0 !important;
  }

  // 水平方向排列
  &.h {
    flex-direction: row;

    & > :first-child,
    & > :first-child > .@{prefix-btn} {
      border-top-left-radius: var(--border-radius) !important;
      border-bottom-left-radius: var(--border-radius) !important;
    }

    & > :last-child,
    & > :last-child > .@{prefix-btn} {
      border-top-right-radius: var(--border-radius) !important;
      border-bottom-right-radius: var(--border-radius) !important;
    }
  }

  // 垂直方向排列
  &.v {
    flex-direction: column;

    & > :first-child,
    & > :first-child > .@{prefix-btn} {
      border-top-left-radius: var(--border-radius) !important;
      border-top-right-radius: var(--border-radius) !important;
    }

    & > :last-child,
    & > :last-child > .@{prefix-btn} {
      border-bottom-right-radius: var(--border-radius) !important;
      border-bottom-left-radius: var(--border-radius) !important;
    }
  }
}
</style>
