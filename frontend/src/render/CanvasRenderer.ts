import { GameState, CameraSystem, InterfaceService } from '../services';
import { EnvironmentRenderer } from './EnvironmentRenderer';
import { UIRenderer } from './UIRenderer';
import { RadarRenderer } from './RadarRenderer';
import { TurretRenderer } from './TurretRenderer';
import { InvaderRenderer } from './InvaderRenderer';
import { PowerNodeRenderer } from './PowerNodeRenderer';
import { RepairBayRenderer } from './RepairBayRenderer';
import { ResourceHarvesterRenderer } from './ResourceHarvesterRenderer';

export class CanvasRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private environmentRenderer: EnvironmentRenderer;
    private uiRenderer: UIRenderer;
    
    private radarRenderer: RadarRenderer;
    private turretRenderer: TurretRenderer;
    private invaderRenderer: InvaderRenderer;
    
    private powerNodeRenderer: PowerNodeRenderer;
    private repairBayRenderer: RepairBayRenderer;
    private resourceHarvesterRenderer: ResourceHarvesterRenderer;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.imageSmoothingEnabled = false;
        
        this.environmentRenderer = new EnvironmentRenderer(this.ctx);
        this.uiRenderer = new UIRenderer(this.ctx);

        this.radarRenderer = new RadarRenderer(this.ctx);
        this.turretRenderer = new TurretRenderer(this.ctx);
        this.invaderRenderer = new InvaderRenderer(this.ctx);

        this.powerNodeRenderer = new PowerNodeRenderer(this.ctx);
        this.repairBayRenderer = new RepairBayRenderer(this.ctx);
        this.resourceHarvesterRenderer = new ResourceHarvesterRenderer(this.ctx);

        this.warmupGraphics();
    }

    private warmupGraphics(): void {
        this.ctx.save();
        this.ctx.translate(-5000, -5000);
        this.uiRenderer.drawScoreUI(0);
        this.uiRenderer.drawSelectedNameUI(1280, 'WARMUP');
        this.ctx.restore();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        console.log('[Графическое Ядро]: Сборка слоёв переведена на объектный контракт.');
    }

    /**
     * СЖАТЫЙ КОНВЕЙЕР СБОРКИ КАДРА
     * Принимает всего 3 комплексных системных объекта вместо 14 параметров!
     */
    public render(state: GameState, camera: CameraSystem, interfaceService: InterfaceService): void {
        const scrWidth = this.canvas.width;
        const scrHeight = this.canvas.height;

        // 1. Очистка экрана (Слой неба / Задний фон)
        this.environmentRenderer.clearScreen(scrWidth, scrHeight);

        // 2. Входим в матрицу мировых координат тактической карты (Камера)
        this.ctx.save();
        this.ctx.translate(-camera.x, -camera.y);

        // Отрисовка координатной сетки земли
        this.environmentRenderer.drawGrid(1600, 1200);
        this.environmentRenderer.drawBasePerimeter(1600);
        
        // Извлекаем выбранную сущность из абстрактного контроллера для отрисовки рамок
        const selectedEntity = interfaceService.activeController?.getEntity() || null;

        // СЛОЙ 1: ИНФРАСТРУКТУРА БАЗЫ (Извлекаем из state.player)
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
        
        // СЛОЙ 4: ВРАЖЕСКИЙ РОЙ КАМИКАДЗЕ (Извлекаем напрямую из фракции state.enemySwarm!)
        this.invaderRenderer.drawAll(state.enemySwarm.invaders);

        // Если активен режим чертежа — рисуем полупрозрачный призрак из данных interfaceService
        const buildType = state.player.placement.currentBuildType;
        if (buildType && !state.isGameOver) {
            this.uiRenderer.drawGhostBuilding(
                buildType, 
                interfaceService.worldMouse.x, 
                interfaceService.worldMouse.y
            );
        }

        this.ctx.restore(); // Выходим к плоскости экрана

        // 3. ВЕРХНИЙ СЛОЙ ЭКРАННОГО ИНТЕРФЕЙСА HUD
        this.uiRenderer.drawShopUI(scrWidth, scrHeight, state.isPaused && !state.isGameOver);

        if (selectedEntity) {
            this.uiRenderer.drawSelectedNameUI(scrWidth, selectedEntity.name);
        }

        this.uiRenderer.drawScoreUI(state.score);

        // Оверлей экрана поражения
        if (state.isGameOver) {
            const powerNodes = state.player.buildings.filter(b => b.type === 'POWER');
            const allPowerDestroyed = powerNodes.every(b => b.isDestroyed);
            
            let reason = 'Все объекты инфраструктуры базы полностью уничтожены.';
            if (allPowerDestroyed) {
                reason = 'Критический сбой: Энергоблок уничтожен. Оборона обесточена.';
            }
            this.uiRenderer.drawGameOverOverlay(scrWidth, scrHeight, reason);
        }
    }
}
