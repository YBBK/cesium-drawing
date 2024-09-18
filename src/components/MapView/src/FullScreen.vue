<template>
    <div @click="toggle">
        <IconButton icon="fullscreen-enter" v-if="!isFullscreen" />
        <IconButton icon="fullscreen-exit" v-else />
    </div>
</template>
<script lang="ts" setup>
    import { inject } from 'vue';
    import { useFullscreen } from '@vueuse/core';
    import { IconButton } from '@/components/Icon';

    const cesiumContainer = inject('cesiumContainer');

    const { toggle, isFullscreen } = useFullscreen(cesiumContainer);
    // 重新检查全屏状态
    // isFullscreen.value = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
</script>
