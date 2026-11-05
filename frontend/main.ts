import { SimpleInvader, SimpleRadar, SimpleTurret, RouteManager } from '@/entities';
import { PlacementManager } from '@/entities/PlacementManager';
import { CanvasRenderer } from '@/render/CanvasRenderer';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const renderer = new CanvasRenderer('gameCanvas');
const placement = new PlacementManager();

// Инициализация глобального Менеджера Маршрутов роя
const routeManager = new RouteManager();

const radars: SimpleRadar[] = [
    new SimpleRadar(260, 260, 'РЛС-1')
];

const turrets: SimpleTurret[] = [
    new SimpleTurret(260, 340, 'ПВО-1')
];

let selectedEntity: SimpleRadar | SimpleTurret | null = null;
let currentMouseX = 0;
let currentMouseY = 0;
let score = 0;

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('mousedown', (event: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (event.button === 0) {
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

        if (placement.currentBuildType) {
            const tooCloseRadar = radars.some(r => Math.sqrt((r.x - mouseX) ** 2 + (r.y - mouseY) ** 2) < 12);
            const tooCloseTurret = turrets.some(t => Math.sqrt((t.x - mouseX) ** 2 + (t.y - mouseY) ** 2) < 12);

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
        if (placement.currentBuildType) {
            placement.cancelBuilding();
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

// ИСПРАВЛЕНО: Генерируем рой ровно из 10 БПЛА, привязанных к 10 фиксированным точкам вылета
const invaders: SimpleInvader[] = [];
routeManager.spawnPoints.forEach(spawnX => {
    // Враги выстраиваются на старте на разной высоте сверху (туман войны), но строго по своим X-коридорам
    const invader = new SimpleInvader(spawnX, Math.floor(Math.random() * -300) - 50);
    // Сразу на старте выдаем дрону его первоначальный чистый полетный план
    invader.waypoints = routeManager.generateFlightPlan(invader.spawnPointX, invader.y);
    invaders.push(invader);
});

let lastTime = performance.now();

function gameTick(timestamp: number) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    radars.forEach(radar => {
        if (radar.isTrackingMouse) {
            radar.setTargetDirection(currentMouseX, currentMouseY);
        }
        radar.rotate(deltaTime);
        radar.scan(invaders);
    });

    invaders.forEach(invader => {
        invader.updateVisibility(deltaTime);
        
        if (invader.isVisible) {
            const seenByAnyRadar = radars.some(radar => radar.isInsideSector(invader));
            const seenByAnyTurret = turrets.some(turret => {
                const dist = Math.sqrt((turret.x - invader.x) ** 2 + (turret.y - invader.y) ** 2);
                return dist <= turret.visionRadius || dist <= turret.attackRange; 
            });

            if (!seenByAnyRadar && !seenByAnyTurret) {
                invader.visibilityTimer = 0;
            }
        }
        
        // Проверка прорыва или уничтожения
        if (invader.y > 540 || invader.hp <= 0) {
            if (invader.hp <= 0) {
                score++;
                
                // РАДИОДОНЕСЕНИЕ 1: Дрон уничтожен — передаем ПВО в Менеджер Маршрутов роя
                const killerTurret = turrets.find(t => t.currentTarget === invader);
                if (killerTurret) {
                    routeManager.reportHazard(killerTurret);
                }
            } else {
                // РАДИОДОНЕСЕНИЕ 2: Дрон прорвался — рапортуем об успешном чистом коридоре
                routeManager.reportSuccess(invader.spawnPointX);
            }

            // РЕСТАРТ ДРОНА: Он возрождается на своей родной точке вылета
            invader.y = Math.floor(Math.random() * -100) - 20;
            invader.x = invader.spawnPointX;
            invader.hp = 100;
            invader.visibilityTimer = 0;
            invader.moveAngle = Math.PI / 2;
            
            // ИСПРАВЛЕНО: Летящие дроны не дергаются в воздухе! 
            // Только новый, только что возрожденный дрон берет из менеджера свежую версию маршрута!
            invader.waypoints = routeManager.generateFlightPlan(invader.spawnPointX, invader.y);
        } else {
            // Дрон просто летит по путям, которые у него уже заложены в памяти
            invader.moveDown();
        }
    });

    turrets.forEach(turret => {
        turret.updateMovement(deltaTime);
        turret.scan(invaders);
        turret.attack(invaders, deltaTime);
    });
    
    // Передаем список обнаруженных турелей из менеджера в рендерер для отрисовки коричневых кругов
    renderer.render(
        invaders, 
        radars, 
        turrets, 
        selectedEntity, 
        placement.currentBuildType, 
        currentMouseX, 
        currentMouseY, 
        score,
        routeManager.getDiscoveredTurrets()
    );

    requestAnimationFrame(gameTick);
}

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameTick(timestamp);
});