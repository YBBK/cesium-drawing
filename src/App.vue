<template>
    <MapViewer ref="mapViewer" class="map_viewer">
        <template #action>
            <IconButton icon="info" @click="showHelp()" />
        </template>
        <template #sideLayer>
            <Panel>
                <template #title> 绘制清单 </template>
                <template #extra>
                    <ButtonGroup direction="h">
                        <IconButton icon="import" @click="handleImport()">导入</IconButton>
                        <IconButton icon="export" @click="handleExport()">导出</IconButton>
                    </ButtonGroup>
                </template>
                <ul class="layer-list">
                    <div class="empty" v-if="Object.keys(store.shapes).length === 0"> 目前没有任何图形 </div>
                    <li v-for="(shapes, type) in store.shapes" :key="type">
                        <div class="item">
                            <Icon icon="caret" :class="{ open: isGroupOpen(type) }" @click="handleToggleGroup(type)" />
                            <div>{{ ShapeNames[type] }}</div>
                            <div class="action">
                                <IconButton :border="0" icon="delete" @click="handleClear(type)" />
                            </div>
                        </div>
                        <ul v-if="isGroupOpen(type)">
                            <li v-for="(shape, idx) in shapes" :key="idx" class="item leaf">
                                <Icon icon="line" v-if="type == 'LineString'" />
                                <Icon icon="polygon" v-else-if="type == 'Polygon'" />
                                <Icon icon="circle" v-else-if="type == 'Circle'" />
                                <Icon icon="rect" v-else-if="type == 'Rectangle'" />
                                <Icon icon="point" v-else />

                                <div @dblclick="handleEditName(shape.id)" v-if="!isEditing(shape.id)" title="双击修改">
                                    {{ shape.properties.name }}
                                </div>
                                <div v-else>
                                    <input
                                        type="text"
                                        :id="'input_ele_' + shape.id"
                                        :value="shape.properties.name"
                                        @keydown.enter="handleEditNameCompleted($event, shape.id)"
                                    />
                                </div>
                                <div class="action">
                                    <IconButton :border="0" icon="edit" @click="handleEditName(shape.id)" v-if="!isEditing(shape.id)" />
                                    <IconButton :border="0" icon="check" @click="handleEditNameSubmit(shape.id)" v-else />
                                    <IconButton :border="0" icon="aim" @click="handleFlyTo(shape.id)" />
                                    <IconButton :border="0" icon="delete" @click="handleDelete(shape.id)" />
                                </div>
                            </li>
                        </ul>
                    </li>
                </ul>
            </Panel>
        </template>
        <Transition name="slide-fade">
            <Panel class="overlay" v-if="showImportOrExport > 0">
                <template #title>{{ showImportOrExport == 1 ? '导入' : '导出' }}GeoJSON</template>
                <template #extra>
                    <IconButton :circle="true" :border="0" icon="close" @click="onClose" />
                </template>
                <CodeEditor v-model:value="geoJSON" />
                <IconButton icon="copy" @click="copyToClipboard()" class="f-btn" v-if="showImportOrExport == 2" />
            </Panel>
        </Transition>
        <Transition name="fade">
            <div :class="['msg', { err: !message.success }]" v-if="message">
                <div>{{ message.msg }}</div>
            </div>
        </Transition>

        <InfoBox @close="isShowHelp = false" :show="isShowHelp" />
    </MapViewer>
</template>

