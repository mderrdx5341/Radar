import { SimpleInvader, SimpleRadar, SimpleTurret, SimpleBuilding } from '../entities';
import { EnvironmentRenderer } from './EnvironmentRenderer';
import { UIRenderer } from './UIRenderer';
// Подключаем наши четыре новые расщеплённые графические компонента
import { RadarRenderer } from './RadarRenderer';
import { TurretRenderer } from './TurretRenderer';
import { InvaderRenderer } from './InvaderRenderer';
import { BuildingRenderer } from './BuildingRenderer';

export class CanvasRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    private environmentRenderer: EnvironmentRenderer;
    private uiRenderer: UIRenderer;
    
    // Ссылки на независимые специализированные рендереры
    private radarRenderer: RadarRenderer;
    private turretRenderer: TurretRenderer;
    private invaderRenderer: InvaderRenderer;
    private buildingRenderer: BuildingRenderer;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.imageSmoothingEnabled = false;
        
        // Инициализируем базовые слои среды и интерфейса
        this.environmentRenderer = new EnvironmentRenderer(this.ctx);
        this.uiRenderer = new UIRenderer(this.ctx);

        // Инициализируем расщеплённые боевые компоненты графики
        this.radarRenderer = new RadarRenderer(this.ctx);
        this.turretRenderer = new TurretRenderer(this.ctx);
        this.invaderRenderer = new InvaderRenderer(this.ctx);
        this.buildingRenderer = new BuildingRenderer(this.ctx);

        this.warmupGraphics();
    }

    /**
     * Прогрев контекста GPU для удержания кэша браузера
     */
    private warmupGraphics(): void {
        this.ctx.save();
        this.ctx.translate(-5000, -5000);
        this.uiRenderer.drawScoreUI(0);
        this.uiRenderer.drawSelectedNameUI(1280, 'WARMUP');
        this.ctx.restore();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        console.log('[Графическое Ядро]: Послойный прогрев компонентов рендеринга завершён.');
    }

    /**
     * ГЛАВНЫЙ КОНВЕЙЕР СБОРКИ КАДРА ВИЗУАЛИЗАЦИИ ПОЛЯ БОЯ
     */
    public render(
        invaders: Array<SimpleInvader>, 
        radars: Array<SimpleRadar>, 
        turrets: Array<SimpleTurret>,
        selectedEntity: any,
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

        // 1. Очистка экрана (Слой неба / Задний фон)
        this.environmentRenderer.clearScreen(scrWidth, scrHeight);

        // Постоянное удержание кэша неонового свечения и шрифтов за границами экрана (Защита от фризов)
        this.ctx.save();
        this.ctx.translate(-500, -500);
        const dummyInvader = { x: 0, y: 0, radius: 6, hp: 100, isVisible: true };
        this.ctx.fillStyle = '#f85149';
        this.ctx.fillRect(0, 0, 10, 10);
        this.ctx.restore();

        // 2. Входим в матрицу мировых координат тактической карты (Сдвиг Камеры по WASD)
        this.ctx.save();
        this.ctx.translate(-cameraX, -cameraY);

        // Отрисовка базовой координатной сетки земли и периметра
        this.environmentRenderer.drawGrid(1600, 1200);
        this.environmentRenderer.drawBasePerimeter(1600);
        
        // ПОСЛОЙНЫЙ СБОР КОРРЕКТНЫХ ГРАФИЧЕСКИХ ПЛАСТОВ МИРА
        this.buildingRenderer.drawAll(buildings);                    // Слой 1: Фундаменты зданий
        radars.forEach(radar => {
            this.radarRenderer.draw(radar, selectedEntity);          // Слой 2: Станции РЛС и конусы
        });

        // ИСПРАВЛЕНО: Вызываем метод draw в цикле для каждой турели
        turrets.forEach(turret => {
            this.turretRenderer.draw(turret, selectedEntity);        // Слой 3: Батареи ПВО, стволы, лазеры
        });
        this.invaderRenderer.drawAll(invaders);                       // Слой 4: Вражеский рой камикадзе

        // Если активен режим чертежа — прорисовываем полупрозрачный силуэт-призрак постройки
        if (buildType && !isGameOver) {
            this.uiRenderer.drawGhostBuilding(buildType, ghostX, ghostY);
        }

        this.ctx.restore(); // Выходим из координат игрового мира обратно к плоскости экрана

        // 3. ВЕРХНИЙ СЛОЙ ЭКРАННОГО ИНТЕРФЕЙСА (Фиксированный HUD HUD-магазин)
        this.uiRenderer.drawShopUI(scrWidth, scrHeight, isPaused && !isGameOver);

        if (selectedEntity) {
            this.uiRenderer.drawSelectedNameUI(scrWidth, selectedEntity.name);
        }

        this.uiRenderer.drawScoreUI(score);

        // Оверлей экрана поражения при деструкции инфраструктуры
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