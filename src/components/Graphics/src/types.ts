import * as Cesium from 'cesium'
import { BaseGraphic } from './base'
import { DrawableGraphic } from './drawableGraphic'

export enum DrawerMode {
  IDLE,
  DRAWING,
  EDIT
}

export interface DrawerOptions {
  model?: boolean
  terrian?: boolean
  name?: string
  mode?: DrawerMode
}

export interface GraphicListener {
  onGraphicSelected(graphic: BaseGraphic, properties?: any): void
  onScreenClicked(coordinate: number[]): void
}

export interface DrawableGraphicListener {
  onGraphicAdded(graphic: DrawableGraphic): void
  onGraphicDeleted(graphic: DrawableGraphic): void
  onGraphicUpdated(graphic: DrawableGraphic): void
  onGraphicSelected(graphic: DrawableGraphic | undefined): void
  onDrawCancelled(): void
}

export enum GraphicType {
  Point = 'Point',
  MultiPoint = 'MultiPoint',
  PolyLine = 'LineString',
  Polygon = 'Polygon',
  Circle = 'Circle',
  Rectangle = 'Rectangle'
}

export interface NodeProperties {
  type: NodeType
  index: number
  graphic: BaseGraphic
}

export enum NodeType {
  Graphic,
  Node,
  ControlNode,
  Dock,
  Drone,
  Wayline,
  WaylinePoint
}

export interface GraphicOptions {
  pixelSize: number
  heightReference?: Cesium.HeightReference
  color: Cesium.Color
  outlineColor: Cesium.Color
  outlineWidth: number
  selectedColor: Cesium.Color
  editColor: Cesium.Color
  width: number
  opacity: number
  dash: boolean
  dashLength: number
  dashPattern: number
  clampToGround: boolean
  showLabel: boolean
  labelFont: string
}

export enum GraphicMode {
  Normal,
  Selected,
  Edit
}

export interface GraphicPrimitive {
  id: string
  name: string
  color: string
  opacity: number
  clampToGround: boolean
  type: string
  coordinates: any
}
