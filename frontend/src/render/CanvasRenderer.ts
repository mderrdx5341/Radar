import { SimpleInvader, SimpleRadar, SimpleTurret } from '../entities/SimpleEntities';

export class CanvasRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        const context = this.canvas.getContext('2d');
        
        if (!context) {
            throw new Error('Не удалось получить 2D контекст для Canvas');
        }
        this.ctx = context;
    }

    public render(invaders: SimpleInvader[], radars: SimpleRadar[], turrets: SimpleTurret[]): void {
        this.clearScreen();
        this.drawGrid();
        
        // 1. Отрисовка радаров
        radars.forEach(radar => this.drawRadar(radar));

        // 2. Отрисовка турелей и лазеров
        turrets.forEach(turret => this.drawTurret(turret));

        // 3. Отрисовка врагов
        invaders.forEach(invader => this.drawInvader(invader));
    }

    private clearScreen(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private drawGrid(): void {
        this.ctx.strokeStyle = '#21262d';
        this.ctx.lineWidth = 1;
        const gridSize = 40;

        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    private drawRadar(radar: SimpleRadar): void {
        // Вычисляем стартовый и конечный угол сектора обзора
        const startAngle = radar.angleDir - radar.fov / 2;
        const endAngle = radar.angleDir + radar.fov / 2;

        // Рисуем конус видимости (сектор в 45 градусов)
        this.ctx.beginPath();
        this.ctx.moveTo(radar.x, radar.y); // Начинаем из центра радара
        this.ctx.arc(radar.x, radar.y, radar.visionRadius, startAngle, endAngle);
        this.ctx.closePath();
        
        this.ctx.fillStyle = 'rgba(56, 139, 253, 0.08)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(56, 139, 253, 0.4)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        // Рисуем само здание радара (синий квадрат)
        this.ctx.fillStyle = '#58a6ff';
        this.ctx.fillRect(radar.x - 10, radar.y - 10, 20, 20);

        // Рисуем небольшую стрелочку направления взгляда радара для наглядности
        this.ctx.beginPath();
        this.ctx.moveTo(radar.x, radar.y);
        this.ctx.lineTo(
            radar.x + Math.cos(radar.angleDir) * 15,
            radar.y + Math.sin(radar.angleDir) * 15
        );
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    private drawTurret(turret: SimpleTurret): void {
        // 1. Рисуем пассивный круговой обзор (маленький круг вокруг турели)
        this.ctx.beginPath();
        this.ctx.arc(turret.x, turret.y, turret.visionRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(57, 211, 83, 0.02)'; // Очень прозрачный зеленый
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // 2. Рисуем длинный боевой сектор атаки (конус в 45 градусов)
        const startAngle = turret.angleDir - turret.fov / 2;
        const endAngle = turret.angleDir + turret.fov / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(turret.x, turret.y);
        this.ctx.arc(turret.x, turret.y, turret.attackRange, startAngle, endAngle);
        this.ctx.closePath();
        
        this.ctx.fillStyle = 'rgba(57, 211, 83, 0.05)'; // Чуть более заметный зеленый
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.35)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        // 3. Если есть зафиксированная цель — бьем лазером
        if (turret.currentTarget) {
            this.ctx.beginPath();
            this.ctx.moveTo(turret.x, turret.y);
            this.ctx.lineTo(turret.currentTarget.x, turret.currentTarget.y);
            this.ctx.strokeStyle = '#ff3333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // Само здание турели (зеленый квадрат)
        this.ctx.fillStyle = '#39d353';
        this.ctx.fillRect(turret.x - 10, turret.y - 10, 20, 20);

        // Направляющая ствола орудия
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

    private drawInvader(invader: SimpleInvader): void {
        if (!invader.isVisible || invader.hp <= 0) return;

        this.ctx.beginPath();
        this.ctx.arc(invader.x, invader.y, invader.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ff7b72';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        // Отрисовка полоски здоровья над врагом
        const barWidth = 20;
        const barHeight = 3;
        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillRect(invader.x - barWidth / 2, invader.y - 15, barWidth, barHeight);
        this.ctx.fillStyle = '#39d353';
        this.ctx.fillRect(invader.x - barWidth / 2, invader.y - 15, barWidth * (invader.hp / 100), barHeight);
    }
}