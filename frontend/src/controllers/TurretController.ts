import { EntityController } from './EntityController';
import { SimpleTurret } from '../entities/SimpleTurret';

export class TurretController extends EntityController {
    // Явно типизируем внутреннюю сущность для удобства работы
    protected entity: SimpleTurret;

    constructor(turret: SimpleTurret) {
        super(turret);
        this.entity = turret;
    }

    /**
     * ПЕРЕОПРЕДЕЛЕНИЕ ПКМ: Отдаём пушке ПВО приказ на плавную передислокацию
     */
    public handleRightClick(worldX: number, worldY: number): void {
        this.entity.moveTo(worldX, worldY);
    }

    // Методы handleMouseMove и onDeselect для ПВО не нужны, 
    // поэтому мы их просто не реализуем — сработает пустой базовый класс.
}