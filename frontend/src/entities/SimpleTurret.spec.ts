import { expect } from 'chai';
import { SimpleInvader } from './SimpleInvader';
import { SimpleTurret } from './SimpleTurret';

describe('Юнит-тестирование боевой турели (SimpleTurret)', () => {

    it('должен делать видимыми врагов в БЛИЖНЕМ КРУГЕ обзора на 360 градусов при вызове scan', () => {
        const turret = new SimpleTurret(100, 100); // visionRadius = 45
        const sideInvader = new SimpleInvader(70, 100); // Дистанция 30 пикселей СЛЕВА (внутри круга 45)

        expect(sideInvader.isVisible).to.be.false;
        turret.scan([sideInvader]);
        expect(sideInvader.isVisible).to.be.true;
    });

    it('должен делать видимым ДАЛЬНЕГО врага, если он попадает в сектор обстрела турели при scan', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2, 45); // attackRange = 90
        const farInvader = new SimpleInvader(100, 30); // Дистанция 70 пикселей СВЕРХУ (внутри сектора 90)

        expect(farInvader.isVisible).to.be.false;
        turret.scan([farInvader]);
        expect(farInvader.isVisible).to.be.true;
    });

    it('НЕ должен делать видимым дальнего врага через scan, если он находится СБОКУ от сектора атаки', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2, 45); // visionRadius = 45, attackRange = 90
        const farSideInvader = new SimpleInvader(20, 100); // Дистанция 80 пикселей СЛЕВА (вне круга 45 и вне сектора)

        turret.scan([farSideInvader]);
        expect(farSideInvader.isVisible).to.be.false;
    });

    it('должен разворачивать сектор атаки в сторону видимого врага и фиксировать его', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2, 45); // attackRange = 90
        const sideInvader = new SimpleInvader(160, 100); // Дистанция 60 пикселей СПРАВА
        sideInvader.visibilityTimer = 1000;

        turret.attack([sideInvader]);

        expect(turret.angleDir).to.equal(0); // Развернулся вправо
        expect(turret.lockedTarget).to.equal(sideInvader);
        expect(sideInvader.hp).to.equal(99);
    });

    it('должен сбрасывать фиксацию цели, если враг улетел за пределы максимального радиуса', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2); // attackRange = 90
        const invader = new SimpleInvader(100, 150); // Дистанция 50 (внутри)
        invader.visibilityTimer = 1000;

        turret.attack([invader]);
        expect(turret.lockedTarget).to.equal(invader);

        invader.visibilityTimer = 0; // Скрылся
        invader.y = 250;             // Дистанция 150 > attackRange 90
        turret.attack([invader]);

        expect(turret.lockedTarget).to.be.null;
        expect(turret.angleDir).to.equal(-Math.PI / 2);
    });

    it('должен возвращать ствол в исходное положение, если на поле нет видимых целей', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2);
        turret.attack([]);
        expect(turret.angleDir).to.equal(-Math.PI / 2);
    });
});