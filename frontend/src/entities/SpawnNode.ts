import { Waypoint, DiscoveredHazard } from './RouteManager';
import { SimpleBuilding } from './buildings/SimpleBuilding';
import { TangentPathfinder } from '../services/TangentPathfinder';

export class SpawnNode {
    public x: number;
    public y: number;
    public index: number;
    private cachedPath: Array<Waypoint> = new Array<Waypoint>();
    public pathfinder: TangentPathfinder;
    public isSearching: boolean = false;
    public currentTargetBuilding: SimpleBuilding | null = null;

    constructor(x: number, y: number, index: number) {
        this.x = x;
        this.y = y;
        this.index = index;
        this.pathfinder = new TangentPathfinder();
    }

    public getPathCopy(): Array<Waypoint> {
        return this.cachedPath.map(wp => ({ x: wp.x, y: wp.y }));
    }

    /**
     * Инициация асинхронной покадровой сессии А* (Для рантайм-боя по 150 шагов)
     */
    public triggerRecalculate(hazards: Array<DiscoveredHazard>, buildings: Array<SimpleBuilding>): void {
        const activeBuildings = buildings.filter(b => !b.isDestroyed);
        if (activeBuildings.length === 0) {
            this.cachedPath = [{ x: this.x, y: this.y }, { x: this.x, y: 1200 }];
            this.isSearching = false;
            this.currentTargetBuilding = null;
            return;
        }

        this.currentTargetBuilding = activeBuildings[this.index % activeBuildings.length];
        this.pathfinder.startNewSearch(this.x, this.y, this.currentTargetBuilding.x, this.currentTargetBuilding.y);
        this.isSearching = true; 
    }

    /**
     * ЖЁСТКИЙ ФИКС ДЛЯ СТАРТА: Синхронный мгновенный просчёт без покадровых ограничений
     * Используется строго при инициализации buildInitialFlightPlans
     */
    public instantRecalculate(hazards: Array<DiscoveredHazard>, buildings: Array<SimpleBuilding>): void {
        const activeBuildings = buildings.filter(b => !b.isDestroyed);
        if (activeBuildings.length === 0) {
            this.cachedPath = [{ x: this.x, y: this.y }, { x: this.x, y: 1200 }];
            return;
        }

        this.currentTargetBuilding = activeBuildings[this.index % activeBuildings.length];
        this.pathfinder.startNewSearch(this.x, this.y, this.currentTargetBuilding.x, this.currentTargetBuilding.y);
        
        // Форсируем цикл: крутим по 1000 шагов, пока А* не скажет true (на пустой карте это займет 1 итерацию)
        let finished = false;
        let safetyCounter = 0;
        while (!finished && safetyCounter < 10) {
            safetyCounter++;
            finished = this.pathfinder.searchStep(1000, hazards);
        }

        this.cachedPath = this.pathfinder.compileFinalPath(hazards);
        this.isSearching = false;
    }

    public processSearchTick(hazards: Array<DiscoveredHazard>): void {
        if (!this.isSearching) return;

        const isFinished = this.pathfinder.searchStep(150, hazards);

        if (isFinished) {
            this.cachedPath = this.pathfinder.compileFinalPath(hazards);
            this.isSearching = false; 
        }
    }
}
