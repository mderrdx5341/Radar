import { InputManager } from './InputManager';
import { CameraSystem } from './CameraSystem';
import { Player } from './Player';
import { GameState } from './GameState';
import { EntityController, TurretController, RadarController } from '../controllers';

export class InterfaceService {
    // Полиморфная ссылка на активный низкоуровневый контроллер (РЛС или ПВО)
    public activeController: EntityController | null = null;

    // СВОЙ ВНУТРЕННИЙ ФЛАГ УДЕРЖАНИЯ КНОПКИ (Защита от сбоев InputManager)
    private isRightMouseDown: boolean = false;

    public worldMouse: { x: number; y: number } = { x: 0, y: 0 };

    constructor() {
        this.activeController = null;
        this.isRightMouseDown = false;
        this.worldMouse = { x: 0, y: 0 };
    }

    /**
     * Центральный обработчик Левой Кнопки Мыши (ЛКМ)
     */
    public handleLeftClick(screenX: number, screenY: number, canvasHeight: number, camera: CameraSystem, player: Player, state: GameState): void {
        if (screenY > canvasHeight - 60) {
            if (screenX >= 20 && screenX <= 160) player.placement.startBuilding('RADAR');
            if (screenX >= 180 && screenX <= 320) player.placement.startBuilding('TURRET');
            if (screenX >= 340 && screenX <= 480) state.isPaused = !state.isPaused;
            return;
        }

        const worldPos = camera.screenToWorld(screenX, screenY);

        if (player.placement.currentBuildType) {
            player.tryPlaceBuilding(worldPos.x, worldPos.y);
            return;
        }

        const clickedRadar = player.radars.find(r => Math.sqrt((r.x - worldPos.x) ** 2 + (r.y - worldPos.y) ** 2) <= 20);
        const clickedTurret = player.turrets.find(t => Math.sqrt((t.x - worldPos.x) ** 2 + (t.y - worldPos.y) ** 2) <= 20);

        this.deselectCurrentEntity();

        if (clickedRadar) {
            this.activeController = new RadarController(clickedRadar);
            console.log(`[Интерфейс]: Выбрана радарная станция ${clickedRadar.name}`);
        } else if (clickedTurret) {
            this.activeController = new TurretController(clickedTurret);
            console.log(`[Интерфейс]: Выбрана батарея ПВО ${clickedTurret.name}`);
        }
    }

    /**
     * Центральный обработчик Правой Кнопки Мыши (ПКМ) — НАЖАТИЕ КНОПКИ
     */
    public handleRightClick(screenX: number, screenY: number, camera: CameraSystem, player: Player): void {
        if (player.placement.currentBuildType) {
            player.placement.cancelBuilding();
            return;
        }

        // Включаем внутренний флаг удержания: игрок прямо сейчас зажал ПКМ!
        this.isRightMouseDown = true;

        const worldPos = camera.screenToWorld(screenX, screenY);

        if (this.activeController) {
            this.activeController.handleRightClick(worldPos.x, worldPos.y);
        }
    }

    /**
     * НОВЫЙ МЕТОД: Сигнал о том, что игрок физически ОТПУСТИЛ правую кнопку мыши
     */
    public handleRightMouseUp(): void {
        // Гасим флаг удержания
        this.isRightMouseDown = false;
        console.log("[Интерфейс]: ПКМ отпущена, ручное ведение прекращено.");
    }

    /**
     * Ежекадровый апдейт движения мыши внутри gameTick
     */
    public update(input: InputManager, worldMouse: { x: number, y: number }): void {
        this.worldMouse = worldMouse;
        
        if (this.activeController) {
            // Передаем наш собственный, гарантированный флаг зажатия кнопки
            this.activeController.handleMouseMove(worldMouse.x, worldMouse.y, this.isRightMouseDown);
        }
    }

    public deselectCurrentEntity(): void {
        if (this.activeController) {
            this.activeController.onDeselect();
        }
        this.activeController = null;
        this.isRightMouseDown = false;
    }
}
