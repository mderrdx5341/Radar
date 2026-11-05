import { SimpleInvader, SimpleBuilding } from '../entities';

export class CollisionManager {
    /**
     * Проверяет столкновение конкретного БПЛА со всеми живыми зданиями базы.
     * Наносит урон зданиям при успешном Suicide Strike.
     * @returns boolean - true, если дрон врезался в здание и должен взорваться/перезагрузиться
     */
    public checkSuicideStrikes(invader: SimpleInvader, buildings: SimpleBuilding[]): boolean {
        for (const building of buildings) {
            if (building.isDestroyed) continue;

            // Считаем дельту расстояния между центрами дрона и бункера
            const dx = invader.x - building.x;
            const dy = invader.y - building.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Фикс промахов: ловим дрона по радиусу касания (30px + запас 15px) 
            // или если он физически перелетел центральную координату Y здания на его X-фланге
            const hitByDistance = dist <= (building.radius + invader.radius + 15);
            const hitByOverflight = invader.y >= building.y && Math.abs(dx) <= (building.radius + 15);

            if (hitByDistance || hitByOverflight) {
                building.hp = Math.max(0, building.hp - 30); // Наносим 30 урона прочности здания
                
                console.log(`[CollisionManager]: ВЗРЫВ КАМИКАДЗЕ! Объект ${building.name} атакован. Осталось HP: ${building.hp}`);
                return true; // Фиксируем факт столкновения для немедленного респавна
            }
        }
        return false; // Столкновений с живыми зданиями не обнаружено
    }
}