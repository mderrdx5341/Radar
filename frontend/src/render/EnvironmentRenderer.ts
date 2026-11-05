export class EnvironmentRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Полная очистка игрового экрана перед отрисовкой нового кадра
     */
    public clearScreen(width: number, height: number): void {
        this.ctx.clearRect(0, 0, width, height);
    }

    /**
     * Отрисовка фоновой тактической координатной сетки (строго до рубежа Y: 540)
     */
    public drawGrid(width: number, height: number, gridSize: number = 40): void {
        this.ctx.save();
        this.ctx.strokeStyle = '#21262d'; // Тёмно-серый цвет сетки в стиле радара
        this.ctx.lineWidth = 1;

        // Вертикальные линии
        for (let x = 0; x < width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height - 60); // Не заходим на нижнюю панель магазина
            this.ctx.stroke();
        }

        // Горизонтальные линии
        for (let y = 0; y <= 540; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    /**
     * Визуализация охраняемого рубежа базы (линия на Y: 540)
     */
    public drawBasePerimeter(width: number): void {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(240, 246, 252, 0.2)'; // Белая полупрозрачная линия рубежа
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 540);
        this.ctx.lineTo(width, 540);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
}