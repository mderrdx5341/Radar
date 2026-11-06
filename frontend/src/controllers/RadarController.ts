import { EntityController } from './EntityController';
import { SimpleRadar } from '../entities/SimpleRadar';

export class RadarController extends EntityController {
    protected entity: SimpleRadar;

    constructor(radar: SimpleRadar) {
        super(radar);
        this.entity = radar;
    }

    /**
     * ПЕРЕОПРЕДЕЛЕНИЕ ПКМ: Мгновенно разворачиваем конус обзора в точку клика
     */
    public handleRightClick(worldX: number, worldY: number): void {
        this.entity.setTargetDirection(worldX, worldY);
    }

    /**
     * ПЕРЕОПРЕДЕЛЕНИЕ HOLD-ДВИЖЕНИЯ: Если ПКМ удерживается — луч плавно следует за курсором
     */
    public handleMouseMove(worldX: number, worldY: number, isMouseDown: boolean): void {
        if (isMouseDown) {
            this.entity.setTargetDirection(worldX, worldY);
        }
    }

    /**
     * ДЕСТРУКТОР СБРОСА ФОКУСА: Гасим флаг слежения, чтобы луч зафиксировался в текущей точке
     */
    public onDeselect(): void {
        this.entity.stopTracking();
    }
}
