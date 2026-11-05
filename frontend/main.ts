import { SimpleInvader, SimpleRadar, SimpleTurret } from '@/entities';
import { CanvasRenderer } from '@/render/CanvasRenderer';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const renderer = new CanvasRenderer('gameCanvas');

const radars: SimpleRadar[] = [
    new SimpleRadar(250, 350, 'РЛС Дальнего Обзора'),
    new SimpleRadar(550, 250, 'РЛС Южного Фланга')
];

const turrets: SimpleTurret[] = [
    new SimpleTurret(250, 420, 'Мобильное ПВО-1'),
    new SimpleTurret(550, 320, 'Мобильное ПВО-2')
];

let selectedEntity: SimpleRadar | SimpleTurret | null = null;

// Храним текущие координаты мыши для непрерывного наведения
let currentMouseX = 0;
let currentMouseY = 0;

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// 1. НАЖАТИЕ КНОПКИ
canvas.addEventListener('mousedown', (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (event.button === 0) {
        // --- ЛКМ: Выбор здания ---
        const clickedRadar = radars.find(r => Math.abs(r.x - mouseX) <= 15 && Math.abs(r.y - mouseY) <= 15);
        const clickedTurret = turrets.find(t => Math.abs(t.x - mouseX) <= 15 && Math.abs(t.y - mouseY) <= 15);

        if (clickedRadar) {
            selectedEntity = clickedRadar;
        } else if (clickedTurret) {
            selectedEntity = clickedTurret;
        } else {
            selectedEntity = null; // Клик в пустоту сбрасывает выбор
        }
    } else if (event.button === 2) {
        // --- ПКМ: Действие ---
        if (selectedEntity instanceof SimpleTurret) {
            // Турель мгновенно едет в точку клика
            selectedEntity.moveTo(mouseX, mouseY);
        } else if (selectedEntity instanceof SimpleRadar) {
            // Радар начинает НЕПРЕРЫВНО ТРЕКАТЬ мышь
            selectedEntity.startTracking();
            selectedEntity.setTargetDirection(mouseX, mouseY);
        }
    }
});

// 2. ПЕРЕМЕЩЕНИЕ МЫШИ (Постоянно обновляем координаты)
canvas.addEventListener('mousemove', (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    currentMouseX = event.clientX - rect.left;
    currentMouseY = event.clientY - rect.top;
});

// 3. ОТПУСКАНИЕ КНОПКИ МЫШИ
canvas.addEventListener('mouseup', (event: MouseEvent) => {
    if (event.button === 2 && selectedEntity instanceof SimpleRadar) {
        // Правая кнопка мыши отпущена — фиксируем сектор радара на месте!
        selectedEntity.stopTracking();
    }
});

function getRandomX(): number {
    return Math.floor(Math.random() * (750 - 50 + 1)) + 50;
}

const invaders: SimpleInvader[] = [
    new SimpleInvader(300, 0),
    new SimpleInvader(400, 0),
    new SimpleInvader(500, 0)
];

let lastTime = performance.now();

function gameTick(timestamp: number) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    invaders.forEach(invader => {
        invader.updateVisibility(deltaTime);
        if (invader.y > 600 || invader.hp <= 0) {
            invader.y = 0;
            invader.x = getRandomX();
            invader.hp = 100;
            invader.visibilityTimer = 0;
        } else {
            invader.y += 1.5;
        }
    });

    // --- ОБНОВЛЕНИЕ НАВЕДЕНИЯ РАДАРА КАЖДЫЙ КАДР ---
    radars.forEach(radar => {
        if (radar.isTrackingMouse) {
            // Если игрок удерживает ПКМ, непрерывно целимся в текущее положение курсора
            radar.setTargetDirection(currentMouseX, currentMouseY);
        }
        radar.rotate(deltaTime);
    });

    turrets.forEach(turret => turret.updateMovement(deltaTime));
    
    radars.forEach(radar => radar.scan(invaders));
    turrets.forEach(turret => turret.scan(invaders));
    turrets.forEach(turret => turret.attack(invaders));
    
    renderer.render(invaders, radars, turrets, selectedEntity);

    requestAnimationFrame(gameTick);
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameTick(timestamp);
});