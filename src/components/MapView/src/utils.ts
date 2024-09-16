import * as Cesium from 'cesium'

const MIN_HEIGHT = 30000

function zoomTo(viewer: Cesium.Viewer, entity: Cesium.Entity) {
  viewer.zoomTo(entity)
}

function setView(viewer: Cesium.Viewer, coord: number[]) {
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(coord[0], coord[1], getHeight(coord[2])),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: Cesium.Math.toRadians(0)
    }
  })
}

function flyToPoint(viewer: Cesium.Viewer, coordinate: number[]) {
  const coord = coordinate
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(coord[0], coord[1], getHeight(coord[2])),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: Cesium.Math.toRadians(0)
    },
    duration: 1
  })
}

function getHeight(height: number): number {
  if (height && height > MIN_HEIGHT) {
    return height
  } else {
    return MIN_HEIGHT
  }
}

export default {
  zoomTo,
  setView,
  flyToPoint
}
