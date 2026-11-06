import { SimpleTurret } from '../entities/SimpleTurret';

export class TurretRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Отрисовка батареи ПВО с её радиусами и сектором обстрела
     * @param turret Объект турели
     * @param selectedEntity Текущая выбранная сущность в игре (для отрисовки рамки)
     */
    public draw(turret: SimpleTurret, selectedEntity: any): void {
        this.ctx.save();

        // Честный физический угол приводов ствола из памяти турели
        const activeAngle = turret.currentAngle;

        // 1. БОЛЬШОЙ ДАЛЬНОБОЙНЫЙ СЕКТОР (КОНУС) ОБСТРЕЛА (Дальность 70px)
        const fovAngle = Math.PI / 4; // Раскрытие 45 градусов
        this.ctx.beginPath();
        this.ctx.moveTo(turret.x, turret.y);
        this.ctx.arc(
            turret.x, 
            turret.y, 
            turret.attackRange, 
            activeAngle - fovAngle, 
            activeAngle + fovAngle
        );
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(57, 211, 83, 0.02)'; // Мягкая зелёная заливка
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.18)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 2. ПОСТОЯННЫЙ ПОДДСВЕЧЕННЫЙ ВНУТРЕННИЙ КРУГ ОБНАРУЖЕНИЯ (Радиус 45px)
        // Виден всегда, чётко обозначая ближнюю автономную зону зрения ПВО
        this.ctx.beginPath();
        this.ctx.arc(turret.x, turret.y, turret.visionRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(57, 211, 83, 0.03)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.25)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 3. Квадратный корпус турели
        this.ctx.fillStyle = '#238636';
        this.ctx.fillRect(turret.x - 8, turret.y - 8, 16, 16);
        this.ctx.strokeStyle = '#39d353';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(turret.x - 8, turret.y - 8, 16, 16);
            
        // 4. Отрисовка постоянного физического ствола пушки ПВО (Длина 12px)
        const barrelLength = 12;
        const barrelEndX = turret.x + Math.cos(activeAngle) * barrelLength;
        const barrelEndY = turret.y + Math.sin(activeAngle) * barrelLength;

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.moveTo(turret.x, turret.y);
        this.ctx.lineTo(barrelEndX, barrelEndY);
        this.ctx.stroke();

        // 5. Отрисовка боевого лазерного луча
        // Проверяем тригонометрическое совпадение ствола и направления на цель перед вспышкой
        if (turret.currentTarget) {
            const dx = turret.currentTarget.x - turret.x;
            const dy = turret.currentTarget.y - turret.y;
            const targetAngle = Math.atan2(dy, dx);

            let fireDiff = targetAngle - activeAngle;
            while (fireDiff < -Math.PI) fireDiff += Math.PI * 2;
            while (fireDiff > Math.PI) fireDiff -= Math.PI * 2;

            // Лазер бьёт СТРОГО из кончика ствола и только при точной доводке приводов башни
            if (Math.abs(fireDiff) <= 0.15) {
                this.ctx.strokeStyle = '#ff7b72'; // Красный лазер
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(barrelEndX, barrelEndY);
                this.ctx.lineTo(turret.currentTarget.x, turret.currentTarget.y);
                this.ctx.stroke();
            }
        }

        // 6. Отрисовка рамки тактического выбора интерфейса
        if (selectedEntity === turret) {
            this.drawSelectionFrame(turret.x, turret.y, '#39d353');
        }

        this.ctx.restore();
    }

    private drawSelectionFrame(x: number, y: number, color: string): void {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1.5;
        const offset = 14;
        const len = 5;

        // Левый верхний
        this.ctx.beginPath();
        this.ctx.moveTo(x - offset, y - offset + len);
        this.ctx.lineTo(x - offset, y - offset);
        this.ctx.lineTo(x - offset + len, y - offset);
        this.ctx.stroke();

        // Правый верхний
        this.ctx.beginPath();
        this.ctx.moveTo(x + offset, y - offset + len);
        this.ctx.lineTo(x + offset, y - offset);
        this.ctx.lineTo(x + offset - len, y - offset);
        this.ctx.stroke();

        // Левый нижний
        this.ctx.beginPath();
        this.ctx.moveTo(x - offset, y + offset - len);
        this.ctx.lineTo(x - offset, y + offset);
        this.ctx.lineTo(x - offset + len, y + offset);
        this.ctx.stroke();

        // Правый нижний
        this.ctx.beginPath();
        this.ctx.moveTo(x + offset, y + offset - len);
        this.ctx.lineTo(x + offset, y + offset);
        this.ctx.lineTo(x + offset - len, y + offset);
        this.ctx.stroke();
    }
}