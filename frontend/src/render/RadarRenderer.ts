import { SimpleRadar } from '../entities/SimpleRadar';

export class RadarRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    /**
     * Отрисовка радарной станции с конусом развёртки и HUD-статусом энергосети
     */
    public draw(radar: SimpleRadar, selectedEntity: any): void {
        this.ctx.save();

        // =============================================================
        // 1. ОТРИСОВКА СИНЕГО КОНУСА СКАНИРОВАНИЯ (С УЧЕТОМ ДЕФИЦИТА)
        // =============================================================
        if (radar.isPowered && radar.detectionRadius > 0) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(radar.x, radar.y);
            
            // Сектор раскрытия луча сканирования (90 градусов вокруг текущего угла антенны)
            const fovAngle = Math.PI / 4; 
            this.ctx.arc(
                radar.x, 
                radar.y, 
                radar.detectionRadius, // Динамический радиус: 180px или сжатый 100px!
                radar.currentAngle - fovAngle, 
                radar.currentAngle + fovAngle
            );
            this.ctx.closePath();
            
            // Если сеть перегружена — конус горит тусклым тревожным цветом, в норме — ярким синим
            const isOverloaded = radar.detectionRadius < 180;
            this.ctx.fillStyle = isOverloaded ? 'rgba(245, 158, 11, 0.03)' : 'rgba(56, 139, 253, 0.05)';
            this.ctx.fill();
            this.ctx.strokeStyle = isOverloaded ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 139, 253, 0.25)';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.restore();
        }

        // =============================================================
        // 2. ОТРИСОВКА КОРПУСА РЛС И ПОВОРОТНОЙ АНТЕННЫ
        // =============================================================
        // Базовая платформа радара (круглый купол 15px)
        this.ctx.fillStyle = '#1f6feb';
        this.ctx.strokeStyle = selectedEntity === radar ? '#58a6ff' : '#38bdf8'; // Подсветка при выделении ЛКМ
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(radar.x, radar.y, 12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Отрисовка вращающейся/направляемой стрелы излучателя (антенны РЛС)
        if (radar.isPowered) {
            this.ctx.save();
            this.ctx.translate(radar.x, radar.y);
            this.ctx.rotate(radar.currentAngle);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(14, 0); // Стрела антенны длиной 14px
            this.ctx.stroke();
            this.ctx.restore();
        }

        // =============================================================
        // 3. ИНТЕГРАЦИЯ ТАКТИЧЕСКОГО HUD ИНДИКАТОРОВ ЭНЕРГОСЕТИ
        // =============================================================
        const hudY = radar.y - 18; // Высота маркера над куполом радара

        if (!radar.isPowered) {
            // Сценарий А: РЛС полностью обесточена (Нет Энергоблока в радиусе 300px)
            this.ctx.fillStyle = '#ff4444'; // Критический красный цвет
            this.ctx.font = 'bold 10px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('⚠️ НЕТ ТОКА', radar.x, hudY);

            // Маленький красный крестик поверх отключенной антенны
            this.ctx.strokeStyle = 'rgba(255, 68, 68, 0.6)';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(radar.x - 6, radar.y - 6); this.ctx.lineTo(radar.x + 6, radar.y + 6);
            this.ctx.moveTo(radar.x + 6, radar.y - 6); this.ctx.lineTo(radar.x - 6, radar.y + 6);
            this.ctx.stroke();

        } else if (radar.detectionRadius < 180) {
            // Сценарий Б: Перегрузка Энергоблока (voltage drop), падение напряжения в сети!
            this.ctx.fillStyle = '#f59e0b'; // Тревожный оранжево-жёлтый цвет дефицита
            this.ctx.font = 'bold 9px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // Выводим предупреждение и текущую урезанную дальность обзора
            this.ctx.fillText(`⚠️ СЛАБЫЙ ТОК (R:${radar.detectionRadius})`, radar.x, hudY);
        } else {
            // Сценарий В: РЛС полностью запитана и функционирует на 100% мощности
            this.ctx.fillStyle = '#38bdf8'; // Стабильный неоновый синий
            this.ctx.font = 'bold 9px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('СЕТЬ: ОК', radar.x, hudY);
        }

        // 4. Отрисовка рамки тактического выбора интерфейса (если радар выделен)
        if (selectedEntity === radar) {
            this.drawSelectionFrame(radar.x, radar.y, '#38bdf8');
        }

        this.ctx.restore();
    }

    private drawSelectionFrame(x: number, y: number, color: string): void {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1.5;
        const offset = 16;
        const len = 5;

        // Левый верхний угол
        this.ctx.beginPath(); this.ctx.moveTo(x - offset, y - offset + len); this.ctx.lineTo(x - offset, y - offset); this.ctx.lineTo(x - offset + len, y - offset); this.ctx.stroke();
        // Правый верхний угол
        this.ctx.beginPath(); this.ctx.moveTo(x + offset, y - offset + len); this.ctx.lineTo(x + offset, y - offset); this.ctx.lineTo(x + offset - len, y - offset); this.ctx.stroke();
        // Левый нижний угол
        this.ctx.beginPath(); this.ctx.moveTo(x - offset, y + offset - len); this.ctx.lineTo(x - offset, y + offset); this.ctx.lineTo(x - offset + len, y + offset); this.ctx.stroke();
        // Правый нижний угол
        this.ctx.beginPath(); this.ctx.moveTo(x + offset, y + offset - len); this.ctx.lineTo(x + offset, y + offset); this.ctx.lineTo(x + offset - len, y + offset); this.ctx.stroke();
    }
}
