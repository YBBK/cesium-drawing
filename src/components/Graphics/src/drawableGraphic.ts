import * as Cesium from 'cesium';
import { BaseGraphic } from './base';
import { GraphicType, NodeType, GraphicMode } from './types';
import type { GraphicOptions } from './types';

import { getNodeProp, toCssColorString, toLnglat, createCircleSVG } from './utils';

const MARKER_SVG =
    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><path fill="white" d="M18 2A11.79 11.79 0 0 0 6.22 13.73c0 4.67 2.62 8.58 4.54 11.43l.35.52a100 100 0 0 0 6.14 8l.76.89l.76-.89a100 100 0 0 0 6.14-8l.35-.53c1.91-2.85 4.53-6.75 4.53-11.42A11.79 11.79 0 0 0 18 2m0 17a6.56 6.56 0 1 1 6.56-6.56A6.56 6.56 0 0 1 18 19" class="clr-i-solid clr-i-solid-path-1"/><circle cx="18" cy="12.44" r="3.73" fill="white" class="clr-i-solid clr-i-solid-path-2"/><path fill="none" d="M0 0h36v36H0z"/></svg>';

const defaultGraphicOptions: GraphicOptions = {
    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    color: Cesium.Color.fromCssColorString('#3EDF2E'),

    //仅适用于点
    pixelSize: 8,
    outlineColor: Cesium.Color.WHITE,
    outlineWidth: 1.5,

    selectedColor: Cesium.Color.fromCssColorString('#2D8CF0'),
    editColor: Cesium.Color.fromCssColorString('#F5A623'),
    opacity: 0.2,
    width: 2, //线宽，除点外的所有图形
    dash: false,
    dashLength: 5,
    dashPattern: 255,
    clampToGround: true,
    showLabel: true,
    labelFont: '14px sans-serif',
};

abstract class DrawableGraphic extends BaseGraphic {
    protected _nodes: Cesium.Entity[] = [];
    protected _controlPoints: Cesium.Entity[] = [];
    protected _options: GraphicOptions;
    protected _positions: Cesium.Cartesian3[];
    protected _mode: GraphicMode = GraphicMode.Edit;
    protected _dynamicPositions: Cesium.Cartesian3[] = [];
    protected _selectedNodeIndex: number = -1;
    protected _changed: number = 0;
    protected _updateCallback: (arg: DrawableGraphic) => void;

    constructor(
        viewer: Cesium.Viewer,
        id: string,
        name: string,
        positions: Cesium.Cartesian3[],
        options: Partial<GraphicOptions> = {},
        updateCallback: (arg: DrawableGraphic) => void = () => {},
    ) {
        super(viewer, id, name);
        this._positions = positions;
        this._updateCallback = updateCallback;
        this._options = { ...defaultGraphicOptions, ...options } as GraphicOptions;
    }

    get positions(): Cesium.Cartesian3[] {
        return this._positions;
    }

    get options(): GraphicOptions {
        return this._options;
    }

    setName(name: string) {
        this._name = name;
    }

    setOptions(options: Partial<GraphicOptions>) {
        this._options = { ...this._options, ...options };
        this.setNormalMode(true);
    }

    abstract type(): GraphicType;
    protected abstract pointLimit(): number[];

    protected abstract updateStyle(): void;

    protected getCenter(): Cesium.Cartesian3 {
        return this._positions[0];
    }

    private getLastPosition(): Cesium.Cartesian3 | undefined {
        if (this._positions.length > 0) {
            return this._positions[this._positions.length - 1];
        }
        return void 0;
    }

    move(diff: Cesium.Cartesian3) {
        this._positions.forEach((pos) => {
            pos.x += diff.x;
            pos.y += diff.y;
            pos.z += diff.z;
        });
        this._changed++;
        this.updateGeometry();
    }

