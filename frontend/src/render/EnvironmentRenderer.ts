export class EnvironmentRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public clearScreen(width: number, height: number): void {
        this.ctx.clearRect(0, 0, width, height);
    }

    /**
     * Отрисовка фоновой тактической сетки на всю площадь большой карты 1600x1200
     */
    public drawGrid(mapWidth: number, mapHeight: number, gridSize: number = 40): void {
        this.ctx.save();
        this.ctx.strokeStyle = '#1b2028'; // Глубокий радарный оттенок
        this.ctx.lineWidth = 1;

        // Вертикальные линии
        for (let x = 0; x <= mapWidth; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, mapHeight); 
            this.ctx.stroke();
        }

        // Горизонтальные линии
        for (let y = 0; y <= mapHeight; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(mapWidth, y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    /**
     * Охраняемый рубеж базы натянут в самом низу большой карты на Y: 1200
     */
    public drawBasePerimeter(mapWidth: number): void {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 51, 51, 0.25)'; // Красный рубеж тревоги
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 1200);
        this.ctx.lineTo(mapWidth, 1200);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
}