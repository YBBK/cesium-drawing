<template>
    <div class="icon-button" aria-hidden="true">
        <Icon :icon="icon" :size="size" :color="color" />{{ text }}
    </div>
</template>
<script lang="ts" setup>
import Icon from './Icon.vue';

defineProps({
    icon: {
        type: String,
        default: 'line',
    },
    text: {
        type: String,
    },
    size: {
        type: [Number, String],
        default: 16,
    },
    circle: {
        type: Boolean,
        default: false,
    },
    border: {
        type: Boolean,
        default: true,
    },
    color: {
        type: String,
        default: 'currentColor'
    },
    spin: {
        type: Boolean,
        default: false,
    },
});


</script>
<style lang="less">
.icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    background-color: var(--component-background-color);
    cursor: pointer;
    pointer-events: auto;
    padding: 0.25rem 0.5rem;
    column-gap: 0.25rem;

    &:hover,
    &.sct {
        border-width: 1px !important;
        border-color: var(--main-color-dark);


        svg {
            transform: scale(1.1);
            fill: var(--main-color-dark);
            color: var(--main-color-dark);
        }
    }

    &:active svg {
        transform: scale(0.9);
    }
}
</style>