    //添加位置 返回是否结束 true:自动结束 false:可以继续添加
    addPosition(position: Cesium.Cartesian3): boolean {
        const last = this.getLastPosition();
        if (position.equals(last)) {
            return false;
        }
        this._positions.push(position);
        this.updateGeometry();
        this.updateNodes();
        return this._positions.length >= this.pointLimit()[1];
    }

    //返回是否取消 true:取消绘图 false:可以继续
    popPosition(): boolean {
        this._positions.pop();
        this.updateGeometry();
        this.updateNodes();
        return this._positions.length == 0;
    }

    updateDynamicPosition(position: Cesium.Cartesian3) {
        this._dynamicPositions = [position];
        this.updateGeometry();
    }

    updateGeometry(): void {
        // 对于点图形和使用CallbackProperty的图形，不需要手动更新
    }

    updateNodePosition(index: number, position: Cesium.Cartesian3) {
        if (index >= 0 && index < this._positions.length) {
            this._changed++;
            this._positions[index] = position;
            this.updateGeometry();
            this.updateNodes();
        }
    }

    protected isAllowControlPoint(): boolean {
        return this._dynamicPositions.length == 0;
    }

    addNodeAtControlPoint(index: number, position: Cesium.Cartesian3) {
        this._selectedNodeIndex = -1;
        if (index !== undefined && index > -1 && index < this._positions.length) {
            this._changed++;
            this._positions.splice(index + 1, 0, position);
            this.updateGeometry();
            this.updateNodes();
        }
    }

    //完成绘制 true:绘图成功
    finishDrawing(): boolean {
        this._dynamicPositions = [];

        this.updateGeometry();
        this.setNormalMode();

        return this._positions.length >= this.pointLimit()[0];
    }

    //设置正常模式
    setNormalMode(force: boolean = false) {
        if (this._mode != GraphicMode.Normal || force) {
            this._mode = GraphicMode.Normal;
            this._selectedNodeIndex = -1;
            this.updateStyle();
            this.hideNodes();
            if (this._changed > 0) {
                this._changed = 0;
                //fire change event
                this._updateCallback(this);
            }
        }
    }

    //设置选中模式
    setSelectedMode() {
        if (this._mode != GraphicMode.Selected) {
            this._mode = GraphicMode.Selected;
            this._selectedNodeIndex = -1;
            this.updateStyle();
            this.hideNodes();
        }
    }

    //设置编辑模式
    setEditMode() {
        if (this._mode != GraphicMode.Edit) {
            this._mode = GraphicMode.Edit;
            // this._selectedNodeIndex = -1;
            this.updateStyle();
            this.updateNodes();
        }
    }

    setSelectedNodeIndex(index: number) {
        this._selectedNodeIndex = index;
        this.showNodes();
    }

    clearSelectedNode() {
        this._selectedNodeIndex = -1;
        this.hideNodes();
    }

    protected createLabel(text: string | undefined) {
        if (this._options.showLabel && text && text.length > 0) {
            return {
                text: text,
                font: this._options.labelFont,
                fillColor: Cesium.Color.BLACK,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 5,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: this.labelOffset(),
                heightReference: this._options.heightReference,
            };
        } else {
            return void 0;
        }
    }

    protected labelOffset() {
        return new Cesium.Cartesian2(0, 0);
    }

    protected updateLabel(show: boolean = true) {
        if (!this._options.showLabel || this._entities.length == 0) {
            return;
        }
        const entity = this._entities[0];
        const pos = this.getCenter();
        if (this._name && this._name.length > 0 && show) {
            entity.position = pos;
            entity.label = this.createLabel(this._name);
        } else {
            entity.label = undefined;
        }
    }

    //更新节点的控制点
    protected updateNodes() {
        //移除旧节点和控制点
        this.removeNodes();
        //创建新节点
        this.createNodes();
    }

    //显示节点和控制点
    protected showNodes() {
        this._nodes.forEach((node, index) => {
            if (node.point) {
                const size = this._selectedNodeIndex == index ? (this._options.pixelSize || 5) * 1.2 : this._options.pixelSize;
                node.point.pixelSize = size;
            }
            node.show = true;
        });
        this._controlPoints.forEach((node) => {
            node.show = true;
        });
    }

