import { ref, inject, watch } from 'vue';
import * as Cesium from 'cesium';

export const useCesiumViewer = (callback?) => {
    const viewer = inject('cesiumViewer');
    const cesiumContainer = inject<HTMLElement>('cesiumContainer');

    function getViewer(): Cesium.Viewer {
        return viewer.value as Cesium.Viewer;
    }

    function getContainer() {
        return cesiumContainer;
    }

    watch(
        viewer,
        (newViewer) => {
            if (newViewer) {
                if (callback) {
                    callback(newViewer);
                }
            }
        },
        { immediate: true },
    );

    return {
        getViewer,
        getContainer,
    };
};

export const useMapViewer = (init?) => {
    const viewer = ref<Cesium.Viewer>();
    function register(_viewer: Cesium.Viewer) {
        viewer.value = _viewer;
        if (init) {
            init(_viewer);
        }
    }
    function getViewer(): Cesium.Viewer | undefined {
        return viewer.value;
    }
    return {
        getViewer,
        register,
    };
};
