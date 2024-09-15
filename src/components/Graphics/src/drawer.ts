import { v4 as uuidv4 } from 'uuid'
import * as Cesium from 'cesium'
import { BaseGraphic } from './base'
import {
  DrawableGraphic,
  PointGraphic,
  LineGraphic,
  PolygonGraphic,
  RectangleGraphic,
  CircleGraphic
} from './drawableGraphic'
import { DrawerMode, GraphicType, NodeType } from './types'
import type { GraphicOptions, DrawerOptions, DrawableGraphicListener } from './types'
import { getNodeProp, pickCartesian3 as pickPosition } from './utils'

class Drawer {
  private static readonly DOUBLE_CLICK_DELAY = 300 // 毫秒
  // private _NORMAL_STATE: DrawerMode = DrawerMode.EDIT; //绘制完之后的状态

  private _viewer: Cesium.Viewer
  private _graphics: Map<string | number, DrawableGraphic> = new Map()
  private _handler: Cesium.ScreenSpaceEventHandler
  private _boundHandleKeyDown: (event: KeyboardEvent) => void
  private _lastClickTime: number = 0

  private _options: Partial<GraphicOptions> = {}
  private _mode: DrawerMode = DrawerMode.IDLE
  private _normalMode = DrawerMode.EDIT //画完图之后的状态
  private _type: GraphicType | undefined
  private _currentGraphic: DrawableGraphic | undefined
  private _selectedGraphic: DrawableGraphic | undefined
  private _selectedNode: Cesium.Entity | undefined
  private _isDraging: boolean = false
  private _startMousePosition: Cesium.Cartesian3 | undefined

  private _listener: DrawableGraphicListener[] = []
  private _model: boolean = false
  private _terrian: boolean = false
  private _name: string | undefined = ''
  private _nextId: number = 0

  constructor(viewer: Cesium.Viewer, options: DrawerOptions = {}) {
    this._viewer = viewer
    this._model = options.model || false
    this._terrian = options.terrian || false
    this._name = options.name
    this._handler = viewer.screenSpaceEventHandler
    this._normalMode = options.mode || DrawerMode.IDLE
    this._boundHandleKeyDown = this.handleKeyDown.bind(this)
    if (this._normalMode == DrawerMode.EDIT) {
      this.setMode(DrawerMode.EDIT)
    }
  }

  public destroy() {}

  addListener(listener: DrawableGraphicListener) {
    this._listener.push(listener)
  }
  enableClickListener() {
    this.enableNormalListeners()
  }

  private notifyGraphicAdded(graphic: DrawableGraphic) {
    this._listener.forEach((listener) => {
      listener.onGraphicAdded(graphic)
    })
  }

  private notifyGraphicDeleted(graphic: DrawableGraphic) {
    this._listener.forEach((listener) => {
      listener.onGraphicDeleted(graphic)
    })
  }

  private notifyGraphicUpdated(graphic: DrawableGraphic) {
    this._listener.forEach((listener) => {
      listener.onGraphicUpdated(graphic)
    })
  }
  private notifyGraphicSelected(graphic: DrawableGraphic | undefined) {
    this._listener.forEach((listener) => {
      listener.onGraphicSelected(graphic)
    })
  }

  private notifyDrawCancelled() {
    this._listener.forEach((listener) => {
      listener.onDrawCancelled()
    })
  }

  private pickCartesian3(position: Cesium.Cartesian2): Cesium.Cartesian3 | undefined {
    return pickPosition(this._viewer, position, this._model, this._terrian)
  }

  private isClickValid(): boolean {
    const now = Date.now()
    if (now - this._lastClickTime < Drawer.DOUBLE_CLICK_DELAY) {
      return false
    }
    this._lastClickTime = now
    return true
  }

  private generateUniqueId(): string {
    return uuidv4()
  }

  private generateName(
    type: GraphicType | undefined,
    name: string | undefined = undefined
  ): string {
    if (name && name.length > 0) {
      return name
    }
    return type ? type.toLowerCase() + ' ' + this._nextId : '' + this._nextId
  }

