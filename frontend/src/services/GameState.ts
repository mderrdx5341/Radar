import { Player } from './Player';
import { EnemySwarm } from './EnemySwarm'; 
import { InterfaceService } from './InterfaceService';
import { InputManager } from './InputManager';
import { CollisionManager } from './CollisionManager';

export class GameState {
    public player: Player;
    public enemySwarm: EnemySwarm;
    public interfaceService: InterfaceService;

    public score: number = 0;
    public isPaused: boolean = false;
    public isGameOver: boolean = false;

    public isDebugMode: boolean = false;
    public isWaveDebugMode: boolean = false;

    constructor() {
        this.player = new Player();
        // Рой сам внутри себя создаст правильный, единый RouteManager!
        this.enemySwarm = new EnemySwarm();
        this.interfaceService = new InterfaceService();
        this.initSession();
    }

    public initSession(): void {
        this.score = 0;
        this.isPaused = false;
        this.isGameOver = false;
        this.isDebugMode = false;
        this.isWaveDebugMode = false;
        
        this.interfaceService.deselectCurrentEntity();
        
        this.player.initStartingUnits();
        this.enemySwarm.initSwarm();

        // Прошиваем БПЛА путями по стартовым бункерам
        this.enemySwarm.buildInitialFlightPlans(this.player.buildings);
    }

    public toggleDebugMode(): void {
        this.isDebugMode = !this.isDebugMode;
        console.log(`[ОТЛАДКА]: Режим визуализации сетки ИИ переключен: ${this.isDebugMode ? 'ВКЛ 🟢' : 'ВЫКЛ 🔴'}`);
    }

    public toggleWaveDebugMode(): void {
        this.isWaveDebugMode = !this.isWaveDebugMode;
    }

    public update(deltaTime: number, input: InputManager, collisionManager: CollisionManager, worldMouse: { x: number, y: number }): void {
        this.interfaceService.update(input, worldMouse);

        if (this.isPaused || this.isGameOver) return;
/*
        const powerNodes = this.player.buildings.filter(b => b.type === 'POWER');
        if (powerNodes.every(b => b.isDestroyed) || this.player.buildings.every(b => b.isDestroyed)) {
            this.isGameOver = true;
            return;
        }
*/
        // Очищаем список целей перед кадром
        this.player.clearActiveTargets();

        // Игрок сканирует рой
        this.player.update(deltaTime, this.enemySwarm.invaders);

        // Рой двигается и атакует бункеры
         const downedCount = this.enemySwarm.update(deltaTime, collisionManager, this.player.buildings);
        this.score += downedCount;
    }
}
