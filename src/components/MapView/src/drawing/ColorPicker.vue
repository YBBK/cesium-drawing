<template>
    <div class="color-icon" v-for="(item, idx) in colors" :key="idx" :style="{ 'background-color': item.color }" @click="selectCurrent(idx)">
        <Icon icon="check2" :size="size" v-if="item.color.toLowerCase() == color.toLowerCase()" :color="item.color" />
    </div>
</template>
<script lang="ts" setup>
    import { ref } from 'vue';
    import { Color, ColorList } from './types';
    import { Icon } from '@/components/Icon';

    const colors = ref<Color[]>(ColorList);
    const selectKey = ref(0);

    defineProps({
        color: {
            type: String,
            default: '',
        },
        size: {
            type: Number,
            default: 18,
        },
    });

    const emits = defineEmits(['click']);

    const selectCurrent = (idx) => {
        selectKey.value = idx;
        emits('click', colors.value[idx].color);
    };
</script>
<style lang="less">
    .color-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        color: white;
        cursor: pointer;
    }
</style>
