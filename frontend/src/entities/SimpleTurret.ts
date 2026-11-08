import { SimpleInvader } from './SimpleInvader';

export class SimpleTurret {
    public x: number;
    public y: number;
    public name: string;
    
    public readonly attackRange: number = 70; 
    public readonly visionRadius: number = 45; 
    
    public currentTarget: SimpleInvader | null = null;
    public currentAngle: number = -Math.PI / 2; 
    
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
    public reloadProgress: number = 0; 

    public idleReloadTimer: number = 0;
    public readonly idleReloadDelay: number = 3000; 

    public isSupplied: boolean = false;
    public hasPenalty: boolean = false; // Флаг перегрузки склада, теперь влияет рантайм!

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
        // Вычисляем текущий динамический потолок магазина (10 в норме, 5 при общем дефиците склада)
        const currentMaxCapacity = this.hasPenalty ? 5 : this.magazineSize;

        // 1. Конвейер дозарядки ленты со Склада боеприпасов
        if (this.isReloading) {
            this.reloadTimer += deltaTime;
            this.reloadProgress = Math.min(1, this.reloadTimer / this.reloadDuration);

            if (this.reloadTimer >= this.reloadDuration) {
                this.isReloading = false;
                this.reloadTimer = 0;
                this.reloadProgress = 0;
                this.idleReloadTimer = 0; 
                
                // После честной перезарядки пушка получает строго дефицитный лимит (5) или норму (10)
                this.currentAmmo = this.isSupplied ? currentMaxCapacity : 0;
            }
            return;
        } else {
            this.reloadProgress = 0;
        }

        // НЮАНС: Пушка уходит на экстренную дозарядку по нулю ПАТРОНОВ только если у неё нет излишков БК
        if (this.currentAmmo <= 0) {
            if (this.isSupplied) {
                this.isReloading = true;
            }
            this.currentTarget = null;
            return;
        }

        // 2. Сканирование неба и захват целей
        let bestTarget: SimpleInvader | null = null;
        let minDist = Infinity;

        for (let i = 0; i < allInvaders.length; i++) {
            const invader = allInvaders[i];
            if (invader.hp <= 0) continue;

            const dx = invader.x - this.x;
            const dy = invader.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= this.visionRadius) {
                invader.visibilityTimer = 1000;
            }

            if (dist <= this.attackRange) {
                const targetAngle = Math.atan2(dy, dx);
                let angleDiff = targetAngle - this.currentAngle;
                angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

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

        // 3. Боевой тик или накопление таймера тактического затишья
        if (this.currentTarget) {
            this.idleReloadTimer = 0; // Идет бой, таймер покоя сброшен

            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            let fireDiff = targetAngle - this.currentAngle;
            fireDiff = Math.atan2(Math.sin(fireDiff), Math.cos(fireDiff));

            if (Math.abs(fireDiff) <= 0.3) {
                this.attackTimer += deltaTime;
                if (this.attackTimer >= this.attackInterval) {
                    this.attackTimer = 0;
                    this.currentTarget.hp -= 15;
                    this.currentAmmo--;

                    if (!this.currentTarget.attackers.includes(this as any)) {
                        this.currentTarget.attackers.push(this as any);
                    }

                    // Если расстреляли всё до нуля — уходим на перезарядку
                    if (this.currentAmmo <= 0) {
                        this.isReloading = true;
                        this.currentTarget = null;
                    }
                }
            }
        } else {
            // =========================================================================
            // НЮАНСЫ ИГРОКА: ЛОГИКА ТАКТИЧЕСКОЙ ДОЗАРЯДКИ С УЧЕТОМ ДЕФИЦИТА
            // =========================================================================
            if (this.isSupplied) {
                // Перезарядка в затишье разрешена ТОЛЬКО если текущих патронов МЕНЬШЕ, 
                // чем склад физически готов нам выдать в текущем состоянии нагрузки!
                // Если у нас 10 или 7 патронов, а текущий лимит дефицита склада равен 5:
                // Условие (7 < 5) выдаст false — перезарядка НЕ НАЧНЕТСЯ, излишки патронов не сгорят!
                if (this.currentAmmo < currentMaxCapacity) {
                    this.idleReloadTimer += deltaTime;
                    
                    if (this.idleReloadTimer >= this.idleReloadDelay) {
                        this.isReloading = true;
                        this.attackTimer = 0;
                        console.log(`[Автоматика ПВО]: Патроны ниже лимита (${this.currentAmmo} < ${currentMaxCapacity}). Перезарядка.`);
                    }
                } else {
                    this.idleReloadTimer = 0; // Излишков БК хватает или магазин полон
                }
            } else {
                this.idleReloadTimer = 0;
            }
        }
    }
}
