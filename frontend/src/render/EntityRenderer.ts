import { SimpleInvader, SimpleRadar, SimpleTurret, SimpleBuilding } from '../entities';

export class EntityRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Отрисовка радиолокационной станции РЛС и конуса её обзора
     */
    public drawRadar(radar: SimpleRadar): void {
        this.ctx.save();

        // 1. Отрисовка конуса сканирования (Раскрытие 45 градусов: Math.PI / 4)
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
        this.ctx.fillStyle = 'rgba(56, 139, 253, 0.04)';
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

        this.ctx.restore();
    }

    /**
     * Отрисовка батареи ПВО и линии её лазерного огня
     */
/**
     * Отрисовка батареи ПВО с внутренним малым радиусом обзора и большим сектором обстрела
     */
/**
     * Отрисовка батареи ПВО с постоянным отображением автономного круга обнаружения и сектора обстрела
     */
    public drawTurret(turret: SimpleTurret): void {
        this.ctx.save();

        // Получаем текущий физический угол поворота башни из её памяти
        const activeAngle = turret.currentAngle;

        // 1. БОЛЬШОЙ ДАЛЬНОБОЙНЫЙ СЕКТОР (КОНУС) ОБСТРЕЛА (Дальность 70px)
        const fovAngle = Math.PI / 4; // Раскрытие сектора 45 градусов
        this.ctx.beginPath();
        this.ctx.moveTo(turret.x, turret.y);
        this.ctx.arc(
            turret.x, 
            turret.y, 
            turret.attackRange, // 70px
            activeAngle - fovAngle, 
            activeAngle + fovAngle
        );
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(57, 211, 83, 0.02)'; // Мягкая зелёная заливка сектора
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.18)'; // Окантовка конуса
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 2. ИСПРАВЛЕНО: ПОСТОЯННЫЙ ПОДДСВЕЧЕННЫЙ ВНУТРЕННИЙ КРУГ ОБНАРУЖЕНИЯ (Радиус 45px)
        // Теперь он сплошной, мягкий и виден всегда, чётко обозначая автономную зону зрения ПВО
        this.ctx.beginPath();
        this.ctx.arc(turret.x, turret.y, turret.visionRadius, 0, Math.PI * 2); // 45px
        this.ctx.fillStyle = 'rgba(57, 211, 83, 0.03)'; // Лёгкое внутреннее заполнение круга
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.25)'; // Чёткая сплошная зелёная линия контура
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 3. Квадратный корпус турели
        this.ctx.fillStyle = '#238636';
        this.ctx.fillRect(turret.x - 8, turret.y - 8, 16, 16);
        this.ctx.strokeStyle = '#39d353';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(turret.x - 8, turret.y - 8, 16, 16);
            
        // 4. Отрисовка постоянного физического ствола пушки ПВО
        const barrelLength = 12;
        const barrelEndX = turret.x + Math.cos(activeAngle) * barrelLength;
        const barrelEndY = turret.y + Math.sin(activeAngle) * barrelLength;

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.moveTo(turret.x, turret.y);
        this.ctx.lineTo(barrelEndX, barrelEndY);
        this.ctx.stroke();

        // 5. Отрисовка лазерного луча при ведении огня
        if (turret.currentTarget) {
            const dx = turret.currentTarget.x - turret.x;
            const dy = turret.currentTarget.y - turret.y;
            const targetAngle = Math.atan2(dy, dx);

            let fireDiff = targetAngle - activeAngle;
            while (fireDiff < -Math.PI) fireDiff += Math.PI * 2;
            while (fireDiff > Math.PI) fireDiff -= Math.PI * 2;

            if (Math.abs(fireDiff) <= 0.15) {
                this.ctx.strokeStyle = '#ff7b72'; // Красный лазерный луч
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(barrelEndX, barrelEndY);
                this.ctx.lineTo(turret.currentTarget.x, turret.currentTarget.y);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    /**
     * Отрисовка вражеского БПЛА-камикадзе с рамкой захвата и линией жизни
     */
    public drawInvader(invader: SimpleInvader): void {
        // Если дрон уничтожен или полностью скрыт в тумане войны — не рендерим его
        if (invader.hp <= 0 || !invader.isVisible) return;

        this.ctx.save();
        
        // 1. Рисуем само физическое тело дрона (Красная точка)
        this.ctx.fillStyle = '#f85149';
        this.ctx.beginPath();
        this.ctx.arc(invader.x, invader.y, invader.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ff7b72';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 2. ВОЗВРАЩАЕМ ТАКТИЧЕСКУЮ РАМКУ ЗАХВАТА ЦЕЛИ (Квадрат вокруг БПЛА)
        const size = 12;
        this.ctx.strokeStyle = 'rgba(248, 81, 73, 0.6)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(invader.x - size / 2, invader.y - size / 2, size, size);

        // 3. ВОЗВРАЩАЕМ ЛИНИЮ ЖИЗНИ (HP-БАР) НАД ДРОНОМ
        const barWidth = 18;
        const barHeight = 2;
        const barX = invader.x - barWidth / 2;
        const barY = invader.y - invader.radius - 6;

        // Подложка потерянного здоровья
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);

        // Полоса текущей прочности БПЛА
        const hpPercentage = invader.hp / 100;
        this.ctx.fillStyle = '#39d353'; // Зеленая полоса
        this.ctx.fillRect(barX, barY, barWidth * hpPercentage, barHeight);

        this.ctx.restore();
    }

    /**
     * Отрисовка физического корпуса здания инфраструктуры и полосы его здоровья
     */
    public drawBuilding(building: SimpleBuilding): void {
        this.ctx.save();

        if (building.isDestroyed) {
            this.ctx.fillStyle = '#21262d';
            this.ctx.strokeStyle = '#30363d';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(building.x, building.y, building.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
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

        let buildingColor = '#58a6ff'; 
        if (building.type === 'REPAIR') buildingColor = '#39d353'; 
        if (building.type === 'HARVESTER') buildingColor = '#f2c744'; 

        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.9)'; 
        this.ctx.strokeStyle = buildingColor; 
        this.ctx.lineWidth = 3;
        
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

        this.ctx.fillStyle = buildingColor;
        this.ctx.beginPath();
        this.ctx.arc(building.x, building.y, 8, 0, Math.PI * 2);
        this.ctx.fill();

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

        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(building.name, building.x, building.y + building.radius + 6);

        this.ctx.restore();
    }

    /**
     * Отрисовка траекторий полета БПЛА (для отладки)
     */
    public drawSwarmPaths(invaders: Array<SimpleInvader>): void {
        this.ctx.save();
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash(Array.of(4, 4)); 

        invaders.forEach(invader => {
            if (invader.hp <= 0 || !invader.waypoints || invader.waypoints.length === 0) return;

            this.ctx.strokeStyle = invader.isVisible 
                ? 'rgba(255, 123, 114, 0.4)'  
                : 'rgba(240, 246, 252, 0.08)'; 

            this.ctx.beginPath();
            this.ctx.moveTo(invader.x, invader.y);

            invader.waypoints.forEach(wp => {
                this.ctx.lineTo(wp.x, wp.y);
            });
            this.ctx.stroke();
        });

        this.ctx.restore();
    }
}