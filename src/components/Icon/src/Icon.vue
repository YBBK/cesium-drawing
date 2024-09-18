<template>
    <svg class="anticon" :width="size" :height="size" :aria-hidden="!title" role="img">
        <use :xlink:href="`#icon-${icon}`" :fill="color" />
        <title v-if="title">{{ title }}</title>
    </svg>
</template>
<script setup lang="ts">
    import 'virtual:svg-icons-register';

    defineProps({
        icon: {
            type: String,
            required: true,
        },
        size: {
            type: [Number, String],
            default: 16,
        },
        title: {
            type: String,
            default: '',
        },
        color: {
            type: String,
            default: 'currentColor',
        },
    });
</script>

<style lang="less">
    .anticon {
        display: inline-block;
        vertical-align: middle;
        fill: var(--text-color);
        color: var(--text-color);
    }
</style>