    //隐藏节点和控制点
    protected hideNodes() {
        this._nodes.forEach((node) => {
            node.show = false;
        });
        this._controlPoints.forEach((node) => {
            node.show = false;
        });
    }

    override remove() {
        // console.log('===== 开始删除图形：' + this._id + ' 类型：' + this.type());
        this._nodes.forEach((node) => this._viewer.entities.remove(node));
        this._controlPoints.forEach((cp) => this._viewer.entities.remove(cp));
        this._nodes = [];
        this._controlPoints = [];
        super.remove();
    }

    removeNode(node: Cesium.Entity) {
        if (this._positions.length <= this.pointLimit()[0]) {
            //剩下的点数己经不能够成图形，需要保留
            return;
        }
        const prop = getNodeProp(node.properties);
        const index = prop?.index;
        this._selectedNodeIndex = -1;
        if (index !== undefined && index > -1 && index < this._positions.length) {
            this._positions.splice(index, 1);
            this.updateGeometry();
            this.updateNodes();
        }
    }

    protected createNodes() {
        const svg = createCircleSVG(toCssColorString(this._options.editColor as Cesium.Color), '#ffffff');
        const ctlSvg = createCircleSVG(toCssColorString(this._options.editColor as Cesium.Color));
        const selectedSvg = createCircleSVG(toCssColorString(this._options.selectedColor as Cesium.Color));
        this._positions.forEach((position, index) => {
            //顶点
            const size = this._selectedNodeIndex == index ? this._options.pixelSize * 1.8 : this._options.pixelSize * 1.5;
            const node = this._viewer.entities.add({
                position: position,
                billboard: {
                    image: this._selectedNodeIndex == index ? selectedSvg : svg,
                    width: size,
                    height: size,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY, // 禁用深度测试
                },
                properties: {
                    type: NodeType.Node,
                    index: index,
                    graphic: this,
                },
            });
            this._nodes.push(node);

            if (this.isAllowControlPoint()) {
                // 添加控制点 如果是多边形，在最后一个点跟首节点中间添加控制点
                // const last = this._positions.length;
                if (index >= this.positions.length - 1 && this.type() !== GraphicType.Polygon) {
                    return;
                }
                const nextPosition = this._positions[index + 1] || this._positions[0];
                const midPosition = Cesium.Cartesian3.midpoint(position, nextPosition, new Cesium.Cartesian3());
                const controlPoint = this._viewer.entities.add({
                    position: midPosition,
                    show: this._mode === GraphicMode.Edit ? true : false,
                    billboard: {
                        image: ctlSvg,
                        width: this._options.pixelSize,
                        height: this._options.pixelSize,
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 禁用深度测试
                    },
                    properties: {
                        type: NodeType.ControlNode,
                        index: index,
                        graphic: this,
                    },
                });
                this._controlPoints.push(controlPoint);
            }
        });
    }

    protected removeNodes() {
        this._nodes.forEach((node) => this._viewer.entities.remove(node));
        this._controlPoints.forEach((node) => this._viewer.entities.remove(node));
        this._nodes = [];
        this._controlPoints = [];
    }

    protected isMultiPoint(): boolean {
        return this._positions.length > 1;
    }

    protected color(color: Cesium.Color) {
        return color.withAlpha(this._options.opacity);
    }

    protected material(color: Cesium.Color, isNormal: boolean = false) {
        if (isNormal && !this._options.dash) {
            return color;
        }
        return new Cesium.PolylineDashMaterialProperty({
            color: color,
            dashLength: this._options.dashLength,
            dashPattern: this._options.dashPattern,
        });
    }

    protected coordinates(): any {
        if (this.isMultiPoint()) {
            return this._positions.map((pos) => {
                return toLnglat(pos);
            });
        } else {
            return toLnglat(this._positions[0]);
        }
    }

    properties() {
        return {
            name: this._name,
            color: toCssColorString(this._options.color as Cesium.Color),
            opacity: this._options.opacity,
        };
    }

