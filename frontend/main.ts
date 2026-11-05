import { SimpleInvader, SimpleRadar, SimpleTurret } from '@/entities';
import { PlacementManager } from '@/entities/PlacementManager';
import { CanvasRenderer } from '@/render/CanvasRenderer';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const renderer = new CanvasRenderer('gameCanvas');
const placement = new PlacementManager(); // Сетка 40x40

const radars: SimpleRadar[] = [
    new SimpleRadar(260, 260, 'РЛС-1')
];

const turrets: SimpleTurret[] = [
    new SimpleTurret(260, 340, 'ПВО-1')
];

let selectedEntity: SimpleRadar | SimpleTurret | null = null;
let currentMouseX = 0;
let currentMouseY = 0;

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('mousedown', (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (event.button === 0) {
        // --- ЛЕВАЯ КНОПКА МЫШИ ---
        
        if (mouseY > 540) {
            if (mouseX >= 20 && mouseX <= 160) {
                placement.startBuilding('RADAR');
                selectedEntity = null;
            } else if (mouseX >= 180 && mouseX <= 320) {
                placement.startBuilding('TURRET');
                selectedEntity = null;
            }
            return;
        }

        // Если включен режим СВОБОДНОГО СТРОИТЕЛЬСТВА
        if (placement.currentBuildType) {
            // Проверяем дистанцию: нельзя строить здания вплотную друг к другу (радиус коллизии 20px)
            const tooCloseRadar = radars.some(r => Math.sqrt((r.x - mouseX) ** 2 + (r.y - mouseY) ** 2) < 20);
            const tooCloseTurret = turrets.some(t => Math.sqrt((t.x - mouseX) ** 2 + (t.y - mouseY) ** 2) < 20);

            if (!tooCloseRadar && !tooCloseTurret) {
                if (placement.currentBuildType === 'RADAR') {
                    radars.push(new SimpleRadar(mouseX, mouseY, `РЛС-${radars.length + 1}`));
                } else if (placement.currentBuildType === 'TURRET') {
                    turrets.push(new SimpleTurret(mouseX, mouseY, `ПВО-${turrets.length + 1}`));
                }
                placement.cancelBuilding(); 
            }
            return;
        }

        const clickedRadar = radars.find(r => Math.abs(r.x - mouseX) <= 15 && Math.abs(r.y - mouseY) <= 15);
        const clickedTurret = turrets.find(t => Math.abs(t.x - mouseX) <= 15 && Math.abs(t.y - mouseY) <= 15);

        if (clickedRadar) {
            selectedEntity = clickedRadar;
        } else if (clickedTurret) {
            selectedEntity = clickedTurret;
        } else {
            selectedEntity = null;
        }
    } else if (event.button === 2) {
        // --- ПРАВАЯ КНОПКА МЫШИ (Действие или Отмена постройки) ---
        if (placement.currentBuildType) {
            placement.cancelBuilding(); // ПКМ отменяет режим строительства
            return;
        }

        if (selectedEntity instanceof SimpleTurret) {
            selectedEntity.moveTo(mouseX, mouseY);
        } else if (selectedEntity instanceof SimpleRadar) {
            selectedEntity.startTracking();
            selectedEntity.setTargetDirection(mouseX, mouseY);
        }
    }
});

canvas.addEventListener('mousemove', (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    currentMouseX = event.clientX - rect.left;
    currentMouseY = event.clientY - rect.top;
});

canvas.addEventListener('mouseup', (event: MouseEvent) => {
    if (event.button === 2 && selectedEntity instanceof SimpleRadar) {
        selectedEntity.stopTracking();
    }
});

function getRandomX(): number {
    // Враги спавнятся сверху, ограничиваем ширину, чтобы не пересекались с UI справа
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

    // Враги не должны лететь в зону магазина (Y > 540 — это база, они там взрываются)
    invaders.forEach(invader => {
        invader.updateVisibility(deltaTime);
        if (invader.y > 540 || invader.hp <= 0) {
            invader.y = 0;
            invader.x = getRandomX();
            invader.hp = 100;
            invader.visibilityTimer = 0;
        } else {
            invader.y += 1.5;
        }
    });

    radars.forEach(radar => {
        if (radar.isTrackingMouse) {
            radar.setTargetDirection(currentMouseX, currentMouseY);
        }
        radar.rotate(deltaTime);
    });

    turrets.forEach(turret => turret.updateMovement(deltaTime));
    
    radars.forEach(radar => radar.scan(invaders));
    turrets.forEach(turret => turret.scan(invaders));
    turrets.forEach(turret => turret.attack(invaders));
    
    renderer.render(
        invaders, 
        radars, 
        turrets, 
        selectedEntity,
        placement.currentBuildType,
        currentMouseX,
        currentMouseY
    );

    requestAnimationFrame(gameTick);
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameTick(timestamp);
});