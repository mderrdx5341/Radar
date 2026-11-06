import { InputManager } from './InputManager';
import { CameraSystem } from './CameraSystem';
import { Player } from './Player';
import { GameState } from './GameState';
import { EntityController, TurretController, RadarController } from '../controllers';

export class InterfaceService {
    // Полиморфная ссылка на активный низкоуровневый контроллер (РЛС или ПВО)
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
        // Ищем клик с небольшим запасом радиуса (20px), чтобы по пушкам было легко кликать
        const clickedRadar = player.radars.find(r => Math.sqrt((r.x - worldPos.x) ** 2 + (r.y - worldPos.y) ** 2) <= 20);
        const clickedTurret = player.turrets.find(t => Math.sqrt((t.x - worldPos.x) ** 2 + (t.y - worldPos.y) ** 2) <= 20);

        // Сбрасываем старый выбор перед активацией нового
        this.deselectCurrentEntity();

        // ИСПРАВЛЕНО: Создаем контроллеры и жестко привязываем к ним выбранные сущности
        if (clickedRadar) {
            this.activeController = new RadarController(clickedRadar);
            console.log(`[Интерфейс]: Выбрана радарная станция ${clickedRadar.name}`);
        } else if (clickedTurret) {
            this.activeController = new TurretController(clickedTurret);
            console.log(`[Интерфейс]: Выбрана батарея ПВО ${clickedTurret.name}`);
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
