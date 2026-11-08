export class GhostRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw(type: string, x: number, y: number): void {
        if (type === 'RADAR') {
            this.ctx.beginPath();
            this.ctx.arc(x, y, 180, -Math.PI/2 - Math.PI/4, -Math.PI/2 + Math.PI/4);
            this.ctx.fillStyle = 'rgba(56, 139, 253, 0.05)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#58a6ff';
            this.ctx.stroke();

            this.ctx.fillStyle = 'rgba(56, 139, 253, 0.3)';
            this.ctx.fillRect(x - 10, y - 10, 20, 20);
            this.ctx.strokeStyle = '#58a6ff';
            this.ctx.strokeRect(x - 10, y - 10, 20, 20);
        } else if (type === 'TURRET') {
            this.ctx.beginPath(); this.ctx.arc(x, y, 45, 0, Math.PI * 2); this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.3)'; this.ctx.stroke();
            this.ctx.beginPath(); this.ctx.arc(x, y, 70, 0, Math.PI * 2); this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.2)'; this.ctx.stroke();

            this.ctx.fillStyle = 'rgba(57, 211, 83, 0.3)';
            this.ctx.fillRect(x - 10, y - 10, 20, 20);
            this.ctx.strokeStyle = '#39d353';
            this.ctx.strokeRect(x - 10, y - 10, 20, 20);
        } else if (type === 'POWER') {
            this.ctx.strokeStyle = 'rgba(56, 139, 253, 0.35)'; this.ctx.beginPath(); this.ctx.arc(x, y, 300, 0, Math.PI * 2); this.ctx.stroke();
            this.ctx.fillStyle = 'rgba(22, 27, 34, 0.4)'; this.ctx.strokeStyle = '#58a6ff'; this.ctx.lineWidth = 3; this.ctx.beginPath();
            for (let i = 0; i < 8; i++) { const a = (i * 2 * Math.PI) / 8; this.ctx.lineTo(x + Math.cos(a) * 20, y + Math.sin(a) * 20); }
            this.ctx.closePath(); this.ctx.fill(); this.ctx.stroke();
        } else if (type === 'REPAIR') {
            this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.35)'; this.ctx.beginPath(); this.ctx.arc(x, y, 200, 0, Math.PI * 2); this.ctx.stroke();
            this.ctx.fillStyle = 'rgba(22, 27, 34, 0.4)'; this.ctx.strokeStyle = '#34d399'; this.ctx.lineWidth = 3; this.ctx.beginPath();
            for (let i = 0; i < 6; i++) { const a = (i * 2 * Math.PI) / 6; this.ctx.lineTo(x + Math.cos(a) * 20, y + Math.sin(a) * 20); }
            this.ctx.closePath(); this.ctx.fill(); this.ctx.stroke();
        } else if (type === 'AMMO_DEPOT') {
            this.ctx.strokeStyle = 'rgba(242, 199, 68, 0.35)'; this.ctx.beginPath(); this.ctx.arc(x, y, 350, 0, Math.PI * 2); this.ctx.stroke();
            this.ctx.fillStyle = 'rgba(22, 27, 34, 0.4)'; this.ctx.strokeStyle = '#fbbf24'; this.ctx.lineWidth = 3;
            this.ctx.fillRect(x - 20, y - 20, 40, 40); this.ctx.strokeRect(x - 20, y - 20, 40, 40);
        }
    }
}
