import { SimpleInvader } from './SimpleInvader';
import { Player } from '../services/Player'; // Подключаем класс Player для отправки репортов

export class SimpleRadar {
    public x: number;
    public y: number;
    public name: string;
    
    // Сектор обзора и углы вращения луча РЛС
    public currentAngle: number = -Math.PI / 2;
    public targetAngle: number = -Math.PI / 2;
    public visionRadius: number = 180;
    public rotationSpeed: number = 0.04;
    
    public isTrackingMouse: boolean = false;

    constructor(x: number, y: number, name: string) {
        this.x = x;
        this.y = y;
        this.name = name;
    }

    public startTracking(): void {
        this.isTrackingMouse = true;
    }

    public stopTracking(): void {
        this.isTrackingMouse = false;
    }

    /**
     * Поворот луча радара к целевому направлению патрулирования
     */
    public setTargetDirection(worldX: number, worldY: number): void {
        const dx = worldX - this.x;
        const dy = worldY - this.y;
        this.targetAngle = Math.atan2(dy, dx);
    }

    /**
     * Математический поворот луча за кадр анимации
     */
    public rotate(deltaTime: number): void {
        let diff = this.targetAngle - this.currentAngle;
        
        // Нормализация угла в диапазон [-PI, PI]
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        const maxStep = this.rotationSpeed * (deltaTime / 16.66);
        if (Math.abs(diff) <= maxStep) {
            this.currentAngle = this.targetAngle;
        } else {
            this.currentAngle += Math.sign(diff) * maxStep;
        }
    }

    /**
     * ИСПРАВЛЕНО: Радар сканирует небо и регистрирует обнаруженные цели напрямую у Player
     */
    public scan(invaders: Array<SimpleInvader>, player: Player): void {
        invaders.forEach(invader => {
            const dx = invader.x - this.x;
            const dy = invader.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Проверяем, входит ли дрон в радиус действия РЛС
            if (distance <= this.visionRadius) {
                const angleToInvader = Math.atan2(dy, dx);
                let angleDiff = angleToInvader - this.currentAngle;

                // Нормализация разности углов
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                // Сектор раскрытия луча равен 45 градусам (Math.PI / 4)
                if (Math.abs(angleDiff) <= Math.PI / 4) {
                    // Подсвечиваем дрон (взводим таймер видимости)
                    invader.visibilityTimer = 1000; 

                    // РЕПОРТ В ШТАБ: Мгновенно заносим БПЛА в тактический список целей игрока!
                    player.registerDetectedTarget(invader);
                }
            }
        });
    }
}