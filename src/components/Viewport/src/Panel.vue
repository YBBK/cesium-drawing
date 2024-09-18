<template>
    <div class="cu-panel">
        <div class="head-wrapper" v-if="$slots.title || $slots.extra">
            <div class="title" v-if="$slots.title">
                <slot name="title"></slot>
            </div>
            <div class="extra" v-if="$slots.extra">
                <slot name="extra"></slot>
            </div>
        </div>
        <div class="body-wrapper">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts" setup></script>
<style lang="less">
    .cu-panel {
        display: flex;
        flex-direction: column;
        height: 100%;
        border-radius: var(--border-radius);
        background-color: var(--component-background-color);
        color: var(--text-color);
        pointer-events: auto;
        backdrop-filter: blur(10px);

        & > .head-wrapper {
            display: flex;
            align-items: center;
            width: 100%;
            // height: 42px;
            padding: 0.75rem;
            border-bottom: 1px solid var(--border-color);
            font-size: 16px;
            font-weight: 600;

            .title {
                display: inline-block;
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .extra {
                margin-inline-start: auto;
                font-size: 14px;
                font-weight: normal;
                cursor: pointer;
            }
        }

        & > .body-wrapper {
            height: calc(100% - 48px);
            padding: 0.75rem;
            overflow: auto;
            font-size: 14px;
            position: relative;
        }

        :deep(.anticon) {
            :hover {
                transform: scale(1.1);

                svg {
                    fill: var(--main-color);
                }
            }
        }
    }
</style>
