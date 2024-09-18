<template>
    <div :class="['icon-button', { 'nb-1': border === 1, 'nb-2': border === 0, circle: circle }]" aria-hidden="true">
        <Icon :icon="icon" :size="size" :color="color" />
        <slot></slot>
    </div>
</template>
<script lang="ts" setup>
    import Icon from './Icon.vue';

    defineProps({
        icon: {
            type: String,
            default: 'line',
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
            type: Number,
            default: 2,
        },
        color: {
            type: String,
            default: 'currentColor',
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

        &.nb-1 {
            border-width: 0;
        }

        &.nb-2 {
            border-width: 0 !important;
            width: auto !important;
            height: auto !important;
            min-width: 16px !important;
            background-color: transparent;
            padding: 0;

            &:hover,
            &.sct {
                border-width: 0 !important;
            }
        }

        &.circle {
            border-radius: 50%;
        }

        &:hover,
        &.sct {
            border-width: 1px !important;
            border-color: var(--main-color-dark);
            color: var(--main-color-dark);

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
