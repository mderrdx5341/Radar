import { SimpleRadar, SimpleTurret, SimpleBuilding, SimpleInvader, PowerNode, RepairBay, AmmoDepot } from '../entities';
import { PlacementManager } from '../entities/PlacementManager';

export class Player {
    public gold: number = 400; 
    public radars: Array<SimpleRadar> = new Array<SimpleRadar>();
    public turrets: Array<SimpleTurret> = new Array<SimpleTurret>();
    public buildings: Array<SimpleBuilding> = new Array<SimpleBuilding>();
    public placement: PlacementManager = new PlacementManager();
    public activeTargets: Array<SimpleInvader> = new Array<SimpleInvader>();

    constructor() {
        this.initStartingUnits();
    }

    public initStartingUnits(): void {
        this.gold = 400;
        this.radars = new Array<SimpleRadar>();
        this.turrets = new Array<SimpleTurret>();
        this.buildings = new Array<SimpleBuilding>();

        this.buildings.push(new PowerNode(400, 1120, 'Энергоблок ⚡'));
        this.buildings.push(new RepairBay(800, 1120, 'Ремонтный блок 🛠️'));
        this.buildings.push(new AmmoDepot(1200, 1120, 'Склад боеприпасов 📦'));

        this.radars.push(new SimpleRadar(800, 1000, 'РЛС-1'));
        this.turrets.push(new SimpleTurret(800, 1080, 'ПВО-1'));
    }

    public clearActiveTargets(): void {
        this.activeTargets.length = 0; 
    }

    public registerDetectedTarget(invader: SimpleInvader): void {
        if (invader.hp > 0 && !this.activeTargets.includes(invader)) {
            this.activeTargets.push(invader);
        }
    }

/**
     * Честное размещение построек из меню HUD-панели на тактическую карту
     */
    public tryPlaceBuilding(worldX: number, worldY: number): void {
        if (!this.placement.currentBuildType) return;

        // ИСПРАВЛЕНО: Уменьшили радиус коллизии до 12px (диаметр 24px).
        // Теперь пушки ПВО и радары РЛС можно ставить вплотную друг к другу!
        const tooClose = this.buildings.some(b => !b.isDestroyed && (b.x - worldX) ** 2 + (b.y - worldY) ** 2 < 12 * 12)
            || this.radars.some(r => (r.x - worldX) ** 2 + (r.y - worldY) ** 2 < 12 * 12)
            || this.turrets.some(t => (t.x - worldX) ** 2 + (t.y - worldY) ** 2 < 12 * 12);

        if (!tooClose) {
            const type = this.placement.currentBuildType;
            
            if (type === 'RADAR') {
                this.radars.push(new SimpleRadar(worldX, worldY, `РЛС-${this.radars.length + 1}`));
            } else if (type === 'TURRET') {
                this.turrets.push(new SimpleTurret(worldX, worldY, `ПВО-${this.turrets.length + 1}`));
            } else if (type === 'POWER') {
                this.buildings.push(new PowerNode(worldX, worldY, `Энергоблок-${this.buildings.length + 1}`));
            } else if (type === 'REPAIR') {
                this.buildings.push(new RepairBay(worldX, worldY, `Рем-Блок-${this.buildings.length + 1}`));
            } else if (type === 'AMMO_DEPOT') {
                this.buildings.push(new AmmoDepot(worldX, worldY, `Склад БК-${this.buildings.length + 1}`));
            }

            console.log(`[Строительство]: Успешно развернут объект ${type}`);
            this.placement.cancelBuilding(); 
        }
    }

