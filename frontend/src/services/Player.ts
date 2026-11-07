import { SimpleRadar, SimpleTurret, SimpleBuilding, SimpleInvader, PowerNode, RepairBay, ResourceHarvester } from '../entities';
import { PlacementManager } from '../entities/PlacementManager';

export class Player {
    public gold: number = 400; 
    public radars: Array<SimpleRadar> = new Array<SimpleRadar>();
    public turrets: Array<SimpleTurret> = new Array<SimpleTurret>();
    public buildings: Array<SimpleBuilding> = new Array<SimpleBuilding>();
    public placement: PlacementManager = new PlacementManager();

    // Оперативный список уникальных видимых целей в текущем кадре
    public activeTargets: Array<SimpleInvader> = new Array<SimpleInvader>();

    constructor() {
        this.initStartingUnits();
    }

    public initStartingUnits(): void {
        this.gold = 400;
        this.radars = new Array<SimpleRadar>();
        this.turrets = new Array<SimpleTurret>();
        this.buildings = new Array<SimpleBuilding>();

        this.radars.push(new SimpleRadar(800, 1000, 'РЛС-1'));
        this.turrets.push(new SimpleTurret(800, 1080, 'ПВО-1'));

        this.buildings.push(new PowerNode(400, 1120, 'Энергоблок ⚡'));
        this.buildings.push(new RepairBay(800, 1120, 'Ремонтный блок 🛠️'));
        this.buildings.push(new ResourceHarvester(1200, 1120, 'Ресурсная шахта 💎'));
    }

    /**
     * Быстрый сброс длины массива (0 аллокаций на куче)
     */
    public clearActiveTargets(): void {
        this.activeTargets.length = 0; 
    }

    /**
     * Регистрация цели от радаров
     */
    public registerDetectedTarget(invader: SimpleInvader): void {
        if (invader.hp > 0 && !this.activeTargets.includes(invader)) {
            this.activeTargets.push(invader);
        }
    }

    public tryPlaceBuilding(worldX: number, worldY: number): void {
        if (!this.placement.currentBuildType) return;

        const tooCloseRadar = this.radars.some(r => (r.x - worldX) * (r.x - worldX) + (r.y - worldY) * (r.y - worldY) < 400);
        const tooCloseTurret = this.turrets.some(t => (t.x - worldX) * (t.x - worldX) + (t.y - worldY) * (t.y - worldY) < 400);

        if (!tooCloseRadar && !tooCloseTurret) {
            if (this.placement.currentBuildType === 'RADAR') {
                this.radars.push(new SimpleRadar(worldX, worldY, `РЛС-${this.radars.length + 1}`));
            }
            if (this.placement.currentBuildType === 'TURRET') {
                this.turrets.push(new SimpleTurret(worldX, worldY, `ПВО-${this.turrets.length + 1}`));
            }
            this.placement.cancelBuilding();
        }
    }

    /**
     * Высокопроизводительный тактический апдейт контура Игрока
     */
    public update(deltaTime: number, allInvaders: Array<SimpleInvader>): void {
        // 1. Радары сканируют воздух
        for (let i = 0; i < this.radars.length; i++) {
            const radar = this.radars[i];
            radar.rotate(deltaTime);
            radar.scan(allInvaders, this); 
        }

        // 2. Батареи ПВО наводятся и стреляют по полному массиву роя
        for (let i = 0; i < this.turrets.length; i++) {
            const turret = this.turrets[i];
            turret.updateMovement(deltaTime);
            turret.attack(allInvaders, deltaTime); 
        }

        // 3. ИСПРАВЛЕНО НАДЁЖНО: Собираем уникальные видимые цели с защитой от дублирования!
        for (let i = 0; i < allInvaders.length; i++) {
            const invader = allInvaders[i];
            if (invader.isVisible && invader.hp > 0) {
                if (!this.activeTargets.includes(invader)) {
                    this.activeTargets.push(invader);
                }
            }
        }
    }
}
