export class ShopRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public draw(scrWidth: number, scrHeight: number): void {
        const sidebarWidth = 200;
        const shopX = sidebarWidth; // ИСПРАВЛЕНО: Панель кнопок начинается СРАЗУ после левого сайдбара
        const shopWidth = scrWidth - sidebarWidth;

        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.95)';
        this.ctx.strokeStyle = '#30363d';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(shopX, scrHeight - 60, shopWidth, 60);
        this.ctx.strokeRect(shopX, scrHeight - 60, shopWidth, 60);

        const buttons = [
            { label: '📡 РЛС' },
            { label: '🎯 ПВО' },
            { label: '⚡ Энергия' },
            { label: '🛠️ Ремонт' },
            { label: '📦 Склад БК' }
        ];

        buttons.forEach((btn, i) => {
            // ИСПРАВЛЕНО: Смещаем кнопки вправо, прибавляя координату начала панели (shopX)
            const btnX = shopX + 20 + i * 130;
            const btnY = scrHeight - 45;
            const btnWidth = 110;
            const btnHeight = 30;

            this.ctx.fillStyle = '#21262d';
            this.ctx.strokeStyle = '#8b949e';
            this.ctx.lineWidth = 1;
            this.ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
            this.ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

            this.ctx.fillStyle = '#c9d1d9';
            this.ctx.font = 'bold 12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(btn.label, btnX + btnWidth / 2, btnY + btnHeight / 2);
        });
    }
}