    toGeoJSON() {
        return {
            type: 'Feature',
            properties: this.properties(),
            geometry: {
                coordinates: this.coordinates(),
                type: this.type(),
                ...this.geometryExt(),
            },
            id: this._id,
        };
    }

    toPrimitive() {
        return {
            id: this._id,
            coordinates: this.coordinates(),
            ...this.properties(),
        };
    }

    protected getRadius(): number | undefined {
        return void 0;
    }

    protected geometryExt() {
        return {};
    }
}

class PointGraphic extends DrawableGraphic {
    constructor(
        viewer: Cesium.Viewer,
        id: string,
        name: string,
        position: Cesium.Cartesian3[],
        options: Partial<GraphicOptions>,
        updateCallback: (arg: DrawableGraphic) => void,
    ) {
        super(viewer, id, name, position, options, updateCallback);
    }

    protected pointLimit(): number[] {
        return [1, 2];
    }

    protected override isAllowControlPoint(): boolean {
        return false;
    }

    type(): GraphicType {
        return this.isMultiPoint() ? GraphicType.MultiPoint : GraphicType.Point;
    }

    private getNormalBillboard(): any {
        return {
            image: MARKER_SVG,
            width: 36,
            height: 36,
            color: this._options.color,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            pixelOffset: new Cesium.Cartesian2(0, -18),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
        };
    }
    private getBillboard(color: Cesium.Color | string, size: number = this._options.pixelSize * 2): any {
        return {
            image: createCircleSVG(toCssColorString(color as Cesium.Color)),
            width: size,
            height: size,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
        };
    }

    protected override createEntities(): Cesium.Entity[] {
        const entities: Cesium.Entity[] = [];
        this._positions.forEach((pos, idx) => {
            const entity = new Cesium.Entity({
                position: pos,
                billboard: this.getNormalBillboard(),
                properties: {
                    type: NodeType.Node,
                    index: idx,
                    graphic: this,
                },
            });
            entities.push(entity);
        });
        return entities;
    }

    protected updateStyle() {
        const editBillboard = this.getBillboard(this._options.editColor);
        const selectedBillboard = this.getBillboard(this._options.selectedColor);
        const normalBillboard = this.getNormalBillboard();

        this._entities.forEach((entity, idx) => {
            entity.position = this._positions[idx];
            switch (this._mode) {
                case GraphicMode.Normal:
                    entity.billboard = normalBillboard;
                    this.updateLabel();
                    break;
                case GraphicMode.Selected:
                    entity.billboard = selectedBillboard;
                    this.updateLabel(false);
                    break;
                case GraphicMode.Edit:
                    entity.billboard = editBillboard;
                    this.updateLabel(false);
                    break;
            }
        });
    }

    protected override updateNodes(): void {
        //empty
    }
    override updateGeometry(): void {
        this.remove();
        this.show();
        this.updateStyle();
    }

    override addNodeAtControlPoint(_idx: number, _position: Cesium.Cartesian3) {
        // 点图形不需要实现此方法
    }

    override updateDynamicPosition(_position: Cesium.Cartesian3) {
        // 对于点图形，不需要动态位置
    }
    protected override labelOffset(): Cesium.Cartesian2 {
        return new Cesium.Cartesian2(0, -36);
    }
}

class LineGraphic extends DrawableGraphic {
    constructor(
        viewer: Cesium.Viewer,
        id: string,
        name: string,
        positions: Cesium.Cartesian3[],
        options: Partial<GraphicOptions>,
        updateCallback: (arg: DrawableGraphic) => void,
    ) {
        super(viewer, id, name, positions, options, updateCallback);
    }

    protected pointLimit(): number[] {
        return [2, Number.MAX_VALUE];
    }

