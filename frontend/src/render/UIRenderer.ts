export class UIRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Отрисовка белой рамки вокруг выбранного на карте объекта
     */
    public drawSelectionFrame(x: number, y: number): void {
        this.ctx.save();
        this.ctx.strokeStyle = '#ffffff'; 
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(x - 14, y - 14, 28, 28);
        this.ctx.restore();
    }

    /**
     * Отрисовка счетчика уничтоженных БПЛА (слева сверху)
     */
    public drawScoreUI(score: number): void {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.8)';
        this.ctx.fillRect(20, 20, 180, 40);
        this.ctx.strokeStyle = '#30363d';
        this.ctx.strokeRect(20, 20, 180, 40);

        this.ctx.fillStyle = '#ff7b72'; 
        this.ctx.font = 'bold 13px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`Сбито БПЛА: ${score}`, 35, 40);
        this.ctx.restore();
    }

    /**
     * Отрисовка тактической панели с именем выделенного юнита (справа сверху)
     */
    public drawSelectedNameUI(canvasWidth: number, name: string): void {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.8)';
        this.ctx.fillRect(canvasWidth - 220, 20, 200, 40);
        this.ctx.strokeStyle = '#30363d';
        this.ctx.strokeRect(canvasWidth - 220, 20, 200, 40);

        this.ctx.fillStyle = '#f0f6fc';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(name, canvasWidth - 120, 40);
        this.ctx.restore();
    }

    /**
     * Отрисовка полупрозрачного силуэта-призрака будущей постройки с радиусами действия
     */
    public drawGhostBuilding(type: string, x: number, y: number): void {
        this.ctx.save();
        if (type === 'RADAR') {
            this.ctx.beginPath();
            this.ctx.arc(x, y, 180, -Math.PI/2 - Math.PI/4, -Math.PI/2 + Math.PI/4);
            this.ctx.fillStyle = 'rgba(56, 139, 253, 0.05)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#58a6ff';
            this.ctx.stroke();
            this.ctx.fillStyle = 'rgba(56, 139, 253, 0.4)';
            this.ctx.fillRect(x - 10, y - 10, 20, 20);
        } else if (type === 'TURRET') {
            this.ctx.beginPath();
            this.ctx.arc(x, y, 45, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.3)';
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 70, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.2)';
            this.ctx.stroke();

            this.ctx.fillStyle = 'rgba(57, 211, 83, 0.4)';
            this.ctx.fillRect(x - 10, y - 10, 20, 20);
        }
        this.ctx.restore();
    }

    /**
     * Отрисовка нижней HUD-панели магазина с кнопками постройки
     */
    public drawShopUI(canvasWidth: number): void {
        this.ctx.save();
        this.ctx.fillStyle = '#161b22';
        this.ctx.fillRect(0, 540, canvasWidth, 60);
        this.ctx.strokeStyle = '#30363d';
        this.ctx.strokeRect(0, 540, canvasWidth, 60);

        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Кнопка РЛС
        this.ctx.fillStyle = '#21262d';
        this.ctx.fillRect(20, 550, 140, 40);
        this.ctx.strokeStyle = '#8b949e';
        this.ctx.strokeRect(20, 550, 140, 40);
        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.fillText('1. + РЛС (ЛКМ)', 90, 570);

        // Кнопка ПВО
        this.ctx.fillStyle = '#21262d';
        this.ctx.fillRect(180, 550, 140, 40);
        this.ctx.strokeStyle = '#8b949e';
        this.ctx.strokeRect(180, 550, 140, 40);
        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.fillText('2. + ПВО (ЛКМ)', 250, 570);
        this.ctx.restore();
    }
}