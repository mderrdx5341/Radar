import { SimpleRadar, SimpleTurret, RouteManager } from '@/entities';
import { PlacementManager } from '@/entities/PlacementManager';
import { CanvasRenderer } from '@/render/CanvasRenderer';
import { InputManager, CameraSystem, CollisionManager, GameState } from '@/services';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const renderer = new CanvasRenderer('gameCanvas');
const placement = new PlacementManager();
const routeManager = new RouteManager();

const input = new InputManager(canvas);
const collisionManager = new CollisionManager();

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1200;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const camera = new CameraSystem(WORLD_WIDTH, WORLD_HEIGHT, canvas.width, canvas.height);
const state = new GameState(routeManager);

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.clamp(canvas.width, canvas.height);
});

// --- ПОДПИСКИ НА СОБЫТИЯ ВВОДА ЧЕРЕЗ INPUTMANAGER ---

input.onKeyPress('Space', () => {
    if (!state.isGameOver) state.isPaused = !state.isPaused;
});

input.onMouseClick(0, (screenX, screenY) => {
    state.interfaceService.handleLeftClick(screenX, screenY, canvas.height, camera, state.player, state);
});

input.onMouseClick(2, (screenX, screenY) => {
    state.interfaceService.handleRightClick(screenX, screenY, camera, state.player);
});

const selectedEntity = state.interfaceService.activeController?.getEntity() || null;

let lastTime = performance.now();

function gameTick(timestamp: number) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    const mousePos = input.getMousePosition();
    camera.update(canvas.width, canvas.height, input, state.isGameOver);

    const worldMouse = camera.screenToWorld(mousePos.x, mousePos.y);

    // Запускаем центральный апдейт симуляции
    state.update(deltaTime, input, collisionManager, worldMouse);
    
    // Передаем массивы юнитов из объекта state.player в рендерер для сборки кадра
    renderer.render(
        state.invaders, state.player.radars, state.player.turrets, selectedEntity, // Передаем selectedEntity
        state.player.placement.currentBuildType, worldMouse.x, worldMouse.y, state.score,
        routeManager.getDiscoveredTurrets(), camera.x, camera.y, state.isPaused, state.player.buildings, state.isGameOver
    );

    requestAnimationFrame(gameTick);
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameTick(timestamp);
});