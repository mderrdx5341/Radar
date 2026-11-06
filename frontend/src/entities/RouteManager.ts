import { SimpleTurret } from './SimpleTurret';
import { TangentPathfinder } from '../services/TangentPathfinder'; // Проверьте правильность пути к services!
import { SimpleBuilding } from './buildings/SimpleBuilding';

export interface Waypoint {
    x: number;
    y: number;
}

export class RouteManager {
    // Безопасная инициализация массива коридоров вылета
    public readonly spawnPoints: Array<number> = Array.of(100, 250, 400, 550, 700, 850, 1000, 1150, 1300, 1450);
    
    private discoveredTurrets: Array<SimpleTurret> = new Array<SimpleTurret>();
    private pathfinder: TangentPathfinder;

    constructor() {
        this.pathfinder = new TangentPathfinder();
    }

    public getDiscoveredTurrets(): Array<SimpleTurret> {
        return this.discoveredTurrets;
    }

    public reportHazard(turret: SimpleTurret): void {
        if (!this.discoveredTurrets.includes(turret)) {
            this.discoveredTurrets.push(turret);
        }
    }

    public reportSuccess(spawnX: number): void {
        // Метод для совместимости
    }

    public generateFlightPlan(startX: number, startY: number, buildings: Array<SimpleBuilding>): Array<Waypoint> {
        const activeBuildings = buildings.filter(b => !b.isDestroyed);
        
        if (activeBuildings.length === 0) {
            return [{ x: startX, y: 1200 }];
        }

        let spawnIndex = 0;
        let minDiff = Infinity;
        for (let i = 0; i < this.spawnPoints.length; i++) {
            const diff = Math.abs(this.spawnPoints[i] - startX);
            if (diff < minDiff) {
                minDiff = diff;
                spawnIndex = i;
            }
        }
        
        const targetBuilding = activeBuildings[spawnIndex % activeBuildings.length];

        return this.pathfinder.findShortestPath(
            startX, 
            startY, 
            this.discoveredTurrets, 
            targetBuilding.x, 
            targetBuilding.y
        );
    }
}