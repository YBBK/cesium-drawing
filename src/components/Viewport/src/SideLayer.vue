<template>
    <div :class="['side-layer', wrapClassName, { collapsed: isSideCollapsed }]">
        <slot></slot>
        <div class="act" @click="toggle()">
            <Icon icon="caret" />
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'

import { Icon } from '@/components/Icon'

defineProps({
    wrapClassName: String
})

const isSideCollapsed = ref<boolean>(true)
function toggle() {
    isSideCollapsed.value = !isSideCollapsed.value
}

const mediaQuery = window.matchMedia('(max-width: 768px)')

function handleResize() {
    isSideCollapsed.value = mediaQuery.matches
}

onMounted(() => {
    handleResize() // 初始化时设置状态
    mediaQuery.addEventListener('change', handleResize) // 监听窗口变化
})

onUnmounted(() => {
    mediaQuery.removeEventListener('change', handleResize) // 清理监听器
})
</script>
<style lang="less">
.side-layer {
    display: flex;
    flex-direction: column;
    width: 300px;
    height: 100%;
    margin-left: 8px;
    transition: width 0.3s ease;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background-color: var(--component-background-color);
    pointer-events: auto;

    &.collapsed {
        width: 0 !important;
        margin-left: 0;
        padding: 0;
        border-width: 0;

        &>.act {
            margin-left: -0.4rem;

            svg {
                transform: rotate(180deg);
            }
        }
    }

    &>.act {
        display: flex;
        position: fixed;
        z-index: 1;
        top: 50%;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 60px;
        margin-left: -15px;
        transform: translateY(-50%);
        border: 1px solid var(--border-color);
        border-right-width: 0;
        border-top-left-radius: var(--border-radius);
        border-bottom-left-radius: var(--border-radius);
        background-color: var(--component-background-color);
        cursor: pointer;

        svg {
            transform: rotate(0deg);
            transition: transform 0.3s ease;
        }
    }
}
</style>
