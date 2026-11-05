import { SimpleBuilding } from './SimpleBuilding';

export class RepairBay extends SimpleBuilding {
    constructor(x: number, y: number, name: string = 'Ремонтный блок') {
        super(x, y, 'REPAIR', name, 120); // 120 единиц прочности
    }

    public update(deltaTime: number, gameContext: any): void {
        // Логика обеспечения ручного ремонта или ауры починки
    }
}