<script lang="ts" setup>
    import { ref, nextTick, watch } from 'vue';
    import { MapViewer } from '@/components/MapView';
    import { Panel } from '@/components/Viewport';
    import { Icon, IconButton, ButtonGroup } from '@/components/Icon';
    import { useDrawingStore } from '@/store/drawing';
    import { CodeEditor } from '@/components/CodeEditor';
    import InfoBox from './Info.vue';

    const ShapeNames = {
        Point: '点',
        LineString: '折线',
        Polygon: '多边形',
        Circle: '圆形',
        Rectangle: '矩形',
    };

    interface Message {
        msg: string;
        success: boolean;
    }

    const store = useDrawingStore();
    const mapViewer = ref();
    const groupPropertyMap = ref(new Map<string | number, { open: boolean }>());
    const editingName = ref();

    const showImportOrExport = ref(0);
    const geoJSON = ref();
    const message = ref<Message>();

    const getDrawer = () => {
        return mapViewer.value.getDrawer();
    };

    const handleToggleGroup = (id: string | number) => {
        const currentState = groupPropertyMap.value.get(id);
        if (currentState) {
            currentState.open = !currentState.open;
        } else {
            groupPropertyMap.value.set(id, { open: false });
        }
    };
    const isGroupOpen = (id: string) => {
        return groupPropertyMap.value.get(id)?.open ?? true;
    };

    const isEditing = (id: string) => {
        return editingName.value === id;
    };

    const handleEditName = (id: string) => {
        editingName.value = id;
        if (id) {
            nextTick(() => {
                const ele = document.getElementById('input_ele_' + id);
                if (ele) {
                    ele.focus();
                    ele.select();
                }
            });
        }
    };

    const handleEditNameSubmit = (id: string) => {
        const inputElement = document.getElementById('input_ele_' + id);
        if (inputElement) {
            handleEditNameCompleted({ target: inputElement }, id);
        }
    };
    const handleEditNameCompleted = (event: Event, id: string) => {
        const newValue = event.target.value;
        editingName.value = null;

        const drawer = getDrawer();
        drawer?.updateProperties(id, { name: newValue });
    };

    const handleFlyTo = (id: string) => {
        const drawer = getDrawer();
        drawer?.flyTo(id, true);
    };

    const handleDelete = (id: string) => {
        const drawer = getDrawer();
        drawer?.deleteGraphicById(id, true);
    };

    const handleClear = (type: string) => {
        const shapes = store.shapes[type];
        if (shapes) {
            shapes.forEach((shape) => {
                handleDelete(shape.id);
            });
        }
    };

    const handleImport = () => {
        showImportOrExport.value = 1;
        console.log(showImportOrExport.value);
    };

    const handleExport = () => {
        showImportOrExport.value = 2;
        const drawer = getDrawer();
        geoJSON.value = drawer?.exportToGeoJSONFeature();
        console.log(showImportOrExport.value);
    };

    const onClose = () => {
        showImportOrExport.value = 0;
        geoJSON.value = undefined;
    };

    const importGeoJSON = async () => {
        try {
            if (geoJSON.value) {
                const drawer = getDrawer();
                drawer?.importFromGeoJSON(geoJSON.value, true);
                message.value = { msg: 'GeoJSON was imported!', success: true };
                setTimeout(() => {
                    message.value = undefined;
                }, 1500);
            }
        } catch (err) {
            console.error('Failed to Import: ', err);
            message.value = { msg: 'Failed to import GeoJSON!', success: false };
            setTimeout(() => {
                message.value = undefined;
            }, 1500);
        }
    };
    const copyToClipboard = async () => {
        try {
            const jsonString = JSON.stringify(geoJSON.value, null, 2);
            await navigator.clipboard.writeText(jsonString);
            message.value = { msg: 'JSON copied to clipboard!', success: true };
            setTimeout(() => {
                message.value = undefined;
            }, 1500);
        } catch (err) {
            console.error('Failed to copy: ', err);
            message.value = { msg: 'Failed to copy JSON!', success: true };
            setTimeout(() => {
                message.value = undefined;
            }, 1500);
        }
    };

    const isShowHelp = ref(true);
    const showHelp = () => {
        isShowHelp.value = !isShowHelp.value;
    };
    watch(
        () => geoJSON.value,
        (newValue) => {
            if (showImportOrExport.value == 1 && newValue) {
                importGeoJSON();
            }
        },
    );
</script>
<style lang="less">
    .map_viewer {
        ul,
        li {
            padding: 0;
            margin: 0;
        }

        .layer-list {
            margin: 0;
            padding: 0;
            list-style: none;
            margin-top: -4px;

            .empty {
                padding: 2rem;
                text-align: center;
            }

            .item {
                display: flex;
                align-items: center;
                height: 28px;
                padding: 0.25rem 0.5rem;
                column-gap: 6px;

                &.sct {
                    background: var(--hover-bg-color);
                }

                .action {
                    display: none;
                }

                input {
                    max-width: 130px;
                }

                &:hover {
                    background: var(--hover-bg-color);
                    cursor: pointer;

                    .action {
                        display: flex;
                        flex: 1;
                        justify-content: flex-end;
                        column-gap: 6px;
                    }
                }

                &.leaf {
                    padding-left: 30px;
                }

                .anticon {
                    transition: transform 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);

                    &.open {
                        transform: rotate(90deg);
                    }
                }
            }
        }

        .overlay {
            position: absolute;
            width: 450px;
            height: calc(100% - 1rem);
            z-index: 1;
            right: 0.5rem;
            top: 0.5rem;
            z-index: 5;

            &:hover {
                .f-btn {
                    display: flex;
                }
            }

            .f-btn {
                position: absolute;
                right: 2rem;
                top: 2rem;
                display: none;
            }
        }

        .msg {
            position: absolute;
            top: 2rem;
            right: 2rem;
            z-index: 99999;

            background: var(--component-background-color);
            border: 1px solid #00aa00;
            border-radius: var(--border-radius);
            height: 48px;
            display: flex;
            min-width: 150px;

            color: var(--text-color);

            &::before {
                content: '';
                height: 100%;
                width: 0.5rem;
                background-color: #00aa00;
                display: inline-flex;
            }

            div {
                padding: 0.5rem 1rem;
                align-content: center;
            }

            &.err {
                border: 1px solid #dd0000;

                &::before {
                    background-color: #dd0000;
                }
            }
        }
    }
</style>
