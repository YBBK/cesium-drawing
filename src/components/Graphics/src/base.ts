import * as Cesium from 'cesium';

export abstract class BaseGraphic {
    protected _viewer: Cesium.Viewer;
    protected _id: string;
    protected _name: string;
    protected _entities: Cesium.Entity[] = [];

    constructor(viewer: Cesium.Viewer, id: string, name: string) {
        this._viewer = viewer;
        this._id = id;
        this._name = name;
    }
    get id(): string {
        return this._id;
    }
    get name(): string {
        return this._name;
    }

    protected abstract createEntities(): Cesium.Entity[];

    show(): void {
        this.remove();
        const entities: Cesium.Entity[] = this.createEntities();
        entities.forEach((entity) => {
            this._entities.push(this._viewer.entities.add(entity));
        });
    }
    remove() {
        this._entities.forEach((entity) => {
            this._viewer.entities.remove(entity);
        });
        this._entities = [];
    }
    flyTo() {
        if (this._entities) {
            this._viewer.flyTo(this._entities, {
                offset: new Cesium.HeadingPitchRange(0, -Cesium.Math.PI_OVER_TWO, 0),
            });
        }
    }
}
