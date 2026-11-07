import { SimpleInvader, RouteManager, SpawnNode } from '../entities';
import { CollisionManager } from './CollisionManager';
import { SimpleBuilding } from '../entities/buildings/SimpleBuilding';

export class EnemySwarm {
    public invaders: Array<SimpleInvader> = new Array<SimpleInvader>();
    public routeManager: RouteManager;
    public spawnNodes: Array<SpawnNode> = new Array<SpawnNode>();

    constructor() {
        this.routeManager = new RouteManager();
        this.initSwarm();
    }

    public initSwarm(): void {
        this.invaders = new Array<SimpleInvader>();
        this.spawnNodes = new Array<SpawnNode>();
        
        this.routeManager.spawnPoints.forEach((spawnX, index) => {
            const node = new SpawnNode(spawnX, -50, index);
            this.spawnNodes.push(node);
        });

        this.spawnNodes.forEach((node) => {
            const invader = new SimpleInvader(node.x, Math.floor(Math.random() * -300) - 50);
            invader.spawnPointX = node.x; 
            this.invaders.push(invader);
        });
    }

    /**
     * ИСПРАВЛЕНО: Стартовая прошивка путей через мгновенный форсированный запуск А*
     */
    public buildInitialFlightPlans(playerBuildings: Array<SimpleBuilding>): void {
        const hazards = this.routeManager.getDiscoveredHazards();
        
        // Заставляем 10 точек взлёта мгновенно выдать готовые стартовые прямые линии
        this.spawnNodes.forEach(node => {
            node.instantRecalculate(hazards, playerBuildings); // <-- Вызываем мгновенный метод!
        });

        // Теперь в cachedPath ГАРАНТИРОВАННО лежат готовые маршруты, раздаём их первой волне БПЛА
        for (let i = 0; i < this.invaders.length; i++) {
            this.invaders[i].waypoints = this.spawnNodes[i].getPathCopy();
        }
        
        console.log('[Диспетчер Роя]: Стартовая калибровка фиолетовых маршрутов первой волны завершена.');
    }

    /**
     * ЦЕНТРАЛЬНЫЙ ТАКТИЧЕСКИЙ АПДЕЙТ РОЯ БПЛА
     */
    public update(deltaTime: number, collisionManager: CollisionManager, playerBuildings: Array<SimpleBuilding>): number {
        let downedInvadersCount = 0;
        const hazards = this.routeManager.getDiscoveredHazards();

        // СИТУАЦИЯ 2: РЕАКЦИЯ НА УНИЧТОЖЕНИЕ ЗДАНИЙ (Тактическое перенацеливание волны)
        // Если у какой-то точки взлёта её цель была уничтожена — принудительно перенаправляем её на живой объект!
        this.spawnNodes.forEach(node => {
            if (node.currentTargetBuilding && node.currentTargetBuilding.isDestroyed) {
                node.triggerRecalculate(hazards, playerBuildings);
            }
        });

        // Продвигаем покадровые А* вычисления на 150 шагов только для тех точек, которые сейчас думают
        this.spawnNodes.forEach(node => {
            if (node.isSearching) {
                node.processSearchTick(hazards);
            }
        });

        // Движение и логика жизни БПЛА-камикадзе
        for (let i = 0; i < this.invaders.length; i++) {
            const invader = this.invaders[i];
            invader.updateVisibility(deltaTime);
            
            let shouldRespawn = collisionManager.checkSuicideStrikes(invader, playerBuildings);

            if (!shouldRespawn && (invader.y > 1200 || invader.hp <= 0)) {
                if (invader.hp <= 0) {
                    downedInvadersCount++;
                    
                    // БПЛА сливает координаты пушки в сеть радиоразведки роя
                    invader.attackers.forEach(turret => {
                        const beforeCount = this.routeManager.getDiscoveredHazards().length;
                        this.routeManager.reportHazard(turret);
                        const afterCount = this.routeManager.getDiscoveredHazards().length;
                        
                        // СИТУАЦИЯ 1: ТОЧЕЧНАЯ ЛОКАЛЬНАЯ РЕАКЦИЯ НА ПВО
                        // Если вскрыта НОВАЯ пушка ПВО, мы запускаем пересчёт ТОЛЬКО для той 
                        // конкретной родительской точки взлёта, чей дрон сейчас пострадал!
                        if (afterCount > beforeCount) {
                            const parentNodeIdx = this.spawnNodes.findIndex(node => node.x === invader.spawnPointX);
                            if (parentNodeIdx !== -1) {
                                this.spawnNodes[parentNodeIdx].triggerRecalculate(hazards, playerBuildings);
                            }
                        }
                    });
                }
                shouldRespawn = true;
            }

            if (shouldRespawn) {
                const parentNodeIdx = this.spawnNodes.findIndex(node => node.x === invader.spawnPointX);
                const parentNode = this.spawnNodes[parentNodeIdx !== -1 ? parentNodeIdx : 0];

                invader.attackers = new Array();
                invader.y = Math.floor(Math.random() * -200) - 40;
                invader.x = parentNode.x;
                invader.hp = 100;
                invader.visibilityTimer = 0;
                invader.moveAngle = Math.PI / 2;
                
                // Дроны берут текущую актуальную версию кэша своей точки взлёта
                invader.waypoints = parentNode.getPathCopy();
            } else {
                invader.moveDown(); 
            }
        }

        return downedInvadersCount;
    }
}
