import { SimpleBuilding } from './SimpleBuilding';

export class ResourceHarvester extends SimpleBuilding {
    private incomeTimer: number = 0;
    private readonly incomeInterval: number = 4000; // Начисление каждые 4 секунды

    constructor(x: number, y: number, name: string = 'Ресурсная шахта') {
        super(x, y, 'HARVESTER', name, 100); // 100 единиц прочности
    }

    public update(deltaTime: number, gameContext: any): void {
        if (this.isDestroyed) return;

        this.incomeTimer += deltaTime;
        if (this.incomeTimer >= this.incomeInterval) {
            this.incomeTimer = 0;
            // Колбэк начисления ресурсов в кошелёк главного цикла
            if (gameContext && typeof gameContext.addGold === 'function') {
                gameContext.addGold(15); // +15 золота за тик
            }
        }
    }
}