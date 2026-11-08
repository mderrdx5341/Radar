import { InputManager } from './InputManager';
import { CameraSystem } from './CameraSystem';
import { Player } from './Player';
import { GameState } from './GameState';
import { EntityController, TurretController, RadarController, BuildingController } from '../controllers';

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

        // 1. ПРОВЕРКА КЛИКА ПО НИЖНЕЙ ПАНЕЛИ HUD (Выбор построек в магазине)
        if (screenY >= canvasHeight - 60) {
            const buttons: Array<'RADAR' | 'TURRET' | 'POWER' | 'REPAIR' | 'AMMO_DEPOT'> = [
                'RADAR', 'TURRET', 'POWER', 'REPAIR', 'AMMO_DEPOT'
            ];

            const shopX = 200; // Панель теперь начинается с 200px из-за левого сайдбара

            for (let i = 0; i < buttons.length; i++) {
                // ИСПРАВЛЕНО: Прибавляем shopX (200), чтобы мышка идеально попадала по кнопкам на новом месте!
                const btnX = shopX + 20 + i * 130;
                const btnWidth = 110;

                if (screenX >= btnX && screenX <= btnX + btnWidth) {
                    const selectedType = buttons[i];
                    state.player.placement.selectBuilding(selectedType);
                    console.log(`[HUD Магазин]: Выбран призрачный чертеж здания: ${selectedType}`);
                    return; 
                }
            }
            return; 
        }

        const worldPos = camera.screenToWorld(screenX, screenY);

        // 2. ЛОГИКА СТРОИТЕЛЬСТВА (Если чертеж уже выбран и мы кликаем ЛКМ ВНУТРИ ИГРОВОГО МИРА)
        if (player.placement.currentBuildType) {
            player.tryPlaceBuilding(worldPos.x, worldPos.y);
            return;
        }

        // 3. ПОИСК ОБЪЕКТА КЛИКА: Перебираем Радары, Пушки ПВО и Здания базы!
        const clickedRadar = player.radars.find(r => Math.sqrt((r.x - worldPos.x) ** 2 + (r.y - worldPos.y) ** 2) <= 20);
        const clickedTurret = player.turrets.find(t => Math.sqrt((t.x - worldPos.x) ** 2 + (t.y - worldPos.y) ** 2) <= 20);
        
        // НОВОЕ: Находим живое здание, в радиус коллизии которого (20px) попал клик ЛКМ
        const clickedBuilding = player.buildings.find(b => !b.isDestroyed && Math.sqrt((b.x - worldPos.x) ** 2 + (b.y - worldPos.y) ** 2) <= 20);

        this.deselectCurrentEntity();

        if (clickedRadar) {
            this.activeController = new RadarController(clickedRadar);
            console.log(`[Интерфейс]: Выбрана радарная станция ${clickedRadar.name}`);
        } else if (clickedTurret) {
            this.activeController = new TurretController(clickedTurret);
            console.log(`[Интерфейс]: Выбрана батарея ПВО ${clickedTurret.name}`);
        } else if (clickedBuilding) {
            // Используем живой класс-наследник BuildingController вместо абстрактного класса!
            this.activeController = new BuildingController(clickedBuilding);
            console.log(`[Интерфейс]: Выделено здание инфраструктуры: ${clickedBuilding.name}`);
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
