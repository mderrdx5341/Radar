import { SimpleInvader } from './SimpleInvader';
import { Player } from '../services/Player';

export class SimpleRadar {
    public x: number;
    public y: number;
    public name: string;
    
    // Углы вращения луча РЛС
    public currentAngle: number = -Math.PI / 2;
    public targetAngle: number = -Math.PI / 2;
    public visionRadius: number = 180;
    public rotationSpeed: number = 0.04;
    
    // Оставляем свойство для совместимости с типами, но в логике движения его больше не проверяем
    public isTrackingMouse: boolean = false;

    constructor(x: number, y: number, name: string) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.currentAngle = -Math.PI / 2;
        this.targetAngle = -Math.PI / 2;
    }

    public startTracking(): void {
        this.isTrackingMouse = true;
    }

    public stopTracking(): void {
        this.isTrackingMouse = false;
    }

    /**
     * Задание ЖЕЛАЕМОГО угла наведения луча (worldMouse)
     */
    public setTargetDirection(worldX: number, worldY: number): void {
        const dx = worldX - this.x;
        const dy = worldY - this.y;
        this.targetAngle = Math.atan2(dy, dx);
    }

    /**
     * ЖЕСТКИЙ ФИКС: Метод покадрового поворота луча РЛС. 
     * Он обязан работать ВСЕГДА, когда targetAngle меняется контроллером!
     */
    public rotate(deltaTime: number): void {
        let diff = this.targetAngle - this.currentAngle;
        
        // Тригонометрическая нормализация разности углов в диапазон [-PI, PI]
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
     * Сканирование неба и репорт обнаруженных БПЛА в штаб Player
     */
    public scan(invaders: Array<SimpleInvader>, player: Player): void {
        invaders.forEach(invader => {
            const dx = invader.x - this.x;
            const dy = invader.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.visionRadius) {
                const angleToInvader = Math.atan2(dy, dx);
                let angleDiff = angleToInvader - this.currentAngle;

                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                // Сектор раскрытия луча равен 45 градусам (Math.PI / 4)
                if (Math.abs(angleDiff) <= Math.PI / 4) {
                    invader.visibilityTimer = 1000; // Подсвечиваем БПЛА
                    player.registerDetectedTarget(invader); // Репортим игроку
                }
            }
        });
    }
}
