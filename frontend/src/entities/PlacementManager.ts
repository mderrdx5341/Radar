export type BuildType = 'RADAR' | 'TURRET' | 'POWER' | 'REPAIR' | 'AMMO_DEPOT';

export class PlacementManager {
    public currentBuildType: BuildType | null = null;

    public selectBuilding(type: BuildType): void {
        this.currentBuildType = type;
    }

    public cancelBuilding(): void {
        this.currentBuildType = null;
    }
}