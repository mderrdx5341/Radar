import { Waypoint } from './RouteManager';

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
    public moveDown(baseSpeed: number = 1.5): void {
        let desiredAngle = Math.PI / 2;

        if (this.waypoints.length > 0) {
            const currentTarget = this.waypoints[0];
            const dx = currentTarget.x - this.x;
            const dy = currentTarget.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Стираем точку из индивидуального плана, как только долетели до нее
            if (distance < 15) {
                this.waypoints.shift();
            }

            desiredAngle = Math.atan2(dy, dx);
        }

        // Запрет полетов вверх
        if (desiredAngle < 0.05 && desiredAngle > -Math.PI / 2) desiredAngle = 0.05;
        if (desiredAngle > Math.PI - 0.05 || desiredAngle <= -Math.PI / 2) desiredAngle = Math.PI - 0.05;

        let angleDiff = desiredAngle - this.moveAngle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        const clampedTurn = Math.max(-this.turnSpeedMax, Math.min(this.turnSpeedMax, angleDiff));
        this.moveAngle += clampedTurn;

        if (this.moveAngle < 0) this.moveAngle = 0.05;
        if (this.moveAngle > Math.PI) this.moveAngle = Math.PI - 0.05;

        this.x += Math.cos(this.moveAngle) * baseSpeed;
        this.y += Math.sin(this.moveAngle) * baseSpeed;

        if (this.x < 20) {
            this.x = 20;
            this.moveAngle = Math.PI / 2;
        }
        if (this.x > 780) {
            this.x = 780;
            this.moveAngle = Math.PI / 2;
        }
    }
}