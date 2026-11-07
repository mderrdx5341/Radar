import { SimpleInvader, DiscoveredHazard, SpawnNode } from '../entities';
import { Waypoint } from '../entities/RouteManager';

export class DebugRenderer {
    private ctx: CanvasRenderingContext2D;
    private readonly gridStep = 20;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Универсальный тактический отрисовщик отладки с разделением слоёв по кнопкам K и L
     */
    public draw(invaders: Array<SimpleInvader>, hazards: Array<DiscoveredHazard>, spawnNodes: Array<SpawnNode>, isDebugMode: boolean, isWaveDebug: boolean): void {
        this.ctx.save();

        // 1. ИСПРАВЛЕНО: Красная сетка опасных зон теперь рисуется ВСЕГДА, когда нажата кнопка K ИЛИ кнопка L!
        if ((isDebugMode || isWaveDebug) && hazards.length > 0) {
            this.ctx.fillStyle = 'rgba(255, 68, 68, 0.08)'; // Мягкая красная заливка заблокированных ячеек
            this.ctx.strokeStyle = 'rgba(255, 68, 68, 0.03)';
            this.ctx.lineWidth = 0.5;

            hazards.forEach(hazard => {
                const rad = hazard.radius;
                const startX = Math.floor((hazard.x - rad) / this.gridStep) * this.gridStep;
                const endX = Math.ceil((hazard.x + rad) / this.gridStep) * this.gridStep;
                const startY = Math.floor((hazard.y - rad) / this.gridStep) * this.gridStep;
                const endY = Math.ceil((hazard.y + rad) / this.gridStep) * this.gridStep;

                for (let x = startX; x <= endX; x += this.gridStep) {
                    for (let y = startY; y <= endY; y += this.gridStep) {
                        const dx = x - hazard.x;
                        const dy = y - hazard.y;
                        
                        if ((dx * dx + dy * dy) < (rad * rad)) {
                            this.ctx.fillRect(x - this.gridStep/2, y - this.gridStep/2, this.gridStep, this.gridStep);
                            this.ctx.strokeRect(x - this.gridStep/2, y - this.gridStep/2, this.gridStep, this.gridStep);
                        }
                    }
                }

                // Внешний радиус угрозы в памяти роя и тактический крест
                this.ctx.strokeStyle = 'rgba(255, 68, 68, 0.4)';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.arc(hazard.x, hazard.y, rad, 0, Math.PI * 2);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(hazard.x - 6, hazard.y);
                this.ctx.lineTo(hazard.x + 6, hazard.y);
                this.ctx.moveTo(hazard.x, hazard.y - 6);
                this.ctx.lineTo(hazard.x, hazard.y + 6);
                this.ctx.stroke();
            });
        }

        // 2. Оранжевый фронт покадрового раскрытия А* (Строго по клавише L)
        if (isWaveDebug) {
            spawnNodes.forEach(node => {
                if (!node.isSearching || !node.pathfinder.closedSet) return;

                this.ctx.fillStyle = 'rgba(242, 199, 68, 0.4)'; // Шаги вычислений
                
                node.pathfinder.closedSet.forEach(key => {
                    const coords = key.split(',');
                    const cx = parseInt(coords[0]);
                    const cy = parseInt(coords[1]);
                    this.ctx.fillRect(cx - 2, cy - 2, 4, 4);
                });
            });
        }

        // 3. Фиолетовые готовые маршруты полета БПЛА (Строго по клавише K)
        if (isDebugMode) {
            invaders.forEach(invader => {
                if (invader.hp <= 0 || !invader.waypoints || invader.waypoints.length === 0) return;

                this.ctx.strokeStyle = 'rgba(211, 140, 235, 0.6)';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.moveTo(invader.x, invader.y);
                invader.waypoints.forEach(wp => {
                    this.ctx.lineTo(wp.x, wp.y);
                });
                this.ctx.stroke();
            });
        }

        this.ctx.restore();
    }
}
