export type BuildingType = 'RADAR' | 'TURRET' | null;

export class PlacementManager {
    public currentBuildType: BuildingType = null;

    /**
     * Включает режим строительства для конкретного типа башни
     */
    public startBuilding(type: BuildingType): void {
        this.currentBuildType = type;
    }

    /**
     * Сбрасывает режим строительства (отмена)
     */
    public cancelBuilding(): void {
        this.currentBuildType = null;
    }
}