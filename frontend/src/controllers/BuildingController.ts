import { EntityController } from './EntityController';
import { SimpleBuilding } from '../entities/buildings/SimpleBuilding';

export class BuildingController extends EntityController {
    protected entity: SimpleBuilding;

    constructor(building: SimpleBuilding) {
        super(building);
        this.entity = building;
    }
}
