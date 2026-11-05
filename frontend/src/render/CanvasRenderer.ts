import { SimpleInvader, SimpleRadar, SimpleTurret, SimpleBuilding } from '../entities';
import { EnvironmentRenderer } from './EnvironmentRenderer';
import { EntityRenderer } from './EntityRenderer';
import { UIRenderer } from './UIRenderer';

export class CanvasRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    
    private environmentRenderer: EnvironmentRenderer;
    private entityRenderer: EntityRenderer;
    private uiRenderer: UIRenderer;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.imageSmoothingEnabled = false;
        
        this.environmentRenderer = new EnvironmentRenderer(this.ctx);
        this.entityRenderer = new EntityRenderer(this.ctx);
        this.uiRenderer = new UIRenderer(this.ctx);
    }

    public render(
        invaders: SimpleInvader[], 
        radars: SimpleRadar[], 
        turrets: SimpleTurret[],
        selectedEntity: SimpleRadar | SimpleTurret | null,
        buildType: string | null,
        ghostX: number, 
        ghostY: number, 
        score: number,
        discoveredTurrets: SimpleTurret[],
        cameraX: number,
        cameraY: number,
        isPaused: boolean,
        buildings: SimpleBuilding[], // ПРИНЯТО: Список объектов инфраструктуры
        isGameOver: boolean
    ): void {
        const scrWidth = this.canvas.width;
        const scrHeight = this.canvas.height;

        this.environmentRenderer.clearScreen(scrWidth, scrHeight);

        // --- СДВИГ В ПРОСТРАНСТВО КАРТЫ ---
        this.ctx.save();
        this.ctx.translate(-cameraX, -cameraY);

        this.environmentRenderer.drawGrid(1600, 1200);
        this.environmentRenderer.drawBasePerimeter(1600);
        
        // Отрисовка оборонительных юнитов
        radars.forEach(radar => {
            this.entityRenderer.drawRadar(radar);
            if (selectedEntity === radar) this.uiRenderer.drawSelectionFrame(radar.x, radar.y);
        });

        turrets.forEach(turret => {
            this.entityRenderer.drawTurret(turret);
            if (selectedEntity === turret) this.uiRenderer.drawSelectionFrame(turret.x, turret.y);
        });

        // ДЕЛЕГИРОВАНИЕ: Отрисовка физических корпусов зданий на карте
        buildings.forEach(building => {
            this.entityRenderer.drawBuilding(building);
        });

        this.entityRenderer.drawSwarmPaths(invaders);
        
        invaders.forEach(invader => {
            this.entityRenderer.drawInvader(invader);
        });

        if (buildType) {
            this.uiRenderer.drawGhostBuilding(buildType, ghostX, ghostY);
        }

        this.ctx.restore();

        // --- СТАТИЧНЫЙ HUD-ИНТЕРФЕЙС ЭКРАНА ---
        this.uiRenderer.drawShopUI(scrWidth, scrHeight, isPaused);

        if (selectedEntity) {
            this.uiRenderer.drawSelectedNameUI(scrWidth, selectedEntity.name);
        }

        this.uiRenderer.drawScoreUI(score);

        if (isGameOver) {
            const powerNodes = buildings.filter(b => b.type === 'POWER');
            const allPowerDestroyed = powerNodes.every(b => b.isDestroyed);
            
            let reason = 'Все объекты инфраструктуры базы полностью уничтожены.';
            if (allPowerDestroyed) {
                reason = 'Критический сбой: Энергоблок уничтожен. Оборона обесточена.';
            }
            this.uiRenderer.drawGameOverOverlay(scrWidth, scrHeight, reason);
        }
    }
}