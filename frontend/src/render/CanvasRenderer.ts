import { SimpleInvader, SimpleRadar, SimpleTurret } from '../entities';

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

    public render(
        invaders: SimpleInvader[], 
        radars: SimpleRadar[], 
        turrets: SimpleTurret[],
        selectedEntity: SimpleRadar | SimpleTurret | null // Передаем выбранный элемент
    ): void {
        this.clearScreen();
        this.drawGrid();
        
        // 1. Отрисовка радаров
        radars.forEach(radar => {
            this.drawRadar(radar);
            if (selectedEntity === radar) this.drawSelectionFrame(radar.x, radar.y);
        });

        // 2. Отрисовка турелей
        turrets.forEach(turret => {
            this.drawTurret(turret);
            if (selectedEntity === turret) this.drawSelectionFrame(turret.x, turret.y);
        });

        // 3. Отрисовка врагов
        invaders.forEach(invader => this.drawInvader(invader));

        // 4. Отрисовка интерфейса (UI) в правом верхнем углу
        if (selectedEntity) {
            this.drawUI(selectedEntity.name);
        }
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

    /**
     * Рисует красивую неоновую рамку выделения вокруг активного объекта
     */
    private drawSelectionFrame(x: number, y: number): void {
        this.ctx.strokeStyle = '#ffffff'; // Белая неоновая рамка
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([4, 4]); // Делаем рамку пунктирной для эффекта интерфейса
        this.ctx.strokeRect(x - 14, y - 14, 28, 28);
        this.ctx.setLineDash([]); // Сбрасываем пунктир обратно
    }

    /**
     * Выводит имя выбранного элемента в правом верхнем углу
     */
    private drawUI(name: string): void {
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.8)'; // Подложка для текста
        this.ctx.fillRect(this.canvas.width - 220, 20, 200, 40);
        this.ctx.strokeStyle = '#30363d';
        this.ctx.strokeRect(this.canvas.width - 220, 20, 200, 40);

        this.ctx.fillStyle = '#f0f6fc'; // Цвет текста
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(name, this.canvas.width - 120, 40);
    }

    private drawRadar(radar: SimpleRadar): void {
        const startAngle = radar.angleDir - radar.fov / 2;
        const endAngle = radar.angleDir + radar.fov / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(radar.x, radar.y);
        this.ctx.arc(radar.x, radar.y, radar.visionRadius, startAngle, endAngle);
        this.ctx.closePath();
        
        this.ctx.fillStyle = 'rgba(56, 139, 253, 0.04)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(56, 139, 253, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(radar.x, radar.y);
        this.ctx.lineTo(
            radar.x + Math.cos(radar.scanLineAngle) * radar.visionRadius,
            radar.y + Math.sin(radar.scanLineAngle) * radar.visionRadius
        );
        this.ctx.strokeStyle = '#58a6ff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.fillStyle = '#58a6ff';
        this.ctx.fillRect(radar.x - 10, radar.y - 10, 20, 20);
    }

    private drawTurret(turret: SimpleTurret): void {
        this.ctx.beginPath();
        this.ctx.arc(turret.x, turret.y, turret.visionRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(57, 211, 83, 0.02)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.15)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        const startAngle = turret.angleDir - turret.fov / 2;
        const endAngle = turret.angleDir + turret.fov / 2;

        this.ctx.beginPath();
        this.ctx.moveTo(turret.x, turret.y);
        this.ctx.arc(turret.x, turret.y, turret.attackRange, startAngle, endAngle);
        this.ctx.closePath();
        
        this.ctx.fillStyle = 'rgba(57, 211, 83, 0.05)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.35)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        if (turret.currentTarget) {
            this.ctx.beginPath();
            this.ctx.moveTo(turret.x, turret.y);
            this.ctx.lineTo(turret.currentTarget.x, turret.currentTarget.y);
            this.ctx.strokeStyle = '#ff3333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        this.ctx.fillStyle = '#39d353';
        this.ctx.fillRect(turret.x - 10, turret.y - 10, 20, 20);

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

        const barWidth = 20;
        const barHeight = 3;
        this.ctx.fillStyle = '#ff4444';
        this.ctx.fillRect(invader.x - barWidth / 2, invader.y - 15, barWidth, barHeight);
        this.ctx.fillStyle = '#39d353';
        this.ctx.fillRect(invader.x - barWidth / 2, invader.y - 15, barWidth * (invader.hp / 100), barHeight);
    }
}