    protected override createEntities(): Cesium.Entity[] {
        const entity = new Cesium.Entity({
            polyline: {
                positions: new Cesium.CallbackProperty(() => [...this._positions, ...this._dynamicPositions], false),
                width: this._options.width,
                material: this.material(this._options.editColor),
                clampToGround: this._options.clampToGround,
            },
            properties: {
                type: NodeType.Graphic,
                graphic: this,
            },
        });
        return [entity];
    }

    protected updateStyle() {
        this._entities.forEach((entity) => {
            switch (this._mode) {
                case GraphicMode.Normal:
                    entity.polyline.material = this.material(this._options.color, true);
                    this.hideNodes();
                    this.updateLabel();
                    break;
                case GraphicMode.Selected:
                    entity.polyline.material = this.material(this._options.selectedColor);
                    this.showNodes();
                    this.updateLabel(false);
                    break;
                case GraphicMode.Edit:
                    entity.polyline.material = this.material(this._options.editColor);
                    this.showNodes();
                    this.updateLabel(false);
                    break;
            }
        });
    }

    type(): GraphicType {
        return GraphicType.PolyLine;
    }
    protected override labelOffset(): Cesium.Cartesian2 {
        return new Cesium.Cartesian2(0, -5);
    }
}

class PolygonGraphic extends DrawableGraphic {
    constructor(
        viewer: Cesium.Viewer,
        id: string,
        name: string,
        positions: Cesium.Cartesian3[],
        options: Partial<GraphicOptions>,
        updateCallback: (arg: DrawableGraphic) => void,
    ) {
        super(viewer, id, name, positions, options, updateCallback);
    }
    protected pointLimit(): number[] {
        return [3, Number.MAX_VALUE];
    }
    protected override createEntities(): Cesium.Entity[] {
        const pointCount = this.pointLimit()[0];
        const entity = new Cesium.Entity({
            polygon: {
                hierarchy: new Cesium.CallbackProperty(() => {
                    const positions = [...this._positions, ...this._dynamicPositions];
                    return positions.length >= pointCount ? new Cesium.PolygonHierarchy(positions) : undefined;
                }, false),
                material: this.color(this._options.editColor),
                heightReference: this._options.heightReference,
                outline: true,
                outlineColor: this._options.outlineColor,
                outlineWidth: this._options.outlineWidth,
                arcType: Cesium.ArcType.RHUMB,
            },
            polyline: {
                positions: new Cesium.CallbackProperty(() => {
                    if (this._positions.length > 1) {
                        return [...this._positions, ...this._dynamicPositions, this._positions[0]];
                    } else {
                        return [...this._positions, ...this._dynamicPositions];
                    }
                }, false),
                width: this._options.width,
                material: this.material(this._options.editColor),
                clampToGround: this._options.clampToGround,
            },
            properties: {
                type: NodeType.Graphic,
                graphic: this,
            },
        });
        return [entity];
    }

    protected updateStyle() {
        this._entities.forEach((entity) => {
            switch (this._mode) {
                case GraphicMode.Normal:
                    entity.polygon.material = this.color(this._options.color);
                    entity.polygon.outlineColor = this._options.color;
                    entity.polyline.material = this.material(this._options.color, true);
                    this.hideNodes();
                    this.updateLabel();
                    break;
                case GraphicMode.Selected:
                    entity.polygon.material = this.color(this._options.selectedColor);
                    entity.polygon.outlineColor = this._options.selectedColor;
                    entity.polyline.material = this.material(this._options.selectedColor);
                    this.showNodes();
                    this.updateLabel(false);
                    break;
                case GraphicMode.Edit:
                    entity.polygon.material = this.color(this._options.editColor);
                    entity.polygon.outlineColor = this._options.editColor;
                    entity.polyline.material = this.material(this._options.editColor);
                    this.showNodes();
                    this.updateLabel(false);
                    break;
            }
        });
    }

    protected override getCenter(): Cesium.Cartesian3 {
        return Cesium.BoundingSphere.fromPoints(this._positions).center;
    }

    type(): GraphicType {
        return GraphicType.Polygon;
    }

    protected override coordinates(): any {
        const coors: any = super.coordinates();
        return [[...coors, coors[0]]];
    }
}

