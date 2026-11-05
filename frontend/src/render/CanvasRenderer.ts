import { SimpleInvader, SimpleRadar, SimpleTurret } from '../entities';
import { EnvironmentRenderer } from './EnvironmentRenderer';
import { EntityRenderer } from './EntityRenderer';
import { UIRenderer } from './UIRenderer';

export class CanvasRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    
    // Три изолированных рендерера для компонентных слоев сцены
    private environmentRenderer: EnvironmentRenderer;
    private entityRenderer: EntityRenderer;
    private uiRenderer: UIRenderer;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        const context = this.canvas.getContext('2d');
        
        if (!context) {
            throw new Error('Не удалось получить 2D контекст для Canvas');
        }
        this.ctx = context;
        
        // Передаем общий графический контекст во все подсистемы
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
        discoveredTurrets: SimpleTurret[]
    ): void {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // СЛОЙ 1: Статическое окружение и тактическая сетка
        this.environmentRenderer.clearScreen(width, height);
        this.environmentRenderer.drawGrid(width, height);
        this.environmentRenderer.drawBasePerimeter(width);
        
        // СЛОЙ 2: Боевые и разведывательные юниты на карте
        radars.forEach(radar => {
            this.entityRenderer.drawRadar(radar);
            if (selectedEntity === radar) this.uiRenderer.drawSelectionFrame(radar.x, radar.y);
        });

        turrets.forEach(turret => {
            this.entityRenderer.drawTurret(turret);
            if (selectedEntity === turret) this.uiRenderer.drawSelectionFrame(turret.x, turret.y);
        });

        invaders.forEach(invader => {
            this.entityRenderer.drawInvader(invader);
        });

        // С СЛОЙ 3: Пользовательский интерфейс и HUD
        if (buildType) {
            this.uiRenderer.drawGhostBuilding(buildType, ghostX, ghostY);
        }

        this.uiRenderer.drawShopUI(width);

        if (selectedEntity) {
            this.uiRenderer.drawSelectedNameUI(width, selectedEntity.name);
        }

        this.uiRenderer.drawScoreUI(score);
    }
}