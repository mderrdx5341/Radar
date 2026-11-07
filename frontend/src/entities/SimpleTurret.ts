import { SimpleInvader } from './SimpleInvader';

export class SimpleTurret {
    public x: number;
    public y: number;
    public name: string;
    
    // ТАКТИЧЕСКИЕ ПАРАМЕТРЫ ДВУХКОНТУРНОЙ СИСТЕМЫ ПВО
    public readonly attackRange: number = 70; // Максимальная дальность лазера (длина конуса обстрела)
    public readonly visionRadius: number = 45; // Малый автономный круговой радиус («слепая зона»)
    
    public currentTarget: SimpleInvader | null = null;

    // ФИЗИКА ВРАЩЕНИЯ БАШНИ И ПРИВОДОВ СТВОЛА
    public currentAngle: number = -Math.PI / 2; // Куда ствол смотрит физически прямо сейчас
    private targetAngle: number = -Math.PI / 2;  // Куда приводы пытаются повернуть ствол
    private rotationSpeed: number = 0.05;        // Скорость наведения (радиан за кадр)

    // ПЕРЕМЕННЫЕ ПЛАВНОГО ПЕРЕМЕЩЕНИЯ КОРПУСА ТУРЕЛИ ПКМ
    private targetX: number;
    private targetY: number;
    private isMoving: boolean = false;
    private moveSpeed: number = 4; 
    
    private attackTimer: number = 0;
    private readonly attackInterval: number = 300; 

    constructor(x: number, y: number, name: string) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.name = name;
        this.currentAngle = -Math.PI / 2;
        this.targetAngle = -Math.PI / 2;
    }

    public moveTo(targetX: number, targetY: number): void {
        this.targetX = targetX;
        this.targetY = targetY;
        this.isMoving = true;
    }

    /**
     * Плавный покадровый сдвиг корпуса и доворот ствола пушки ПВО
     */
    public updateMovement(deltaTime: number): void {
        const timeFactor = deltaTime / 16.66; 

        // 1. Движение корпуса по карте
        if (this.isMoving) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const step = this.moveSpeed * timeFactor;

            if (dist <= step) {
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
            } else {
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * step;
                this.y += Math.sin(angle) * step;
            }
        }

        // 2. ИСПРАВЛЕНО: Честный покадровый доворот башни ствола к targetAngle без бесконечных циклов!
        let angleDiff = this.targetAngle - this.currentAngle;
        
        // Нормализация разности углов в тригонометрический диапазон [-PI, PI]
        while (angleDiff < -Math.PI) {
            angleDiff += Math.PI * 2;
        }
        while (angleDiff > Math.PI) {
            angleDiff -= Math.PI * 2;
        }

        const maxRotationStep = this.rotationSpeed * timeFactor;
        if (Math.abs(angleDiff) <= maxRotationStep) {
            this.currentAngle = this.targetAngle;
        } else {
            this.currentAngle += Math.sign(angleDiff) * maxRotationStep;
        }
    }

       /**
     * Боевая фаза: Сверхскоростной поиск цели без тригонометрических перегрузок CPU
     */
    public attack(visibleTargets: Array<SimpleInvader>, deltaTime: number): void {
        // 1. ПРОВЕРКА ПОТЕРЯНОЙ ИЛИ СБИТОЙ ЦЕЛИ
        if (this.currentTarget && (this.currentTarget.hp <= 0 || !this.currentTarget.isVisible)) {
            this.currentTarget = null;
        }

        if (this.currentTarget) {
            const dist = Math.sqrt((this.currentTarget.x - this.x) ** 2 + (this.currentTarget.y - this.y) ** 2);
            if (dist > this.attackRange) {
                this.currentTarget = null;
            }
        }

        // 2. ИСПРАВЛЕНО (ЗАЩИТА ОТ ФРИЗОВ): Быстрый ленивый захват цели
        if (!this.currentTarget) {
            let selectedInvader: SimpleInvader | null = null;
            let closestDist = Infinity;

            for (let i = 0; i < visibleTargets.length; i++) {
                const invader = visibleTargets[i];
                if (invader.hp <= 0) continue;

                // БЫСТРЫЙ ФИЛЬТР: Сначала проверяем грубое расстояние по осям (AABB), без Math.sqrt!
                const dx = invader.x - this.x;
                const dy = invader.y - this.y;
                if (Math.abs(dx) > this.attackRange || Math.abs(dy) > this.attackRange) {
                    continue; // Дрон слишком далеко, процессор даже не будет считать для него тригонометрию!
                }

                // Если дрон близко — считаем честное расстояние
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Условие А: Автономная слепая зона (45px)
                const inBlindZone = dist <= this.visionRadius;
                if (inBlindZone) {
                    invader.visibilityTimer = 1000; // Подсвечиваем сами
                }

                // Условие Б: Конус обстрела (Вычисляем Math.atan2 ТОЛЬКО для близких дронов!)
                let inAttackCone = false;
                if (dist <= this.attackRange && invader.isVisible) {
                    const angleToInvader = Math.atan2(dy, dx);
                    let angleDiff = angleToInvader - this.currentAngle;
                    
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    
                    inAttackCone = Math.abs(angleDiff) <= (Math.PI / 4);
                }

                if ((inBlindZone || inAttackCone) && dist < closestDist) {
                    closestDist = dist;
                    selectedInvader = invader;
                }
            }

            if (selectedInvader) {
                this.currentTarget = selectedInvader;
            }
        }

        // 3. ФАЗА НАВЕДЕНИЯ СТВОЛА И УПРЕЖДЕНИЯ
        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            this.targetAngle = Math.atan2(dy, dx);
        } else {
            // Упреждение по данным РЛС для ближайшего видимого врага
            let nearestEnemy: SimpleInvader | null = null;
            let minDistance = Infinity;

            for (let i = 0; i < visibleTargets.length; i++) {
                const invader = visibleTargets[i];
                if (!invader.isVisible || invader.hp <= 0) continue;

                const dist = Math.sqrt((invader.x - this.x) ** 2 + (invader.y - this.y) ** 2);
                if (dist < minDistance && dist < 400) { // Ограничиваем радиус упреждения РЛС, чтобы не грузить CPU
                    minDistance = dist;
                    nearestEnemy = invader;
                }
            }

            if (nearestEnemy) {
                const dx = (nearestEnemy as SimpleInvader).x - this.x;
                const dy = (nearestEnemy as SimpleInvader).y - this.y;
                this.targetAngle = Math.atan2(dy, dx); 
            } else {
                this.targetAngle = this.currentAngle;
            }
        }

        // 4. ОГНЕВОЙ ЗАЛП ЛАЗЕРА (Только при точной доводке ствола)
        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const currentTargetAngle = Math.atan2(dy, dx);

            let fireDiff = currentTargetAngle - this.currentAngle;
            
            fireDiff = Math.atan2(Math.sin(fireDiff), Math.cos(fireDiff));

            if (Math.abs(fireDiff) <= 0.15) {
                this.attackTimer += deltaTime;
                if (this.attackTimer >= this.attackInterval) {
                    this.attackTimer = 0;
                    this.currentTarget.hp -= 20; 

                    if (!this.currentTarget.attackers.includes(this)) {
                        this.currentTarget.attackers.push(this);
                    }
                }
            }
        }
    }
}