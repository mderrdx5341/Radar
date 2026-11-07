import { SimpleInvader, DiscoveredHazard, SpawnNode } from '../entities';
import { Waypoint } from '../entities/RouteManager';
import { TangentPathfinder } from '../services/TangentPathfinder';

export class DebugRenderer {
    private ctx: CanvasRenderingContext2D;
    private readonly gridStep = 20;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Градиентный Heatmap-отрисовщик стоимости ячеек
     */
    public draw(invaders: Array<SimpleInvader>, hazards: Array<DiscoveredHazard>, spawnNodes: Array<SpawnNode>, isDebugMode: boolean, isWaveDebug: boolean): void {
        this.ctx.save();

        // 1. ИСПРАВЛЕНО (ТЕПЛОВАЯ КАРТА СТРАХА): Отрисовка градиентной сетки стоимости прохода
        if ((isDebugMode || isWaveDebug) && hazards.length > 0) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.01)'; // Едва заметные границы ячеек сетки
            this.ctx.lineWidth = 0.5;

            hazards.forEach(hazard => {
                const rad = hazard.radius;
                const startX = Math.floor((hazard.x - rad) / this.gridStep) * this.gridStep;
                const endX = Math.ceil((hazard.x + rad) / this.gridStep) * this.gridStep;
                const startY = Math.floor((hazard.y - rad) / this.gridStep) * this.gridStep;
                const endY = Math.ceil((hazard.y + rad) / this.gridStep) * this.gridStep;

                for (let x = startX; x <= endX; x += this.gridStep) {
                    for (let y = startY; y <= endY; y += this.gridStep) {
                        
                        // Запрашиваем точную рантайм-стоимость штрафа в центре текущего квадрата 20x20
                        const penalty = TangentPathfinder.calculatePenaltyAt(x, y, hazards);
                        
                        if (penalty > 0) {
                            // Нормализуем прозрачность от 0.02 (на окраинах) до 0.45 (в эпицентре у пушки)
                            const alpha = 0.02 + (penalty / 2500) * 0.43;
                            
                            // Плавный переход цвета: от бледно-оранжевого на краях до кроваво-красного в центре!
                            if (penalty < 800) {
                                this.ctx.fillStyle = `rgba(242, 140, 68, ${alpha})`; // Мягкий оранжевый предупреждающий
                            } else {
                                this.ctx.fillStyle = `rgba(248, 81, 73, ${alpha})`; // Агрессивный красный "критический штраф"
                            }

                            this.ctx.fillRect(x - this.gridStep/2, y - this.gridStep/2, this.gridStep, this.gridStep);
                            this.ctx.strokeRect(x - this.gridStep/2, y - this.gridStep/2, this.gridStep, this.gridStep);
                        }
                    }
                }

                // Радиус-кольцо вскрытой опасности
                this.ctx.strokeStyle = 'rgba(248, 81, 73, 0.25)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(hazard.x, hazard.y, rad, 0, Math.PI * 2);
                this.ctx.stroke();

                this.ctx.beginPath();
                this.ctx.moveTo(hazard.x - 5, hazard.y);
                this.ctx.lineTo(hazard.x + 5, hazard.y);
                this.ctx.moveTo(hazard.x, hazard.y - 5);
                this.ctx.lineTo(hazard.x, hazard.y + 5);
                this.ctx.stroke();
            });
        }

        // 2. Оранжевый фронт покадрового раскрытия А* (Клавиша L)
        if (isWaveDebug) {
            spawnNodes.forEach(node => {
                if (!node.isSearching || !node.pathfinder.closedSet) return;

                this.ctx.fillStyle = 'rgba(242, 199, 68, 0.4)'; 
                
                node.pathfinder.closedSet.forEach(key => {
                    const coords = key.split(',');
                    const cx = parseInt(coords[0]);
                    const cy = parseInt(coords[1]);
                    this.ctx.fillRect(cx - 2, cy - 2, 4, 4);
                });
            });
        }

        // 3. Фиолетовые готовые маршруты полета БПЛА (Клавиша K)
        if (isDebugMode) {
            invaders.forEach(invader => {
                if (invader.hp <= 0 || !invader.waypoints || invader.waypoints.length === 0) return;

                this.ctx.strokeStyle = 'rgba(211, 140, 235, 0.7)';
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
