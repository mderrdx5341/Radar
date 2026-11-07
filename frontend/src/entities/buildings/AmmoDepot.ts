import { SimpleBuilding } from './SimpleBuilding';

export class AmmoDepot extends SimpleBuilding {
    public supplyRadius: number = 350;
    public connectedTurretsCount: number = 0;
    public maxSafeLoad: number = 3;
    public maxHp: number = 120;

    constructor(x: number, y: number, name: string) {
        // Передаем x, y, name, тип, и размеры сетки (5, 5) для конструктора SimpleBuilding
        super(x, y, 'AMMO_DEPOT', name, 5);
        this.hp = 120;
    }

    /**
     * ВОССТАНОВЛЕНО: Обязательная реализация абстрактного метода
     */
    public update(deltaTime: number): void {}
}
