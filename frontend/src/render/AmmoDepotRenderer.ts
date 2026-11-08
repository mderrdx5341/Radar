import { AmmoDepot } from '../entities/buildings/AmmoDepot';

export class AmmoDepotRenderer {
    private ctx: CanvasRenderingContext2D;
    private readonly buildingColor = '#fbbf24';

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw(building: AmmoDepot): void {
        this.ctx.save();

        if (building.isDestroyed) {
            this.ctx.restore();
            return;
        }

        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.9)';
        this.ctx.strokeStyle = this.buildingColor;
        this.ctx.lineWidth = 3;
        this.ctx.fillRect(building.x - building.radius, building.y - building.radius, building.radius * 2, building.radius * 2);
        this.ctx.strokeRect(building.x - building.radius, building.y - building.radius, building.radius * 2, building.radius * 2);

        this.ctx.fillStyle = this.buildingColor;
        this.ctx.fillRect(building.x - 10, building.y - 4, 20, 3);
        this.ctx.fillRect(building.x - 10, building.y + 3, 20, 3);

        this.drawHealthBar(building);

        // ==========================================
        // НОВЫЙ ГОРИЗОНТАЛЬНЫЙ ИНДИКАТОР НАГРУЗКИ (БЕЗ НАЛОЖЕНИЙ)
        // ==========================================
        const indicatorY = building.y - 50;
        const isOver = building.connectedTurretsCount > building.maxSafeLoad;

        this.ctx.fillStyle = 'rgba(13, 17, 23, 0.75)';
        this.ctx.fillRect(building.x - 20, indicatorY - 7, 40, 12);

        this.ctx.fillStyle = isOver ? '#f59e0b' : '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(building.x - 11, indicatorY - 1, 3.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 10px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${building.connectedTurretsCount}/${building.maxSafeLoad}`, building.x - 4, indicatorY - 1);

        this.ctx.restore();
    }

    private drawHealthBar(building: AmmoDepot): void {
        const barWidth = 44;
        const barHeight = 4;
        const barX = building.x - barWidth / 2;
        const barY = building.y - building.radius - 12;

        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        const maxHp = building.maxHp || 120;
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
