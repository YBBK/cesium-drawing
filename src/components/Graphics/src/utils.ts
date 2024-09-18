import * as Cesium from 'cesium';
import * as turf from '@turf/turf';
import * as geojson from 'geojson';

import type { NodeProperties } from './types';

export function pickCartesian3(
    viewer: Cesium.Viewer,
    position: Cesium.Cartesian2,
    model: boolean = false,
    terrian: boolean = false,
): Cesium.Cartesian3 | undefined {
    if (model) {
        return viewer.scene.pickPosition(position);
    }
    if (terrian) {
        const ray = viewer.camera.getPickRay(position);
        if (ray) {
            return viewer.scene.globe.pick(ray, viewer.scene);
        }
    } else {
        return viewer.camera.pickEllipsoid(position);
    }
    return void 0;
}

export function toCssColorString(color: Cesium.Color | undefined, rgba: Boolean = false): string {
    if (!color) {
        return '#00ff00';
    }
    const red = Math.round(color.red * 255)
        .toString(16)
        .padStart(2, '0');
    const green = Math.round(color.green * 255)
        .toString(16)
        .padStart(2, '0');
    const blue = Math.round(color.blue * 255)
        .toString(16)
        .padStart(2, '0');
    const alpha = Math.round(color.alpha * 255)
        .toString(16)
        .padStart(2, '0');

    if (rgba) {
        return `#${red}${green}${blue}${alpha}`;
    } else {
        return `#${red}${green}${blue}`;
    }
}

export function toLnglat(pos: Cesium.Cartesian3): number[] {
    const cartographic = Cesium.Cartographic.fromCartesian(pos);
    return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
}

export function getNodeProp(properties: Cesium.PropertyBag | undefined): NodeProperties | undefined {
    if (properties) {
        return {
            type: properties.type?.getValue(),
            index: properties.index?.getValue(),
            graphic: properties.graphic?.getValue(),
        };
    }
    return void 0;
}

//线的长度计算
export function calculateLineLength(coordinates: geojson.Position[]) {
    // console.log('calculateLineLength', coordinates);
    const line = turf.lineString(coordinates);
    // 单位：米
    return turf.length(line, { units: 'meters' });
}

//多边形的周长计算
export function calculatePolygonPerimeter(coordinates: geojson.Position[][]) {
    const _coordinates = coordinates[0];
    return calculateLineLength(_coordinates);
}

//多边形的面积计算
export function calculatePolygonArea(coordinates: geojson.Position[][]) {
    // const closedCoordinates = [...coordinates, coordinates[0]];
    const polygon = turf.polygon(coordinates);
    return turf.area(polygon); // 单位：平方米
}

//圆的周长计算
export function calculateCirclePerimeter(radius) {
    return 2 * Math.PI * radius; // 单位：米
}

//圆的面积计算
export function calculateCircleArea(radius) {
    return Math.PI * radius * radius; // 单位：平方米
}

export function areaSquareMeters2Kilometers(areaSquareMeters) {
    if (areaSquareMeters >= 1000000) {
        const areaSquareKilometers = areaSquareMeters / 1000000;
        return `${areaSquareKilometers.toFixed(2)} km²`;
    } else {
        return `${areaSquareMeters.toFixed(2)} m²`;
    }
}

export function meters2Kilometers(meters) {
    if (meters >= 1000) {
        const kilometers = meters / 1000;
        return `${kilometers.toFixed(2)} km`;
    } else {
        return `${meters.toFixed(2)} m`;
    }
}
