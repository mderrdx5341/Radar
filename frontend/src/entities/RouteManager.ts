import { SimpleTurret } from './SimpleTurret';
import { TangentPathfinder } from './TangentPathfinder';

export interface Waypoint {
    x: number;
    y: number;
}

export class RouteManager {
    // ЖЁСТКИЙ ФИКС: 10 тактических коридоров взлёта по оси X зафиксированы цифрами
    public readonly spawnPoints: number[] = [80, 240, 400, 560, 720, 880, 1040, 1200, 1360, 1520];
    
    // Глобальный реестр турелей ПВО, о которых рой уже знает
    private discoveredTurrets: SimpleTurret[] = [];

    // Инкапсулированный планировщик путей по касательным
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

    /**
     * ВОЗВРАЩЕНО: Метод радиодонесения роя при успешном прорыве дрона
     */
    public reportSuccess(spawnX: number): void {
        // Логирование скрыто по вашей задаче, метод сохранен для стабильности вызовов в main.ts
    }

    /**
     * Запрашивает кратчайший маршрут у инкапсулированного навигатора
     */
    public generateFlightPlan(startX: number, startY: number): Waypoint[] {
        return this.pathfinder.findShortestPath(startX, startY, this.discoveredTurrets);
    }
}