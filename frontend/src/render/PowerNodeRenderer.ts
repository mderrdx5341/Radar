import { PowerNode } from '../entities/buildings/PowerNode';

export class PowerNodeRenderer {
    private ctx: CanvasRenderingContext2D;
    private readonly buildingColor = '#58a6ff';

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw(building: PowerNode): void {
        this.ctx.save();

        if (building.isDestroyed) {
            this.ctx.restore();
            return;
        }

        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.9)';
        this.ctx.strokeStyle = this.buildingColor;
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        const corners = 8;
        for (let i = 0; i < corners; i++) {
            const angle = (i * 2 * Math.PI) / corners;
            const bx = building.x + Math.cos(angle) * building.radius;
            const by = building.y + Math.sin(angle) * building.radius;

            if (i === 0) this.ctx.moveTo(bx, by);
            else this.ctx.lineTo(bx, by);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = this.buildingColor;
        this.ctx.beginPath();
        this.ctx.arc(building.x, building.y, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.drawHealthBar(building);

        // ==========================================
        // НОВЫЙ ГОРИЗОНТАЛЬНЫЙ ИНДИКАТОР НАГРУЗКИ (БЕЗ НАЛОЖЕНИЙ)
        // ==========================================
        const indicatorY = building.y - 50; // Единая высота для всего блока
        const isOver = building.connectedRadarsCount > building.maxSafeLoad;

        // 1. Отрисовка аккуратной подложки-плашки для читаемости цифр
        this.ctx.fillStyle = 'rgba(13, 17, 23, 0.75)';
        this.ctx.fillRect(building.x - 20, indicatorY - 7, 40, 12);

        // 2. Рисуем лампочку СЛЕВА (сдвиг на -11 пикселей от центра)
        this.ctx.fillStyle = isOver ? '#ff4444' : '#38bdf8';
        this.ctx.beginPath();
        this.ctx.arc(building.x - 11, indicatorY - 1, 3.5, 0, Math.PI * 2);
        this.ctx.fill();

        // 3. Печатаем цифры СПРАВА (сдвиг вправо, выравнивание по левому краю 'left')
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 10px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${building.connectedRadarsCount}/${building.maxSafeLoad}`, building.x - 4, indicatorY - 1);

        this.ctx.restore();
    }

    private drawHealthBar(building: PowerNode): void {
        const barWidth = 44;
        const barHeight = 4;
        const barX = building.x - barWidth / 2;
        const barY = building.y - building.radius - 12;

        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        const maxHp = building.maxHp || 100;
        const hpPercentage = Math.max(0, Math.min(1, building.hp / maxHp));
        
        this.ctx.fillStyle = hpPercentage > 0.5 ? '#39d353' : '#f2c744';
        this.ctx.fillRect(barX, barY, barWidth * hpPercentage, barHeight);

        this.ctx.strokeStyle = '#0d1117';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);

        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(building.name, building.x, building.y + building.radius + 6);
    }
}
