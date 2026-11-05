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
        selectedEntity: SimpleRadar | SimpleTurret | null,
        buildType: string | null,
        ghostX: number,
        ghostY: number,
        score: number,
        discoveredTurrets: SimpleTurret[] // НОВОЕ: Передаем список турелей, раскрытых роем БПЛА
    ): void {
        this.clearScreen();
        this.drawGrid();
        
        // 1. Отрисовка существующих радаров
        radars.forEach(radar => {
            this.drawRadar(radar);
            if (selectedEntity === radar) this.drawSelectionFrame(radar.x, radar.y);
        });

        // 2. Отрисовка существующих турелей
        turrets.forEach(turret => {
            this.drawTurret(turret);
            if (selectedEntity === turret) this.drawSelectionFrame(turret.x, turret.y);
        });

        // 3. Отрисовка призрака постройки под курсором мыши
        if (buildType) {
            this.drawGhostBuilding(buildType, ghostX, ghostY);
        }

        // ====================================================================
        // ОТЛАДОЧНАЯ ГРАФИКА СКРЫТА: БПЛА теперь летят полностью автономно и скрытно
        // --------------------------------------------------------------------
        // this.drawDiscoveredCircles(discoveredTurrets);
        // this.drawSwarmPaths(invaders);
        // ====================================================================

        // 5. Отрисовка видимых врагов
        invaders.forEach(invader => this.drawInvader(invader));

        // 6. Отрисовка нижнего HUD-интерфейса магазина
        this.drawShopUI();

        // 7. Отрисовка имени выбранного элемента (справа сверху)
        if (selectedEntity) {
            this.drawSelectedNameUI(selectedEntity.name);
        }

        // 8. Отрисовка счётчика сбитых БПЛА (слева сверху)
        this.drawScoreUI(score);
    }

    /**
     * Отрисовывает коричневые круги безопасности (76px) вокруг раскрытых рою турелей
     */
    private drawDiscoveredCircles(discoveredTurrets: SimpleTurret[]): void {
        this.ctx.save();
        
        discoveredTurrets.forEach(turret => {
            // Радиус облёта: 70px (боевой радиус) + 6px (корпус БПЛА) = 76px
            const criticalRadius = 70 + 6; 
            
            this.ctx.beginPath();
            this.ctx.arc(turret.x, turret.y, criticalRadius, 0, Math.PI * 2);
            
            // Заливка круга мягким прозрачно-коричневым цветом
            this.ctx.fillStyle = 'rgba(139, 69, 19, 0.04)';
            this.ctx.fill();
            
            // Штриховая коричневая линия границы зоны
            this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 5]); // Пунктир для эффекта сетки
            this.ctx.stroke();
        });
        
        this.ctx.restore();
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
     * Отрисовывает траектории путей навигации ИИ в виде тонких технологичных линий
     */
    private drawSwarmPaths(invaders: SimpleInvader[]): void {
        this.ctx.save();
        
        // Яркие пунктирные линии, чётко заметные на тёмном фоне
        this.ctx.strokeStyle = 'rgba(255, 123, 114, 0.35)'; 
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]); // Паттерн штрихов: 4px линия, 4px пропуск
        
        invaders.forEach(invader => {
            if (invader.hp <= 0) return;

            // ИСПРАВЛЕНО: Безопасное двойное приведение типов через unknown для обхода строгой проверки TS
            const points = (invader.waypoints as unknown) as any[];

            if (invader.waypoints && invader.waypoints.length > 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(invader.x, invader.y);
                invader.waypoints.forEach(wp => {
                    this.ctx.lineTo(wp.x, wp.y);
                });
                this.ctx.stroke();
            }
        });
        
        this.ctx.restore();
    }

    private drawSelectionFrame(x: number, y: number): void {
        this.ctx.strokeStyle = '#ffffff'; 
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(x - 14, y - 14, 28, 28);
    }

    private drawScoreUI(score: number): void {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.8)';
        this.ctx.fillRect(20, 20, 180, 40);
        this.ctx.strokeStyle = '#30363d';
        this.ctx.strokeRect(20, 20, 180, 40);

        this.ctx.fillStyle = '#ff7b72'; 
        this.ctx.font = 'bold 13px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`Сбито БПЛА: ${score}`, 35, 40);
        this.ctx.restore();
    }

    private drawSelectedNameUI(name: string): void {
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.8)';
        this.ctx.fillRect(this.canvas.width - 220, 20, 200, 40);
        this.ctx.strokeStyle = '#30363d';
        this.ctx.strokeRect(this.canvas.width - 220, 20, 200, 40);

        this.ctx.fillStyle = '#f0f6fc';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(name, this.canvas.width - 120, 40);
    }

    private drawGhostBuilding(type: string, x: number, y: number): void {
        this.ctx.save();
        if (type === 'RADAR') {
            this.ctx.beginPath();
            this.ctx.arc(x, y, 180, -Math.PI/2 - Math.PI/4, -Math.PI/2 + Math.PI/4);
            this.ctx.fillStyle = 'rgba(56, 139, 253, 0.05)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#58a6ff';
            this.ctx.stroke();
            this.ctx.fillStyle = 'rgba(56, 139, 253, 0.4)';
            this.ctx.fillRect(x - 10, y - 10, 20, 20);
        } else if (type === 'TURRET') {
            this.ctx.beginPath();
            this.ctx.arc(x, y, 45, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.3)';
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 70, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.2)';
            this.ctx.stroke();

            this.ctx.fillStyle = 'rgba(57, 211, 83, 0.4)';
            this.ctx.fillRect(x - 10, y - 10, 20, 20);
        }
        this.ctx.restore();
    }

    private drawShopUI(): void {
        this.ctx.fillStyle = '#161b22';
        this.ctx.fillRect(0, 540, this.canvas.width, 60);
        this.ctx.strokeStyle = '#30363d';
        this.ctx.strokeRect(0, 540, this.canvas.width, 60);

        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        this.ctx.fillStyle = '#21262d';
        this.ctx.fillRect(20, 550, 140, 40);
        this.ctx.strokeStyle = '#8b949e';
        this.ctx.strokeRect(20, 550, 140, 40);
        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.fillText('1. + РЛС (ЛКМ)', 90, 570);

        this.ctx.fillStyle = '#21262d';
        this.ctx.fillRect(180, 550, 140, 40);
        this.ctx.strokeStyle = '#8b949e';
        this.ctx.strokeRect(180, 550, 140, 40);
        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.fillText('2. + ПВО (ЛКМ)', 250, 570);
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
