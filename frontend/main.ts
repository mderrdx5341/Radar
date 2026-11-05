import { 
    SimpleInvader, SimpleRadar, SimpleTurret, RouteManager,
    PowerNode, RepairBay, ResourceHarvester, SimpleBuilding 
} from '@/entities';
import { PlacementManager } from '@/entities/PlacementManager';
import { CanvasRenderer } from '@/render/CanvasRenderer';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const renderer = new CanvasRenderer('gameCanvas');
const placement = new PlacementManager();
const routeManager = new RouteManager();

// --- РАЗМЕРЫ СТРАТЕГИЧЕСКОЙ КАРТЫ (МИРОВЫЕ КООРДИНАТЫ) ---
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1200;

// --- НАСТРОЙКИ ВИРТУАЛЬНОЙ КАМЕРЫ ---
let cameraX = 160; 
let cameraY = 480; 

let isDragging = false;
let startDragX = 0;
let startDragY = 0;
let startCamX = 0;
let startCamY = 0;

// --- СОСТОЯНИЕ ТАКТИЧЕСКОЙ ПАУЗЫ ---
let isPaused = false; 

// Отслеживание клавиш WASD
const keys: { [key: string]: boolean } = { KeyW: false, KeyA: false, KeyS: false, KeyD: false };

// Функция динамической подстройки под экран пользователя (Защита от мыла)
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    clampCamera();
}
window.addEventListener('resize', resizeCanvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

function clampCamera() {
    cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, cameraX));
    cameraY = Math.max(0, Math.min(WORLD_HEIGHT - (canvas.height - 60), cameraY));
}

// Первоначальное выставление камеры строго вниз тыла
cameraX = (WORLD_WIDTH - canvas.width) / 2;
cameraY = WORLD_HEIGHT - (canvas.height - 60);
clampCamera();

// Инициализация оборонительных рубежей
const radars: SimpleRadar[] = [new SimpleRadar(800, 1000, 'РЛС-1')];
const turrets: SimpleTurret[] = [new SimpleTurret(800, 1080, 'ПВО-1')];

// ЖЕСТКИЙ ФИКС: Разворачиваем 3 физических здания в тылу на высоте Y: 1120
const buildings: SimpleBuilding[] = [
    new PowerNode(400, 1120, 'Энергоблок ⚡'),
    new RepairBay(800, 1120, 'Ремонтный блок 🛠️'),
    new ResourceHarvester(1200, 1120, 'Ресурсная шахта 💎')
];

let selectedEntity: SimpleRadar | SimpleTurret | null = null;
let currentMouseX = 0;
let currentMouseY = 0;
let score = 0;

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('keydown', (e) => {
    const code = e.code; 
    if (code in keys) keys[code] = true;
    if (code === 'Space') isPaused = !isPaused;
});

window.addEventListener('keyup', (e) => {
    const code = e.code;
    if (code in keys) keys[code] = false;
});

canvas.addEventListener('mousedown', (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const shopYThreshold = canvas.height - 60;

    if (event.button === 0) {
        if (screenY > shopYThreshold) {
            if (screenX >= 20 && screenX <= 160) placement.startBuilding('RADAR');
            if (screenX >= 180 && screenX <= 320) placement.startBuilding('TURRET');
            if (screenX >= 340 && screenX <= 480) isPaused = !isPaused;
            return;
        }

        const worldX = screenX + cameraX;
        const worldY = screenY + cameraY;

        if (placement.currentBuildType) {
            const tooCloseRadar = radars.some(r => Math.sqrt((r.x - worldX) ** 2 + (r.y - worldY) ** 2) < 12);
            const tooCloseTurret = turrets.some(t => Math.sqrt((t.x - worldX) ** 2 + (t.y - worldY) ** 2) < 12);

            if (!tooCloseRadar && !tooCloseTurret) {
                if (placement.currentBuildType === 'RADAR') radars.push(new SimpleRadar(worldX, worldY, `РЛС-${radars.length + 1}`));
                if (placement.currentBuildType === 'TURRET') turrets.push(new SimpleTurret(worldX, worldY, `ПВО-${turrets.length + 1}`));
                placement.cancelBuilding(); 
            }
            return;
        }

        const clickedRadar = radars.find(r => Math.abs(r.x - worldX) <= 15 && Math.abs(r.y - worldY) <= 15);
        const clickedTurret = turrets.find(t => Math.abs(t.x - worldX) <= 15 && Math.abs(t.y - worldY) <= 15);

        selectedEntity = clickedRadar || clickedTurret || null;

    } else if (event.button === 1) {
        isDragging = true;
        startDragX = screenX;
        startDragY = screenY;
        startCamX = cameraX;
        startCamY = cameraY;
        event.preventDefault();

    } else if (event.button === 2) {
        if (placement.currentBuildType) {
            placement.cancelBuilding();
            return;
        }
        const worldX = screenX + cameraX;
        const worldY = screenY + cameraY;

        if (selectedEntity instanceof SimpleTurret) selectedEntity.moveTo(worldX, worldY);
        if (selectedEntity instanceof SimpleRadar) {
            selectedEntity.startTracking();
            selectedEntity.setTargetDirection(worldX, worldY);
        }
    }
});

