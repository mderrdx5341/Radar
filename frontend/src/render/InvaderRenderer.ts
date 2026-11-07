import { SimpleInvader } from '../entities/SimpleInvader';

export class InvaderRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Отрисовка всех активных БПЛА на карте с жестким округлением координат (Pixel Snapping)
     */
    public drawAll(invaders: Array<SimpleInvader>): void {
        invaders.forEach(invader => {
            if (invader.hp <= 0 || !invader.isVisible) return;

            this.ctx.save();
            
            // ЖЕСТКИЙ ФИКС ФРИЗОВ: Округляем координаты до целых пикселей!
            const ix = Math.round(invader.x);
            const iy = Math.round(invader.y);
            const r = Math.round(invader.radius);

            // 1. Отрисовка физического тела дрона (Красная точка)
            this.ctx.fillStyle = '#f85149';
            this.ctx.beginPath();
            this.ctx.arc(ix, iy, r, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#ff7b72';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // 2. Отрисовка тактической рамки захвата цели (Квадрат вокруг БПЛА)
            const size = 12;
            this.ctx.strokeStyle = 'rgba(248, 81, 73, 0.6)';
            this.ctx.lineWidth = 1;
            // Округляем координаты рамки
            this.ctx.strokeRect(
                Math.round(ix - size / 2), 
                Math.round(iy - size / 2), 
                size, 
                size
            );

            // 3. Отрисовка линии жизни (HP-бар) над дроном
            const barWidth = 18;
            const barHeight = 2;
            const barX = Math.round(ix - barWidth / 2);
            const barY = Math.round(iy - r - 6);

            // Подложка потерянной прочности
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);

            // Полоса текущего здоровья БПЛА (Округляем итоговую ширину полоски!)
            const hpPercentage = invader.hp / 100;
            const currentBarWidth = Math.round(barWidth * hpPercentage);

            this.ctx.fillStyle = '#39d353'; 
            this.ctx.fillRect(barX, barY, currentBarWidth, barHeight);

            this.ctx.restore();
        });
    }
}
