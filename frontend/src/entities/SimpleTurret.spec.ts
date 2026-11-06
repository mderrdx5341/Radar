import { expect } from 'chai';
import { SimpleTurret } from './SimpleTurret';
import { SimpleInvader } from './SimpleInvader';

describe('SimpleTurret', () => {
    it('должен инициализироваться с корректными базовыми параметрами', () => {
        const turret = new SimpleTurret(500, 400, 'ПВО-Защитник');
        expect(turret.x).to.equal(500);
        expect(turret.y).to.equal(400);
        expect(turret.name).to.equal('ПВО-Защитник');
        expect(turret.attackRange).to.equal(70);
        expect(turret.currentTarget).to.be.null;
    });

    it('должен корректно менять огневую позицию при вызове moveTo', () => {
        const turret = new SimpleTurret(0, 0, 'Мобильный-ПВО');
        turret.moveTo(150, 250);
        expect(turret.x).to.equal(150);
        expect(turret.y).to.equal(250);
    });

    it('должен захватывать ближайшую легитимную цель из присланного списка visibleTargets', () => {
        const turret = new SimpleTurret(0, 0, 'ПВО-Захват');
        
        // Создаем два видимых дрона на разном расстоянии
        const closeInvader = new SimpleInvader(0, 30);  // Дистанция 30px (внутри 70px)
        const farInvader = new SimpleInvader(0, 200);  // Дистанция 200px (вне зоны)
        
        closeInvader.visibilityTimer = 1000; // взводим видимость
        farInvader.visibilityTimer = 1000;

        const visibleTargets: Array<SimpleInvader> = [closeInvader, farInvader];

        // Запускаем атаку — пушка должна выбрать только близкий дрон
        turret.attack(visibleTargets, 16.66);
        expect(turret.currentTarget).to.equal(closeInvader);
    });

    it('должен наносить урон захваченной цели по истечении attackInterval', () => {
        const turret = new SimpleTurret(0, 0, 'ПВО-Штурм');
        const invader = new SimpleInvader(0, 20); // Сверхоблизкая дистанция
        invader.visibilityTimer = 1000;

        const visibleTargets: Array<SimpleInvader> = [invader];

        // Первый тик — захватываем цель
        turret.attack(visibleTargets, 16.66);
        
        // Симулируем прохождение 350 мс (attackInterval равен 300 мс)
        turret.attack(visibleTargets, 350);

        // Проверяем, что у инвейдера списалось здоровье (было 100, стало 80)
        expect(invader.hp).to.equal(80);
        // Проверяем, что пушка внесла себя в список attackers этого дрона
        expect(invader.attackers.includes(turret)).to.be.true;
    });
});