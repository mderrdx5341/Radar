import { SimpleBuilding } from './SimpleBuilding';

export class PowerNode extends SimpleBuilding {
    constructor(x: number, y: number, name: string = 'Энергоблок') {
        super(x, y, 'POWER', name, 150); // 150 единиц прочности
    }

    public update(deltaTime: number, gameContext: any): void {
        // Удержание сети питания радаров и пушек ПВО
    }
}