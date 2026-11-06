import { Waypoint } from './RouteManager';
import { SimpleTurret } from './SimpleTurret';

export class SimpleInvader {
    public x: number;
    public y: number;
    public radius: number = 6; 
    public hp: number = 100;
    public visibilityTimer: number = 0; 

    // Фиксированная точка взлета по оси X, за которой закреплен этот дрон
    public spawnPointX: number = 0;

    // Текущий угол движения дрона (в радианах). Изначально строго вниз (Math.PI / 2)
    public moveAngle: number = Math.PI / 2;
    // Ограничение на скорость поворота за один кадр (инерция дуги)
    private turnSpeedMax: number = 0.045; 

    // Индивидуальный путевой лист
    public waypoints: Waypoint[] = []; 

    public attackers: Array<SimpleTurret> = new Array<SimpleTurret>();

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.spawnPointX = x; // Запоминаем родной тактический коридор
        this.waypoints = [];
    }

    public get isVisible(): boolean {
        return this.visibilityTimer > 0;
    }

    public updateVisibility(deltaTime: number): void {
        if (deltaTime <= 0) return;
        this.visibilityTimer = Math.max(0, this.visibilityTimer - deltaTime);
    }

    /**
     * Метод чистого удержания курса по путевым точкам, выданным RouteManager
     */
    public moveDown(): void {
        const baseSpeed = 1.5; // Скорость полёта дрона

        // Если у дрона есть построенный маршрут в памяти — летим строго по точкам
        if (this.waypoints && this.waypoints.length > 0) {
            // Берём самую первую путевую точку из списка
            const target = this.waypoints.at(0);
            
            if (target) {
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // ЖЁСТКИЙ ФИКС «НЕВИДИМОЙ СТЕНЫ»: 
                // Увеличиваем радиус перехвата точки с 2px до 6px. 
                // Теперь дрон никогда не проскочит триггер и не застрянет!
                if (distance <= 6) {
                    this.waypoints.shift(); // Удаляем выполненную точку, переключаемся на следующую
                    return;
                }

                // Разворачиваем ствол и вектор движения дрона в направлении текущей точки
                this.moveAngle = Math.atan2(dy, dx);
                this.x += Math.cos(this.moveAngle) * baseSpeed;
                this.y += Math.sin(this.moveAngle) * baseSpeed;
            }
        } else {
            // Если маршрут пуст, плавно падаем строго вниз по умолчанию
            this.x += Math.cos(this.moveAngle) * baseSpeed;
            this.y += Math.sin(this.moveAngle) * baseSpeed;
        }
    }
}