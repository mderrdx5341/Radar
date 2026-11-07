import { SimpleTurret } from './SimpleTurret';

export interface Waypoint {
    x: number;
    y: number;
}

// Чистый тип данных для хранения призраков вскрытых угроз в памяти роя
export interface DiscoveredHazard {
    x: number;
    y: number;
    radius: number;
}

export class RouteManager {
    public readonly spawnPoints: Array<number> = Array.of(100, 250, 400, 550, 700, 850, 1000, 1150, 1300, 1450);
    
    // Внутренний реестр радиоразведки роя: сюда попадают только КОРДИНАТЫ вскрытых ПВО!
    private discoveredHazards: Array<DiscoveredHazard> = new Array<DiscoveredHazard>();

    constructor() {
        // Убрали создание pathfinder отсюда, он теперь личный у каждой SpawnNode
    }

    public getDiscoveredHazards(): Array<DiscoveredHazard> {
        return this.discoveredHazards;
    }

    /**
     * Занесение вскрытой пушки ПВО в базу данных роя
     */
    public reportHazard(turret: SimpleTurret): void {
        const snapX = Math.round(turret.x);
        const snapY = Math.round(turret.y);
        
        // Проверяем, нет ли уже этой точки в нашей базе данных радиоразведки
        const alreadyExists = this.discoveredHazards.some(h => h.x === snapX && h.y === snapY);
        
        if (!alreadyExists) {
            this.discoveredHazards.push({
                x: snapX,
                y: snapY,
                radius: turret.attackRange + 8 // 70px дальность + 8px запас корпуса БПЛА
            });
        }
    }

    public reportSuccess(spawnX: number): void { }
}
