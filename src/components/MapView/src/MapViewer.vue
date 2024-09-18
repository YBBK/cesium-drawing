<template>
    <div ref="cesiumContainer" :id="props.id" class="mapviewer">
        <MapIndicator class="indicator" />
        <div class="r">
            <div style="margin-right: 0.5rem">
                <slot name="action"></slot>
            </div>
            <div class="act">
                <MapDrawing ref="cesiumDrawing" class="drawing" :viewer="viewer" />

                <MapZoom class="zoom" :home="props.home" @go-home="handleGoHome" />
            </div>
            <SideLayer v-if="$slots.sideLayer">
                <slot name="sideLayer"></slot>
            </SideLayer>
        </div>
        <slot></slot>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, provide, onUnmounted } from 'vue';
import { SideLayer } from '@/components/Viewport';
import * as Cesium from 'cesium';
import utils from './utils';
import MapIndicator from './MapIndicator.vue';
import MapZoom from './MapZoom.vue';
import { MapDrawing } from './drawing';

const cesiumContainer = ref();
const cesiumDrawing = ref();
const viewer = ref<Cesium.Viewer>();

const props = defineProps({
    id: {
        type: String,
        required: false,
        default: 'map_container',
    },
    home: {
        type: Number[3],
        required: false,
        default: [113.31932, 23.1405, 30000],
    },
    goHome: {
        type: Function,
        default: null,
    },
    scene2DOnly: {
        type: Boolean,
        default: false,
    },
    fly: {
        type: Boolean,
        default: false,
    },
});

const emits = defineEmits(['inited', 'goHome']);

function getViewer(): Cesium.Viewer | undefined {
    return viewer.value as Cesium.Viewer;
}
function getDrawer() {
    return cesiumDrawing.value?.getDrawer();
}

function onCesiumLoaded() {
    viewer.value.scene.camera.frustum.aspectRatio = viewer.value.canvas.clientWidth / viewer.value.canvas.clientHeight;
    if (viewer.value) {
        viewer.value.scene.postRender.removeEventListener(onCesiumLoaded);
        emits('inited', viewer.value);
    }
}

function handleGoHome() {
    if (props.goHome) {
        props.goHome();
    } else if (viewer.value) {
        utils.flyToPoint(viewer.value, props.home);
    }
}

onMounted(async () => {
    // 将视角定位到点的范围
    const _viewer = new Cesium.Viewer(props.id, {
        animation: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        fullscreenButton: false,
        navigationHelpButton: false,
        shouldAnimate: true,
        targetFrameRate: 60,
        terrain: props.scene2DOnly ? undefined : new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl('http://120.26.202.82:8083/')),
    });
    if (props.scene2DOnly) {
        _viewer.scene.mode = Cesium.SceneMode.SCENE2D;
    }
    _viewer._cesiumWidget._creditContainer.style.display = 'none'; // 隐藏cesium ion
    _viewer.scene.fxaa = true; //抗锯齿
    _viewer.scene.postProcessStages.fxaa.enabled = false;
    _viewer.scene.globe.showGroundAtmosphere = true;
    _viewer.scene.screenSpaceCameraController.minimumZoomDistance = 500; // 最小高度500米
    _viewer.scene.screenSpaceCameraController.maximumZoomDistance = 20000000; // 最大高度20000公里

    //禁用双击
    _viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    const pos = props.home;
    if (props.fly) {
        utils.flyToPoint(_viewer, [pos[0], pos[1], pos[2]]);
    } else {
        utils.setView(_viewer, [pos[0], pos[1], pos[2]]);
    }

    viewer.value = _viewer;
    _viewer.scene.postRender.addEventListener(onCesiumLoaded);
});

onUnmounted(() => {
    if (viewer.value && viewer.value) {
        viewer.value.destroy();
    }
});

provide('cesiumViewer', viewer);
provide('cesiumContainer', cesiumContainer);
provide('viewport', cesiumContainer);

defineExpose({ getViewer, getDrawer });
</script>
<style lang="less">
@padding: 0.5rem;

.mapviewer {
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;

    .imagery,
    .indicator,
    .r {
        position: absolute;
        z-index: 2;
    }

    .imagery {
        top: @padding;
        left: @padding;
    }

    .indicator {
        bottom: @padding;
        left: @padding;
    }

    &>.r {
        display: flex;
        top: 0;
        right: 0;
        height: 100%;
        padding: 0.5rem 0.5rem 0.5rem 0;
        pointer-events: none;

        &>.act {
            display: flex;
            flex-direction: column;
            height: 100%;
            justify-content: space-between;
        }
    }

    .cesium-viewer {
        z-index: 0;
    }
}
</style>
