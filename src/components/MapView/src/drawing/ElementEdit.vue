<template>
    <Transition name="slide-fade">
        <Panel class="geometry-form" v-if="data">
            <template #title>图形信息</template>
            <template #extra>
                <Icon icon="close" @click="onClose" />
            </template>
            <div class="form">
                <div class="item">
                    <Icon :icon="getElePic" :color="currentColor" :size="20" />
                    <Input v-model:value="name" />
                </div>
                <div class="item">
                    <span>颜色</span>
                    <ColorPicker :color="currentColor" :size="20" @click="selectColor" />
                </div>

                <div class="item mt-2">
                    <span>测量数据</span>
                </div>
                <template v-if="isPoint">
                    <div class="item">
                        <span class="title">经度:</span>
                        <Input v-model:value="lon" />
                    </div>
                    <div class="item">
                        <span class="title">纬度:</span>
                        <Input v-model:value="lat" />
                    </div>
                </template>
                <div class="item" v-else-if="data.geometry.type == 'LineString'">
                    <span class="title">长度:</span>
                    <span>{{ meters2Kilometers(length) }}</span>
                </div>
                <template v-else>
                    <div class="item" v-if="data.properties.radius">
                        <span class="title">半径:</span>
                        <span>{{ meters2Kilometers(data.properties.radius) }}</span>
                    </div>
                    <div class="item">
                        <span class="title">面积:</span>
                        <span>{{ areaSquareMeters2Kilometers(area) }}</span>
                    </div>
                    <div class="item">
                        <span class="title">周长:</span>
                        <span>{{ meters2Kilometers(perimeter) }}</span>
                    </div>
                </template>
                <div class="item mt-2" style="justify-content: center;">
                    <IconButton icon="aim" text="居中" @click="flyTo" />
                    <IconButton icon="save" text="保存" @click="save" />
                    <IconButton icon="delete" text="删除" @click="del" />
                </div>
            </div>
        </Panel>
    </Transition>
</template>
<script lang="ts" setup>
import { ref, computed, watchEffect } from 'vue';
import { Panel } from '@/components/Viewport';
import { Icon, IconButton } from '@/components/Icon';
import { Input } from '@/components/Basic';
import ColorPicker from './ColorPicker.vue';
import * as geojson from 'geojson';

import {
    calculateLineLength,
    calculatePolygonPerimeter,
    calculatePolygonArea,
    calculateCirclePerimeter,
    calculateCircleArea,
    areaSquareMeters2Kilometers,
    meters2Kilometers,
} from '@/components/Graphics';

const props = defineProps<{
    data?: geojson.Feature;
}>();

const emits = defineEmits(['close', 'flyTo', 'remove', 'save']);

const name = ref();
const lon = ref();
const lat = ref();

const currentColor = ref();

const selectColor = (color) => {
    currentColor.value = color;
    if (props.data && color) {
        emits('save', props.data.id, {
            color: currentColor.value
        });
    }
};

const onClose = () => {
    emits('close');
};

const flyTo = () => {
    if (props.data) {
        emits('flyTo', props.data.id);
    }
};

const del = () => {
    if (props.data) {
        emits('remove', props.data.id);
    }
};

const str2num = (value) => {
    const numberValue = Number(value)
    return isNaN(numberValue) ? undefined : numberValue
}
const save = () => {
    if (!props.data) {
        return;
    }
    const properties = {
        name: name.value,
        color: currentColor.value
    }
    if (isPoint.value) {
        const _lon = str2num(lon.value);
        const _lat = str2num(lat.value);
        if (_lon && _lat) {
            properties.position = [_lon, _lat]
        }
    }
    emits('save', props.data.id, properties);
    emits('close');
};

const getElePic = computed(() => {
    const type = getType();
    if (type == 'LineString') {
        return 'line';
    }
    if (type == 'Point' || type == 'MultiPoint') {
        return 'point';
    }
    if (type == 'Circle') {
        return 'circle';
    }
    if (type == 'Rectangle') {
        return 'rect';
    }
    return 'polygon';
});

const area = computed(() => {
    const type = getType();
    if (type == 'Rectangle' || type == 'Polygon' || type == 'MultiPolygon') {
        return calculatePolygonArea(props.data?.geometry.coordinates);
    } else if (type == 'Circle') {
        return calculateCircleArea(props.data?.properties.radius);
    }
    return 0;
});
const perimeter = computed(() => {
    const type = getType();
    if (type == 'Rectangle' || type == 'Polygon' || type == 'MultiPolygon') {
        return calculatePolygonPerimeter(props.data?.geometry.coordinates);
    } else if (type == 'Circle') {
        return calculateCirclePerimeter(props.data?.properties.radius);
    }
    return 0;
});
const length = computed(() => {
    const type = getType();
    if (type == 'LineString') {
        return calculateLineLength(props.data?.geometry.coordinates);
    }
    return 0;
});

const isPoint = computed(() => {
    return props.data?.geometry.type == 'Point';
});
const getType = () => {
    const type = props.data?.geometry.type;
    if (type == 'Polygon') {
        return props.data?.properties.type || type;
    }
    return type;
};

watchEffect(() => {
    name.value = props.data?.properties.name;
    if (props.data?.geometry.type == 'Point') {
        lon.value = props.data?.geometry.coordinates[0];
        lat.value = props.data?.geometry.coordinates[1];
    }
    currentColor.value = props.data?.properties.color;
});
</script>

<style lang="less">
.geometry-form {
    position: absolute;
    z-index: 9999999999999;
    right: 0.5rem;
    min-width: 350px;
    height: calc(100% - 1rem);
    background-color: var(--component-background-color);

    .mt-2 {
        margin-top: 0.5rem;
    }

    .form {
        padding: 0 0.5rem;

        &>.item {
            display: flex;
            align-items: center;
            column-gap: 0.5rem;
            line-height: 36px !important;

            input[type=text] {
                line-height: 22px;
                flex: 1;
            }
        }

        .title {
            display: inline-block;
            color: var(--text-second-color);
        }

        .color {
            display: inline-block;
            align-items: center;
            width: 18px;
            height: 18px;
            line-height: 18px;
            cursor: pointer;
        }
    }
}
</style>
