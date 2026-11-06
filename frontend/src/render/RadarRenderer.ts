import { SimpleRadar } from '../entities/SimpleRadar';

export class RadarRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Отрисовка конкретной станции РЛС и конуса её обзора
     * @param radar Объект радара
     * @param selectedEntity Текущая выбранная сущность в игре (для отрисовки рамки)
     */
    public draw(radar: SimpleRadar, selectedEntity: any): void {
        this.ctx.save();

        // 1. Отрисовка конуса сканирования (Раскрытие 45 градусов вокруг текущего угла)
        const fovAngle = Math.PI / 4;
        this.ctx.beginPath();
        this.ctx.moveTo(radar.x, radar.y);
        this.ctx.arc(
            radar.x, 
            radar.y, 
            radar.visionRadius, 
            radar.currentAngle - fovAngle, 
            radar.currentAngle + fovAngle
        );
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(56, 139, 253, 0.04)'; // Полупрозрачный синий
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(56, 139, 253, 0.2)';
        this.ctx.stroke();

        // 2. Рисуем сам квадратный корпус РЛС
        this.ctx.fillStyle = '#1f6feb';
        this.ctx.fillRect(radar.x - 8, radar.y - 8, 16, 16);
        this.ctx.strokeStyle = '#58a6ff';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(radar.x - 8, radar.y - 8, 16, 16);

        // 3. Рисуем поворотную стрелку-указатель направления луча
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(radar.x, radar.y);
        this.ctx.lineTo(
            radar.x + Math.cos(radar.currentAngle) * 12,
            radar.y + Math.sin(radar.currentAngle) * 12
        );
        this.ctx.stroke();

        // 4. Отрисовка рамки тактического выбора интерфейса
        if (selectedEntity === radar) {
            this.drawSelectionFrame(radar.x, radar.y, '#58a6ff');
        }

        this.ctx.restore();
    }

    /**
     * Вспомогательный метод отрисовки уголков рамки выделения сущности
     */
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