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
        const sideInvader = new SimpleInvader(70, 100); // Дистанция 30 пикселей СЛЕВА

        expect(sideInvader.isVisible).to.be.false;
        turret.scan([sideInvader]);
        expect(sideInvader.isVisible).to.be.true;
    });

    it('должен делать видимым ДАЛЬНЕГО врага, если он попадает в сектор обстрела турели при scan', () => {
        const turret = new SimpleTurret(100, 100, 'Турель-Тест', -Math.PI / 2, 45); // attackRange = 90
        const farInvader = new SimpleInvader(100, 30); // Дистанция 70 пикселей СВЕРХУ

        expect(farInvader.isVisible).to.be.false;
        turret.scan([farInvader]);
        expect(farInvader.isVisible).to.be.true;
    });

    it('НЕ должен делать видимым дальнего врага через scan, если он находится СБОКУ от сектора атаки', () => {
        const turret = new SimpleTurret(100, 100, 'Турель-Тест', -Math.PI / 2, 45);
        const farSideInvader = new SimpleInvader(20, 100); // Дистанция 80 пикселей СЛЕВА

        turret.scan([farSideInvader]);
        expect(farSideInvader.isVisible).to.be.false;
    });

    it('должен разворачивать сектор атаки в сторону видимого врага и фиксировать его', () => {
        const turret = new SimpleTurret(100, 100, 'Турель-Тест', -Math.PI / 2, 45);
        const sideInvader = new SimpleInvader(160, 100); // Дистанция 60 пикселей СПРАВА
        sideInvader.visibilityTimer = 1000;

        turret.attack([sideInvader]);

        expect(turret.angleDir).to.equal(0); // Развернулся вправо
        expect(turret.lockedTarget).to.equal(sideInvader);
        expect(sideInvader.hp).to.equal(99);
    });

    it('должен сбрасывать фиксацию цели, если враг улетел за пределы maximal радиуса', () => {
        const turret = new SimpleTurret(100, 100, 'Турель-Тест', -Math.PI / 2);
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
        const turret = new SimpleTurret(100, 100, 'Турель-Тест', -Math.PI / 2);
        turret.attack([]);
        expect(turret.angleDir).to.equal(-Math.PI / 2);
    });

    it('должен правильно изменять целевые координаты при вызове moveTo', () => {
        const turret = new SimpleTurret(100, 100, 'Тест-ПВО');
        turret.moveTo(200, 300);

        expect(turret.targetX).to.equal(200);
        expect(turret.targetY).to.equal(300);
    });

    it('должен плавно перемещать турель к целевой точке по времени', () => {
        const turret = new SimpleTurret(100, 100, 'Тест-ПВО'); // moveSpeed = 0.12
        turret.moveTo(200, 100); // Движемся строго направо по оси X на 100 пикселей

        // Прошло 100 миллисекунд. Расстояние шага должно составить: 100 * 0.12 = 12 пикселей
        turret.updateMovement(100);

        expect(turret.x).to.equal(112);
        expect(turret.y).to.equal(100);
    });

    it('должен мгновенно фиксировать турель в конечной точке, если шаг превышает оставшееся расстояние', () => {
        const turret = new SimpleTurret(100, 100, 'Тест-ПВО');
        turret.moveTo(105, 100); // Отрезок всего 5 пикселей

        // Прошло 100 мс (шаг 12 пикселей, что больше чем 5)
        turret.updateMovement(100);

        expect(turret.x).to.equal(105); // Мы встали идеально в цель
        expect(turret.y).to.equal(100);
    });

    it('должен игнорировать движение, если дельта времени меньше или равна нулю', () => {
        const turret = new SimpleTurret(100, 100, 'Тест-ПВО');
        turret.moveTo(200, 200);

        turret.updateMovement(0);
        turret.updateMovement(-10);

        expect(turret.x).to.equal(100);
    });
});