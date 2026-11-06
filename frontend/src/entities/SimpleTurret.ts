import { SimpleInvader } from './SimpleInvader';

export class SimpleTurret {
    public x: number;
    public y: number;
    public name: string;
    
    public visionRadius: number = 45;  
    public attackRange: number = 70;  
    public damagePerFrame: number = 1; // Сделаем 1 для плавного теста угасания HP, либо верните 5
    public angleDir: number;           // Текущий физический угол ствола
    public fov: number;                
    public lockedTarget: SimpleInvader | null = null; 

    private defaultAngle: number;       
    public targetAngle: number;        // НОВОЕ: Целевой угол, куда турель стремится повернуться
    private turnSpeed: number = 0.003;  // НОВОЕ: Скорость поворота ствола (радиан в миллисекунду)

    public targetX: number;            
    public targetY: number;            
    private moveSpeed: number = 0.12;   

    constructor(
        x: number, 
        y: number, 
        name: string = 'Турель-Страж', 
        angleDir: number = -Math.PI / 2, 
        fovDegrees: number = 45
    ) {
        this.x = x;
        this.y = y;
        this.targetX = x; 
        this.targetY = y;
        this.name = name;
        this.angleDir = angleDir;
        this.targetAngle = angleDir; // Изначально смотрим в дефолтную сторону
        this.defaultAngle = angleDir;
        this.fov = fovDegrees * Math.PI / 180;
    }

    public get currentTarget(): SimpleInvader | null {
        return this.lockedTarget;
    }

    public moveTo(targetX: number, targetY: number): void {
        this.targetX = targetX;
        this.targetY = targetY;
    }

    public updateMovement(deltaTime: number): void {
        if (deltaTime <= 0) return;

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const step = this.moveSpeed * deltaTime;
            if (distance <= step) {
                this.x = this.targetX;
                this.y = this.targetY;
            } else {
                this.x += (dx / distance) * step;
                this.y += (dy / distance) * step;
            }
        }
    }

    /**
     * Вспомогательный метод проверки попадания в сектор обстрела
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

    /**
     * Боевой тик с плавным расчетом вращения ствола по времени
     */
    public attack(invaders: SimpleInvader[], deltaTime: number = 16): void {
        // 1. Проверяем старую зафиксированную цель на дальность и живучесть
        if (this.lockedTarget) {
            const isAlive = this.lockedTarget.hp > 0;
            const dx = this.lockedTarget.x - this.x;
            const dy = this.lockedTarget.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (!isAlive || distance > this.attackRange) {
                this.lockedTarget = null;
            }
        }

        // 2. Если турель СВОБОДНА, ищем БЛИЖАЙШУЮ видимую цель на всем поле для автонаведения
        let targetToTrack: SimpleInvader | null = this.lockedTarget;

        if (!targetToTrack) {
            let closestDistance = Infinity; // Начальное бесконечное расстояние

            for (const invader of invaders) {
                if (invader.hp <= 0 || !invader.isVisible) continue;

                const dx = invader.x - this.x;
                const dy = invader.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Если этот враг ближе, чем все предыдущие найденные — запоминаем его
                if (distance < closestDistance) {
                    closestDistance = distance;
                    targetToTrack = invader;
                }
            }
        }

        // 3. РАСЧЕТ ЦЕЛЕВОГО УГЛА: Направляем ствол на выбранную (или ближайшую) цель
        if (targetToTrack) {
            const dx = targetToTrack.x - this.x;
            const dy = targetToTrack.y - this.y;
            this.targetAngle = Math.atan2(dy, dx);
        }

        // 4. ПЛАВНОЕ ВРАЩЕНИЕ СТВОЛА
        if (deltaTime > 0 && this.angleDir !== this.targetAngle) {
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

        // 5. ФИКСАЦИЯ БОЕВОГО ЗАМКА: Захватываем цель, если она зашла в наш боевой сектор
        if (!this.lockedTarget && targetToTrack) {
            if (this.isInsideAttackSector(targetToTrack)) {
                this.lockedTarget = targetToTrack;
            }
        }

        // 6. ОГОНЬ: Наносим урон зафиксированной цели
        if (this.lockedTarget) {
            this.lockedTarget.hp -= this.damagePerFrame;
            if (!this.lockedTarget.attackers.includes(this)) {
                this.lockedTarget.attackers.push(this);
            }
        }
    }
}