import { SimpleInvader } from './SimpleInvader';

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
                invader.visibilityTimer = Math.max(invader.visibilityTimer, 100);
                return;
            }

            if (this.isInsideAttackSector(invader)) {
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