export class UIRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Отрисовка белой рамки вокруг выбранного на карте объекта
     */
    public drawSelectionFrame(x: number, y: number): void {
        this.ctx.save();
        this.ctx.strokeStyle = '#ffffff'; 
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(x - 14, y - 14, 28, 28);
        this.ctx.restore();
    }

    /**
     * Отрисовка счетчика уничтоженных БПЛА (слева сверху)
     */
    public drawScoreUI(score: number): void {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.85)';
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

    /**
     * Отрисовка тактической панели с именем выделенного юнита (справа сверху)
     */
    public drawSelectedNameUI(canvasWidth: number, name: string): void {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.85)';
        this.ctx.fillRect(canvasWidth - 220, 20, 200, 40);
        this.ctx.strokeStyle = '#30363d';
        this.ctx.strokeRect(canvasWidth - 220, 20, 200, 40);

        this.ctx.fillStyle = '#f0f6fc';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(name, canvasWidth - 120, 40);
        this.ctx.restore();
    }

    /**
     * ОТРИСОВКА ПОЛУПРОЗРАЧНОГО ПРИЗРАКА ЗДАНИЯ ЗА КУРСОРOM МЫШИ В РЕЖИМЕ СТРОИТЕЛЬСТВА
     */
    public drawGhostBuilding(type: string, x: number, y: number): void {
        this.ctx.save();
        this.ctx.lineWidth = 1.5;

        // =============================================================
        // 1. ОРИГИНАЛЬНЫЙ КОД ИГРОКА ДЛЯ ОБОРОНИТЕЛЬНЫХ СИСТЕМ (РЛС И ПВО)
        // =============================================================
        if (type === 'RADAR') {
            // 1. Рисуем конус радарной развёртки
            this.ctx.beginPath();
            this.ctx.arc(x, y, 180, -Math.PI/2 - Math.PI/4, -Math.PI/2 + Math.PI/4);
            this.ctx.fillStyle = 'rgba(56, 139, 253, 0.05)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#58a6ff';
            this.ctx.stroke();

            // Рисуем сам центральный квадратик корпуса РЛС (размер 20x20px, центрирован)
            this.ctx.fillStyle = 'rgba(56, 139, 253, 0.3)'; 
            this.ctx.fillRect(x - 10, y - 10, 20, 20);
            this.ctx.strokeStyle = '#58a6ff';
            this.ctx.strokeRect(x - 10, y - 10, 20, 20);

        } else if (type === 'TURRET') {
            // 1. Рисуем зоны поражения лазера ПВО
            this.ctx.beginPath();
            this.ctx.arc(x, y, 45, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.3)';
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 70, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.2)';
            this.ctx.stroke();

            // Рисуем центральный квадратик корпуса ПВО (размер 20x20px, центрирован)
            this.ctx.fillStyle = 'rgba(57, 211, 83, 0.3)'; 
            this.ctx.fillRect(x - 10, y - 10, 20, 20);
            this.ctx.strokeStyle = '#39d353';
            this.ctx.strokeRect(x - 10, y - 10, 20, 20);

        // =============================================================
        // 2. СОВРЕМЕННЫЙ КОД ДЛЯ ИНФРАСТРУКТУРНЫХ ЗДАНИЙ БАЗЫ
        // =============================================================
        } else if (type === 'POWER') {
            // Будущая зона энергосети (300px)
            this.ctx.strokeStyle = 'rgba(56, 139, 253, 0.35)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 300, 0, Math.PI * 2);
            this.ctx.stroke();

            // Полупрозрачный синий восьмиугольник купола (радиус 20px)
            this.ctx.fillStyle = 'rgba(22, 27, 34, 0.4)';
            this.ctx.strokeStyle = '#58a6ff';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            const corners = 8;
            for (let i = 0; i < corners; i++) {
                const angle = (i * 2 * Math.PI) / corners;
                const bx = x + Math.cos(angle) * 20;
                const by = y + Math.sin(angle) * 20;
                if (i === 0) this.ctx.moveTo(bx, by);
                else this.ctx.lineTo(bx, by);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

        } else if (type === 'REPAIR') {
            // Будущая зона ремонта инженеров (200px)
            this.ctx.strokeStyle = 'rgba(57, 211, 83, 0.35)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 200, 0, Math.PI * 2);
            this.ctx.stroke();

            // Полупрозрачный зеленый шестиугольник ремонтного дока (радиус 20px)
            this.ctx.fillStyle = 'rgba(22, 27, 34, 0.4)';
            this.ctx.strokeStyle = '#34d399';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            const corners = 6;
            for (let i = 0; i < corners; i++) {
                const angle = (i * 2 * Math.PI) / corners;
                const bx = x + Math.cos(angle) * 20;
                const by = y + Math.sin(angle) * 20;
                if (i === 0) this.ctx.moveTo(bx, by);
                else this.ctx.lineTo(bx, by);
            }
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.stroke();

        } else if (type === 'AMMO_DEPOT') {
            // Будущая зона снабжения патронами (350px)
            this.ctx.strokeStyle = 'rgba(242, 199, 68, 0.35)';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 350, 0, Math.PI * 2);
            this.ctx.stroke();

            // Полупрозрачный золотой квадрат Склада БК (сторона 40x40px, радиус 20px)
            this.ctx.fillStyle = 'rgba(22, 27, 34, 0.4)';
            this.ctx.strokeStyle = '#fbbf24';
            this.ctx.lineWidth = 3;
            this.ctx.fillRect(x - 20, y - 20, 40, 40);
            this.ctx.strokeRect(x - 20, y - 20, 40, 40);
        }

        this.ctx.restore();
    }

    /**
     * Отрисовка обновлённого магазина построек на нижней панели HUD
     */
    public drawShopUI(scrWidth: number, scrHeight: number, isPaused: boolean): void {
        this.ctx.save();
        
        // Рисуем нижнюю плашку HUD панели
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.95)';
        this.ctx.strokeStyle = '#30363d';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(0, scrHeight - 60, scrWidth, 60);
        this.ctx.strokeRect(0, scrHeight - 60, scrWidth, 60);

        // Конфигурация 5 тактических кнопок строительства
        const buttons = [
            { type: 'RADAR', label: '📡 РЛС' },
            { type: 'TURRET', label: '🎯 ПВО' },
            { type: 'POWER', label: '⚡ Энергия' },
            { type: 'REPAIR', label: '🛠️ Ремонт' },
            { type: 'AMMO_DEPOT', label: '📦 Склад БК' }
        ];

        buttons.forEach((btn, i) => {
            const btnX = 20 + i * 130;
            const btnY = scrHeight - 45;
            const btnWidth = 110;
            const btnHeight = 30;

            // Подсветка кнопки
            this.ctx.fillStyle = '#21262d';
            this.ctx.strokeStyle = '#8b949e';
            this.ctx.lineWidth = 1;
            this.ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
            this.ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);

            // Текст внутри кнопки
            this.ctx.fillStyle = '#c9d1d9';
            this.ctx.font = 'bold 12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(btn.label, btnX + btnWidth / 2, btnY + btnHeight / 2);
        });

        this.ctx.restore();
    }

    /**
     * ЖЁСТКИЙ ФИКС: Отрисовка экрана тактического поражения Game Over
     */
    public drawGameOverOverlay(width: number, height: number, reason: string): void {
        this.ctx.save();
        // Глубокое притемнение поля боя
        this.ctx.fillStyle = 'rgba(7, 10, 14, 0.85)';
        this.ctx.fillRect(0, 0, width, height);

        // Массивная темная тактическая панель по центру
        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.95)';
        this.ctx.fillRect(width / 2 - 240, height / 2 - 70, 480, 120);
        this.ctx.strokeStyle = '#ff4444'; // Красная рамка тревоги
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(width / 2 - 240, height / 2 - 70, 480, 120);

        // Главное предупреждение
        this.ctx.fillStyle = '#ff7b72';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('СВЯЗЬ ПОТЕРЯНА. ПЕРИМЕТР ПРОРВАН', width / 2, height / 2 - 35);

        // Конкретная причина коллапса инфраструктуры
        this.ctx.fillStyle = '#c9d1d9';
        this.ctx.font = '13px sans-serif';
        this.ctx.fillText(reason, width / 2, height / 2 + 5);
        
        this.ctx.fillStyle = '#8b949e';
        this.ctx.font = 'italic 11px sans-serif';
        this.ctx.fillText('Перезапустите страницу для повторной попытки', width / 2, height / 2 + 30);
        this.ctx.restore();
    }

    /**
     * Отрисовка центрального полупрозрачного оверлея паузы
     */
    private drawPauseOverlay(width: number, height: number): void {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(0, 0, width, height - 60);

        this.ctx.fillStyle = 'rgba(22, 27, 34, 0.9)';
        this.ctx.fillRect(width / 2 - 160, height / 2 - 40, 320, 60);
        this.ctx.strokeStyle = '#d67422';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(width / 2 - 160, height / 2 - 40, 320, 60);

        this.ctx.fillStyle = '#e38e44';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('ТАКТИЧЕСКАЯ ПАУЗА ACTIVATED', width / 2, height / 2 - 10);
        this.ctx.restore();
    }
}