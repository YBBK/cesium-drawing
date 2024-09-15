<template>
    <div ref="cesiumContainer" class="cesium-container">
        <div class="over">
            <ButtonGroup>
                <IconButton icon="line" />
                <IconButton icon="line" />
                <IconButton icon="line" />
            </ButtonGroup>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import * as Cesium from 'cesium'
import { IconButton, ButtonGroup } from '@/components/Icon'

const cesiumContainer = ref(null)

onMounted(() => {
    const viewer = new Cesium.Viewer(cesiumContainer.value, {
        //       terrainProvider: Cesium.createWorldTerrain()
    })

    // 添加一个点
    const point = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 100),
        point: {
            pixelSize: 10,
            color: Cesium.Color.RED
        },
        label: {
            text: 'Beijing',
            font: '14pt sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -9)
        }
    })

    // 添加一个矩形
    const rectangle = viewer.entities.add({
        rectangle: {
            coordinates: Cesium.Rectangle.fromDegrees(115.39, 38.9, 117.39, 40.9),
            material: Cesium.Color.RED.withAlpha(0.5)
        }
    })

    // 设置相机位置
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 1000000),
        orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-90),
            roll: 0.0
        }
    })
})
</script>

<style scoped lang="less">
.cesium-container {
    width: 100%;
    height: 100%;
    position: relative;

    .over {

        position: absolute;
        top: 10rem;
        left: 10rem;
        z-index: 9999;
    }
}
</style>