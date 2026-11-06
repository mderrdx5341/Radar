import { SimpleInvader, RouteManager } from '../entities';
import { InputManager } from './InputManager';
import { CollisionManager } from './CollisionManager';
import { Player } from './Player';
import { InterfaceService } from './InterfaceService'; // Подключаем тактический диспетчер

export class GameState {
    public player: Player;
    public invaders: Array<SimpleInvader> = new Array<SimpleInvader>();
    
    // Глобальный интерфейсный сервис управления кликами и выбором
    public interfaceService: InterfaceService;

    // Системные триггеры сессии
    public score: number = 0;
    public isPaused: boolean = false;
    public isGameOver: boolean = false;

    private routeManager: RouteManager;

    constructor(routeManager: RouteManager) {
        this.routeManager = routeManager;
        this.player = new Player();
        // Инициализируем наш интерфейсный диспетчер
        this.interfaceService = new InterfaceService();
        this.initSession();
    }

    /**
     * Сброс и развёртывание сессии с нуля
     */
    public initSession(): void {
        this.score = 0;
        this.isPaused = false;
        this.isGameOver = false;
        
        // Сбрасываем выделение в интерфейсе
        this.interfaceService.deselectCurrentEntity();
        this.player.initStartingUnits();

        // Спавн БПЛА-камикадзе
        this.invaders = new Array<SimpleInvader>();
        this.routeManager.spawnPoints.forEach(spawnX => {
            const invader = new SimpleInvader(spawnX, Math.floor(Math.random() * -300) - 50);
            invader.waypoints = this.routeManager.generateFlightPlan(invader.spawnPointX, invader.y, this.player.buildings);
            this.invaders.push(invader);
        });
    }

    /**
     * ВЫСОКОУРОВНЕВЫЙ ТИК ОБНОВЛЕНИЯ ИГРОВОГО МИРА
     */
    public update(deltaTime: number, input: InputManager, collisionManager: CollisionManager, worldMouse: { x: number, y: number }): void {
        
        // 1. АПДЕЙТ ИНТЕРФЕЙСА: Транслируем покадровое движение мыши (удержание ПКМ для РЛС)
        //this.interfaceService.update(input, worldMouse);

        // 2. ЗАМОРОЗКА МИРА: Если игра на паузе или бункеры уничтожены
        if (this.isPaused || this.isGameOver) return;

        // 3. УСЛОВИЯ ПОРАЖЕНИЯ БАЗЫ
        const powerNodes = this.player.buildings.filter(b => b.type === 'POWER');
        const allPowerDestroyed = powerNodes.every(b => b.isDestroyed);
        const allBuildingsDestroyed = this.player.buildings.every(b => b.isDestroyed);

        if (allPowerDestroyed || allBuildingsDestroyed) {
            this.isGameOver = true;
            return;
        }

        // 4. СБРОС ТАКТИЧЕСКОЙ КАРТЫ ЦЕЛЕЙ ИГРОКА ПЕРЕД НАЧАЛОМ КАДРА
        this.player.clearActiveTargets();

        // 5. ЗАПУСК ЦИКЛА ИГРОКА (Обнаружение РЛС -> Движение пушек ПВО -> Залпы лазеров)
        this.player.update(deltaTime, this.invaders);

        // 6. СИМУЛЯЦИЯ ДВИЖЕНИЯ И УПРАВЛЕНИЯ РОЕМ БПЛА-КАМИКАДЗЕ
        this.invaders.forEach(invader => {
            invader.updateVisibility(deltaTime);
            
            // Перехват Suicide Strike коллизий о бункеры игрока
            let shouldRespawn = collisionManager.checkSuicideStrikes(invader, this.player.buildings);

            if (!shouldRespawn && (invader.y > 1200 || invader.hp <= 0)) {
                if (invader.hp <= 0) {
                    this.score++;
                    
                    // Погибший дрон передает координаты ПВО в глобальный разум роя
                    invader.attackers.forEach(turret => {
                        this.routeManager.reportHazard(turret);
                    });
                }
                shouldRespawn = true;
            }

            // Порционный пересчёт А* строго в момент респавна дрона наверх
            if (shouldRespawn) {
                invader.attackers = new Array();
                invader.y = Math.floor(Math.random() * -200) - 40;
                invader.x = invader.spawnPointX;
                invader.hp = 100;
                invader.visibilityTimer = 0;
                invader.moveAngle = Math.PI / 2;
                invader.waypoints = this.routeManager.generateFlightPlan(invader.spawnPointX, invader.y, this.player.buildings);
            } else {
                invader.moveDown(); // Спокойно скользит по путевым точкам из своей памяти
            }
        });
    }
}