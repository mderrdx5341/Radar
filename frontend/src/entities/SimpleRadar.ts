import { SimpleInvader } from './SimpleInvader';

export class SimpleRadar {
    public x: number;
    public y: number;
    public name: string;
    public visionRadius: number = 180;
    public angleDir: number;            
    public fov: number;                 
    public scanLineAngle: number;       
    private rotationSpeed: number;      
    private rotationDirection: number = 1;

    public targetAngle: number;         
    private turnSpeed: number = 0.003;  

    // --- НОВОЕ: СОСТОЯНИЕ РУЧНОГО УДЕРЖАНИЯ СЕКТОРА ---
    public isTrackingMouse: boolean = false; 

    constructor(
        x: number, 
        y: number, 
        name: string = 'РЛС-Альфа',
        angleDir: number = -Math.PI / 2, 
        fovDegrees: number = 90, 
        speed: number = 0.0025
    ) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.angleDir = angleDir;
        this.scanLineAngle = angleDir;  
        this.targetAngle = angleDir; 
        this.fov = fovDegrees * Math.PI / 180;
        this.rotationSpeed = speed;
    }

    /**
     * Включает режим следования за курсором
     */
    public startTracking(): void {
        this.isTrackingMouse = true;
    }

    /**
     * Выключает режим следования за курсором (фиксация направления)
     */
    public stopTracking(): void {
        this.isTrackingMouse = false;
    }

    public setTargetDirection(mouseX: number, mouseY: number): void {
        this.targetAngle = Math.atan2(mouseY - this.y, mouseX - this.x);
    }

    public rotate(deltaTime: number): void {
        if (deltaTime <= 0) return;

        // ПЛАВНЫЙ ПОВОРОТ: сектор крутится, только если угол не совпадает с целью
        if (this.angleDir !== this.targetAngle) {
            let angleDiff = this.targetAngle - this.angleDir;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

            const step = this.turnSpeed * deltaTime;
            if (Math.abs(angleDiff) <= step) {
                this.angleDir = this.targetAngle;
            } else {
                this.angleDir += Math.sign(angleDiff) * step;
            }
        }

        // ВРАЩЕНИЕ ВНУТРЕННЕГО ЛУЧА
        this.scanLineAngle += this.rotationSpeed * deltaTime * this.rotationDirection;
        let diff = this.scanLineAngle - this.angleDir;

        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        const halfFov = this.fov / 2;
        if (Math.abs(diff) >= halfFov) {
            this.rotationDirection *= -1;
            this.scanLineAngle = this.angleDir + halfFov * Math.sign(diff);
        }
    }

    public scan(invaders: SimpleInvader[]): void {
        invaders.forEach(invader => {
            const dx = invader.x - this.x;
            const dy = invader.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.visionRadius) {
                const angleToInvader = Math.atan2(dy, dx);
                let sectorDiff = angleToInvader - this.angleDir;
                while (sectorDiff < -Math.PI) sectorDiff += Math.PI * 2;
                while (sectorDiff > Math.PI) sectorDiff -= Math.PI * 2;

                const halfFov = this.fov / 2;

                if (Math.abs(sectorDiff) <= halfFov) {
                    let beamDiff = angleToInvader - this.scanLineAngle;
                    while (beamDiff < -Math.PI) beamDiff += Math.PI * 2;
                    while (beamDiff > Math.PI) beamDiff -= Math.PI * 2;

                    const beamThickness = 0.08;
                    if (Math.abs(beamDiff) <= beamThickness) {
                        invader.visibilityTimer = 1500; 
                    }
                } else {
                    invader.visibilityTimer = 0;
                }
            }
        });
    }
}