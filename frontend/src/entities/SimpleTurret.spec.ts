import { expect } from 'chai';
import { SimpleInvader } from './SimpleInvader';
import { SimpleTurret } from './SimpleTurret';

describe('Юнит-тестирование боевой турели (SimpleTurret)', () => {

    it('должен правильно сохранять тактическое имя при создании', () => {
        const turret = new SimpleTurret(100, 100, 'Тестовая Пушка');
        expect(turret.name).to.equal('Тестовая Пушка');
    });

    it('должен делать видимыми врагов в БЛИЖНЕМ КРУГЕ обзора на 360 градусов при вызове scan', () => {
        const turret = new SimpleTurret(100, 100, 'Турель-Тест'); // visionRadius = 45
        const sideInvader = new SimpleInvader(70, 100); // Дистанция 30 пикселей СЛЕВА (внутри круга 45)

        expect(sideInvader.isVisible).to.be.false;
        turret.scan([sideInvader]);
        expect(sideInvader.isVisible).to.be.true;
    });

    it('должен делать видимым ДАЛЬНЕГО врага, если он попадает в сектор обстрела турели при scan', () => {
        const turret = new SimpleTurret(100, 100, 'Turret-Test', -Math.PI / 2, 45); // attackRange = 70
        const farInvader = new SimpleInvader(100, 50); // ИСПРАВЛЕНО: Дистанция 50 пикселей СВЕРХУ (внутри сектора 70)

        expect(farInvader.isVisible).to.be.false;
        turret.scan([farInvader]);
        expect(farInvader.isVisible).to.be.true;
    });

    it('НЕ должен делать видимым дальнего врага через scan, если он находится СБОКУ от сектора атаки', () => {
        const turret = new SimpleTurret(100, 100, 'Turret-Test', -Math.PI / 2, 45);
        const farSideInvader = new SimpleInvader(20, 100); // Дистанция 80 пикселей СЛЕВА (вне круга 45 и вне сектора 70)

        turret.scan([farSideInvader]);
        expect(farSideInvader.isVisible).to.be.false;
    });

    it('должен разворачивать сектор атаки в сторону видимого врага и фиксировать его', () => {
        const turret = new SimpleTurret(100, 100, 'Turret-Test', -Math.PI / 2, 45); // attackRange = 70
        const sideInvader = new SimpleInvader(150, 100); // ИСПРАВЛЕНО: Дистанция 50 пикселей СПРАВА (внутри 70)
        sideInvader.visibilityTimer = 1000;

        turret.attack([sideInvader]);

        expect(turret.angleDir).to.equal(0); 
        expect(turret.lockedTarget).to.equal(sideInvader);
        expect(sideInvader.hp).to.equal(95); // ИСПРАВЛЕНО: Урон теперь равен 5 (100 - 5 = 95)
    });

    it('должен сбрасывать фиксацию цели, если враг улетел за пределы максимального радиуса', () => {
        const turret = new SimpleTurret(100, 100, 'Turret-Test', -Math.PI / 2); // attackRange = 70
        const invader = new SimpleInvader(100, 140); // ИСПРАВЛЕНО: Дистанция 40 (внутри 70)
        invader.visibilityTimer = 1000;

        turret.attack([invader]);
        expect(turret.lockedTarget).to.equal(invader);

        invader.visibilityTimer = 0; 
        invader.y = 200;             // ИСПРАВЛЕНО: Дистанция 100 > attackRange 70
        turret.attack([invader]);

        expect(turret.lockedTarget).to.be.null;
        expect(turret.angleDir).to.equal(-Math.PI / 2);
    });

    it('должен возвращать ствол в исходное положение, если на поле нет видимых целей', () => {
        const turret = new SimpleTurret(100, 100, 'Turret-Test', -Math.PI / 2);
        turret.attack([]);
        expect(turret.angleDir).to.equal(-Math.PI / 2);
    });

    it('должен наносить измененный урон врагу, если свойство damagePerFrame было переписано', () => {
        const turret = new SimpleTurret(100, 100, 'Тяжелое ПВО');
        const invader = new SimpleInvader(150, 100); // ИСПРАВЛЕНО: Дистанция 50 пикселей (внутри 70)
        invader.visibilityTimer = 1000;

        turret.damagePerFrame = 20; // Прокачиваем урон до 20

        turret.attack([invader]);
        expect(invader.hp).to.equal(80); // 100 - 20 = 80
    });
});