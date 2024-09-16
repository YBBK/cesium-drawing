<template>
  <div :class="['pop-icon', { active: props.isActive }]" :style="customStyle">
    <slot></slot>
    <div class="popup">
      <slot name="overlay"></slot>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps({
  isActive: {
    type: Boolean,
    default: false
  },
  color: {
    type: String,
    default: ''
  }
})
const customStyle = computed(() => {
  return props.color ? { '--main-color-dark': props.color } : {}
})
</script>
<style lang="less">
.pop-icon {
  @keyframes fadein {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }

  position: relative;

  &.active {
    &::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      border-width: 5px;
      border-style: solid;
      border-color: var(--main-color-dark) var(--main-color-dark) transparent transparent;
      pointer-events: auto;
    }
  }

  &:hover {
    .popup {
      display: block;
    }
  }

  .popup {
    display: none;
    position: absolute;
    top: 0;
    right: 100%;
    width: auto;
    animation: fadein 0.5s forwards;

    & > div {
      margin-right: 0.5rem;
      padding: 0.5rem 0;
      border-radius: var(--border-radius);
      background: var(--component-background-color);
    }
  }
}
</style>
