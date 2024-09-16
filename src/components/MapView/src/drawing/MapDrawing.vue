<template>
  <div class="map-drawing" v-if="drawer">
    <ButtonGroup>
      <ColorPickButton
        icon="point"
        :isActive="currentType == GraphicType.Point"
        @click="drawPoint"
      />
      <ColorPickButton
        icon="line"
        :isActive="currentType == GraphicType.PolyLine"
        @click="drawLine"
      />
      <ColorPickButton
        icon="polygon"
        :isActive="currentType == GraphicType.Polygon"
        @click="drawPolygon"
      />
      <ColorPickButton
        icon="circle"
        :isActive="currentType == GraphicType.Circle"
        @click="drawCircle"
      />
      <ColorPickButton
        icon="rect"
        :isActive="currentType == GraphicType.Rectangle"
        @click="drawRect"
      />
    </ButtonGroup>
    <IconButton icon="edit" @click="toggleEdit()" v-if="!isEditMode" />
    <IconButton icon="check" @click="toggleEdit()" v-else />

    <ElementEdit
      :data="selectedGraphic"
      @fly-to="flyTo"
      @save="save"
      @remove="deleteGraphicById"
      @close="() => (selectedGraphic = undefined)"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, watchEffect, onBeforeUnmount } from 'vue'
import { ButtonGroup, IconButton } from '@/components/Icon'
import * as Cesium from 'cesium'
import { DrawableGraphic, Drawer, GraphicType } from '@/components/Graphics'
import ColorPickButton from './ColorPickButton.vue'
import ElementEdit from './ElementEdit.vue'
import { useDrawingStore } from '@/store/drawing'

const store = useDrawingStore()
const isEditMode = ref(false)
const selectedGraphic = ref()

const currentType = ref<GraphicType>()

let drawer: Drawer | null = null

const props = defineProps({
  viewer: {
    type: Object
  }
})

const graphicListener = {
  async onGraphicAdded(graphic: DrawableGraphic) {
    console.log(`Graphic added: ${graphic.id}`, graphic.type())
    currentType.value = undefined
    store.addShape(graphic.type(), graphic.toGeoJSON())
  },
  async onGraphicDeleted(graphic: DrawableGraphic) {
    //        console.log(`Graphic deleted: ${graphic.id}`);
    store.deleteShape(graphic.type(), graphic.id)
  },
  async onGraphicUpdated(graphic: DrawableGraphic) {
    //        console.log(`Graphic edited: ......................`);
    store.updateShape(graphic.type(), graphic.id, graphic.toGeoJSON())
  },
  onGraphicSelected(graphic: DrawableGraphic | undefined) {
    if (!drawer?.isEditMode()) {
      selectedGraphic.value = graphic?.toGeoJSON()
    }
  },
  onDrawCancelled() {
    // console.log(`onDrawCancelled`);
    currentType.value = undefined
  }
}

function onViewInited(viewer: Cesium.Viewer) {
  if (viewer && !drawer) {
    drawer = new Drawer(viewer)
    drawer.addListener(graphicListener)
    drawer.enableClickListener()
  }
}

function getDrawer(): Drawer {
  return drawer
}

function toggleEdit() {
  if (drawer.isEditMode()) {
    drawer.finishEdit()
    isEditMode.value = false
  } else {
    drawer.enableEdit()
    isEditMode.value = true
  }
}

function drawPoint(color: string) {
  selectedGraphic.value = undefined
  isEditMode.value = false
  currentType.value = GraphicType.Point
  drawer?.drawPoint({ color: color })
}

function drawLine(color: string) {
  selectedGraphic.value = undefined
  isEditMode.value = false
  currentType.value = GraphicType.PolyLine
  drawer?.drawLine({ color: color })
}

function drawPolygon(color: string) {
  selectedGraphic.value = undefined
  isEditMode.value = false
  currentType.value = GraphicType.Polygon
  drawer?.drawPolygon({ color: color })
}

function drawCircle(color: string) {
  selectedGraphic.value = undefined
  isEditMode.value = false
  currentType.value = GraphicType.Circle
  drawer?.drawCircle({ color: color })
}

function drawRect(color: string) {
  selectedGraphic.value = undefined
  isEditMode.value = false
  currentType.value = GraphicType.Rectangle
  drawer?.drawRectangle({ color: color })
}

function deleteGraphicById(id: string) {
  selectedGraphic.value = undefined
  drawer?.deleteGraphicById(id, true)
}

function flyTo(id: string) {
  drawer?.flyTo(id)
}

function save(id: string, properties: Object) {
  drawer?.updateProperties(id, properties)
}

onBeforeUnmount(() => {
  drawer?.destroy()
})

watchEffect(() => {
  props.viewer && onViewInited(props.viewer as Cesium.Viewer)
})

defineExpose({ getDrawer })
</script>
<style lang="less">
.map-drawing {
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  row-gap: @padding;
}
</style>
