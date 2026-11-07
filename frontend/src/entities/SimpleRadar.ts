import { SimpleInvader } from './SimpleInvader';

export class SimpleRadar {
    public x: number;
    public y: number;
    public name: string;
    
    // ВЫВЕРЕННЫЕ НАСТРОЙКИ: 180 пикселей базовый радиус
    public visionRadius: number = 180;
    public detectionRadius: number = 180;
    
    public currentAngle: number = -Math.PI / 2; // Смотрит строго вверх при постройке

    public isTrackingMouse: boolean = false;
    public targetAngle: number = -Math.PI / 2;
    public isPowered: boolean = true;

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
     * ИСПРАВЛЕНО ДЛЯ ЗАЖАТИЯ: Каждый раз, когда контроллер передаёт новые координаты из handleMouseMove,
     * мы обновляем цель И ПРИНУДИТЕЛЬНО взводим флаг движения приводов!
     */
    public setTargetDirection(targetX: number, targetY: number): void {
        this.targetAngle = Math.atan2(targetY - this.y, targetX - this.x);
        this.isTrackingMouse = true; // <-- ВОТ ЭТОТ ФЛАГ ОЖИВИТ ЗАЖАТИЕ МЫШИ!
    }

    /**
     * ПЛАВНЫЙ И НЕПРЕРЫВНЫЙ ПОВОРОТ ЛУЧА (ДЛЯ handleRightClick И handleMouseMove)
     */
    public rotate(deltaTime: number): void {
        if (!this.isPowered) return;

        if (this.isTrackingMouse) {
            let angleDiff = this.targetAngle - this.currentAngle;
            angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
            
            // Скорость доводки приводов РЛС
            const rotationSpeed = 0.002 * deltaTime;
            
            if (Math.abs(angleDiff) > rotationSpeed) {
                this.currentAngle += Math.sign(angleDiff) * rotationSpeed;
            } else {
                // Если антенна догнала целевой угол мышки и кнопка отпущена, 
                // фиксируем направление. Если мышь всё ещё зажата — движение продолжится.
                this.currentAngle = this.targetAngle;
            }
        }

        // Коррекция диапазона радиан [0, 2*PI]
        if (this.currentAngle > Math.PI * 2) this.currentAngle -= Math.PI * 2;
        if (this.currentAngle < 0) this.currentAngle += Math.PI * 2;
    }

    public scan(allInvaders: Array<SimpleInvader>, player: any): void {
        if (!this.isPowered) return;
        
        for (let i = 0; i < allInvaders.length; i++) {
            const invader = allInvaders[i];
            if (invader.hp <= 0) continue;

            const dx = invader.x - this.x;
            const dy = invader.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.detectionRadius) {
                const angleToInvader = Math.atan2(dy, dx);
                let angleDiff = angleToInvader - this.currentAngle;
                angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

                if (Math.abs(angleDiff) <= Math.PI / 4) {
                    invader.visibilityTimer = 1000;
                    if (player && typeof player.registerDetectedTarget === 'function') {
                        player.registerDetectedTarget(invader);
                    }
                }
            }
        }
    }
}
