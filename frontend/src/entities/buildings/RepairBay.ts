import { SimpleBuilding } from './SimpleBuilding';

export class RepairBay extends SimpleBuilding {
    public repairRadius: number = 200;
    public connectedBuildingsCount: number = 0;
    public maxSafeLoad: number = 3;
    public maxHp: number = 100;

    constructor(x: number, y: number, name: string) {
        super(x, y, 'REPAIR', name, 5);
        this.hp = 100;
    }

    public update(deltaTime: number): void {}
}
