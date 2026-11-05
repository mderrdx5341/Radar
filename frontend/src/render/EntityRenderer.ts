import { SimpleInvader, SimpleRadar, SimpleTurret } from '../entities';

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
}