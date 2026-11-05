import { SimpleInvader, SimpleRadar, SimpleTurret } from '@/entities/';
import { CanvasRenderer } from '@/render/CanvasRenderer';

const renderer = new CanvasRenderer('gameCanvas');

// Создаем радар с углом качания 35 градусов влево-вправо от центра
const radars: SimpleRadar[] = [
    new SimpleRadar(400, 350, -Math.PI / 2, 90, 0.0025)
];

const turrets: SimpleTurret[] = [
    new SimpleTurret(400, 420, -Math.PI / 2, 45)
];

function getRandomX(): number {
    return Math.floor(Math.random() * (750 - 50 + 1)) + 50;
}

const invaders: SimpleInvader[] = [
    new SimpleInvader(300, 0), // Этот летит слева
    new SimpleInvader(400, 0), // Этот летит по центру
    new SimpleInvader(500, 0)  // Этот летит справа
];

let lastTime = performance.now();

function gameTick(timestamp: number) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    // 1. Обновление состояния врагов
    invaders.forEach(invader => {
        // ПЛАВНОЕ УГАСАНИЕ: уменьшаем таймер видимости на прошедшее deltaTime
        invader.updateVisibility(deltaTime);
        
        if (invader.y > 600 || invader.hp <= 0) {
            invader.y = 0;
            invader.x = getRandomX();
            invader.hp = 100;
            invader.visibilityTimer = 0; // Сбрасываем видимость при возрождении
        } else {
            invader.y += 1.5;
        }
    });

    // 2. Вращение луча РЛС
    radars.forEach(radar => radar.rotate(deltaTime));

    // 3. Сканирование и Бой
    radars.forEach(radar => radar.scan(invaders));
    turrets.forEach(turret => turret.scan(invaders));
    turrets.forEach(turret => turret.attack(invaders));
    
    // 4. Отрисовка
    renderer.render(invaders, radars, turrets);

    requestAnimationFrame(gameTick);
}

// Запускаем первый кадр, передавая стартовое время
requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameTick(timestamp);
});