    public update(deltaTime: number, allInvaders: Array<SimpleInvader>): void {
        const liveBuildings = this.buildings.filter(b => !b.isDestroyed);
        const powerNodes = liveBuildings.filter(b => b.type === 'POWER') as Array<PowerNode>;
        const repairBays = liveBuildings.filter(b => b.type === 'REPAIR') as Array<RepairBay>;
        const ammoDepots = liveBuildings.filter(b => b.type === 'AMMO_DEPOT') as Array<AmmoDepot>;

        powerNodes.forEach(p => p.connectedRadarsCount = 0);
        repairBays.forEach(r => r.connectedBuildingsCount = 0);
        ammoDepots.forEach(a => a.connectedTurretsCount = 0);

        // --- 1. ЭНЕРГОСЕТЬ: Распределение РЛС по Энергоблокам ---
        this.radars.forEach(radar => {
            const provider = powerNodes.find(p => {
                const distSq = (p.x - radar.x) * (p.x - radar.x) + (p.y - radar.y) * (p.y - radar.y);
                return distSq <= p.powerRadius * p.powerRadius;
            });

            if (provider) {
                radar.isPowered = true;
                provider.connectedRadarsCount++;
                const isOverloaded = provider.connectedRadarsCount > provider.maxSafeLoad;
                
                // ИСПРАВЛЕНО: В норме 300px, при перегрузке сети падает до 180px!
                radar.detectionRadius = isOverloaded ? 100 : 180; 
            } else {
                radar.isPowered = false;
                radar.detectionRadius = 0; // Полностью обесточен
            }
        });

        const isGlobalRadarActive = this.radars.some(r => r.isPowered);

        // --- 2. ЛОГИКА БК: Двухпроходный расчет общего тактического дефицита ---
        
        // ПРОХОД А: Сначала просто привязываем пушки и собираем ИТОГОВУЮ нагрузку на каждый склад
        this.turrets.forEach(turret => {
            // Ищем склад боеприпасов в радиусе 350px
            const depot = ammoDepots.find(a => {
                const distSq = (a.x - turret.x) ** 2 + (a.y - turret.y) ** 2;
                return distSq <= a.supplyRadius * a.supplyRadius;
            });

            if (depot) {
                turret.isSupplied = true;
                depot.connectedTurretsCount++; // Склад накапливает суммарный счетчик
                // Временно сохраняем ссылку на склад внутри пушки (для прохода Б)
                (turret as any)._currentDepot = depot; 
            } else {
                turret.isSupplied = false;
                turret.hasPenalty = false;
                (turret as any)._currentDepot = null;
                turret.currentAmmo = 0; 
            }
        });

        // ПРОХОД Б: Когда итоговая нагрузка известна, объявляем дефицит ВСЕМ пушкам одновременно!
        this.turrets.forEach(turret => {
            const depot = (turret as any)._currentDepot;
            
            if (depot) {
                // Если ИТОГОВАЯ нагрузка на этот склад превысила лимит N=3,
                // то дефицит БК (hasPenalty = true) взводится ОДНОВРЕМЕННО у ВСЕХ пушек в этой сети!
                turret.hasPenalty = depot.connectedTurretsCount > depot.maxSafeLoad;
            }

            // Запускаем огневые и двигательные тики пушки ПВО
            turret.updateMovement(deltaTime);
            turret.attack(allInvaders, deltaTime, isGlobalRadarActive);
        });

        // --- 3. ИНЖЕНЕРНЫЙ КОНТУР: Ремонт зданий под их честный maxHp ---
        liveBuildings.forEach(targetBuilding => {
            const healers = repairBays.filter(r => {
                const distSq = (r.x - targetBuilding.x) * (r.x - targetBuilding.x) + (r.y - targetBuilding.y) * (r.y - targetBuilding.y);
                return distSq <= r.repairRadius * r.repairRadius;
            });

            healers.forEach(bay => {
                bay.connectedBuildingsCount++;
                const isOverloaded = bay.connectedBuildingsCount > bay.maxSafeLoad;
                const isSelfHeal = (bay as any) === targetBuilding;
                let healAmount = isSelfHeal ? 0.1 : 0.04;
                
                if (isOverloaded) healAmount /= 3;

                // ИСПРАВЛЕНО: Чиним здание строго до ЕГО индивидуального максимума (100 или 120)!
                const maxLimit = (targetBuilding as any).maxHp || 100;
                if (targetBuilding.hp < maxLimit) {
                    targetBuilding.hp = Math.min(maxLimit, targetBuilding.hp + healAmount * deltaTime * 0.06);
                }
            });
        });

        // --- 4. ОБНОВЛЕНИЕ РАДАРОВ РЛС ---
        for (let i = 0; i < this.radars.length; i++) {
            const radar = this.radars[i];
            
            // Сначала вращаем приводы (если есть команда наведения от мыши)
            radar.rotate(deltaTime);
            
            // Если РЛС запитана — производим конусный скан воздуха
            if (radar.isPowered) {
                radar.scan(allInvaders, this);
            }
        }

        // --- 5. РЕГИСТРАЦИЯ ОБНАРУЖЕННЫХ ЦЕЛЕЙ ---
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