class RectangleGraphic extends DrawableGraphic {
    private _edgePoints: Cesium.Cartesian3[] = [];

    constructor(
        viewer: Cesium.Viewer,
        id: string,
        name: string,
        positions: Cesium.Cartesian3[],
        options: Partial<GraphicOptions>,
        updateCallback: (arg: DrawableGraphic) => void,
    ) {
        super(viewer, id, name, positions, options, updateCallback);
    }

    protected pointLimit(): number[] {
        return [2, 2];
    }

    protected override createEntities(): Cesium.Entity[] {
        const entity = new Cesium.Entity({
            polygon: {
                hierarchy: new Cesium.CallbackProperty(() => {
                    return new Cesium.PolygonHierarchy(this._edgePoints);
                }, false),
                material: this.color(this._options.editColor),
                heightReference: this._options.heightReference,
                outline: true,
                outlineColor: this._options.outlineColor,
                outlineWidth: this._options.outlineWidth,
                arcType: Cesium.ArcType.RHUMB,
            },
            polyline: {
                positions: new Cesium.CallbackProperty(() => {
                    return [...this._edgePoints, this._edgePoints[0]];
                }, false),
                width: this._options.width,
                material: this.material(this._options.editColor),
                clampToGround: this._options.clampToGround,
            },
            properties: {
                type: NodeType.Graphic,
                graphic: this,
            },
        });
        return [entity];
    }

    override updateGeometry() {
        const min = this.pointLimit()[0];
        if (this._positions.length == 0) {
            return;
        }
        if (this._positions.length >= min) {
            this._edgePoints = this.generateEdgePoints(this._positions[0], this._positions[1]);
        } else if (this._dynamicPositions.length > 0) {
            this._edgePoints = this.generateEdgePoints(this._positions[0], this._dynamicPositions[0]);
        }
    }

    protected override isAllowControlPoint(): boolean {
        return false;
    }

    protected updateStyle() {
        this._entities.forEach((entity) => {
            switch (this._mode) {
                case GraphicMode.Normal:
                    entity.polygon.material = this.color(this._options.color);
                    entity.polygon.outlineColor = this._options.color;
                    entity.polyline.material = this.material(this._options.color, true);
                    this.hideNodes();
                    this.updateLabel();
                    break;
                case GraphicMode.Selected:
                    entity.polygon.material = this.color(this._options.selectedColor);
                    entity.polygon.outlineColor = this._options.selectedColor;
                    entity.polyline.material = this.material(this._options.selectedColor);
                    this.showNodes();
                    this.updateLabel(false);
                    break;
                case GraphicMode.Edit:
                    entity.polygon.material = this.color(this._options.editColor);
                    entity.polygon.outlineColor = this._options.editColor;
                    entity.polyline.material = this.material(this._options.editColor);
                    this.showNodes();
                    this.updateLabel(false);
                    break;
            }
        });
    }

    protected override getCenter(): Cesium.Cartesian3 {
        return Cesium.BoundingSphere.fromPoints(this._positions).center;
    }

    protected generateEdgePoints(leftTopPoint: Cesium.Cartesian3, rightBottomPoint: Cesium.Cartesian3): Cesium.Cartesian3[] {
        const leftTopCartographic = Cesium.Cartographic.fromCartesian(leftTopPoint);
        const rightBottomCartographic = Cesium.Cartographic.fromCartesian(rightBottomPoint);

        // 计算右上角和左下角的坐标
        const rightTopCartographic = new Cesium.Cartographic(rightBottomCartographic.longitude, leftTopCartographic.latitude);
        const leftBottomCartographic = new Cesium.Cartographic(leftTopCartographic.longitude, rightBottomCartographic.latitude);
        const rightTop = Cesium.Cartesian3.fromRadians(rightTopCartographic.longitude, rightTopCartographic.latitude);
        const leftBottom = Cesium.Cartesian3.fromRadians(leftBottomCartographic.longitude, leftBottomCartographic.latitude);

        const positions: Cesium.Cartesian3[] = [leftTopPoint];
        positions.push(rightTop);
        positions.push(rightBottomPoint);
        positions.push(leftBottom);

        return positions;
    }

