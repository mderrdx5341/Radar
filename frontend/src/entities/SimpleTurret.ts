import { SimpleInvader } from './SimpleInvader';

export class SimpleTurret {
    public x: number;
    public y: number;
    public name: string;
    
    // Оригинальные характеристики пушки ПВО
    public readonly attackRange: number = 70; // Длина конуса обстрела
    public readonly visionRadius: number = 45; // Круг автономного обнаружения в упор
    
    public currentTarget: SimpleInvader | null = null;
    public currentAngle: number = -Math.PI / 2; // При установке смотрит строго вверх
    
    // Внутренняя память точки назначения передислокации
    public targetMoveX: number | null = null;
    public targetMoveY: number | null = null;

    // МЕХАНИКА БОЕКОМПЛЕКТА
    public magazineSize: number = 10;
    public currentAmmo: number = 10;
    public attackInterval: number = 200; 
    public attackTimer: number = 0;
    
    public isReloading: boolean = false;
    public reloadDuration: number = 2000; 
    public reloadTimer: number = 0;

    public isSupplied: boolean = false;
    public hasPenalty: boolean = false;

    constructor(x: number, y: number, name: string) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.targetMoveX = x;
        this.targetMoveY = y;
    }

    public moveTo(targetX: number, targetY: number): void {
        this.targetMoveX = targetX;
        this.targetMoveY = targetY;
    }

    public updateMovement(deltaTime: number): void {
        if (this.targetMoveX !== null && this.targetMoveY !== null) {
            const dx = this.targetMoveX - this.x;
            const dy = this.targetMoveY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 4; 

            if (dist > speed) {
                this.x += (dx / dist) * speed;
                this.y += (dy / dist) * speed;
            } else {
                this.x = this.targetMoveX;
                this.y = this.targetMoveY;
            }
        }

        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            let angleDiff = targetAngle - this.currentAngle;
            angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

            const rotationSpeed = 0.004 * deltaTime;
            if (Math.abs(angleDiff) > rotationSpeed) {
                this.currentAngle += Math.sign(angleDiff) * rotationSpeed;
            } else {
                this.currentAngle = targetAngle;
            }
        }
    }

    public attack(allInvaders: Array<SimpleInvader>, deltaTime: number, hasGlobalRadar: boolean): void {
        if (this.isReloading) {
            this.reloadTimer += deltaTime;
            if (this.reloadTimer >= this.reloadDuration) {
                this.isReloading = false;
                this.reloadTimer = 0;
                const activeMagazineSize = this.hasPenalty ? 5 : this.magazineSize;
                this.currentAmmo = this.isSupplied ? activeMagazineSize : 0;
            }
            return;
        }

        if (this.currentAmmo <= 0) {
            if (this.isSupplied) {
                this.isReloading = true;
            }
            this.currentTarget = null;
            return;
        }

        let bestTarget: SimpleInvader | null = null;
        let minDist = Infinity;

        for (let i = 0; i < allInvaders.length; i++) {
            const invader = allInvaders[i];
            if (invader.hp <= 0) continue;

            const dx = invader.x - this.x;
            const dy = invader.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // КРИТИЧЕСКИЙ ФИКС 1: Обнаружение всенаправленным кругом 45px.
            // ИСПРАВЛЕНО: Убрана запрещенная перезапись invader.isVisible, 
            // взвод таймера на 1 секунду легально включит нативный геттер БПЛА!
            if (dist <= this.visionRadius) {
                invader.visibilityTimer = 1000;
            }

            // Проверка конуса обстрела 70 пикселей
            if (dist <= this.attackRange) {
                const targetAngle = Math.atan2(dy, dx);
                let angleDiff = targetAngle - this.currentAngle;
                angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

                // КРИТИЧЕСКИЙ ФИКС 2: Если БПЛА в направленном конусе обстрела 70px вдоль ствола (fireDiff <= 0.3)
                // ИСПРАВЛЕНО: Зажигаем видимость только через взвод visibilityTimer!
                const isInAttackCone = Math.abs(angleDiff) <= 0.3;
                if (isInAttackCone) {
                    invader.visibilityTimer = 1000;
                }

                const isTargetVisible = invader.isVisible || (dist <= this.visionRadius);
                
                if (isTargetVisible && dist < minDist) {
                    minDist = dist;
                    bestTarget = invader;
                }
            }
        }

        this.currentTarget = bestTarget;

        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            let fireDiff = targetAngle - this.currentAngle;
            fireDiff = Math.atan2(Math.sin(fireDiff), Math.cos(fireDiff));

            // Проверка доворота орудия для ведения стрельбы снарядами
            if (Math.abs(fireDiff) <= 0.3) {
                this.attackTimer += deltaTime;
                if (this.attackTimer >= this.attackInterval) {
                    this.attackTimer = 0;
                    this.currentTarget.hp -= 15;
                    this.currentAmmo--;

                    if (!this.currentTarget.attackers.includes(this as any)) {
                        this.currentTarget.attackers.push(this as any);
                    }

                    if (this.currentAmmo <= 0) {
                        this.isReloading = true;
                        this.currentTarget = null;
                    }
                }
            }
        }
    }
}
