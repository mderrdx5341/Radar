import { expect } from 'chai';
import { SimpleInvader } from './SimpleInvader';
import { SimpleTurret } from './SimpleTurret';

describe('Юнит-тестирование боевой турели (SimpleTurret)', () => {

    it('должен делать видимыми врагов в БЛИЖНЕМ КРУГЕ обзора на 360 градусов при вызове scan', () => {
        const turret = new SimpleTurret(100, 100); 
        const sideInvader = new SimpleInvader(40, 100); // Дистанция 60 пикселей (сзади сектора)

        expect(sideInvader.isVisible).to.be.false;
        turret.scan([sideInvader]);
        expect(sideInvader.isVisible).to.be.true;
    });

    it('должен делать видимым ДАЛЬНЕГО врага, если он попадает в сектор обстрела турели при scan', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2, 45);
        const farInvader = new SimpleInvader(100, -30); // Дистанция 130 пикселей

        expect(farInvader.isVisible).to.be.false;
        turret.scan([farInvader]);
        expect(farInvader.isVisible).to.be.true;
    });

    it('НЕ должен делать видимым дальнего врага через scan, если он находится СБОКУ от сектора атаки', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2, 45);
        const farSideInvader = new SimpleInvader(0, 50);

        turret.scan([farSideInvader]);
        expect(farSideInvader.isVisible).to.be.false;
    });

    it('должен разворачивать сектор атаки в сторону видимого врага и фиксировать его', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2, 45);
        const sideInvader = new SimpleInvader(200, 100); // Дистанция 100
        sideInvader.visibilityTimer = 1000; // Делаем видимым

        turret.attack([sideInvader]);

        expect(turret.angleDir).to.equal(0); // Повернулся направо
        expect(turret.lockedTarget).to.equal(sideInvader);
        expect(sideInvader.hp).to.equal(99);
    });

    it('должен сбрасывать фиксацию цели, если враг улетел за пределы максимального радиуса', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2);
        const invader = new SimpleInvader(100, 150);
        invader.visibilityTimer = 1000;

        turret.attack([invader]);
        expect(turret.lockedTarget).to.equal(invader);

        invader.visibilityTimer = 0; // Скрылся в тумане
        invader.y = 400;             // Дистанция 300 > 160
        turret.attack([invader]);

        expect(turret.lockedTarget).to.be.null;
        expect(turret.angleDir).to.equal(-Math.PI / 2); // Вернулся в дефолт
    });

    it('должен возвращать ствол в исходное положение, если на поле нет видимых целей', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2);
        turret.attack([]);
        expect(turret.angleDir).to.equal(-Math.PI / 2);
    });
});