    protected override coordinates(): any {
        const coors: any = this._edgePoints.map((pos) => {
            return toLnglat(pos);
        });
        return [[...coors, coors[0]]];
    }

    override properties() {
        return Object.assign(super.properties(), {
            type: 'Rectangle',
        });
    }

    override type(): GraphicType {
        return GraphicType.Rectangle;
    }
    protected override geometryExt() {
        return {
            type: 'Polygon',
        };
    }
}

class CircleGraphic extends RectangleGraphic {
    private _lineEntity: Cesium.Entity | undefined;
    private _radius: number | undefined;

    constructor(
        viewer: Cesium.Viewer,
        id: string,
        name: string,
        positions: Cesium.Cartesian3[],
        options: Partial<GraphicOptions>,
        updateCallback: (arg: DrawableGraphic) => void,
    ) {
        super(viewer, id, name, positions, options, updateCallback);
    }

    override show() {
        super.show();
        this._lineEntity = this._viewer.entities.add({
            polyline: {
                positions: new Cesium.CallbackProperty(() => {
                    if (this._positions.length >= this.pointLimit()[0]) {
                        return [this._positions[0], this._positions[1]];
                    } else {
                        return [this._positions[0], ...this._dynamicPositions];
                    }
                }, false),
                width: this._options.width,
                material: this.material(this._options.editColor),
                clampToGround: this._options.clampToGround,
            },
        });
    }

    override remove(): void {
        if (this._lineEntity) {
            this._viewer.entities.remove(this._lineEntity);
        }
        super.remove();
    }

    protected override getCenter(): Cesium.Cartesian3 {
        return this._positions[0];
    }

    protected override updateStyle() {
        if (this._lineEntity) {
            switch (this._mode) {
                case GraphicMode.Normal:
                case GraphicMode.Selected:
                    this._lineEntity.show = false;
                    break;
                case GraphicMode.Edit:
                    this._lineEntity.show = true;
                    break;
            }
        }
        super.updateStyle();
    }

    protected override generateEdgePoints(center, edgePoint, numPoints = 64): Cesium.Cartesian3[] {
        //计算半径（米）
        this._radius = parseFloat(Cesium.Cartesian3.distance(center, edgePoint).toFixed(3));
        const positions: Cesium.Cartesian3[] = [];
        // 计算圆周上的所有点
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * Cesium.Math.TWO_PI; //% Cesium.Math.TWO_PI;
            const rotatedPoint = this.calcEdgePoint(center, this._radius, angle);

            positions.push(rotatedPoint);
        }
        return positions;
    }

    set radius(radius: number) {
        this._radius = radius;
        if (this._positions.length > 0) {
            const pos = this.calcEdgePoint(this._positions[0], radius);
            this.addPosition(pos);
        }
    }

    override properties() {
        return Object.assign(super.properties(), {
            type: 'Circle',
            radius: this._radius,
            center: toLnglat(this.getCenter()),
        });
    }
    override type(): GraphicType {
        return GraphicType.Circle;
    }
    protected override geometryExt() {
        return {
            type: 'Polygon',
        };
    }

    protected calcEdgePoint(center: Cesium.Cartesian3, radius: number, angle: number = 0) {
        const offsetX = radius * Math.cos(angle);
        const offsetY = radius * Math.sin(angle);

        // 将2D平面上的点投影到3D空间中
        const point = Cesium.Cartesian3.fromElements(offsetX, offsetY, 0);
        const rotationMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        const rotatedPoint = Cesium.Matrix4.multiplyByPoint(rotationMatrix, point, new Cesium.Cartesian3());

        return rotatedPoint;
    }
}

export { DrawableGraphic, PointGraphic, LineGraphic, PolygonGraphic, RectangleGraphic, CircleGraphic };
