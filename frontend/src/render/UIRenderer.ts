export class UIRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public drawSelectionFrame(x: number, y: number): void {
        this.ctx.save();
        this.ctx.strokeStyle = '#ffffff'; 
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(x - 14, y - 14, 28, 28);
        this.ctx.restore();
    }

    public drawScoreUI(score: number): void {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.85)';
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

    public drawSelectedNameUI(canvasWidth: number, name: string): void {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.85)';
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

    public drawGhostBuilding(type: string, x: number, y: number): void {
        this.ctx.save();
        if (type === 'RADAR') {
            this.ctx.beginPath();
            this.ctx.arc(x, y, 180, -Math.PI/2 - Math.PI/4, -Math.PI/2 + Math.PI/4);
            this.ctx.fillStyle = 'rgba(56, 139, 253, 0.05)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#58a6ff';
            this.ctx.stroke();
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

            this.ctx.fillRect(x - 10, y - 10, 20, 20);
        }
        this.ctx.restore();
    }

    /**
     * Отрисовка нижней HUD-панели магазина с динамической привязкой к низу текущего экрана
     */
    public drawShopUI(canvasWidth: number, canvasHeight: number, isPaused: boolean): void {
        this.ctx.save();
        const shopY = canvasHeight - 60;

        this.ctx.fillStyle = '#161b22';
        this.ctx.fillRect(0, shopY, canvasWidth, 60);
        this.ctx.strokeStyle = '#30363d';
        this.ctx.strokeRect(0, shopY, canvasWidth, 60);

        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // 1. Кнопка РЛС
        this.ctx.fillStyle = '#21262d';
        this.ctx.fillRect(20, shopY + 10, 140, 40);
        this.ctx.strokeStyle = '#8b949e';
        this.ctx.strokeRect(20, shopY + 10, 140, 40);
        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.fillText('1. + РЛС (ЛКМ)', 90, shopY + 30);

        // 2. Кнопка ПВО
        this.ctx.fillStyle = '#21262d';
        this.ctx.fillRect(180, shopY + 10, 140, 40);
        this.ctx.strokeStyle = '#8b949e';
        this.ctx.strokeRect(180, shopY + 10, 140, 40);
        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.fillText('2. + ПВО (ЛКМ)', 250, shopY + 30);

        // 3. НОВАЯ КНОПКА: Тактическая Пауза (X: 340-480)
        // Менят цвет фона с серого на предупреждающий оранжевый, если игра приостановлена
        this.ctx.fillStyle = isPaused ? 'rgba(214, 116, 34, 0.2)' : '#21262d';
        this.ctx.fillRect(340, shopY + 10, 140, 40);
        this.ctx.strokeStyle = isPaused ? '#d67422' : '#8b949e';
        this.ctx.strokeRect(340, shopY + 10, 140, 40);
        this.ctx.fillStyle = isPaused ? '#e38e44' : '#c9d1d9';
        this.ctx.fillText(isPaused ? '▶ ПРОДОЛЖИТЬ' : '⏸ ПАУЗА (Space)', 410, shopY + 30);
        
        this.ctx.restore();

        // Если игра на паузе — выводим крупный красивый оверлей прямо по центру экрана
        if (isPaused) {
            this.drawPauseOverlay(canvasWidth, canvasHeight);
        }
    }

    /**
     * Отрисовка центрального полупрозрачного оверлея паузы
     */
    private drawPauseOverlay(width: number, height: number): void {
        this.ctx.save();
        // Притемняем фон игрового поля
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(0, 0, width, height - 60);

        // Рисуем стильную технологичную рамку
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.9)';
        this.ctx.fillRect(width / 2 - 160, height / 2 - 40, 320, 60);
        this.ctx.strokeStyle = '#d67422';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(width / 2 - 160, height / 2 - 40, 320, 60);

        // Выводим текст
        this.ctx.fillStyle = '#e38e44';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('ТАКТИЧЕСКАЯ ПАУЗА ACTIVATED', width / 2, height / 2 - 10);
        this.ctx.restore();
    }
}