import { defineStore } from 'pinia';

export const useDrawingStore = defineStore('drawing', {
    state: () => ({
        shapes: {} as { [type: string]: any[] },
    }),
    actions: {
        addShape(type: string, shape: any) {
            if (!this.shapes[type]) {
                this.shapes[type] = [];
            }
            const index = this.shapes[type].findIndex((s) => s.id === shape.id);
            if (index !== -1) {
                this.updateShape(type, shape.id, shape);
            } else {
                this.shapes[type].push(shape);
            }
        },
        updateShape(type: string, id: string, params: any) {
            if (!this.shapes[type]) return;

            const index = this.shapes[type].findIndex((s) => s.id === id);

            if (index !== -1) {
                const updatedShape = {
                    ...this.shapes[type][index],
                    ...params,
                };
                this.shapes[type].splice(index, 1, updatedShape);
                this.shapes[type] = [...this.shapes[type]]; // Trigger reactivity
            }
        },
        deleteShape(type: string, id: string) {
            if (!this.shapes[type]) {
                return;
            }
            this.shapes[type] = this.shapes[type].filter((s) => s.id !== id);
            if (this.shapes[type].length == 0) {
                delete this.shapes[type];
            }
        },
    },
});
