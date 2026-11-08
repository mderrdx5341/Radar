import { GameState, CameraSystem, InterfaceService } from '../services';
import { EnvironmentRenderer } from './EnvironmentRenderer';
import { UIRenderer } from './UIRenderer';
import { RadarRenderer } from './RadarRenderer';
import { TurretRenderer } from './TurretRenderer';
import { InvaderRenderer } from './InvaderRenderer';
import { PowerNodeRenderer } from './PowerNodeRenderer';
import { RepairBayRenderer } from './RepairBayRenderer';
import { ResourceHarvesterRenderer } from './ResourceHarvesterRenderer';
import { AmmoDepotRenderer } from './AmmoDepotRenderer'; 
import { DebugRenderer } from './DebugRenderer'; 

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
    private ammoDepotRenderer: AmmoDepotRenderer; 
    
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
        
        this.powerNodeRenderer = new PowerNodeRenderer(this.ctx);
        this.repairBayRenderer = new RepairBayRenderer(this.ctx);
        this.resourceHarvesterRenderer = new ResourceHarvesterRenderer(this.ctx);
        this.ammoDepotRenderer = new AmmoDepotRenderer(this.ctx); 
        
        this.debugRenderer = new DebugRenderer(this.ctx);
    }

    public render(state: GameState, camera: CameraSystem, interfaceService: InterfaceService): void {
        // ЖЕСТКАЯ ФИКСАЦИЯ РАЗМЕРОВ ЭКРАНА ДЛЯ ИСКЛЮЧЕНИЯ ВЫЛЕТА КООРДИНАТ UI В NaN
        const scrWidth = this.canvas.width;
        const scrHeight = this.canvas.height;

        this.environmentRenderer.clearScreen(scrWidth, scrHeight);

        this.ctx.save();
        this.ctx.translate(-camera.x, -camera.y);

        this.environmentRenderer.drawGrid(1600, 1200);
        this.environmentRenderer.drawBasePerimeter(1600);
        
        const selectedEntity = interfaceService.activeController?.getEntity() || null;

        // 1. Отрисовка контекстных неоновых радиусов и кабелей снабжения при клике ЛКМ
        if (selectedEntity) {
            this.ctx.save();
            this.ctx.lineWidth = 1.5;

            if (selectedEntity.type === 'POWER') {
                this.ctx.strokeStyle = 'rgba(56, 139, 253, 0.35)';
                this.ctx.beginPath();
                this.ctx.arc(selectedEntity.x, selectedEntity.y, (selectedEntity as any).powerRadius || 300, 0, Math.PI * 2);
                this.ctx.stroke();

                this.ctx.strokeStyle = 'rgba(56, 139, 253, 0.6)';
                this.ctx.setLineDash([4, 4]);
                state.player.radars.forEach((radar: any) => {
                    const distSq = (selectedEntity.x - radar.x) ** 2 + (selectedEntity.y - radar.y) ** 2;
                    if (distSq <= (300 * 300)) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(selectedEntity.x, selectedEntity.y);
                        this.ctx.lineTo(radar.x, radar.y);
                        this.ctx.stroke();
                    }
                });
                
            } else if (selectedEntity.type === 'AMMO_DEPOT') {
                this.ctx.strokeStyle = 'rgba(242, 199, 68, 0.35)';
                this.ctx.beginPath();
                this.ctx.arc(selectedEntity.x, selectedEntity.y, (selectedEntity as any).supplyRadius || 350, 0, Math.PI * 2);
                this.ctx.stroke();

                const a = selectedEntity as any;
                const isOver = a.connectedTurretsCount > a.maxSafeLoad;
                this.ctx.strokeStyle = isOver ? 'rgba(245, 158, 11, 0.7)' : 'rgba(242, 199, 68, 0.6)';
                this.ctx.setLineDash([4, 4]);
                
                state.player.turrets.forEach((turret: any) => {
                    const distSq = (selectedEntity.x - turret.x) ** 2 + (selectedEntity.y - turret.y) ** 2;
                    if (distSq <= (350 * 350)) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(selectedEntity.x, selectedEntity.y);
                        this.ctx.lineTo(turret.x, turret.y);
                        this.ctx.stroke();
                    }
                });
                
            } else if (selectedEntity.type === 'REPAIR') {
                this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.35)';
                this.ctx.beginPath();
                this.ctx.arc(selectedEntity.x, selectedEntity.y, (selectedEntity as any).repairRadius || 200, 0, Math.PI * 2);
                this.ctx.stroke();

                this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.5)';
                this.ctx.setLineDash([4, 4]);
                state.player.buildings.forEach((b: any) => {
                    if (b === selectedEntity || b.type === 'REPAIR' || b.isDestroyed) return;
                    const maxLimit = b.maxHp || 100;
                    if (b.hp < maxLimit) {
                        const distSq = (selectedEntity.x - b.x) ** 2 + (selectedEntity.y - b.y) ** 2;
                        if (distSq <= (200 * 200)) {
                            this.ctx.beginPath();
                            this.ctx.moveTo(selectedEntity.x, selectedEntity.y);
                            this.ctx.lineTo(b.x, b.y);
                            this.ctx.stroke();
                        }
                    }
                });
            }
            this.ctx.restore();
        }

        // 2. Слой ИИ отладки фронта (Клавиши K и L)
        if (state.isDebugMode || state.isWaveDebugMode) {
            this.debugRenderer.draw(
                state.enemySwarm.invaders, 
                state.enemySwarm.routeManager.getDiscoveredHazards(),
                state.enemySwarm.spawnNodes,
                state.isDebugMode,
                state.isWaveDebugMode
            );
        }

        // 3. Покомпонентная чистая отрисовка инфраструктуры построек базы
        state.player.buildings.forEach((building: any) => {
            if (building.type === 'POWER') this.powerNodeRenderer.draw(building);
            else if (building.type === 'REPAIR') this.repairBayRenderer.draw(building);
            else if (building.type === 'AMMO_DEPOT') this.ammoDepotRenderer.draw(building);
            else if (building.type === 'HARVESTER') this.resourceHarvesterRenderer.draw(building);
        });
        
        // 4. Отрисовка радарных станций
        state.player.radars.forEach((radar: any) => {
            this.radarRenderer.draw(radar, selectedEntity);
        });

        // 5. Отрисовка пушек ПВО с HUD-счётчиками патронов
        state.player.turrets.forEach((turret: any) => {
            this.turretRenderer.draw(turret, selectedEntity);
        });
        
        // 6. Отрисовка роя БПЛА камикадзе
        this.invaderRenderer.drawAll(state.enemySwarm.invaders);

        // 7. Отрисовка призрака чертежа за курсором мыши
        if (state.player.placement.currentBuildType && !state.isGameOver) {
            this.uiRenderer.drawGhostBuilding(
                state.player.placement.currentBuildType, 
                interfaceService.worldMouse.x, 
                interfaceService.worldMouse.y
            );
        }

        this.ctx.restore();

        // =============================================================
        // 4. СЛОЙ ИНТЕРФЕЙСА HUD С СИНХРОНИЗИРОВАННЫМИ ПАРАМЕТРАМИ РАЗМЕРОВ
        // =============================================================
        // Отрисовка нижнего магазина кнопок (ужатого под сайдбар)
        this.uiRenderer.drawShopUI(scrWidth, scrHeight, state.isPaused && !state.isGameOver);

        // СБОРКА ИСПРАВЛЕНА: Прокидываем размеры и состояние в правый Sidebar телеметрии!
        this.uiRenderer.drawRightTelemetrySidebar(scrWidth, scrHeight, state);

        if (selectedEntity) {
            this.uiRenderer.drawSelectedNameUI(scrWidth, selectedEntity.name);
        }

        this.uiRenderer.drawScoreUI(state.score);

        if (state.isWaveDebugMode) {
            this.ctx.fillStyle = '#f2c744';
            this.ctx.font = 'bold 12px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(' ПОКАДРОВЫЙ АНАЛИЗ ФРОНТА А* АКТИВЕН (КЛАВИША L) ', 20, 50);
        }

        // Отреставрированный баннер паузы по центру сверху
        if (state.isPaused && !state.isGameOver) {
            this.uiRenderer.drawPauseOverlay(scrWidth, scrHeight);
        }

        if (state.isGameOver) {
            this.uiRenderer.drawGameOverOverlay(scrWidth, scrHeight, 'Критический сбой инфраструктуры.');
        }
    }
}
