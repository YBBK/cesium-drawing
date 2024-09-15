import * as Cesium from 'cesium';

const MIN_HEIGHT = 30000;

function zoomTo(viewer: Cesium.Viewer, entity: Cesium.Entity) {
    viewer.zoomTo(entity);
}

function setView(viewer: Cesium.Viewer, coord: number[]) {
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(coord[0], coord[1], getHeight(coord[2])),
        orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-90),
            roll: Cesium.Math.toRadians(0),
        },
    });
}

function flyToPoint(viewer: Cesium.Viewer, coordinate: number[]) {
    const coord = coordinate;
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(coord[0], coord[1], getHeight(coord[2])),
        orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-90),
            roll: Cesium.Math.toRadians(0),
        },
        duration: 1,
    });
}

function flyToEntity(viewer: Cesium.Viewer, id: string) {
    const entity = viewer.entities.getById(id);
    if (entity) {
        viewer.flyTo(entity, {
            offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.PI_OVER_TWO, 0),
        });
    }
}

function getHeight(height: number): number {
    if (height && height > MIN_HEIGHT) {
        return height;
    } else {
        return MIN_HEIGHT;
    }
}

//获取实体在场景中的xy坐标，用于设置html中关联信息的位置
function getPosition(viewer: Cesium.Viewer, entity: Cesium.Entity): Cesium.Cartesian2 | undefined {
    const coor = entity.position?.getValue(new Cesium.JulianDate());
    if (coor) {
        return viewer.scene.cartesianToCanvasCoordinates(coor);
    }
    return undefined;
}

function getPositionById(viewer: Cesium.Viewer, id: string): Cesium.Cartesian2 | undefined {
    const entity = viewer.entities.getById(id);
    if (entity) {
        const coor = entity.position?.getValue(new Cesium.JulianDate());
        if (coor) {
            return viewer.scene.cartesianToCanvasCoordinates(coor);
        }
    }
    return undefined;
}

export default {
    zoomTo,
    setView,
    flyToPoint,
    flyToEntity,
    getPosition,
    getPositionById,
};
