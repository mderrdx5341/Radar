import { Player } from './Player';
import { EnemySwarm } from './EnemySwarm'; // Подключаем фракцию противника
import { InterfaceService } from './InterfaceService';
import { InputManager } from './InputManager';
import { CollisionManager } from './CollisionManager';

export class GameState {
    // Две полноценные суверенные фракции игрового мира
    public player: Player;
    public enemySwarm: EnemySwarm;

    // Глобальный интерфейсный сервис управления кликами и выбором
    public interfaceService: InterfaceService;

    // Системные триггеры сессии
    public score: number = 0;
    public isPaused: boolean = false;
    public isGameOver: boolean = false;

    constructor() {
        this.player = new Player();
        this.enemySwarm = new EnemySwarm();
        this.interfaceService = new InterfaceService();
        this.initSession();
    }

    /**
     * Сброс и развёртывание сессии с нуля (Restart)
     */
    public initSession(): void {
        this.score = 0;
        this.isPaused = false;
        this.isGameOver = false;
        
        // Очищаем тактический фокус интерфейса
        this.interfaceService.deselectCurrentEntity();
        
        // Перезапускаем фракции к стартовым параметрам
        this.player.initStartingUnits();
        this.enemySwarm.initSwarm();

        // Прошиваем БПЛА первыми полетными листами по стартовым бункерам
        this.enemySwarm.buildInitialFlightPlans(this.player.buildings);
    }

    /**
     * ВЫСОКОУРОВНЕВЫЙ ТИК СИМУЛЯЦИИ ИГРОВОГО МИРА ЗА КАДР
     */
    public update(deltaTime: number, input: InputManager, collisionManager: CollisionManager, worldMouse: { x: number, y: number }): void {
        
        // 1. АПДЕЙТ ИНТЕРФЕЙСА: Транслируем покадровое движение мыши (удержание ПКМ для РЛС)
        this.interfaceService.update(input, worldMouse);

        // 2. ЗАМОРОЗКА МИРА: Если игра на паузе или бункеры уничтожены
        if (this.isPaused || this.isGameOver) return;

        // 3. УСЛОВИЯ ПОРАЖЕНИЯ БАЗЫ: Проверяем уцелевшие энергоблоки Игрока
        const powerNodes = this.player.buildings.filter(b => b.type === 'POWER');
        const allPowerDestroyed = powerNodes.every(b => b.isDestroyed);
        const allBuildingsDestroyed = this.player.buildings.every(b => b.isDestroyed);

        if (allPowerDestroyed || allBuildingsDestroyed) {
            this.isGameOver = true;
            return;
        }

        // 4. СБРОС ТАКТИЧЕСКОЙ КАРТЫ ЦЕЛЕЙ ИГРОКА ПЕРЕД НАЧАЛОМ КАДРА
        this.player.clearActiveTargets();

        // 5. ТИК ФРАКЦИИ ИГРОКА (Обнаружение РЛС -> Движение пушек -> Залпы лазеров)
        this.player.update(deltaTime, this.enemySwarm.invaders);

        // 6. ТИК ФРАКЦИИ ПРОТИВНИКА (Перемещаем рой камикадзе внутрь EnemySwarm)
        // Метод возвращает число сбитых дронов, которое мы сразу плюсуем к счету сессии
        const downedCount = this.enemySwarm.update(deltaTime, collisionManager, this.player.buildings);
        this.score += downedCount;
    }
}
