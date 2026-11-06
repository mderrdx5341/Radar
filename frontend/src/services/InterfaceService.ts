import { InputManager } from './InputManager';
import { CameraSystem } from './CameraSystem';
import { Player } from './Player';
import { GameState } from './GameState'; // Импортируем GameState
import { EntityController, TurretController, RadarController } from '../controllers';

export class InterfaceService {
    public activeController: EntityController | null = null;

    constructor() {
        this.activeController = null;
    }

    /**
     * Центральный обработчик Левой Кнопки Мыши (ЛКМ)
     */
    public handleLeftClick(screenX: number, screenY: number, canvasHeight: number, camera: CameraSystem, player: Player, state: GameState): void {
        // 1. Слой HUD-интерфейса панели магазина (высота 60px от нижнего края экрана)
        if (screenY > canvasHeight - 60) {
            if (screenX >= 20 && screenX <= 160) player.placement.startBuilding('RADAR');
            if (screenX >= 180 && screenX <= 320) player.placement.startBuilding('TURRET');
            // ИСПРАВЛЕНО: Кнопка "3. Пауза" теперь корректно переключает флаг в ядре GameState
            if (screenX >= 340 && screenX <= 480) state.isPaused = !state.isPaused;
            return;
        }

        const worldPos = camera.screenToWorld(screenX, screenY);

        // 2. Слой бесплатного строительства в песочнице
        if (player.placement.currentBuildType) {
            player.tryPlaceBuilding(worldPos.x, worldPos.y);
            return;
        }

        // 3. Слой тактического выбора объектов на поле боя
        const clickedRadar = player.radars.find(r => Math.abs(r.x - worldPos.x) <= 15 && Math.abs(r.y - worldPos.y) <= 15);
        const clickedTurret = player.turrets.find(t => Math.abs(t.x - worldPos.x) <= 15 && Math.abs(t.y - worldPos.y) <= 15);

        this.deselectCurrentEntity();

        if (clickedRadar) {
            this.activeController = new RadarController(clickedRadar);
        } else if (clickedTurret) {
            this.activeController = new TurretController(clickedTurret);
        }
    }

    /**
     * Центральный обработчик Правой Кнопки Мыши (ПКМ)
     */
    public handleRightClick(screenX: number, screenY: number, camera: CameraSystem, player: Player): void {
        if (player.placement.currentBuildType) {
            player.placement.cancelBuilding();
            return;
        }

        const worldPos = camera.screenToWorld(screenX, screenY);

        if (this.activeController) {
            this.activeController.handleRightClick(worldPos.x, worldPos.y);
        }
    }

    public update(input: InputManager, worldMouse: { x: number, y: number }): void {
        const isMouseDown = input.isMouseButtonDown(2); 
        
        if (this.activeController) {
            this.activeController.handleMouseMove(worldMouse.x, worldMouse.y, isMouseDown);
        }
    }

    public deselectCurrentEntity(): void {
        if (this.activeController) {
            this.activeController.onDeselect();
        }
        this.activeController = null;
    }
}
