import { SimpleTurret } from './SimpleTurret';
import { TangentPathfinder } from '../services/TangentPathfinder';
import { SimpleBuilding } from './buildings/SimpleBuilding';

export interface Waypoint {
    x: number;
    y: number;
}

export class RouteManager {
    // 10 фиксированных тактических коридоров взлёта по оси X зафиксированы цифрами
public readonly spawnPoints: Array<number> = Array.of(100, 250, 400, 550, 700, 850, 1000, 1150, 1300, 1450);
    
    // Глобальный реестр турелей ПВО, о которых рой уже знает
    private discoveredTurrets: Array<SimpleTurret> = [];

    // Инкапсулированный планировщик путей по касательным
    private pathfinder: TangentPathfinder;

    constructor() {
        this.discoveredTurrets = [];
        this.pathfinder = new TangentPathfinder();
    }

    /**
     * Возвращает список обнаруженных турелей
     */
    public getDiscoveredTurrets(): Array<SimpleTurret> {
        return this.discoveredTurrets;
    }

    /**
     * Радиодонесение роя: Занесение новой обнаруженной турели в общую базу данных
     */
    public reportHazard(turret: SimpleTurret): void {
        if (!this.discoveredTurrets.includes(turret)) {
            this.discoveredTurrets.push(turret);
        }
    }

    public reportSuccess(spawnX: number): void {
        // Метод сохранен для совместимости
    }

    /**
     * Безошибочное определение цели и вызов инкапсулированного TangentPathfinder
     */
    public generateFlightPlan(startX: number, startY: number, buildings: Array<SimpleBuilding>): Array<Waypoint> {
        // Фильтруем только функционирующие здания в тылу
        const activeBuildings = buildings.filter(b => !b.isDestroyed);
        
        // Если все здания стёрты — целимся просто по умолчанию в центр нижней линии
        if (activeBuildings.length === 0) {
            return [{ x: startX, y: 1200 }];
        }

        // Находим индекс текущего коридора вылета (0-9)
        let spawnIndex = 0;
        let minDiff = Infinity;
        for (let i = 0; i < this.spawnPoints.length; i++) {
            const diff = Math.abs(this.spawnPoints[i] - startX);
            if (diff < minDiff) {
                minDiff = diff;
                spawnIndex = i;
            }
        }
        
        // Жестко привязываем коридор к активным зданиям сессии
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