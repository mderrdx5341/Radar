import { SimpleBuilding } from '../entities/buildings/SimpleBuilding';

export class BuildingRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Отрисовка всех объектов инфраструктуры базы игрока
     */
    public drawAll(buildings: Array<SimpleBuilding>): void {
        buildings.forEach(building => {
            this.ctx.save();

            // Сценарий 1: Здание полностью разрушено камикадзе
            if (building.isDestroyed) {
                this.ctx.fillStyle = '#21262d';
                this.ctx.strokeStyle = '#30363d';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(building.x, building.y, building.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Рисуем красный крест поверх руин
                this.ctx.strokeStyle = '#ff4444';
                this.ctx.beginPath();
                this.ctx.moveTo(building.x - 10, building.y - 10);
                this.ctx.lineTo(building.x + 10, building.y + 10);
                this.ctx.moveTo(building.x + 10, building.y - 10);
                this.ctx.lineTo(building.x - 10, building.y + 10);
                this.ctx.stroke();
                this.ctx.restore();
                return;
            }

            // Сценарий 2: Здание функционирует. Определяем его неоновый цвет
            let buildingColor = '#58a6ff'; // Синий для Энергоблока
            if (building.type === 'REPAIR') buildingColor = '#39d353'; // Зелёный для Ремонтного депо
            if (building.type === 'HARVESTER') buildingColor = '#f2c744'; // Золотой для Шахты

            this.ctx.fillStyle = 'rgba(22, 27, 34, 0.9)'; 
            this.ctx.strokeStyle = buildingColor; 
            this.ctx.lineWidth = 3;
            
            // Математически честная отрисовка восьмиугольного купола бункера
            this.ctx.beginPath();
            const corners = 8;
            for (let i = 0; i < corners; i++) {
                const angle = (i * 2 * Math.PI) / corners;
                const bx = building.x + Math.cos(angle) * building.radius;
                const by = building.y + Math.sin(angle) * building.radius;
                
                if (i === 0) {
                    this.ctx.moveTo(bx, by);
                } else {
                    this.ctx.lineTo(bx, by);
                }
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

            // Центральное ядро строения
            this.ctx.fillStyle = buildingColor;
            this.ctx.beginPath();
            this.ctx.arc(building.x, building.y, 8, 0, Math.PI * 2);
            this.ctx.fill();

            // Отрисовка полосы прочности здания
            const barWidth = 44;
            const barHeight = 4;
            const barX = building.x - barWidth / 2;
            const barY = building.y - building.radius - 12;

            // Красная подложка потерянного здоровья
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);

            // Зелёный или жёлтый индикатор текущего здоровья
            const hpPercentage = building.hp / building.maxHp;
            this.ctx.fillStyle = hpPercentage > 0.4 ? '#39d353' : '#f2c744'; 
            this.ctx.fillRect(barX, barY, barWidth * hpPercentage, barHeight);

            this.ctx.strokeStyle = '#0d1117';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(barX, barY, barWidth, barHeight);

            // Текстовая подпись названия объекта
            this.ctx.fillStyle = '#c9d1d9';
            this.ctx.font = '10px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(building.name, building.x, building.y + building.radius + 6);

            this.ctx.restore();
        });
    }
}