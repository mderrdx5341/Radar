export type InfrastructureType = 'POWER' | 'REPAIR' | 'HARVESTER' | 'AMMO_DEPOT';

export abstract class SimpleBuilding {
    public x: number;
    public y: number;
    public radius: number = 24; // Физический радиус корпуса (~48px в диаметре)
    public hp: number;
    public maxHp: number;
    public type: InfrastructureType;
    public name: string;

    constructor(x: number, y: number, type: InfrastructureType, name: string, maxHp: number) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.name = name;
        this.maxHp = maxHp;
        this.hp = maxHp;
    }

    public get isDestroyed(): boolean {
        return this.hp <= 0;
    }

    /**
     * Пассивный тик здания для его механик во времени
     */
    public abstract update(deltaTime: number, gameContext: any): void;
}