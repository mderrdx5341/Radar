import { SimpleTurret } from './SimpleTurret';
import { TangentPathfinder } from './TangentPathfinder';
import { SimpleBuilding } from './buildings/SimpleBuilding';

export interface Waypoint {
    x: number;
    y: number;
}

export class RouteManager {
    // 10 фиксированных тактических коридоров взлёта по оси X зафиксированы цифрами
    public readonly spawnPoints: number[] = [60, 130, 200, 270, 340, 410, 480, 550, 620, 690];
    
    // Global registry of turrets known to the swarm
    private discoveredTurrets: SimpleTurret[] = [];

    // ИНКАПСУЛЯЦИЯ: Выделенный навигатор изолирован внутри менеджера
    private pathfinder: TangentPathfinder;

    constructor() {
        this.discoveredTurrets = [];
        this.pathfinder = new TangentPathfinder();
    }

    /**
     * Возвращает список обнаруженных турелей
     */
    public getDiscoveredTurrets(): SimpleTurret[] {
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
        // Метод сохранен для стабильности вызовов в main.ts
    }

    /**
     * ИСПРАВЛЕНО: Метод только определяет цель, а расчет кратчайшего пути 
     * полностью делегирует инкапсулированному классу TangentPathfinder!
     */
    public generateFlightPlan(startX: number, startY: number, buildings: SimpleBuilding[]): Waypoint[] {
        // Фильтруем только функционирующие здания в тылу
        const activeBuildings = buildings.filter(b => !b.isDestroyed);
        
        // Если все здания стёрты — целимся просто по умолчанию в центр нижней линии
        if (activeBuildings.length === 0) {
            return [{ x: startX, y: 1200 }];
        }

        // Вычисляем индекс коридора взлёта
        const spawnIndex = this.spawnPoints.indexOf(startX);
        
        // Назначаем здание-цель по остатку от деления, распределяя рой веером
        const targetBuilding = activeBuildings[Math.abs(spawnIndex) % activeBuildings.length];

        // ДЕЛЕГИРОВАНИЕ: Передаем стартовую точку, координаты выбранного бункера-цели 
        // и список известных ПВО в наш скрытый класс-поиск пути TangentPathfinder
        return this.pathfinder.findShortestPath(
            startX, 
            startY, 
            this.discoveredTurrets, 
            targetBuilding.x, 
            targetBuilding.y
        );
    }
}