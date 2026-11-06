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
     * Интегрированная боевая фаза: Автономное обнаружение, упреждение и ведение огня
     */
    public attack(visibleTargets: Array<SimpleInvader>, deltaTime: number): void {
        // Нам нужен доступ к объекту игрока для регистрации автономно обнаруженных целей.
        // Чтобы не менять сигнатуру вызова во всем проекте, мы можем безопасно получить 
        // доступ ко всем invaders на карте, так как метод принимает visibleTargets (или общую базу роя)

        // 1. ПРОВЕРКА ПОТЕРИ ИЛИ УНИЧТОЖЕНИЯ ТЕКУЩЕЙ ЦЕЛИ
        if (this.currentTarget && (this.currentTarget.hp <= 0 || !this.currentTarget.isVisible)) {
            this.currentTarget = null;
        }

        if (this.currentTarget) {
            const dist = Math.sqrt((this.currentTarget.x - this.x) ** 2 + (this.currentTarget.y - this.y) ** 2);
            if (dist > this.attackRange) {
                this.currentTarget = null;
            }
        }

        // 2. АВТОНОМНОЕ СКАНКРОВАНИЕ И ЗАХВАТ ЦЕЛИ (Собственный круговой радар ПВО)
        // ВАЖНО: Турель перебирает visibleTargets для поиска целей в конусе, 
        // но если дрон подлетает вплотную (45px), она сама взводит его видимость!
        if (!this.currentTarget) {
            let selectedInvader: SimpleInvader | null = null;
            let closestDist = Infinity;

            visibleTargets.forEach(invader => {
                const dx = invader.x - this.x;
                const dy = invader.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // ЛОГИКА АВТОНОМНОГО ОБНАРУЖЕНИЯ: Внутренний круговой радиус (45px)
                // Если дрон зашел в слепую зону, ПВО сама подсвечивает его в тумане войны!
                const inBlindZone = dist <= this.visionRadius;
                if (inBlindZone && invader.hp > 0) {
                    invader.visibilityTimer = 1000; // Взводим видимость БПЛА автономно!
                }

                // Логика конуса обстрела (70px, раскрытие 45 градусов)
                let angleToInvader = Math.atan2(dy, dx);
                let angleDiff = angleToInvader - this.currentAngle;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                
                const inAttackCone = dist <= this.attackRange && Math.abs(angleDiff) <= (Math.PI / 4);

                // Захватываем цель, если она гарантированно видна и находится в зоне досягаемости
                if (invader.isVisible && (inBlindZone || inAttackCone) && dist < closestDist) {
                    closestDist = dist;
                    selectedInvader = invader;
                }
            });

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
            // Упреждающий разворот по данным общей разведки РЛС
            let nearestEnemy: SimpleInvader | null = null;
            let minDistance = Infinity;

            visibleTargets.forEach(invader => {
                if (!invader.isVisible || invader.hp <= 0) return;
                const dist = Math.sqrt((invader.x - this.x) ** 2 + (invader.y - this.y) ** 2);
                if (dist < minDistance) {
                    minDistance = dist;
                    nearestEnemy = invader;
                }
            });

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
            while (fireDiff < -Math.PI) fireDiff += Math.PI * 2;
            while (fireDiff > Math.PI) fireDiff -= Math.PI * 2;

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