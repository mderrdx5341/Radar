import { SimpleRadar } from '../entities/SimpleRadar';

export class RadarRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Отрисовка станции РЛС и стабильного конуса обзора без изломов Canvas API
     */
    public draw(radar: SimpleRadar, selectedEntity: any): void {
        this.ctx.save();

        const activeAngle = radar.currentAngle;
        const fovAngle = Math.PI / 4; // Сектор раскрытия 45 градусов в каждую сторону

        // Расчет крайних точек радарного веера
        const startAngle = activeAngle - fovAngle;
        const endAngle = activeAngle + fovAngle;

        // ЖЕСТКИЙ ГРАФИЧЕСКИЙ ФИКС: Строим честный замкнутый треугольный сектор
        this.ctx.beginPath();
        this.ctx.moveTo(radar.x, radar.y); // Стартуем строго из центра ядра РЛС
        
        // Линия к началу дуги конуса
        this.ctx.lineTo(
            radar.x + Math.cos(startAngle) * radar.visionRadius,
            radar.y + Math.sin(startAngle) * radar.visionRadius
        );
        
        // Рисуем саму дугу окружности конуса
        this.ctx.arc(radar.x, radar.y, radar.visionRadius, startAngle, endAngle, false);
        
        // Замыкаем путь обратно в центральную точку
        this.ctx.lineTo(radar.x, radar.y);
        this.ctx.closePath();

        // Мягкая заливка радарного поля
        this.ctx.fillStyle = 'rgba(56, 139, 253, 0.04)'; 
        this.ctx.fill();
        
        // Яркая окантовка конуса обзора
        this.ctx.strokeStyle = 'rgba(56, 139, 253, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 2. Рисуем квадратный корпус фундамента РЛС
        this.ctx.fillStyle = '#1f6feb';
        this.ctx.fillRect(radar.x - 8, radar.y - 8, 16, 16);
        this.ctx.strokeStyle = '#58a6ff';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(radar.x - 8, radar.y - 8, 16, 16);

        // 3. Рисуем белую поворотную стрелку направления приводов РЛС
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(radar.x, radar.y);
        this.ctx.lineTo(
            radar.x + Math.cos(activeAngle) * 12,
            radar.y + Math.sin(activeAngle) * 12
        );
        this.ctx.stroke();

        // 4. Отрисовка рамки тактического выбора интерфейса
        if (selectedEntity === radar) {
            this.drawSelectionFrame(radar.x, radar.y, '#58a6ff');
        }

        this.ctx.restore();
    }

    private drawSelectionFrame(x: number, y: number, color: string): void {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1.5;
        const offset = 14;
        const len = 5;

        // Левый верхний угол
        this.ctx.beginPath();
        this.ctx.moveTo(x - offset, y - offset + len);
        this.ctx.lineTo(x - offset, y - offset);
        this.ctx.lineTo(x - offset + len, y - offset);
        this.ctx.stroke();

        // Правый верхний угол
        this.ctx.beginPath();
        this.ctx.moveTo(x + offset, y - offset + len);
        this.ctx.lineTo(x + offset, y - offset);
        this.ctx.lineTo(x + offset - len, y - offset);
        this.ctx.stroke();

        // Левый нижний угол
        this.ctx.beginPath();
        this.ctx.moveTo(x - offset, y + offset - len);
        this.ctx.lineTo(x - offset, y + offset);
        this.ctx.lineTo(x - offset + len, y + offset);
        this.ctx.stroke();

        // Правый нижний угол
        this.ctx.beginPath();
        this.ctx.moveTo(x + offset, y + offset - len);
        this.ctx.lineTo(x + offset, y + offset);
        this.ctx.lineTo(x + offset - len, y + offset);
        this.ctx.stroke();
    }
}
