import { SidebarRenderer, ShopRenderer, PauseRenderer, GhostRenderer } from './ui';

export class UIRenderer {
    private ctx: CanvasRenderingContext2D;
    private sidebar: SidebarRenderer;
    private shop: ShopRenderer;
    private pauseBanner: PauseRenderer;
    private ghost: GhostRenderer;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
        this.sidebar = new SidebarRenderer(ctx);
        this.shop = new ShopRenderer(ctx);
        this.pauseBanner = new PauseRenderer(ctx);
        this.ghost = new GhostRenderer(ctx);
    }

    public drawRightTelemetrySidebar(w: number, h: number, state: any): void {
        this.sidebar.draw(w, h, state);
    }

    public drawShopUI(w: number, h: number, isPaused: boolean): void {
        this.shop.draw(w, h);
    }

    public drawPauseOverlay(w: number, h: number): void {
        this.pauseBanner.draw(w);
    }

    public drawGhostBuilding(type: string, x: number, y: number): void {
        this.ctx.save();
        this.ghost.draw(type, x, y);
        this.ctx.restore();
    }

    public drawSelectedNameUI(scrWidth: number, name: string): void {
        this.ctx.save();
        this.ctx.fillStyle = '#8b949e';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.textAlign = 'left';
        // ИСПРАВЛЕНО: Смещено на X = 220, чтобы текст не залезал под левый сайдбар!
        this.ctx.fillText(`ВЫБРАН ОБЪЕКТ: ${name}`, 220, 30);
        this.ctx.restore();
    }

    public drawScoreUI(score: number): void {
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'left';
        // ИСПРАВЛЕНО: Смещено на X = 220, чтобы текст не залезал под левый сайдбар!
        this.ctx.fillText(`СБИТО БПЛА: ${score}`, 220, 50);
        this.ctx.restore();
    }
    public drawGameOverOverlay(w: number, h: number, msg: string): void {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(13, 17, 23, 0.95)';
        this.ctx.fillRect(0, 0, w, h);
        this.ctx.fillStyle = '#f85149';
        this.ctx.font = 'bold 24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('СБОЙ ИНФРАСТРУКТУРЫ', w / 2, h / 2 - 20);
        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.font = '14px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(msg, w / 2, h / 2 + 15);
        this.ctx.restore();
    }
}
