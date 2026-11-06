import { SimpleInvader, RouteManager } from '../entities';
import { CollisionManager } from './CollisionManager';
import { SimpleBuilding } from '../entities/buildings/SimpleBuilding';

export class EnemySwarm {
    // Вражеский рой БПЛА-камикадзе теперь инкапсулирован здесь
    public invaders: Array<SimpleInvader> = new Array<SimpleInvader>();
    
    // Навигационный штаб радиоразведки роя скрыт внутри фракции противника
    public routeManager: RouteManager;

    constructor() {
        this.routeManager = new RouteManager();
        this.initSwarm();
    }

    /**
     * Стартовое развёртывание и генерация первой волны БПЛА
     */
    public initSwarm(): void {
        this.invaders = new Array<SimpleInvader>();
        
        // Рой на старте ничего не знает о скрытых базах и генерирует 10 коридоров взлёта
        this.routeManager.spawnPoints.forEach(spawnX => {
            const invader = new SimpleInvader(spawnX, Math.floor(Math.random() * -300) - 50);
            this.invaders.push(invader);
        });
    }

    /**
     * Первичная прошивка маршрутных листов А* для дронов (вызывается при старте сессии)
     */
    public buildInitialFlightPlans(playerBuildings: Array<SimpleBuilding>): void {
        this.invaders.forEach(invader => {
            invader.waypoints = this.routeManager.generateFlightPlan(
                invader.spawnPointX, 
                invader.y, 
                playerBuildings
            );
        });
    }

    /**
     * ЦЕНТРАЛЬНЫЙ ТИК СИМУЛЯЦИИ РОЯ ПРОТИВНИКА ЗА КАДР
     * @returns Число сбитых за этот кадр дронов (нужно для начисления очков в GameState)
     */
    public update(deltaTime: number, collisionManager: CollisionManager, playerBuildings: Array<SimpleBuilding>): number {
        let downedInvadersCount = 0;

        this.invaders.forEach(invader => {
            invader.updateVisibility(deltaTime);
            
            // Проверяем физический таран бункеров игрока (Suicide Strike)
            let shouldRespawn = collisionManager.checkSuicideStrikes(invader, playerBuildings);

            // Если дрон не долетел до базы, но его прочность сожгли лазеры батарей ПВО
            if (!shouldRespawn && (invader.y > 1200 || invader.hp <= 0)) {
                if (invader.hp <= 0) {
                    downedInvadersCount++; // Фиксируем фраг для передачи в GameState
                    
                    // Радиоэлектронная разведка камикадзе: перед смертью сливаем координаты в сеть
                    invader.attackers.forEach(turret => {
                        this.routeManager.reportHazard(turret);
                        console.log(`[Разведка Роя]: Вскрыта огневая позиция ПВО: ${turret.name}. Маршруты пересчитываются.`);
                    });
                }
                shouldRespawn = true;
            }

            // ЖЁСТКИЙ ФИКС: Пересчёт траектории А* выполняется строго в момент респавна дрона наверх
            if (shouldRespawn) {
                invader.attackers = new Array();
                invader.y = Math.floor(Math.random() * -200) - 40;
                invader.x = invader.spawnPointX;
                invader.hp = 100;
                invader.visibilityTimer = 0;
                invader.moveAngle = Math.PI / 2;
                
                // Пересчитываем траекторию с учётом только что вскрытых позиций ПВО и уцелевших бункеров
                invader.waypoints = this.routeManager.generateFlightPlan(
                    invader.spawnPointX, 
                    invader.y, 
                    playerBuildings
                );
            } else {
                invader.moveDown(); // Плавный полет вперед по путевым точкам из личной памяти дрона
            }
        });

        return downedInvadersCount;
    }
}
