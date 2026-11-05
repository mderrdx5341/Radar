export class SimpleInvader {
    public x: number;
    public y: number;
    public radius: number = 10;
    public isVisible: boolean = false;
    public hp: number = 100;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export class SimpleRadar {
    public x: number;
    public y: number;
    public visionRadius: number = 180;
    public angleDir: number;
    public fov: number;

    constructor(x: number, y: number, angleDir: number = -Math.PI / 2, fovDegrees: number = 45) {
        this.x = x;
        this.y = y;
        this.angleDir = angleDir; 
        this.fov = fovDegrees * Math.PI / 180;
    }

    // ИСПРАВЛЕНО: Добавлены квадратные скобки [] для массива
    public scan(invaders: SimpleInvader[]): void {
        invaders.forEach(invader => {
            const dx = invader.x - this.x;
            const dy = invader.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.visionRadius) {
                const angleToInvader = Math.atan2(dy, dx);
                let angleDiff = angleToInvader - this.angleDir;

                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                if (Math.abs(angleDiff) <= this.fov / 2) {
                    invader.isVisible = true;
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

    /**
     * Вспомогательный метод для проверки, попадает ли враг в текущий боевой конус атаки
     */
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

    /**
     * ШАГ 1: Пассивный обзор турели.
     * Раскрывает туман войны ЕСЛИ враг в ближнем круге ИЛИ в длинном секторе обстрела
     */
    public scan(invaders: SimpleInvader[]): void {
        invaders.forEach(invader => {
            if (invader.hp <= 0) return;

            const dx = invader.x - this.x;
            const dy = invader.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Условие 1: Враг в ближнем круге на 360 градусов
            if (distance <= this.visionRadius) {
                invader.isVisible = true;
                return;
            }

            // Условие 2: Враг в длинном секторе обстрела (45 градусов)
            if (this.isInsideAttackSector(invader)) {
                invader.isVisible = true;
            }
        });
    }

    /**
     * ШАГ 2: Боевая логика — ведение огня строго по зафиксированной цели в секторе
     */
    public attack(invaders: SimpleInvader[]): void {
        // Проверяем старую зафиксированную цель
        if (this.lockedTarget) {
            const isAlive = this.lockedTarget.hp > 0;
            const inSector = this.isInsideAttackSector(this.lockedTarget);
            
            if (!isAlive || !inSector) {
                this.lockedTarget = null;
            }
        }

        // Ищем цель для автонаведения (любой видимый враг на поле)
        let targetToTrack: SimpleInvader | null = this.lockedTarget;

        if (!targetToTrack) {
            for (const invader of invaders) {
                if (invader.hp > 0 && invader.isVisible) {
                    targetToTrack = invader;
                    break; 
                }
            }
        }

        // Поворачиваем ствол к видимой цели
        if (targetToTrack) {
            const dx = targetToTrack.x - this.x;
            const dy = targetToTrack.y - this.y;
            this.angleDir = Math.atan2(dy, dx);
        } else {
            this.angleDir = this.defaultAngle;
        }

        // Фиксируем боевой замок лазера, если цель в секторе обстрела
        if (!this.lockedTarget && targetToTrack) {
            if (this.isInsideAttackSector(targetToTrack)) {
                this.lockedTarget = targetToTrack;
            }
        }

        // Наносим урон
        if (this.lockedTarget) {
            this.lockedTarget.hp -= this.damagePerFrame;
        }
    }
}