import { InputManager } from './InputManager';

export class CameraSystem {
    public x: number = 0;
    public y: number = 0;

    private worldWidth: number;
    private worldHeight: number;
    private camSpeed: number = 7;

    // Переменные для вычисления дельты Pan Drag (перетаскивания колёсиком)
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;

    constructor(worldWidth: number, worldHeight: number, canvasWidth: number, canvasHeight: number) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        // Стартовая позиция: центрируем по горизонтали и опускаем в самый низ тыла базы
        this.x = (this.worldWidth - canvasWidth) / 2;
        this.y = this.worldHeight - (canvasHeight - 60);
        this.clamp(canvasWidth, canvasHeight);
    }

    /**
     * Ограничивает движение камеры, чтобы экран не вылетал за пределы стратегической карты 1600x1200
     */
    public clamp(canvasWidth: number, canvasHeight: number): void {
        this.x = Math.max(0, Math.min(this.worldWidth - canvasWidth, this.x));
        this.y = Math.max(0, Math.min(this.worldHeight - (canvasHeight - 60), this.y));
    }

    /**
     * Преобразует ЭКРАННЫЕ координаты курсора мыши (1280x720) в МИРОВЫЕ координаты карты (1600x1200)
     */
    public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }

    /**
     * Основной цикл обновления положения камеры за кадр
     */
    public update(canvasWidth: number, canvasHeight: number, input: InputManager, isGameOver: boolean): void {
        // 1. Скроллинг клавишами WASD (работает всегда, даже на паузе)
        if (input.isKeyDown('KeyW')) this.y -= this.camSpeed;
        if (input.isKeyDown('KeyS')) this.y += this.camSpeed;
        if (input.isKeyDown('KeyA')) this.x -= this.camSpeed;
        if (input.isKeyDown('KeyD')) this.x += this.camSpeed;

        const mousePos = input.getMousePosition();

        // 2. Перетаскивание карты зажатым колёсиком мыши (Pan Drag)
        if (input.isMouseButtonDown(1) && !isGameOver) {
            const dx = mousePos.x - this.lastMouseX;
            const dy = mousePos.y - this.lastMouseY;
            this.x -= dx;
            this.y -= dy;
        }

        // Запоминаем текущие координаты мыши для расчёта дельты на следующем кадре
        this.lastMouseX = mousePos.x;
        this.lastMouseY = mousePos.y;

        // Фиксируем камеру в жестких рамках карты
        this.clamp(canvasWidth, canvasHeight);
    }
}