import { 
    SimpleInvader, SimpleRadar, SimpleTurret, RouteManager,
    PowerNode, RepairBay, ResourceHarvester, SimpleBuilding 
} from '../entities';
import { InputManager } from './InputManager';
import { CollisionManager } from './CollisionManager';

export class GameState {
    // Хранение списков юнитов и строений (Мировые координаты)
    public invaders: SimpleInvader[] = [];
    public radars: SimpleRadar[] = [];
    public turrets: SimpleTurret[] = [];
    public buildings: SimpleBuilding[] = [];

    // Глобальные триггеры сессии, статистика и выбор
    public score: number = 0;
    public isPaused: boolean = false;
    public isGameOver: boolean = false;
    public selectedEntity: SimpleRadar | SimpleTurret | null = null;

    private routeManager: RouteManager;

    // Экономический контекст для пассивного тика зданий
    private econContext = {
        addGold: (amount: number) => {
            // Будет связано с кошельком золота на следующем этапе
            console.log(`[GameState Экономика]: Добыто золота: +${amount}`);
        }
    };

    constructor(routeManager: RouteManager) {
        this.routeManager = routeManager;
        this.initSession();
    }

    /**
     * Первоначальное развёртывание сессии: спавн зданий, РЛС, ПВО и роя БПЛА
     */
    public initSession(): void {
        this.score = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.selectedEntity = null;

        // Инициализация оборонительных рубежей
        this.radars = [new SimpleRadar(800, 1000, 'РЛС-1')];
        this.turrets = [new SimpleTurret(800, 1080, 'ПВО-1')];

        // Разворачиваем 3 физических здания в тылу на высоте Y: 1120
        this.buildings = [
            new PowerNode(400, 1120, 'Энергоблок ⚡'),
            new RepairBay(800, 1120, 'Ремонтный блок 🛠️'),
            new ResourceHarvester(1200, 1120, 'Ресурсная шахта 💎')
        ];

        // Генерация роя БПЛА по 10 фиксированным коридорам взлёта
        this.invaders = [];
        this.routeManager.spawnPoints.forEach(spawnX => {
            const invader = new SimpleInvader(spawnX, Math.floor(Math.random() * -300) - 50);
            invader.waypoints = this.routeManager.generateFlightPlan(invader.spawnPointX, invader.y, this.buildings);
            this.invaders.push(invader);
        });
    }

    /**
     * Основной высокоуровневый цикл симуляции боя и логики за кадр
     */
    public update(
        deltaTime: number, 
        input: InputManager, 
        collisionManager: CollisionManager, 
        worldMouse: { x: number, y: number }
    ): void {
        // Если игра на паузе или окончена — обновляем только вектор ведения мыши у выделенного радара
        if (this.isPaused || this.isGameOver) {
            this.radars.forEach(radar => {
                if (radar.isTrackingMouse) radar.setTargetDirection(worldMouse.x, worldMouse.y);
            });
            return;
        }

        // 1. Проверяем глобальные условия тактического поражения (Game Over)
        const powerNodes = this.buildings.filter(b => b.type === 'POWER');
        const allPowerDestroyed = powerNodes.every(b => b.isDestroyed);
        const allBuildingsDestroyed = this.buildings.every(b => b.isDestroyed);

        if (allPowerDestroyed || allBuildingsDestroyed) {
            this.isGameOver = true;
            return;
        }

        // 2. Пассивный тик зданий (Шахта генерирует ресурсы)
        this.buildings.forEach(building => {
            building.update(deltaTime, this.econContext);
        });

        // 3. Обновление РЛС станций
        this.radars.forEach(radar => {
            if (radar.isTrackingMouse || (input.isMouseButtonDown(2) && this.selectedEntity === radar)) {
                radar.setTargetDirection(worldMouse.x, worldMouse.y);
            }
            radar.rotate(deltaTime);
            radar.scan(this.invaders);
        });

        // 4. Движение камикадзе и обсчёт взрывов Suicide Strike
        this.invaders.forEach(invader => {
            invader.updateVisibility(deltaTime);
            
            // Проверка тарана бункеров в CollisionManager
            let shouldRespawn = collisionManager.checkSuicideStrikes(invader, this.buildings);

            // Если дрон не долетел до зданий, но был ликвидирован лазерами ПВО
            if (!shouldRespawn && (invader.y > 1200 || invader.hp <= 0)) {
                if (invader.hp <= 0) {
                    this.score++;
                    invader.attackers.forEach(turret => {
                        this.routeManager.reportHazard(turret);
                        console.log(`[Радиосеть Роя]: Перехвачены координаты позиции ПВО: ${turret.name}`);
                    });
                }
                shouldRespawn = true;
            }

            // Респавн и пересчёт веера Flight Plan по оставшимся целям
            if (shouldRespawn) {
                invader.attackers = new Array<SimpleTurret>();
                invader.y = Math.floor(Math.random() * -200) - 40;
                invader.x = invader.spawnPointX;
                invader.hp = 100;
                invader.visibilityTimer = 0;
                invader.moveAngle = Math.PI / 2;
                invader.waypoints = this.routeManager.generateFlightPlan(invader.spawnPointX, invader.y, this.buildings);
            } else {
                invader.moveDown();
            }
        });

        // 5. Логика перезарядки и наведения ПВО
        this.turrets.forEach(turret => {
            turret.updateMovement(deltaTime);
            turret.scan(this.invaders);
            turret.attack(this.invaders, deltaTime);
        });
    }
}