canvas.addEventListener('mousemove', (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    currentMouseX = screenX;
    currentMouseY = screenY;

    if (isDragging) {
        const dx = screenX - startDragX;
        const dy = screenY - startDragY;
        cameraX = startCamX - dx;
        cameraY = startCamY - dy;
        clampCamera();
    }
});

canvas.addEventListener('mouseup', (event: MouseEvent) => {
    if (event.button === 1) isDragging = false; 
    if (event.button === 2 && selectedEntity instanceof SimpleRadar) selectedEntity.stopTracking();
});

const invaders: SimpleInvader[] = [];
routeManager.spawnPoints.forEach(spawnX => {
    const invader = new SimpleInvader(spawnX, Math.floor(Math.random() * -300) - 50);
    invader.waypoints = routeManager.generateFlightPlan(invader.spawnPointX, invader.y);
    invaders.push(invader);
});

let lastTime = performance.now();

// Создаем фиктивный экономический контекст для передачи в здания
const econContext = {
    addGold: (amount: number) => {
        console.log(`[Экономика]: Добыто золота: +${amount} (Шахта функционирует)`);
    }
};

function gameTick(timestamp: number) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    const camSpeed = 7;
    if (keys.KeyW) cameraY -= camSpeed;
    if (keys.KeyS) cameraY += camSpeed;
    if (keys.KeyA) cameraX -= camSpeed;
    if (keys.KeyD) cameraX += camSpeed;
    clampCamera();

    if (isPaused) {
        radars.forEach(radar => {
            if (radar.isTrackingMouse) radar.setTargetDirection(currentMouseX + cameraX, currentMouseY + cameraY);
        });

        renderer.render(
            invaders, radars, turrets, selectedEntity, 
            placement.currentBuildType, currentMouseX + cameraX, currentMouseY + cameraY, score,
            routeManager.getDiscoveredTurrets(), cameraX, cameraY, isPaused, buildings
        );
        requestAnimationFrame(gameTick);
        return;
    }

    // Обновление пассивных систем зданий (генерация ресурсов и т.д.)
    buildings.forEach(building => {
        building.update(deltaTime, econContext);
    });

    radars.forEach(radar => {
        if (radar.isTrackingMouse) radar.setTargetDirection(currentMouseX + cameraX, currentMouseY + cameraY);
        radar.rotate(deltaTime);
        radar.scan(invaders);
    });

    invaders.forEach(invader => {
        invader.updateVisibility(deltaTime);
        
        if (invader.y > 1200 || invader.hp <= 0) {
            if (invader.hp <= 0) {
                score++;
                const killerTurret = turrets.find(t => t.currentTarget === invader);
                if (killerTurret) routeManager.reportHazard(killerTurret);
            }

            invader.y = Math.floor(Math.random() * -100) - 20;
            invader.x = invader.spawnPointX;
            invader.hp = 100;
            invader.visibilityTimer = 0;
            invader.moveAngle = Math.PI / 2;
            
            invader.waypoints = routeManager.generateFlightPlan(invader.spawnPointX, invader.y);
        } else {
            invader.moveDown();
        }
    });

    turrets.forEach(turret => {
        turret.updateMovement(deltaTime);
        turret.scan(invaders);
        turret.attack(invaders, deltaTime);
    });
    
    // Передаем массив зданий одиннадцатым аргументом в рендерер
    renderer.render(
        invaders, radars, turrets, selectedEntity, 
        placement.currentBuildType, currentMouseX + cameraX, currentMouseY + cameraY, score,
        routeManager.getDiscoveredTurrets(), cameraX, cameraY, isPaused, buildings
    );

    requestAnimationFrame(gameTick);
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameTick(timestamp);
});