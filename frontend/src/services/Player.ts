import { SimpleRadar, SimpleTurret, SimpleBuilding, SimpleInvader, PowerNode, RepairBay, ResourceHarvester } from '../entities';
import { PlacementManager } from '../entities/PlacementManager'; // Подключаем менеджер чертежей

export class Player {
    // Ресурсы игрока
    public gold: number = 400; 
    
    // Массивы активных подконтрольных войск
    public radars: Array<SimpleRadar> = new Array<SimpleRadar>();
    public turrets: Array<SimpleTurret> = new Array<SimpleTurret>();
    public buildings: Array<SimpleBuilding> = new Array<SimpleBuilding>();

    // ИСПРАВЛЕНО: Инкапсулируем менеджер размещения призраков внутри Игрока
    public placement: PlacementManager = new PlacementManager();

    // Оперативный список обнаруженных целей за текущий кадр симуляции
    private activeTargets: Array<SimpleInvader> = new Array<SimpleInvader>();

    constructor() {
        this.initStartingUnits();
    }

    /**
     * Стартовая разметка и создание начальной инфраструктуры базы
     */
    public initStartingUnits(): void {
        this.gold = 400;
        this.radars = new Array<SimpleRadar>();
        this.turrets = new Array<SimpleTurret>();
        this.buildings = new Array<SimpleBuilding>();

        // Базовые боевые единицы в центре тактической зоны
        this.radars.push(new SimpleRadar(800, 1000, 'РЛС-1'));
        this.turrets.push(new SimpleTurret(800, 1080, 'ПВО-1'));

        // Три стартовых здания инфраструктуры
        this.buildings.push(new PowerNode(400, 1120, 'Энергоблок ⚡'));
        this.buildings.push(new RepairBay(800, 1120, 'Ремонтный блок 🛠️'));
        this.buildings.push(new ResourceHarvester(1200, 1120, 'Ресурсная шахта 💎'));
    }

    public clearActiveTargets(): void {
        this.activeTargets = new Array<SimpleInvader>();
    }

    public registerDetectedTarget(invader: SimpleInvader): void {
        if (!this.activeTargets.includes(invader)) {
            this.activeTargets.push(invader);
        }
    }

    /**
     * ИСПРАВЛЕНО: Метод сборки фундамента здания по всей тактической карте
     */
    public tryPlaceBuilding(worldX: number, worldY: number): void {
        if (!this.placement.currentBuildType) return;

        // Исключаем установку башен друг в друга (минимальный зазор 15px)
        const tooCloseRadar = this.radars.some(r => Math.sqrt((r.x - worldX) ** 2 + (r.y - worldY) ** 2) < 15);
        const tooCloseTurret = this.turrets.some(t => Math.sqrt((t.x - worldX) ** 2 + (t.y - worldY) ** 2) < 15);

        if (!tooCloseRadar && !tooCloseTurret) {
            if (this.placement.currentBuildType === 'RADAR') {
                this.radars.push(new SimpleRadar(worldX, worldY, `РЛС-${this.radars.length + 1}`));
            }
            if (this.placement.currentBuildType === 'TURRET') {
                this.turrets.push(new SimpleTurret(worldX, worldY, `ПВО-${this.turrets.length + 1}`));
            }
            // Успешно развернули постройку — сбрасываем режим чертежа
            this.placement.cancelBuilding();
        }
    }

    /**
     * Симуляция работы тактического контура игрока за кадр
     */
    public update(deltaTime: number, allInvaders: Array<SimpleInvader>): void {
        // 1. Радары сканируют небо
        this.radars.forEach(radar => {
            radar.rotate(deltaTime);
            radar.scan(allInvaders, this); 
        });

        // 2. Рассчитываем плавную анимацию перемещения и приводов стволов ПВО
        this.turrets.forEach(turret => {
            turret.updateMovement(deltaTime);
        });

        // Пополняем тактический список целями, обнаруженными ПВО автономно
        allInvaders.forEach(invader => {
            if (invader.isVisible && !this.activeTargets.includes(invader)) {
                this.activeTargets.push(invader);
            }
        });

        // 3. Если целей на карте нет — пушки сбрасывают огонь, но продолжают перемещаться
        if (this.activeTargets.length === 0) {
            this.turrets.forEach(turret => { turret.currentTarget = null; });
            return;
        }

        // 4. Огневые залпы ПВО по подтверждённому списку угроз
        this.turrets.forEach(turret => {
            turret.attack(this.activeTargets, deltaTime);
        });
    }
}