import { SimpleInvader } from '../entities/SimpleInvader';

export class InvaderRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Отрисовка всех активных БПЛА на карте
     */
    public drawAll(invaders: Array<SimpleInvader>): void {
        invaders.forEach(invader => {
            // Если дрон уничтожен или скрыт в тумане войны — пропускаем его
            if (invader.hp <= 0 || !invader.isVisible) return;

            this.ctx.save();
            
            // 1. Отрисовка физического тела дрона (Красная точка)
            this.ctx.fillStyle = '#f85149';
            this.ctx.beginPath();
            this.ctx.arc(invader.x, invader.y, invader.radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#ff7b72';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // 2. Отрисовка тактической рамки захвата цели (Квадрат вокруг БПЛА)
            const size = 12;
            this.ctx.strokeStyle = 'rgba(248, 81, 73, 0.6)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(invader.x - size / 2, invader.y - size / 2, size, size);

            // 3. Отрисовка линии жизни (HP-бар) над дроном
            const barWidth = 18;
            const barHeight = 2;
            const barX = invader.x - barWidth / 2;
            const barY = invader.y - invader.radius - 6;

            // Подложка потерянной прочности
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);

            // Полоса текущего здоровья БПЛА
            const hpPercentage = invader.hp / 100;
            this.ctx.fillStyle = '#39d353'; // Зелёный маркер прочности
            this.ctx.fillRect(barX, barY, barWidth * hpPercentage, barHeight);

            this.ctx.restore();
        });
    }
}