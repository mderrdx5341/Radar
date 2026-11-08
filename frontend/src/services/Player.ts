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

        // СБРОС СЧЕТЧИКОВ НАГРУЗКИ ПЕРЕД НАЧАЛОМ КАДРА
        powerNodes.forEach(p => p.connectedRadarsCount = 0);
        repairBays.forEach(r => r.connectedBuildingsCount = 0);
        ammoDepots.forEach(a => a.connectedTurretsCount = 0);

        // =========================================================================
        // --- 1. УМНАЯ БАЛАНСИРОВКА ЭНЕРГОСЕТИ (Для РЛС) ---
        // =========================================================================
        
        // ПРОХОД А: Распределяем радары по Энергоблокам с наименьшей текущей загрузкой
        this.radars.forEach(radar => {
            // Находим ВСЕ живые энергоблоки, до которых радар дотягивается (радиус 300px)
            const availableProviders = powerNodes.filter(p => {
                const distSq = (p.x - radar.x) ** 2 + (p.y - radar.y) ** 2;
                return distSq <= p.powerRadius * p.powerRadius;
            });

            if (availableProviders.length > 0) {
                // СОРТИРОВКА: Выбираем блок, у которого прямо сейчас МЕНЬШЕ ВСЕГО подключенных потребителей!
                availableProviders.sort((a, b) => a.connectedRadarsCount - b.connectedRadarsCount);
                
                const bestProvider = availableProviders[0]; // Самый свободный энергоблок
                radar.isPowered = true;
                bestProvider.connectedRadarsCount++;
                (radar as any)._currentProvider = bestProvider;
            } else {
                radar.isPowered = false;
                radar.detectionRadius = 0; 
                (radar as any)._currentProvider = null;
            }
        });

        // ПРОХОД Б: Объявляем дефицит энергии (Voltage Drop) синхронно по сетям
        this.radars.forEach(radar => {
            const provider = (radar as any)._currentProvider;
            if (provider) {
                const isOverloaded = provider.connectedRadarsCount > provider.maxSafeLoad;
                radar.detectionRadius = isOverloaded ? 100 : 180;
            }
        });

        const isGlobalRadarActive = this.radars.some(r => r.isPowered && r.detectionRadius > 0);

        // =========================================================================
        // --- 2. УМНАЯ БАЛАНСИРОВКА ЛОГИСТИКИ БК (Для ПВО) ---
        // =========================================================================
        
        // ПРОХОД А: Распределяем пушки по Складам БК с наименьшей текущей загрузкой
        this.turrets.forEach(turret => {
            // Находим ВСЕ живые склады БК, в радиусе снабжения которых стоит пушка (радиус 350px)
            const availableDepots = ammoDepots.filter(a => {
                const distSq = (a.x - turret.x) ** 2 + (a.y - turret.y) ** 2;
                return distSq <= a.supplyRadius * a.supplyRadius;
            });

            if (availableDepots.length > 0) {
                // СОРТИРОВКА: Направляем патронный кабель к самому СВОБОДНОМУ складу в этом кадре!
                availableDepots.sort((a, b) => a.connectedTurretsCount - b.connectedTurretsCount);
                
                const bestDepot = availableDepots[0]; // Самый свободный арсенал снабжения
                turret.isSupplied = true;
                bestDepot.connectedTurretsCount++;
                (turret as any)._currentDepot = bestDepot;
            } else {
                turret.isSupplied = false;
                turret.hasPenalty = false;
                (turret as any)._currentDepot = null;
            }
        });

        // ПРОХОД Б: Объявляем дефицит патронов синхронно по сетям перегруженных складов
        this.turrets.forEach(turret => {
            const depot = (turret as any)._currentDepot;
            if (depot) {
                turret.hasPenalty = depot.connectedTurretsCount > depot.maxSafeLoad;
            }

            // Запускаем тики движения и стрельбы пушек ПВО
            turret.updateMovement(deltaTime);
            turret.attack(allInvaders, deltaTime, isGlobalRadarActive);
        });

        // =========================================================================
        // --- 3. ИНЖЕНЕРНЫЙ КОНТУР (Ремонт зданий) ---
        // =========================================================================
        liveBuildings.forEach(targetBuilding => {
            const healers = repairBays.filter(r => {
                const distSq = (r.x - targetBuilding.x) ** 2 + (r.y - targetBuilding.y) ** 2;
                return distSq <= r.repairRadius * r.repairRadius;
            });

            healers.forEach(bay => {
                bay.connectedBuildingsCount++;
                const isOverloaded = bay.connectedBuildingsCount > bay.maxSafeLoad;
                const isSelfHeal = (bay as any) === targetBuilding;
                let healAmount = isSelfHeal ? 0.1 : 0.04;
                
                if (isOverloaded) healAmount /= 3;

                const maxLimit = (targetBuilding as any).maxHp || 100;
                if (targetBuilding.hp < maxLimit) {
                    targetBuilding.hp = Math.min(maxLimit, targetBuilding.hp + healAmount * deltaTime * 0.06);
                }
            });
        });

        // 4. Покадровый скан воздуха выжившими радарами РЛС
        for (let i = 0; i < this.radars.length; i++) {
            const radar = this.radars[i];
            radar.rotate(deltaTime);
            if (radar.isPowered) {
                radar.scan(allInvaders, this);
            }
        }

        // 5. Запись обнаруженных целей для радиоразведки роя А*
        for (let i = 0; i < allInvaders.length; i++) {
            const invader = allInvaders[i];
            if (invader.isVisible && invader.hp > 0) {
                if (!this.activeTargets.includes(invader)) {
                    this.activeTargets.push(invader);
                }
            }
        }
    } // Конец метода update

}
