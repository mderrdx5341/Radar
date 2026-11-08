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
        const scrWidth = this.canvas.width;
        const scrHeight = this.canvas.height;

        this.environmentRenderer.clearScreen(scrWidth, scrHeight);

        this.ctx.save();
        this.ctx.translate(-camera.x, -camera.y);

        this.environmentRenderer.drawGrid(1600, 1200);
        this.environmentRenderer.drawBasePerimeter(1600);
        
        const selectedEntity = interfaceService.activeController?.getEntity() || null;

        // 1. Отрисовка контекстных неоновых радиусов при клике игрока (Без дебага)
        if (selectedEntity) {
            this.ctx.save();
            this.ctx.lineWidth = 1.5;

            if (selectedEntity.type === 'POWER') {
                // А) Мягкий синий радиус действия энергосети
                this.ctx.strokeStyle = 'rgba(56, 139, 253, 0.35)';
                this.ctx.beginPath();
                this.ctx.arc(selectedEntity.x, selectedEntity.y, (selectedEntity as any).powerRadius || 300, 0, Math.PI * 2);
                this.ctx.stroke();

                // Б) Синие ЛЭП-пунктиры ко всем РЛС, которые питаются от этого узла
                this.ctx.strokeStyle = 'rgba(56, 139, 253, 0.6)';
                this.ctx.setLineDash([4, 4]); // Пунктирный неоновый кабель
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
                // А) Жёлтый радиус логистического снабжения патронами
                this.ctx.strokeStyle = 'rgba(242, 199, 68, 0.35)';
                this.ctx.beginPath();
                this.ctx.arc(selectedEntity.x, selectedEntity.y, (selectedEntity as any).supplyRadius || 350, 0, Math.PI * 2);
                this.ctx.stroke();

                // Б) Жёлтые конвейерные нити подвоза патронов к подключенным пушкам ПВО
                const a = selectedEntity as any;
                const isOver = a.connectedTurretsCount > a.maxSafeLoad;
                
                // Если Склад боеприпасов перегружен — нити снабжения мигают оранжевым цветом!
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
                // 1. Зелёный радиус инженерной поддержки рем-зоны
                this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.35)';
                this.ctx.beginPath();
                this.ctx.arc(selectedEntity.x, selectedEntity.y, (selectedEntity as any).repairRadius || 200, 0, Math.PI * 2);
                this.ctx.stroke();

                // 2. Зелёные лучи ремонта ТОЛЬКО к раненым внешним зданиям инфраструктуры
                this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.5)';
                this.ctx.setLineDash([4, 4]); // Пунктирный луч работы
                
                state.player.buildings.forEach((b: any) => {
                    // Исключаем самопочинку (чтобы луч не рисовался внутрь себя) 
                    // и полностью изолируем от соседних рем-блоков по RULE 1!
                    if (b === selectedEntity || b.type === 'REPAIR' || b.isDestroyed) return;
                    
                    // Луч загорается строго тогда, когда здание ранено и инженеры реально работают!
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

        // 2. Слой ИИ дебага (Кнопки K и L)
        if (state.isDebugMode || state.isWaveDebugMode) {
            this.debugRenderer.draw(
                state.enemySwarm.invaders, 
                state.enemySwarm.routeManager.getDiscoveredHazards(),
                state.enemySwarm.spawnNodes,
                state.isDebugMode,
                state.isWaveDebugMode
            );
        }

        // 3. АРХИТЕКТУРНО ЧИСТАЯ ОТРИСОВКА: Каждое здание рисуется строго своим классом
        state.player.buildings.forEach(building => {
            if (building.type === 'POWER') this.powerNodeRenderer.draw(building as any);
            else if (building.type === 'REPAIR') this.repairBayRenderer.draw(building as any);
            else if (building.type === 'AMMO_DEPOT') this.ammoDepotRenderer.draw(building as any);
            else if (building.type === 'HARVESTER') this.resourceHarvesterRenderer.draw(building);
        });
        
        // 4. Боевые единицы игрока
        state.player.radars.forEach(radar => {
            this.radarRenderer.draw(radar, selectedEntity);
        });

        state.player.turrets.forEach(turret => {
            this.turretRenderer.draw(turret, selectedEntity);
        });
        
        // 5. Отрисовка вражеского роя БПЛА
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

        if (state.isPaused && !state.isGameOver) {
            this.uiRenderer.drawPauseOverlay(scrWidth, scrHeight);
        }

        if (state.isWaveDebugMode) {
            this.ctx.fillStyle = '#f2c744';
            this.ctx.font = 'bold 12px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(' ПОКАДРОВЫЙ АНАЛИЗ ФРОНТА А* АКТИВЕН (КЛАВИША L) ', 20, 50);
        }

        if (state.isGameOver) {
            this.uiRenderer.drawGameOverOverlay(scrWidth, scrHeight, 'Критический сбой инфраструктуры.');
        }
    }
}
