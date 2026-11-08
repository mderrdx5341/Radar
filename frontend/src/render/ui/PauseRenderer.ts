export class PauseRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw(width: number): void {
        const bannerWidth = 420;
        const bannerHeight = 46;
        const bannerX = width / 2 - bannerWidth / 2;
        const bannerY = 15;

        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.92)';
        this.ctx.fillRect(bannerX, bannerY, bannerWidth, bannerHeight);

        this.ctx.strokeStyle = '#d67422';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(bannerX, bannerY, bannerWidth, bannerHeight);

        this.ctx.fillStyle = '#e38e44';
        this.ctx.font = 'bold 13px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('[ ⏸ ТАКТИЧЕСКАЯ ПАУЗА ]', width / 2, bannerY + 6);

        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.font = '9px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('ФРОНТ ЗАМОРОЖЕН • НАЖМИТЕ [ SPACE ] ДЛЯ ЗАПУСКА ВРЕМЕНИ', width / 2, bannerY + 26);
    }
}
