import { CanvasRenderer } from '@/render/CanvasRenderer';
import { InputManager, CameraSystem, CollisionManager, GameState } from '@/services';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const renderer = new CanvasRenderer('gameCanvas');

const input = new InputManager(canvas);
const collisionManager = new CollisionManager();

const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1200;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const camera = new CameraSystem(WORLD_WIDTH, WORLD_HEIGHT, canvas.width, canvas.height);

// Создаём GameState, который сам развернёт обе фракции: Player и EnemySwarm!
const state = new GameState();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    camera.clamp(canvas.width, canvas.height);
});

// --- ПОДПИСКИ НА СОБЫТИЯ ВВОДА ЧЕРЕЗ INPUTMANAGER ЧЕРЕЗ INTERFACESERVICE ---

input.onKeyPress('Space', () => {
    if (!state.isGameOver) state.isPaused = !state.isPaused;
});

input.onMouseClick(0, (screenX, screenY) => {
    state.interfaceService.handleLeftClick(screenX, screenY, canvas.height, camera, state.player, state);
});

input.onMouseClick(2, (screenX, screenY) => {
    state.interfaceService.handleRightClick(screenX, screenY, camera, state.player);
});

input.onMouseUp(2, () => {
    state.interfaceService.handleRightMouseUp();
});

let lastTime = performance.now();

function gameTick(timestamp: number) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    const mousePos = input.getMousePosition();
    camera.update(canvas.width, canvas.height, input, state.isGameOver);

    const worldMouse = camera.screenToWorld(mousePos.x, mousePos.y);

    // Запускаем единый и лаконичный тик симуляции мира
    state.update(deltaTime, input, collisionManager, worldMouse);
    
    // ИСПРАВЛЕНО: Кристально чистая, послойная сборка тактического кадра в 3 аргумента!
    renderer.render(state, camera, state.interfaceService);

    requestAnimationFrame(gameTick);
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameTick(timestamp);
});