  // 启用绘图相关的事件监听器
  private enableDrawingListeners() {
    this._handler.setInputAction(
      this.leftClickHandler.bind(this),
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    )
    this._handler.setInputAction(
      this.dbClickHandler.bind(this),
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    )
    this._handler.setInputAction(
      this.rightClickHandler.bind(this),
      Cesium.ScreenSpaceEventType.RIGHT_CLICK
    )
    this._handler.setInputAction(
      this.mouseMoveHandler.bind(this),
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    )
  }

  // 启用编辑相关的事件监听器
  private enableEditingListeners() {
    this._handler.setInputAction(
      this.editClickHandler.bind(this),
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    )
    this._handler.setInputAction(
      this.editMoveHandler.bind(this),
      Cesium.ScreenSpaceEventType.MOUSE_MOVE
    )
    this._handler.setInputAction(
      this.editDownHandler.bind(this),
      Cesium.ScreenSpaceEventType.LEFT_DOWN
    )
    this._handler.setInputAction(this.editUpHandler.bind(this), Cesium.ScreenSpaceEventType.LEFT_UP)
    // 添加键盘事件监听器
    document.addEventListener('keydown', this._boundHandleKeyDown)
  }

  // 禁用所有事件监听器
  private disableAllListeners() {
    this._handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
    this._handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    this._handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    this._handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN)
    this._handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP)
    // 移除键盘事件监听器
    document.removeEventListener('keydown', this._boundHandleKeyDown)
  }

  private enableNormalListeners() {
    this._handler.setInputAction(
      this.pickClickHandler.bind(this),
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    )
  }

  //处理左键点击事件(绘图模式)
  private pickClickHandler(e: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
    const pickedObject = this._viewer.scene.pick(e.position)
    if (Cesium.defined(pickedObject) && pickedObject.id) {
      const properties = getNodeProp(pickedObject.id.properties)
      if (properties && properties.graphic instanceof DrawableGraphic) {
        this.notifyGraphicSelected(properties.graphic)
        return
      }
    }
    this.notifyGraphicSelected(undefined)
  }

  //处理左键点击事件(绘图模式)
  private leftClickHandler(e: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
    if (!this.isClickValid()) {
      // console.log('无效点击');
      return
    }
    // console.log('leftClickHandler');
    const pos = this.pickCartesian3(e.position)
    if (!pos) {
      return
    }
    if (!this._currentGraphic) {
      this.startDrawing(pos)
    } else {
      this.continueDrawing(pos)
    }
  }

  //处理双击事件(绘图模式)
  private dbClickHandler(_e: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
    // console.log('dbClickHandler');
    if (this._currentGraphic) {
      this.finishDrawing()
    }
  }

  //处理右键点击事件(绘图模式)
  private rightClickHandler(_e: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
    if (!this._currentGraphic) {
      this.cancelDrawing(true)
      return
    }

    //返回是否取消 true:取消绘图 false:可以继续
    const cancel = this._currentGraphic.popPosition()
    if (cancel) {
      this.cancelDrawing(true)
    }
  }

  //处理鼠标移动事件(绘图模式)
  private mouseMoveHandler(e: Cesium.ScreenSpaceEventHandler.MotionEvent) {
    const pos = this.pickCartesian3(e.endPosition)
    if (pos && this._currentGraphic) {
      this._currentGraphic.updateDynamicPosition(pos)
    }
  }

  //处理左键点击事件(编辑模式)
  private editClickHandler(_e: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
    //empty
    // this.pickClickHandler(_e);
  }

  //处理鼠标按下事件(编辑模式)
  private editDownHandler(e: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
    // console.log('editDownHandler');
    const pickedObject = this._viewer.scene.pick(e.position)
    if (Cesium.defined(pickedObject) && pickedObject.id) {
      const properties = getNodeProp(pickedObject.id.properties)
      if (!properties || !(properties.graphic instanceof DrawableGraphic)) {
        return
      }
      const graphic = properties.graphic as DrawableGraphic
      const pos = this.pickCartesian3(e.position)
      if (properties.type == NodeType.Graphic) {
        this._selectedNode = undefined
        graphic.clearSelectedNode()
        this.selectGraphic(graphic)
        graphic.setSelectedMode()
        this._isDraging = true
      } else if (properties.type == NodeType.Node) {
        this._selectedNode = pickedObject.id
        if (this._selectedNode) {
          this.selectGraphic(graphic)
          graphic.setSelectedNodeIndex(properties.index)
          this._isDraging = true
        }
      } else if (properties.type === NodeType.ControlNode) {
        //点击的是控制点，在控制点位置添加新节点
        if (pos) {
          this._selectedGraphic?.addNodeAtControlPoint(properties.index, pos)
        }
      }

      if (this._isDraging) {
        this._startMousePosition = pos
        // 禁用相机控制，防止地图移动
        this._viewer.scene.screenSpaceCameraController.enableRotate = false
        this._viewer.scene.screenSpaceCameraController.enableTranslate = false
        this._viewer.scene.screenSpaceCameraController.enableZoom = false
        this._viewer.scene.screenSpaceCameraController.enableTilt = false
        this._viewer.scene.screenSpaceCameraController.enableLook = false
        this._viewer.canvas.style.cursor = 'move'
      }
    } else {
      this.clearSelection()
    }
  }

  //处理鼠标移动事件(编辑模式)
  private editMoveHandler(e: Cesium.ScreenSpaceEventHandler.MotionEvent) {
    // console.log('editMoveHandler');
    if (
      !this._isDraging ||
      (!this._selectedNode && !this._selectedGraphic) ||
      !this._startMousePosition
    ) {
      return
    }
    const endPos = this.pickCartesian3(e.endPosition)
    if (!endPos) {
      return
    }
    if (this._selectedNode) {
      const properties = getNodeProp(this._selectedNode.properties)
      if (!properties || !(properties.graphic instanceof DrawableGraphic)) {
        return
      }
      const graphic = properties.graphic as DrawableGraphic
      graphic.updateNodePosition(properties.index, endPos)
    } else if (this._selectedGraphic) {
      const diff = Cesium.Cartesian3.subtract(
        endPos,
        this._startMousePosition,
        new Cesium.Cartesian3()
      )
      this._selectedGraphic.move(diff)
      this._startMousePosition = endPos // 更新起始位置
    }
  }

  // 处理鼠标释放事件（编辑模式）
  private editUpHandler(_: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
    // console.log('editUpHandler');
    this._isDraging = false
    this._startMousePosition = undefined
    if (this._selectedGraphic) {
      this._selectedGraphic.setEditMode()
    }
    // 重新启用相机控制
    this._viewer.scene.screenSpaceCameraController.enableRotate = true
    this._viewer.scene.screenSpaceCameraController.enableTranslate = true
    this._viewer.scene.screenSpaceCameraController.enableZoom = true
    this._viewer.scene.screenSpaceCameraController.enableTilt = true
    this._viewer.scene.screenSpaceCameraController.enableLook = true
    this._viewer.canvas.style.cursor = 'default'
  }

  //处理键盘事件
  private handleKeyDown(event: KeyboardEvent) {
    if (event.key == 'Delete' && this._mode === DrawerMode.EDIT) {
      this.deleteSelected()
    }
  }

  // 开始绘图
  private startDrawing(pos: Cesium.Cartesian3) {
    const id = this.generateUniqueId()
    const name = this.generateName(this._type, this._name)
    switch (this._type) {
      case GraphicType.Point:
        this._currentGraphic = new PointGraphic(
          this._viewer,
          id,
          name,
          [pos],
          this._options,
          this.notifyGraphicUpdated.bind(this)
        )
        this._currentGraphic.show()
        this.finishDrawing()
        return
      case GraphicType.PolyLine:
        this._currentGraphic = new LineGraphic(
          this._viewer,
          id,
          name,
          [pos],
          this._options,
          this.notifyGraphicUpdated.bind(this)
        )
        break
      case GraphicType.Polygon:
        this._currentGraphic = new PolygonGraphic(
          this._viewer,
          id,
          name,
          [pos],
          this._options,
          this.notifyGraphicUpdated.bind(this)
        )
        break
      case GraphicType.Circle:
        this._currentGraphic = new CircleGraphic(
          this._viewer,
          id,
          name,
          [pos],
          this._options,
          this.notifyGraphicUpdated.bind(this)
        )
        break
      case GraphicType.Rectangle:
        this._currentGraphic = new RectangleGraphic(
          this._viewer,
          id,
          name,
          [pos],
          this._options,
          this.notifyGraphicUpdated.bind(this)
        )
    }
    if (this._currentGraphic) {
      this._currentGraphic.show()
    }
  }

  // 继续绘图
  private continueDrawing(pos: Cesium.Cartesian3) {
    if (this._currentGraphic) {
      //添加位置 返回 true:自动结束 false:可以继续添加
      const finish = this._currentGraphic.addPosition(pos)
      if (finish) {
        this.finishDrawing()
      }
    }
  }

  // 完成绘图
  private finishDrawing() {
    if (this._currentGraphic) {
      const result = this._currentGraphic.finishDrawing()
      if (result) {
        //绘图成功， 将图形保存
        this.addGraphic(this._currentGraphic, true)
      } else {
        //绘图失败，删除图形
        this._currentGraphic.remove()
      }
      this._currentGraphic = undefined
    }
    this.setMode(this._normalMode)
  }

  // 取消绘图
  private cancelDrawing(notify: boolean = false) {
    if (this._currentGraphic) {
      this._currentGraphic.remove()
      this._currentGraphic = undefined
    }
    this.setMode(this._normalMode)
    if (notify) {
      this.notifyDrawCancelled()
    }
  }

  // 选中图形
  private selectGraphic(graphic: DrawableGraphic) {
    if (this._selectedGraphic && this._selectedGraphic.id !== graphic.id) {
      this._selectedGraphic.setNormalMode()
    }
    this._selectedGraphic = graphic
    this._selectedGraphic.setEditMode()
    this.notifyGraphicSelected(this._selectedGraphic)
  }

  // 清除选择
  private clearSelection() {
    if (this._selectedNode) {
      const properties = getNodeProp(this._selectedNode.properties)
      if (!properties || !(properties.graphic instanceof DrawableGraphic)) {
        return
      }
      properties?.graphic?.clearSelectedNode()
      this._selectedNode = undefined
    }
    if (this._selectedGraphic) {
      this._selectedGraphic.setNormalMode()
      this._selectedGraphic = undefined
      this.notifyGraphicSelected(undefined)
    }
  }

  //添加图形
  private addGraphic(graphic: DrawableGraphic, isNotify: boolean = false) {
    if (this._graphics.has(graphic.id)) {
      // console.log('000 替换图形: ' + graphic.id);
      const oldGraphics = this._graphics.get(graphic.id)
      if (oldGraphics) {
        oldGraphics.remove()
        this._graphics.delete(graphic.id)
      }
    }
    this._graphics.set(graphic.id, graphic)
    this._nextId++

    if (isNotify) {
      this.notifyGraphicAdded(graphic)
    }
  }

  // 移除图形
  private removeGraphic(graphic: DrawableGraphic, isNotify: boolean = false) {
    graphic.remove()
    this._graphics.delete(graphic.id)
    if (isNotify) {
      this.notifyGraphicDeleted(graphic)
    }
  }

  // 设置绘图模式
  setMode(mode: DrawerMode) {
    // console.log('set mode:' + mode + '    Graphics:' + this._graphics.size);
    this.disableAllListeners()
    this.clearSelection()
    this._mode = mode
    switch (mode) {
      case DrawerMode.IDLE:
        this.enableNormalListeners()
        this._viewer.canvas.style.cursor = 'default'
        break
      case DrawerMode.DRAWING:
        this.enableDrawingListeners()
        this._viewer.canvas.style.cursor = 'crosshair'
        break
      case DrawerMode.EDIT:
        this.enableEditingListeners()
        this._viewer.canvas.style.cursor = 'default'
        break
    }
  }

  // 绘制点
  drawPoint(options: Partial<GraphicOptions> = {}) {
    this.cancelDrawing()
    this._options = this.convertColorProperties(options)
    this._type = GraphicType.Point
    this.setMode(DrawerMode.DRAWING)
  }

  // 绘制线
  drawLine(options: Partial<GraphicOptions> = {}) {
    this.cancelDrawing()
    this._options = this.convertColorProperties(options)
    this._type = GraphicType.PolyLine
    this.setMode(DrawerMode.DRAWING)
  }

  // 绘制多边形
  drawPolygon(options: Partial<GraphicOptions> = {}) {
    this.cancelDrawing()
    this._options = this.convertColorProperties(options)
    this._type = GraphicType.Polygon
    this.setMode(DrawerMode.DRAWING)
  }

  // 绘制圆形
  drawCircle(options: Partial<GraphicOptions> = {}) {
    this.cancelDrawing()
    this._options = this.convertColorProperties(options)
    this._type = GraphicType.Circle
    this.setMode(DrawerMode.DRAWING)
  }

  // 绘制矩形
  drawRectangle(options: Partial<GraphicOptions> = {}) {
    this.cancelDrawing()
    this._options = this.convertColorProperties(options)
    this._type = GraphicType.Rectangle
    this.setMode(DrawerMode.DRAWING)
  }

  // 启用编辑模式
  enableEdit() {
    this.setMode(DrawerMode.EDIT)
  }

  // 停用编辑模式
  finishEdit() {
    this.setMode(DrawerMode.IDLE)
  }

  //是否编辑模式
  isEditMode(): boolean {
    return this._mode === DrawerMode.EDIT
  }

  getGraphicById(id: string): DrawableGraphic | undefined {
    return this._graphics.get(id)
  }

  deleteGraphicById(id: string, isNotify: boolean = false) {
    const graphic = this.getGraphicById(id)
    if (graphic) {
      this.removeGraphic(graphic, isNotify)
    }
    if (this._selectedGraphic && this._selectedGraphic.id == id) {
      this._selectedGraphic = undefined
    }
  }

  flyTo(id: string) {
    const graphic = this.getGraphicById(id)
    if (graphic) {
      graphic.flyTo()
    }
  }

  updateProperties(id: string, properties: Object, isNotify: boolean = true) {
    const graphic = this.getGraphicById(id)
    if (graphic) {
      if (properties.hasOwnProperty('name')) {
        graphic.setName((properties as any).name)
      }
      if (properties.hasOwnProperty('position')) {
        const position = (properties as any).position
        const pos = Cesium.Cartesian3.fromDegrees(position[0], position[1], position[2] || 0)
        graphic.updateNodePosition(0, pos)
      }
      const otherProps = this.convertColorProperties(properties as GraphicOptions)
      if (Object.keys(otherProps).length > 0) {
        graphic.setOptions(otherProps)
        if (isNotify) {
          this.notifyGraphicUpdated(graphic)
        }
      }
    }
  }

  deleteSelected(isNotify: boolean = true) {
    if (this._selectedNode) {
      //删除选中的节点
      const properties = getNodeProp(this._selectedNode.properties)
      if (!properties || !(properties.graphic instanceof DrawableGraphic)) {
        return
      }
      const graphic = properties.graphic as DrawableGraphic
      graphic.removeNode(this._selectedNode)
      this._selectedNode = undefined
    } else if (this._selectedGraphic) {
      //删除选中图形
      this._selectedGraphic.remove()
      this.removeGraphic(this._selectedGraphic, isNotify)
      this._selectedGraphic = undefined
      this.notifyGraphicSelected(undefined)
    }
  }

  // 遍历所有图形
  forEachGraphic(callback: (graphic: BaseGraphic) => void) {
    this._graphics.forEach(callback)
  }

  // 获取所有图形的数组
  getAllGraphics(): DrawableGraphic[] {
    return Array.from(this._graphics.values())
  }

  // 导出为GeoJSON
  exportToGeoJSON(): GeoJSON.Feature[] {
    return this.getAllGraphics().map((graphic) => graphic.toGeoJSON()) as GeoJSON.Feature[]
  }

  exportToGeoJSONFeature(): GeoJSON.FeatureCollection {
    const features = this.exportToGeoJSON()
    return {
      type: 'FeatureCollection',
      features: features
    }
  }

  clearAllGraphic() {
    this.getAllGraphics().forEach((graphic) => {
      graphic.remove()
      this._graphics.delete(graphic.id)
    })
  }

  clearInvalidGraphic(ids: Set<string | number>) {
    this.getAllGraphics().forEach((graphic) => {
      if (!ids.has(graphic.id)) {
        graphic.remove()
        this._graphics.delete(graphic.id)
      }
    })
  }

  // 从GeoJSON导入图形
  importFromGeoJSON(
    geojson: GeoJSON.FeatureCollection | GeoJSON.Feature,
    isNotify: boolean = false
  ) {
    if (geojson.type === 'FeatureCollection') {
      geojson.features.forEach((feature) => this.createGraphicFromFeature(feature, isNotify))
    } else if (geojson.type === 'Feature') {
      this.createGraphicFromFeature(geojson, isNotify)
    }
  }

  private createGraphicFromFeature(feature: GeoJSON.Feature, isNotify: boolean = false) {
    const id = (feature.id as string) || this.generateUniqueId()
    if (this._selectedGraphic?.id === id && this._isDraging == true) {
      console.warn('cannot import in draw or edit mode. id:' + id)
      return
    }

    if (!feature.geometry) return

    const coordinates = this.getCoordinatesFromGeometry(feature.geometry)
    if (!coordinates || coordinates.length === 0) return

    const _options = this.convertColorProperties(feature.properties)

    let graphic: DrawableGraphic | null = null
    const name = feature.name || feature.properties.name || 'imp_' + this._nextId

    switch (feature.geometry.type) {
      case 'Point':
      case 'MultiPoint':
        graphic = new PointGraphic(
          this._viewer,
          id,
          name,
          coordinates,
          _options,
          this.notifyGraphicUpdated.bind(this)
        )
        break
      case 'LineString':
      case 'MultiLineString':
        graphic = new LineGraphic(
          this._viewer,
          id,
          name,
          coordinates,
          _options,
          this.notifyGraphicUpdated.bind(this)
        )
        break
      case 'Polygon':
      case 'MultiPolygon':
        graphic = new PolygonGraphic(
          this._viewer,
          id,
          name,
          coordinates,
          _options,
          this.notifyGraphicUpdated.bind(this)
        )
        break
      case 'Circle':
        const radius = feature.geometry.radius || feature.properties.radius
        if (radius) {
          const _graphic = new CircleGraphic(
            this._viewer,
            id,
            name,
            coordinates,
            _options,
            this.notifyGraphicUpdated.bind(this)
          )
          _graphic.radius = radius
          graphic = _graphic
          break
        }
    }

    if (graphic) {
      graphic.show()
      graphic.setNormalMode()
      this.addGraphic(graphic, isNotify)
    }
  }

  private getCoordinatesFromGeometry(geometry: GeoJSON.Geometry): Cesium.Cartesian3[] {
    let coordinates: number[][] = []

    switch (geometry.type) {
      case 'Point':
      case 'Circle':
        coordinates = [geometry.coordinates as number[]]
        break
      case 'MultiPoint':
      case 'LineString':
        coordinates = geometry.coordinates as number[][]
        break
      case 'MultiLineString':
      case 'Polygon':
        coordinates = (geometry.coordinates as number[][][])[0]
        break
      case 'MultiPolygon':
        coordinates = (geometry.coordinates as number[][][][])[0][0]
        break
    }

    return coordinates.map((coord) =>
      Cesium.Cartesian3.fromDegrees(coord[0], coord[1], coord[2] || 0)
    )
  }

  private convertColorProperties(properties: any): Partial<GraphicOptions> {
    if (!properties) return {}

    const convertedOptions: GraphicOptions = { ...properties }

    for (const key in convertedOptions) {
      if (convertedOptions[key] && key.toLowerCase().includes('color')) {
        convertedOptions[key] = Cesium.Color.fromCssColorString(convertedOptions[key])
      }
    }

    return convertedOptions
  }
}

export { Drawer }
