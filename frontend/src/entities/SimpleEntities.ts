export class SimpleInvader {
    public x: number;
    public y: number;
    public radius: number = 10;
    public hp: number = 100;
    
    // Вместо boolean вводим таймер послесвечения в миллисекундах
    public visibilityTimer: number = 0; 

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Враг считается видимым, пока таймер послесвечения больше нуля
     */
    public get isVisible(): boolean {
        return this.visibilityTimer > 0;
    }

    /**
     * Плавно уменьшает время видимости врага на величину deltaTime
     */
    public updateVisibility(deltaTime: number): void {
        if (deltaTime <= 0) return;
        this.visibilityTimer = Math.max(0, this.visibilityTimer - deltaTime);
    }
}

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

            // 1. Проверяем дальность действия радара
            if (distance <= this.visionRadius) {
                const angleToInvader = Math.atan2(dy, dx);
                
                // Проверяем, находится ли враг ВНУТРИ самого 90-градусного сектора
                let sectorDiff = angleToInvader - this.angleDir;
                while (sectorDiff < -Math.PI) sectorDiff += Math.PI * 2;
                while (sectorDiff > Math.PI) sectorDiff -= Math.PI * 2;

                const halfFov = this.fov / 2;

                if (Math.abs(sectorDiff) <= halfFov) {
                    // --- ВРАГ ВНУТРИ СЕКТОРА ---
                    // Проверяем разность углов между БЫСТРЫМ ЛУЧОМ развёртки и врагом
                    let beamDiff = angleToInvader - this.scanLineAngle;
                    while (beamDiff < -Math.PI) beamDiff += Math.PI * 2;
                    while (beamDiff > Math.PI) beamDiff -= Math.PI * 2;

                    const beamThickness = 0.08;
                    if (Math.abs(beamDiff) <= beamThickness) {
                        // Луч задел врага — включаем послесвечение
                        invader.visibilityTimer = 1500; 
                    }
                } else {
                    // --- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: ВРАГ ВЫШЕЛ ЗА ГРАНИЦЫ СЕКТОРА УГЛА ---
                    // Если враг внутри радиуса, но сместился по X за пределы 90 градусов — мгновенно гасим его
                    invader.visibilityTimer = 0;
                }
            }
        });
    }
}

export class SimpleTurret {
    public x: number;
    public y: number;
    public visionRadius: number = 90;  
    public attackRange: number = 160;  
    public damagePerFrame: number = 1;
    public angleDir: number;           
    public fov: number;                
    public lockedTarget: SimpleInvader | null = null; 

    private defaultAngle: number;       

    constructor(x: number, y: number, angleDir: number = -Math.PI / 2, fovDegrees: number = 45) {
        this.x = x;
        this.y = y;
        this.angleDir = angleDir;
        this.defaultAngle = angleDir;
        this.fov = fovDegrees * Math.PI / 180;
    }

    public get currentTarget(): SimpleInvader | null {
        return this.lockedTarget;
    }

    private isInsideAttackSector(invader: SimpleInvader): boolean {
        const dx = invader.x - this.x;
        const dy = invader.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > this.attackRange) return false;

        const angleToInvader = Math.atan2(dy, dx);
        let angleDiff = angleToInvader - this.angleDir;

        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        return Math.abs(angleDiff) <= this.fov / 2;
    }

    public scan(invaders: SimpleInvader[]): void {
        invaders.forEach(invader => {
            if (invader.hp <= 0) return;

            const dx = invader.x - this.x;
            const dy = invader.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.visionRadius) {
                // Если враг вошёл в ближний круг — он подсвечивается постоянно (даём 100 мс на этот кадр)
                invader.visibilityTimer = Math.max(invader.visibilityTimer, 100);
                return;
            }

            if (this.isInsideAttackSector(invader)) {
                // Если враг в секторе атаки — он также подсвечивается на этот кадр
                invader.visibilityTimer = Math.max(invader.visibilityTimer, 100);
            }
        });
    }

    public attack(invaders: SimpleInvader[]): void {
        if (this.lockedTarget) {
            const isAlive = this.lockedTarget.hp > 0;
            const dx = this.lockedTarget.x - this.x;
            const dy = this.lockedTarget.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (!isAlive || distance > this.attackRange) {
                this.lockedTarget = null;
            }
        }

        let targetToTrack: SimpleInvader | null = this.lockedTarget;

        if (!targetToTrack) {
            for (const invader of invaders) {
                if (invader.hp > 0 && invader.isVisible) {
                    targetToTrack = invader;
                    break; 
                }
            }
        }

        if (targetToTrack) {
            const dx = targetToTrack.x - this.x;
            const dy = targetToTrack.y - this.y;
            this.angleDir = Math.atan2(dy, dx);
        } else {
            this.angleDir = this.defaultAngle;
        }

        if (!this.lockedTarget && targetToTrack) {
            if (this.isInsideAttackSector(targetToTrack)) {
                this.lockedTarget = targetToTrack;
            }
        }

        if (this.lockedTarget) {
            this.lockedTarget.hp -= this.damagePerFrame;
        }
    }
}