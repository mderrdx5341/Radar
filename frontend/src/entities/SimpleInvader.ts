export class SimpleInvader {
    public x: number;
    public y: number;
    public radius: number = 10;
    public hp: number = 100;
    public visibilityTimer: number = 0; 

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * Враг считается видимым, пока таймер послесвечения больше нуля
     */
    public get isVisible(): boolean {
        return this.visibilityTimer > 0;
    }

    /**
     * Плавно уменьшает время видимости врага на величину deltaTime
     */
    public updateVisibility(deltaTime: number): void {
        if (deltaTime <= 0) return;
        this.visibilityTimer = Math.max(0, this.visibilityTimer - deltaTime);
    }
}