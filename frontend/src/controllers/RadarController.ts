import { EntityController } from './EntityController';
import { SimpleRadar } from '../entities/SimpleRadar';

export class RadarController extends EntityController {
    protected entity: SimpleRadar;

    constructor(radar: SimpleRadar) {
        super(radar);
        this.entity = radar;
    }

    /**
     * Клик ПКМ: Честное переопределение метода базового класса
     */
    public handleRightClick(worldX: number, worldY: number): void {
        if (this.entity) {
            this.entity.setTargetDirection(worldX, worldY);
        }
    }

    /**
     * Движение мыши: Честное переопределение метода базового класса
     */
    public handleMouseMove(worldX: number, worldY: number, isMouseDown: boolean): void {
        if (isMouseDown && this.entity) {
            this.entity.setTargetDirection(worldX, worldY);
        }
    }

    /**
     * Сброс фокуса: Честное переопределение метода базового класса
     */
    public onDeselect(): void {
        if (this.entity) {
            this.entity.stopTracking();
        }
    }
}
