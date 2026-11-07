import { GameState, CameraSystem, InterfaceService } from '../services';
import { EnvironmentRenderer } from './EnvironmentRenderer';
import { UIRenderer } from './UIRenderer';
import { RadarRenderer } from './RadarRenderer';
import { TurretRenderer } from './TurretRenderer';
import { InvaderRenderer } from './InvaderRenderer';
// Импортируем три наших расщеплённых графических компонента построек базы
import { PowerNodeRenderer } from './PowerNodeRenderer';
import { RepairBayRenderer } from './RepairBayRenderer';
import { ResourceHarvesterRenderer } from './ResourceHarvesterRenderer';
import { DebugRenderer } from './DebugRenderer'; 

export class CanvasRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private environmentRenderer: EnvironmentRenderer;
    private uiRenderer: UIRenderer;
    
    private radarRenderer: RadarRenderer;
    private turretRenderer: TurretRenderer;
    private invaderRenderer: InvaderRenderer;
    
    // Под-службы визуализации инфраструктуры базы
    private powerNodeRenderer: PowerNodeRenderer;
    private repairBayRenderer: RepairBayRenderer;
    private resourceHarvesterRenderer: ResourceHarvesterRenderer;
    
    private debugRenderer: DebugRenderer;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.imageSmoothingEnabled = false;
        
        this.environmentRenderer = new EnvironmentRenderer(this.ctx);
        this.uiRenderer = new UIRenderer(this.ctx);

        this.radarRenderer = new RadarRenderer(this.ctx);
        this.turretRenderer = new TurretRenderer(this.ctx);
        this.invaderRenderer = new InvaderRenderer(this.ctx);

        // ИСПРАВЛЕНО: Жёстко инициализируем все три рендерера зданий в конструкторе!
        this.powerNodeRenderer = new PowerNodeRenderer(this.ctx);
        this.repairBayRenderer = new RepairBayRenderer(this.ctx);
        this.resourceHarvesterRenderer = new ResourceHarvesterRenderer(this.ctx);
        
        this.debugRenderer = new DebugRenderer(this.ctx);

        this.warmupGraphics();
    }

    private warmupGraphics(): void {
        this.ctx.save();
        this.ctx.translate(-5000, -5000);
        this.uiRenderer.drawScoreUI(0);
        this.uiRenderer.drawSelectedNameUI(1280, 'WARMUP');
        this.ctx.restore();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        console.log('[Графическое Ядро]: Полное послойное расщепление компонентов базы завершено успешно.');
    }

    /**
     * ГЛАВНЫЙ СЖАТЫЙ КОНВЕЙЕР СБОРКИ КАДРА ПО КЛАВИШЕ ОТЛАДКИ KEYK
     */
    public render(state: GameState, camera: CameraSystem, interfaceService: InterfaceService): void {
        const scrWidth = this.canvas.width;
        const scrHeight = this.canvas.height;

        this.environmentRenderer.clearScreen(scrWidth, scrHeight);

        this.ctx.save();
        this.ctx.translate(-camera.x, -camera.y);

        this.environmentRenderer.drawGrid(1600, 1200);
        this.environmentRenderer.drawBasePerimeter(1600);
        
        const selectedEntity = interfaceService.activeController?.getEntity() || null;

        // СЛОЙ ОТЛАДКИ: Если активирован дебаг-режим (по клавише K), рендерим закрашенные квадраты и пути БПЛА
        if (state.isDebugMode || state.isWaveDebugMode) {
            this.debugRenderer.draw(
                state.enemySwarm.invaders, 
                state.enemySwarm.routeManager.getDiscoveredHazards(),
                state.enemySwarm.spawnNodes,
                state.isDebugMode,          // Передаем флаг кнопки K
                state.isWaveDebugMode       // Передаем флаг кнопки L
            );
        }

        // СЛОЙ 1: ИНФРАСТРУКТУРА БАЗЫ (Рендерится поштучно в зависимости от типа бункера)
        state.player.buildings.forEach(building => {
            if (building.type === 'POWER') this.powerNodeRenderer.draw(building);
            else if (building.type === 'REPAIR') this.repairBayRenderer.draw(building);
            else if (building.type === 'HARVESTER') this.resourceHarvesterRenderer.draw(building);
        });

        // СЛОЙ 2: СТАНЦИИ РЛС ИГРОКА
        state.player.radars.forEach(radar => {
            this.radarRenderer.draw(radar, selectedEntity);
        });

        // СЛОЙ 3: БАТАРЕИ ПВО ИГРОКА
        state.player.turrets.forEach(turret => {
            this.turretRenderer.draw(turret, selectedEntity);
        });
        
        // СЛОЙ 4: ВРАЖЕСКИЙ РОЙ КАМИКАДЗЕ
        this.invaderRenderer.drawAll(state.enemySwarm.invaders);

        if (state.player.placement.currentBuildType && !state.isGameOver) {
            this.uiRenderer.drawGhostBuilding(
                state.player.placement.currentBuildType, 
                interfaceService.worldMouse.x, 
                interfaceService.worldMouse.y
            );
        }

        this.ctx.restore();

        this.uiRenderer.drawShopUI(scrWidth, scrHeight, state.isPaused && !state.isGameOver);

        if (selectedEntity) {
            this.uiRenderer.drawSelectedNameUI(scrWidth, selectedEntity.name);
        }

        this.uiRenderer.drawScoreUI(state.score);

        // Индикатор отладки на экране HUD по вашей кнопке K
        if (state.isDebugMode) {
            this.ctx.fillStyle = '#39d353';
            this.ctx.font = 'bold 12px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(' СИСТЕМА ДЕБАГА ИИ: СЕТКА А* АКТИВНА (КЛАВИША K) ', 20, 30);
        }

        if (state.isGameOver) {
            const powerNodes = state.player.buildings.filter(b => b.type === 'POWER');
            const allPowerDestroyed = powerNodes.every(b => b.isDestroyed);
            
            let reason = 'Все объекты инфраструктуры базы полностью уничтожены.';
            if (allPowerDestroyed) {
                reason = 'Критический сбой: Энергоблок уничтожен. Оборона обесточена.';
            }
            this.uiRenderer.drawGameOverOverlay(scrWidth, scrHeight, reason);
        }

        if (state.isWaveDebugMode) {
            this.ctx.fillStyle = '#f2c744';
            this.ctx.font = 'bold 12px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(' ПОКАДРОВЫЙ АНАЛИЗ ФРОНТА А* АКТИВЕН (КЛАВИША L) ', 20, 50);
        }
    }
}
