<template>
  <div class="scale-indicator">
    <svg width="110" height="40">
      <g fill="none" stroke="currentColor" stroke-width="1.5">
        <line x1="10" y1="30" :x2="scaleWidth" y2="30" />
        <line x1="10" y1="25" x2="10" y2="31" />
        <line :x1="scaleWidth" y1="25" :x2="scaleWidth" y2="31" />
        <text x="38" y="25">{{ scaleText }}</text>
      </g>
    </svg>
    <!-- height:{{ height }} pitch:{{ pitch }} heading:{{ heading }} roll:{{ roll }} -->
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import * as Cesium from 'cesium'
import { useCesiumViewer } from './hooks/useMapView'

const scaleWidth = ref(100)
const scaleText = ref('100 m')
const height = ref(0)
const pitch = ref(0)
const heading = ref(0)
const roll = ref(0)

const updateScaleBar = (viewer) => {
  const camera = viewer.camera
  const position = camera.positionCartographic
  height.value = position.height

  pitch.value = Cesium.Math.toDegrees(camera.pitch)
  heading.value = Cesium.Math.toDegrees(camera.heading)
  roll.value = Cesium.Math.toDegrees(camera.roll)

  const ellipsoid = viewer.scene.globe.ellipsoid
  const scale = roundToNearest(getScale(camera, ellipsoid, viewer))
  scaleText.value = formatScaleText(scale)
  scaleWidth.value = scaleToWidth(scale)
}

const getScale = (camera, ellipsoid, viewer) => {
  const canvas = viewer.scene.canvas
  const width = canvas.clientWidth
  const left = camera.getPickRay(new Cesium.Cartesian2(width / 2 - 50, canvas.clientHeight - 1))
  const right = camera.getPickRay(new Cesium.Cartesian2(width / 2 + 50, canvas.clientHeight - 1))
  const leftPosition = viewer.scene.globe.pick(left, viewer.scene)
  const rightPosition = viewer.scene.globe.pick(right, viewer.scene)

  if (!leftPosition || !rightPosition) {
    return 0
  }

  const leftCartographic = ellipsoid.cartesianToCartographic(leftPosition)
  const rightCartographic = ellipsoid.cartesianToCartographic(rightPosition)

  const geodesic = new Cesium.EllipsoidGeodesic()
  geodesic.setEndPoints(leftCartographic, rightCartographic)
  const distance = geodesic.surfaceDistance

  return Math.round(distance)
}
const formatScaleText = (scale) => {
  if (scale == 0) {
    return '--'
  }
  if (scale < 1000) {
    return `${scale} m`
  } else {
    return `${(scale / 1000).toFixed(1)} km`
  }
}
const scaleToWidth = (scale) => {
  return 100 + scale / 1000
}

const roundToNearest = (scale) => {
  if (scale < 10) {
    return Math.round(scale)
  } else if (scale < 100) {
    return Math.round(scale / 5) * 5
  } else {
    return Math.round(scale / 10) * 10
  }
}

function onViewInited(viewer: Cesium.Viewer) {
  /******/
  viewer.scene.postRender.addEventListener(() => updateScaleBar(viewer))
  updateScaleBar(viewer)
}

useCesiumViewer(onViewInited)
</script>
<style lang="less">
.scale-indicator {
  display: flex;
  align-items: center;

  svg {
    fill: var(--text-color);
    color: var(--text-color);
  }
}
</style>
