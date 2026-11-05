import { SimpleInvader } from './SimpleInvader';

export class SimpleTurret {
    public x: number;
    public y: number;
    public name: string;
    
    public visionRadius: number = 45;  
    public attackRange: number = 70;  
    public damagePerFrame: number = 5;
    public angleDir: number;           
    public fov: number;                
    public lockedTarget: SimpleInvader | null = null; 

    private defaultAngle: number;       

    // --- ПАРАМЕТРЫ ПЕРЕДВИЖЕНИЯ ТУРЕЛИ ---
    public targetX: number;            // Координата X, куда едет турель
    public targetY: number;            // Координата Y, куда едет турель
    private moveSpeed: number = 0.12;   // Скорость движения (пикселей в миллисекунду)

    constructor(
        x: number, 
        y: number, 
        name: string = 'Турель-Страж', 
        angleDir: number = -Math.PI / 2, 
        fovDegrees: number = 45
    ) {
        this.x = x;
        this.y = y;
        this.targetX = x; // Изначально цель совпадает с текущим местом
        this.targetY = y;
        this.name = name;
        this.angleDir = angleDir;
        this.defaultAngle = angleDir;
        this.fov = fovDegrees * Math.PI / 180;
    }

    public get currentTarget(): SimpleInvader | null {
        return this.lockedTarget;
    }

    /**
     * Приказ начать движение к новым координатам
     */
    public moveTo(targetX: number, targetY: number): void {
        this.targetX = targetX;
        this.targetY = targetY;
    }

    /**
     * Плавно передвигает турель к целевой точке в зависимости от deltaTime
     */
    public updateMovement(deltaTime: number): void {
        if (deltaTime <= 0) return;

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const step = this.moveSpeed * deltaTime;
            if (distance <= step) {
                // Если мы очень близко — мгновенно встаем в цель, чтобы не проскочить
                this.x = this.targetX;
                this.y = this.targetY;
            } else {
                // Передвигаемся по вектору направления
                this.x += (dx / distance) * step;
                this.y += (dy / distance) * step;
            }
        }
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
            const distance = Math.sqrt(dx * Math.sqrt(dx * dx + dy * dy)); // Фикс Пифагора

            const realDist = Math.sqrt(dx * dx + dy * dy);

            if (realDist <= this.visionRadius) {
                invader.visibilityTimer = Math.max(invader.visibilityTimer, 100);
                return;
            }

            if (this.isInsideAttackSector(invader)) {
                invader.visibilityTimer = Math.max(invader.visibilityTimer, 100);
            }
        });
    }

    public attack(invaders: SimpleInvader[]): void {
        // 1. Проверяем старую зафиксированную цель
        if (this.lockedTarget) {
            const isAlive = this.lockedTarget.hp > 0;
            const dx = this.lockedTarget.x - this.x;
            const dy = this.lockedTarget.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (!isAlive || distance > this.attackRange) {
                this.lockedTarget = null;
            }
        }

        // 2. Если турель СВОБОДНА, ищем любую видимую цель на поле
        let targetToTrack: SimpleInvader | null = this.lockedTarget;

        if (!targetToTrack) {
            for (const invader of invaders) {
                if (invader.hp > 0 && invader.isVisible) {
                    targetToTrack = invader;
                    break; 
                }
            }
        }

        // 3. Автонаведение ствола
        if (targetToTrack) {
            const dx = targetToTrack.x - this.x;
            const dy = targetToTrack.y - this.y;
            this.angleDir = Math.atan2(dy, dx);
        } else {
            this.angleDir = this.defaultAngle;
        }

        // 4. Фиксируем боевой замок лазера
        if (!this.lockedTarget && targetToTrack) {
            if (this.isInsideAttackSector(targetToTrack)) {
                this.lockedTarget = targetToTrack;
            }
        }

        // 5. НАНЕСЕНИЕ УРОНА (ИСПРАВЛЕНО: используем динамическое свойство класса)
        if (this.lockedTarget) {
            this.lockedTarget.hp -= this.damagePerFrame; 
        }
    }
}