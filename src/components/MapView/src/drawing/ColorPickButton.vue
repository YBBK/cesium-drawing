<template>
    <PopupIcon class="geometry-icon" :isActive="props.isActive" :color="currentColor">
        <IconButton :color="currentColor" :icon="props.icon" @click="selectColor(currentColor)" :class="[{ sct: props.isActive }]" />
        <template #overlay>
            <div class="popmenu">
                <ColorPicker :color="currentColor" @click="selectColor" />
            </div>
        </template>
    </PopupIcon>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { PopupIcon, IconButton } from '@/components/Icon';
import { ColorList } from './types';
import ColorPicker from './ColorPicker.vue';

const emits = defineEmits(['click']);

const props = defineProps({
    isActive: {
        type: Boolean,
        default: false,
    },
    icon: {
        type: String,
        default: 'layer',
    },
});

const currentColor = ref();

const selectColor = (color) => {
    if (color == undefined) {
        color = ColorList[0].color;
    }
    currentColor.value = color;
    emits('click', color);
};
</script>
<style lang="less">
.geometry-icon {
    .popmenu {
        display: flex;
        padding: 0.5rem !important;
        column-gap: 0.5rem;
    }
}
</style>
