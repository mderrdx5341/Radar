import { SimpleBuilding } from '../entities/buildings/SimpleBuilding';

export class PowerNodeRenderer {
    private ctx: CanvasRenderingContext2D;
    private readonly buildingColor = '#58a6ff'; // Фирменный неоновый синий цвет энергии

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw(building: SimpleBuilding): void {
        this.ctx.save();

        // Сценарий 1: Объект полностью уничтожен роем камикадзе
        if (building.isDestroyed) {
            this.drawDestroyedState(building);
            this.ctx.restore();
            return;
        }

        // Сценарий 2: Объект функционирует в энергосети базы
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.9)';
        this.ctx.strokeStyle = this.buildingColor;
        this.ctx.lineWidth = 3;

        // Построение геометрии купола (восьмиугольник)
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

        // Энергетическое ядро генератора
        this.ctx.fillStyle = this.buildingColor;
        this.ctx.beginPath();
        this.ctx.arc(building.x, building.y, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Отрисовка тактического интерфейса прочности (HP-бар)
        this.drawHealthBar(building);

        this.ctx.restore();
    }

    private drawDestroyedState(building: SimpleBuilding): void {
        this.ctx.fillStyle = '#21262d';
        this.ctx.strokeStyle = '#30363d';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(building.x, building.y, building.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Красный крест поверх руин обесточенного блока
        this.ctx.strokeStyle = '#ff4444';
        this.ctx.beginPath();
        this.ctx.moveTo(building.x - 10, building.y - 10);
        this.ctx.lineTo(building.x + 10, building.y + 10);
        this.ctx.moveTo(building.x + 10, building.y - 10);
        this.ctx.lineTo(building.x - 10, building.y + 10);
        this.ctx.stroke();
    }

    private drawHealthBar(building: SimpleBuilding): void {
        const barWidth = 44;
        const barHeight = 4;
        const barX = building.x - barWidth / 2;
        const barY = building.y - building.radius - 12;

        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        const hpPercentage = building.hp / building.maxHp;
        this.ctx.fillStyle = hpPercentage > 0.4 ? '#39d353' : '#f2c744';
        this.ctx.fillRect(barX, barY, barWidth * hpPercentage, barHeight);

        this.ctx.strokeStyle = '#0d1117';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Подпись имени строения
        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(building.name, building.x, building.y + building.radius + 6);
    }
}
