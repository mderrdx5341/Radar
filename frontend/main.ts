import { SimpleInvader, SimpleRadar, SimpleTurret } from '@/entities/SimpleEntities';
import { CanvasRenderer } from '@/render/CanvasRenderer';

const renderer = new CanvasRenderer('gameCanvas');

// Дальнобойный радар по центру, светящий широким сектором (90 градусов)
const radars: SimpleRadar[] = [
    new SimpleRadar(400, 300, -Math.PI / 2, 90)
];

// Турель стоит внизу экрана
const turrets: SimpleTurret[] = [
    new SimpleTurret(400, 450, -Math.PI / 2, 45)
];

// Пускаем двух врагов по разным флангам
const invaders: SimpleInvader[] = [
    new SimpleInvader(350, 0), // Летит по левому флангу
    new SimpleInvader(500, 0),  // Летит по правому флангу
    new SimpleInvader(400, 0)  // Летит по правому флангу
];

function gameTick() {
    invaders.forEach(invader => {
        invader.isVisible = false;
        
        if (invader.y > 600 || invader.hp <= 0) {
            invader.y = 0;
            invader.hp = 100;
        } else {
            invader.y += 1.5; // Медленная скорость для наглядности слежения
        }
    });

    radars.forEach(radar => radar.scan(invaders));
    turrets.forEach(turret => turret.scan(invaders)); 
    turrets.forEach(turret => turret.attack(invaders)); 
    
    renderer.render(invaders, radars, turrets);
    requestAnimationFrame(gameTick);
}

gameTick();