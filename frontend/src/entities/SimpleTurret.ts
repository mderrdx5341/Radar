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
    public reloadProgress: number = 0; // Прогресс перезарядки от 0 до 1

    // НОВОЕ: Таймер тактической дозарядки в режиме затишья
    public idleReloadTimer: number = 0;
    public readonly idleReloadDelay: number = 3000; // Пауза до начала дозарядки (3 секунды)

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

    /**
     * МОДЕРНИЗИРОВАННЫЙ ОГНЕВОЙ ТИК С АВТОДОЗАРЯДКОЙ В ЗАТИШЬЕ
     */
    public attack(allInvaders: Array<SimpleInvader>, deltaTime: number, hasGlobalRadar: boolean): void {
        // 1. Конвейер дозарядки ленты со Склада боеприпасов
        if (this.isReloading) {
            this.reloadTimer += deltaTime;
            this.reloadProgress = Math.min(1, this.reloadTimer / this.reloadDuration);

            if (this.reloadTimer >= this.reloadDuration) {
                this.isReloading = false;
                this.reloadTimer = 0;
                this.reloadProgress = 0;
                this.idleReloadTimer = 0; // Сбрасываем таймер затишья
                
                const activeMagazineSize = this.hasPenalty ? 5 : this.magazineSize;
                this.currentAmmo = this.isSupplied ? activeMagazineSize : 0;
            }
            return;
        } else {
            this.reloadProgress = 0;
        }

        // Если магазин пуст, принудительно уходим на перезарядку (если есть склад)
        if (this.currentAmmo <= 0) {
            if (this.isSupplied) {
                this.isReloading = true;
            }
            this.currentTarget = null;
            return;
        }

        // 2. Сканирование и захват целей
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

        // 3. Обработка стрельбы или накопления таймера затишья
        if (this.currentTarget) {
            // Цель есть: сбрасываем таймер затишья, пушка воюет
            this.idleReloadTimer = 0;

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

                    if (this.currentAmmo <= 0) {
                        this.isReloading = true;
                        this.currentTarget = null;
                    }
                }
            }
        } else {
            // ИСПРАВЛЕНО (ТАКТИЧЕСКАЯ ДОЗАРЯДКА): Целей нет. 
            // Если магазин не полон и пушка подключена к складу — запускаем таймер покоя!
            const maxCapacity = this.hasPenalty ? 5 : this.magazineSize;
            
            if (this.currentAmmo < maxCapacity && this.isSupplied) {
                this.idleReloadTimer += deltaTime;
                
                // Если затишье длится дольше 3 секунд — запускаем автоматическую смену ленты!
                if (this.idleReloadTimer >= this.idleReloadDelay) {
                    this.isReloading = true;
                    this.attackTimer = 0;
                    console.log(`[Автоматика ПВО]: Наступило затишье. Запущена тактическая дозарядка ленты.`);
                }
            } else {
                this.idleReloadTimer = 0; // Магазин полный — таймер покоя отдыхает
            }
        }
    }
}
