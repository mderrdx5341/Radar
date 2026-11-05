import { SimpleInvader, SimpleRadar, SimpleTurret, SimpleBuilding } from '../entities';


export class EntityRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Отрисовка радара РЛС (пассивный сектор, вращающийся луч и корпус)
     */
    public drawRadar(radar: SimpleRadar): void {
        const startAngle = radar.angleDir - radar.fov / 2;
        const endAngle = radar.angleDir + radar.fov / 2;

        // Пассивный синий конус обзора
        this.ctx.beginPath();
        this.ctx.moveTo(radar.x, radar.y);
        this.ctx.arc(radar.x, radar.y, radar.visionRadius, startAngle, endAngle);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(56, 139, 253, 0.04)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(56, 139, 253, 0.2)';
        this.ctx.stroke();

        // Быстрый неоновый сканирующий луч развёртки
        this.ctx.beginPath();
        this.ctx.moveTo(radar.x, radar.y);
        this.ctx.lineTo(
            radar.x + Math.cos(radar.scanLineAngle) * radar.visionRadius,
            radar.y + Math.sin(radar.scanLineAngle) * radar.visionRadius
        );
        this.ctx.strokeStyle = '#58a6ff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Синий квадратный корпус башни
        this.ctx.fillStyle = '#58a6ff';
        this.ctx.fillRect(radar.x - 10, radar.y - 10, 20, 20);
    }

    /**
     * Отрисовка турели ПВО (пассивный круг, боевой сектор, лазерный огонь и ствол)
     */
    public drawTurret(turret: SimpleTurret): void {
        // Круговой пассивный радиус детекции
        this.ctx.beginPath();
        this.ctx.arc(turret.x, turret.y, turret.visionRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(57, 211, 83, 0.02)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.15)';
        this.ctx.stroke();

        const startAngle = turret.angleDir - turret.fov / 2;
        const endAngle = turret.angleDir + turret.fov / 2;

        // Боевой зеленый сектор атаки
        this.ctx.beginPath();
        this.ctx.moveTo(turret.x, turret.y);
        this.ctx.arc(turret.x, turret.y, turret.attackRange, startAngle, endAngle);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(57, 211, 83, 0.05)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.35)';
        this.ctx.stroke();

        // Яркий красный лазерный луч огня по текущей цели
        if (turret.currentTarget) {
            this.ctx.beginPath();
            this.ctx.moveTo(turret.x, turret.y);
            this.ctx.lineTo(turret.currentTarget.x, turret.currentTarget.y);
            this.ctx.strokeStyle = '#ff3333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // Зеленый квадратный корпус башни ПВО
        this.ctx.fillStyle = '#39d353';
        this.ctx.fillRect(turret.x - 10, turret.y - 10, 20, 20);

        // Поворотный ствол пушки ПВО
        this.ctx.beginPath();
        this.ctx.moveTo(turret.x, turret.y);
        this.ctx.lineTo(
            turret.x + Math.cos(turret.angleDir) * 15,
            turret.y + Math.sin(turret.angleDir) * 15
        );
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    /**
     * Отрисовка БПЛА (только если виден) и его HP-бара здоровья
     */
    public drawInvader(invader: SimpleInvader): void {
        if (!invader.isVisible || invader.hp <= 0) return;

        // Красный круг корпуса дрона
        this.ctx.beginPath();
        this.ctx.arc(invader.x, invader.y, invader.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ff7b72';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        // Полоска здоровья (HP Bar) над дроном
        const barWidth = 20;
        const barHeight = 3;
        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillRect(invader.x - barWidth / 2, invader.y - 15, barWidth, barHeight);
        this.ctx.fillStyle = '#39d353';
        this.ctx.fillRect(invader.x - barWidth / 2, invader.y - 15, barWidth * (invader.hp / 100), barHeight);
    }

    public drawBuilding(building: SimpleBuilding): void {
        if (building.isDestroyed) {
            // Если здание взорвано, рисуем темный остов руин
            this.ctx.save();
            this.ctx.fillStyle = '#21262d';
            this.ctx.strokeStyle = '#30363d';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(building.x, building.y, building.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Символический красный крест разрушения
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

        this.ctx.save();

        // Выбираем тактический цвет в зависимости от типа инфраструктурного узла
        let buildingColor = '#58a6ff'; // Синий для Энергоблока
        if (building.type === 'REPAIR') buildingColor = '#39d353'; // Зеленый для Ремонта
        if (building.type === 'HARVESTER') buildingColor = '#f2c744'; // Золотой для Шахты

        // 1. Отрисовка мощного корпуса здания (Восьмиугольный защищенный бункер)
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.9)'; // Темный прочный центр
        this.ctx.strokeStyle = buildingColor; // Цветная неоновая окантовка типа
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

        // Тонкое внутреннее ядро здания
        this.ctx.fillStyle = buildingColor;
        this.ctx.beginPath();
        this.ctx.arc(building.x, building.y, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // 2. ОТРИСОВКА КРУПНОГО HP-БАРА (Над бункером, высота Y - 35)
        const barWidth = 44;
        const barHeight = 4;
        const barX = building.x - barWidth / 2;
        const barY = building.y - building.radius - 12;

        // Красная подложка потерянного здоровья
        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Зеленая полоса текущей прочности
        const hpPercentage = building.hp / building.maxHp;
        this.ctx.fillStyle = hpPercentage > 0.4 ? '#39d353' : '#f2c744'; // Переходит в желтый при падении
        this.ctx.fillRect(barX, barY, barWidth * hpPercentage, barHeight);

        // Черная рамка-окантовка полоски
        this.ctx.strokeStyle = '#0d1117';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Текстовая подпись имени узла под баром
        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(building.name, building.x, building.y + building.radius + 6);

        this.ctx.restore();
    }
}