<template>
    <Transition name="fade">
        <Panel class="info-box" v-if="show">
            <template #title>Hello</template>
            <template #extra>
                <IconButton :circle="true" :border="0" icon="close" @click="onClose" />
            </template>
            <div class="section">
                这是一个Cesium基础绘图工具。目前支持点，折线，多边形，圆形以及矩形的绘制，并提供了周长，面积的计算。
            </div>
            <div class="section">
                本绘图工具支持GeoJSON的导入导出。但由于标准GeoJSON中，圆跟矩形都是采用多边形实现的，故本工具中绘制的圆跟矩形导出成GeoJSON之后是多边形。
            </div>
            <div class="section">
                本工具采用的技术栈是：Vue 3.x + Vite 5.x + Pinia 2.x + Cesium 1.121
            </div>
            <div class="section">
                目前己开源,地址如下：
            </div>
            <div class="section">
                <p>
                    <label>Github: </label><a target="_blank" :href="url_github">{{ url_github }}</a>
                </p>
                <!-- <p>
                    <label>Gitee: </label><a _target="blank" :href="url_gitee">{{ url_gitee }}</a>
                </p> -->
            </div>
            <div class="section last">
                your's 郭师傅
            </div>
        </Panel>
    </Transition>
</template>

<script lang="ts" setup>
import { Panel } from '@/components/Viewport'
import { IconButton } from '@/components/Icon'

const emits = defineEmits(['close'])
defineProps({
    show: {
        type: Boolean,
        default: false
    }
})

const url_github = "https://github.com/YBBK/cesium-drawing"
const url_gitee = "http://www.baidu.com"

const onClose = () => {
    emits('close')
}
</script>
<style lang="less">
.info-box {
    position: absolute;
    width: 500px;
    height: 320px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -100%);
    z-index: 9;

    .section {
        text-indent: 2em;
        padding-bottom: 0.5rem;

        label {
            display: inline-block;
            width: 50px;
            text-indent: 0;
        }

        &.last {
            text-align: end;
        }
    }
}
</style>
