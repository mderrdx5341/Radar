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

        // КРИТИЧЕСКИЙ ФИКС ЛАГА: Прогреваем графический контекст Canvas API при старте
        this.warmupGraphics();
    }

    /**
     * Технологический холостой прогон отрисовки для кэширования шейдеров, лазеров и шрифтов
     */
    private warmupGraphics(): void {
        this.ctx.save();
        // Сдвигаем контекст далеко в невидимую зону за пределы экрана
        this.ctx.translate(-5000, -5000);

        // 1. Прогреваем шрифты и ХУД
        this.uiRenderer.drawScoreUI(0);
        this.uiRenderer.drawSelectedNameUI(1280, 'ТЕСТ_РЛС');

        // 2. Имитируем тестовые сущности для кэширования неонового свечения (shadowBlur)
        const dummyInvader = new (class {
            public x = 0; public y = 0; public radius = 6;
            public hp = 100; public isVisible = true;
            public visibilityTimer = 1000;
        })();

        // Вхолостую рендерим графику дрона и ПВО, принуждая GPU создать кэш
        this.entityRenderer.drawInvader(dummyInvader as any);
        
        this.ctx.restore();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        console.log('[Графическое Ядро]: Первичный прогрев шейдеров и контекста GPU успешно завершён.');
    }

    public render(
        invaders: Array<SimpleInvader>, 
        radars: Array<SimpleRadar>, 
        turrets: Array<SimpleTurret>,
        selectedEntity: SimpleRadar | SimpleTurret | null,
        buildType: string | null,
        ghostX: number, 
        ghostY: number, 
        score: number,
        discoveredTurrets: Array<SimpleTurret>,
        cameraX: number,
        cameraY: number,
        isPaused: boolean,
        buildings: Array<SimpleBuilding>,
        isGameOver: boolean
    ): void {
        const scrWidth = this.canvas.width;
        const scrHeight = this.canvas.height;

        // --- Шаг 1: Очистка экрана ---
        this.environmentRenderer.clearScreen(scrWidth, scrHeight);

        // --- ШАГ 1.5: КРИТИЧЕСКИЙ ФИКС ЦИКЛИЧЕСКОГО ЛАГА (УДЕРЖАНИЕ КЭША GPU) ---
        // Рисуем фейковые невидимые сущности со всеми эффектами за краем экрана,
        // чтобы браузер никогда не выгружал из памяти шейдеры свечения лазеров и шрифты!
        this.ctx.save();
        this.ctx.translate(-500, -500); // Глубоко за экран
        
        // Создаем легкие мок-объекты
        const dummyInvader = { x: 0, y: 0, radius: 6, hp: 100, isVisible: true };
        const dummyTurret = { x: 0, y: 50, radius: 10, name: 'WARMUP', currentTarget: dummyInvader, isVisible: true };
        
        // Вхолостую гоняем отрисовку эффектов лазера и дрона каждый кадр
        this.entityRenderer.drawInvader(dummyInvader as any);
        this.entityRenderer.drawTurret(dummyTurret as any);
        this.ctx.restore();
        // -----------------------------------------------------------------------

        // --- Шаг 2: Сдвиг в мировые координаты карты ---
        this.ctx.save();
        this.ctx.translate(-cameraX, -cameraY);

        this.environmentRenderer.drawGrid(1600, 1200);
        this.environmentRenderer.drawBasePerimeter(1600);
        
        radars.forEach(radar => {
            this.entityRenderer.drawRadar(radar);
            if (selectedEntity === radar) this.uiRenderer.drawSelectionFrame(radar.x, radar.y);
        });

        turrets.forEach(turret => {
            this.entityRenderer.drawTurret(turret);
            if (selectedEntity === turret) this.uiRenderer.drawSelectionFrame(turret.x, turret.y);
        });

        buildings.forEach(building => {
            this.entityRenderer.drawBuilding(building);
        });

        invaders.forEach(invader => {
            this.entityRenderer.drawInvader(invader);
        });

        if (buildType && !isGameOver) {
            this.uiRenderer.drawGhostBuilding(buildType, ghostX, ghostY);
        }

        this.ctx.restore();

        // --- Шаг 3: HUD интерфейс экрана ---
        this.uiRenderer.drawShopUI(scrWidth, scrHeight, isPaused && !isGameOver);

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