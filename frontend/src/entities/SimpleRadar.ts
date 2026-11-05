import { SimpleInvader } from './SimpleInvader';

export class SimpleRadar {
    public x: number;
    public y: number;
    public visionRadius: number = 180;
    public angleDir: number;            
    public fov: number;                 
    public scanLineAngle: number;       
    private rotationSpeed: number;      
    private rotationDirection: number = 1;

    constructor(
        x: number, 
        y: number, 
        angleDir: number = -Math.PI / 2, 
        fovDegrees: number = 90, 
        speed: number = 0.005           
    ) {
        this.x = x;
        this.y = y;
        this.angleDir = angleDir;
        this.scanLineAngle = angleDir;  
        this.fov = fovDegrees * Math.PI / 180;
        this.rotationSpeed = speed;
    }

    public rotate(deltaTime: number): void {
        if (deltaTime <= 0) return;

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