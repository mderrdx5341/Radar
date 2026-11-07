import { SimpleBuilding } from './SimpleBuilding';

export class PowerNode extends SimpleBuilding {
    public powerRadius: number = 300;
    public connectedRadarsCount: number = 0;
    public maxSafeLoad: number = 3;
    public maxHp: number = 100;

    constructor(x: number, y: number, name: string) {
        // Передаем ровно 5 аргументов: x, y, name, тип, размер сетки (например, 5)
        super(x, y, 'POWER', name, 5);
        this.hp = 100;
    }

    public update(deltaTime: number): void {}
}
