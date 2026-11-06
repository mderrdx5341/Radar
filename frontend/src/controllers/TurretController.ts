import { EntityController } from './EntityController';
import { SimpleTurret } from '../entities/SimpleTurret';

export class TurretController extends EntityController {
    protected entity: SimpleTurret;

    constructor(turret: SimpleTurret) {
        super(turret);
        this.entity = turret;
    }

    /**
     * Приказ на движение ПВО по ПКМ
     */
    public handleRightClick = (worldX: number, worldY: number): void => {
        if (this.entity) {
            this.entity.moveTo(worldX, worldY);
        }
    };
}
