import { SimpleRadar, SimpleTurret, RouteManager } from '@/entities';
import { PlacementManager } from '@/entities/PlacementManager';
import { CanvasRenderer } from '@/render/CanvasRenderer';
import { InputManager, CameraSystem, CollisionManager, GameState } from '@/services';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const renderer = new CanvasRenderer('gameCanvas');
const placement = new PlacementManager();
const routeManager = new RouteManager();

// Инициализация периферийных сервисов
const input = new InputManager(canvas);
const collisionManager = new CollisionManager();

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1200;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const camera = new CameraSystem(WORLD_WIDTH, WORLD_HEIGHT, canvas.width, canvas.height);

// Инициализация Менеджера Состояния Игры
const state = new GameState(routeManager);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.clamp(canvas.width, canvas.height);
});

// --- ДЕКЛАРАТИВНЫЕ ПОДПИСКИ НА ИГРОВЫЕ СОБЫТИЯ ЧЕРЕЗ INPUTMANAGER ---

input.onKeyPress('Space', () => {
    if (!state.isGameOver) state.isPaused = !state.isPaused;
});

input.onMouseClick(0, (screenX, screenY) => {
    if (state.isGameOver) return;

    // Клик по нижней HUD-панели управления магазином
    if (screenY > canvas.height - 60) {
        if (screenX >= 20 && screenX <= 160) placement.startBuilding('RADAR');
        if (screenX >= 180 && screenX <= 320) placement.startBuilding('TURRET');
        if (screenX >= 340 && screenX <= 480) state.isPaused = !state.isPaused;
        return;
    }

    const worldPos = camera.screenToWorld(screenX, screenY);

    // Режим активного строительства
    if (placement.currentBuildType) {
        const tooCloseRadar = state.radars.some(r => Math.sqrt((r.x - worldPos.x) ** 2 + (r.y - worldPos.y) ** 2) < 12);
        const tooCloseTurret = state.turrets.some(t => Math.sqrt((t.x - worldPos.x) ** 2 + (t.y - worldPos.y) ** 2) < 12);

        if (!tooCloseRadar && !tooCloseTurret) {
            if (placement.currentBuildType === 'RADAR') state.radars.push(new SimpleRadar(worldPos.x, worldPos.y, `РЛС-${state.radars.length + 1}`));
            if (placement.currentBuildType === 'TURRET') state.turrets.push(new SimpleTurret(worldPos.x, worldPos.y, `ПВО-${state.turrets.length + 1}`));
            placement.cancelBuilding(); 
        }
        return;
    }

    // Выбор юнита на карте
    const clickedRadar = state.radars.find(r => Math.abs(r.x - worldPos.x) <= 15 && Math.abs(r.y - worldPos.y) <= 15);
    const clickedTurret = state.turrets.find(t => Math.abs(t.x - worldPos.x) <= 15 && Math.abs(t.y - worldPos.y) <= 15);

    state.selectedEntity = clickedRadar || clickedTurret || null;
});

input.onMouseClick(2, (screenX, screenY) => {
    if (state.isGameOver) return;
    if (placement.currentBuildType) {
        placement.cancelBuilding();
        return;
    }

    const worldPos = camera.screenToWorld(screenX, screenY);

    if (state.selectedEntity instanceof SimpleTurret) state.selectedEntity.moveTo(worldPos.x, worldPos.y);
    if (state.selectedEntity instanceof SimpleRadar) {
        state.selectedEntity.startTracking();
        state.selectedEntity.setTargetDirection(worldPos.x, worldPos.y);
    }
});

let lastTime = performance.now();

function gameTick(timestamp: number) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    const mousePos = input.getMousePosition();
    
    // 1. Обновляем виртуальную камеру
    camera.update(canvas.width, canvas.height, input, state.isGameOver);

    // Переводим экранную мышь в мировые координаты карты
    const worldMouse = camera.screenToWorld(mousePos.x, mousePos.y);

    // 2. Делегируем ВСЮ симуляцию игрового процесса и коллизий в GameState
    state.update(deltaTime, input, collisionManager, worldMouse);
    
    // 3. Отправляем текущий слепок состояния на компонентный рендеринг
    renderer.render(
        state.invaders, state.radars, state.turrets, state.selectedEntity, 
        placement.currentBuildType, worldMouse.x, worldMouse.y, state.score,
        routeManager.getDiscoveredTurrets(), camera.x, camera.y, state.isPaused, state.buildings, state.isGameOver
    );

    requestAnimationFrame(gameTick);
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameTick(timestamp);
});