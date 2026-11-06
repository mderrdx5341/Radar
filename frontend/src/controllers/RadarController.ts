import { EntityController } from './EntityController';
import { SimpleRadar } from '../entities/SimpleRadar';

export class RadarController extends EntityController {
    protected entity: SimpleRadar;

    constructor(radar: SimpleRadar) {
        super(radar);
        this.entity = radar;
    }

    /**
     * Клик ПКМ: Разворот луча в целевую точку
     */
    public handleRightClick = (worldX: number, worldY: number): void => {
        if (this.entity) {
            this.entity.setTargetDirection(worldX, worldY);
        }
    };

    /**
     * Движение мыши: Пока удерживается ПКМ, непрерывно транслируем координаты
     */
    public handleMouseMove = (worldX: number, worldY: number, isMouseDown: boolean): void => {
        if (isMouseDown && this.entity) {
            this.entity.setTargetDirection(worldX, worldY);
        }
    };

    /**
     * Сброс фокуса: Гасим трекинг
     */
    public onDeselect = (): void => {
        if (this.entity) {
            this.entity.stopTracking();
        }
    };
}