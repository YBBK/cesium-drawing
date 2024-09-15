<template>
    <div class="map-zoom">
        <IconButton icon="home" @click="goHome" />
        <ButtonGroup>
            <IconButton icon="plus" @click="zoomIn" />
            <IconButton icon="minus" @click="zoomOut" />
        </ButtonGroup>
        <FullScreen v-if="fullscreen" />
    </div>
</template>

<script lang="ts" setup>
import * as Cesium from 'cesium';
import { useCesiumViewer } from './hooks/useMapView';
import { IconButton, ButtonGroup } from '@/components/Icon';
import FullScreen from './FullScreen.vue';

const emits = defineEmits(['goHome']);
const props = defineProps({
    home: Number[3],
    fullscreen: {
        type: Boolean,
        default: true,
    },
});
const { getViewer } = useCesiumViewer();

function zoomIn() {
    const _viewer = getViewer();
    if (_viewer) {
        const scene = _viewer.scene;
        const camera = scene.camera;
        if (scene.mode === Cesium.SceneMode.SCENE3D) {
            const focus = _getCameraFocus(scene);
            const cameraPosition = _getCameraPosition(camera, focus, 1 / 2);
            camera.flyTo({
                destination: cameraPosition,
                orientation: {
                    heading: camera.heading,
                    pitch: camera.pitch,
                    roll: camera.roll,
                },
                duration: 0.5,
                convert: false,
            });
        } else {
            camera.zoomIn(camera.positionCartographic.height * 0.5);
        }
    }
}
function zoomOut() {
    const _viewer = getViewer();
    if (_viewer) {
        const scene = _viewer.scene;
        const camera = scene.camera;
        if (scene.mode === Cesium.SceneMode.SCENE3D) {
            const focus = _getCameraFocus(scene);
            const cameraPosition = _getCameraPosition(camera, focus, -1);
            camera.flyTo({
                destination: cameraPosition,
                orientation: {
                    heading: camera.heading,
                    pitch: camera.pitch,
                    roll: camera.roll,
                },
                duration: 0.5,
                convert: false,
            });
        } else {
            camera.zoomOut(camera.positionCartographic.height);
        }
    }
}
function goHome() {
    const _viewer = getViewer();
    if (_viewer) {
        const _home = props.home;
        if (_home) {
            _viewer.camera.flyTo({
                destination: Cesium.Cartesian3.fromDegrees(_home[0], _home[1], _home[2]),
                orientation: {
                    heading: Cesium.Math.toRadians(0),
                    pitch: Cesium.Math.toRadians(-90),
                    roll: Cesium.Math.toRadians(0),
                },
                duration: 1,
            });
        } else {
            emits('goHome');
        }
    }
}

function _getCameraFocus(scene) {
    const ray = new Cesium.Ray(scene.camera.positionWC, scene.camera.directionWC);
    const intersections = Cesium.IntersectionTests.rayEllipsoid(ray, Cesium.Ellipsoid.WGS84);
    if (intersections) {
        return Cesium.Ray.getPoint(ray, intersections.start);
    }
    return Cesium.IntersectionTests.grazingAltitudeLocation(ray, Cesium.Ellipsoid.WGS84);
}
function _getCameraPosition(camera, focus, scalar) {
    const cartesian3Scratch = new Cesium.Cartesian3();
    const direction = Cesium.Cartesian3.subtract(focus, camera.position, cartesian3Scratch);
    const movementVector = Cesium.Cartesian3.multiplyByScalar(direction, scalar, cartesian3Scratch);
    return Cesium.Cartesian3.add(camera.position, movementVector, cartesian3Scratch);
}
</script>
<style lang="less">
.map-zoom {
    display: flex;
    flex-direction: column;
    row-gap: @padding;
}
</style>
