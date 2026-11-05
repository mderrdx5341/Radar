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
        const turret = new SimpleTurret(100, 100, 'Турель-Тест', -Math.PI / 2, 45); // attackRange = 70
        const farInvader = new SimpleInvader(100, 50); // Дистанция 50 пикселей СВЕРХУ (внутри сектора 70)

        expect(farInvader.isVisible).to.be.false;
        turret.scan([farInvader]);
        expect(farInvader.isVisible).to.be.true;
    });

    it('НЕ должен делать видимым дальнего врага через scan, если он находится СБОКУ от сектора атаки', () => {
        const turret = new SimpleTurret(100, 100, 'Турель-Тест', -Math.PI / 2, 45); // attackRange = 70
        const farSideInvader = new SimpleInvader(20, 100); // Дистанция 80 пикселей СЛЕВА (вне круга 45 и вне сектора 70)

        turret.scan([farSideInvader]);
        expect(farSideInvader.isVisible).to.be.false;
    });

    it('должен разворачивать сектор атаки в сторону видимого врага и фиксировать его', () => {
        const turret = new SimpleTurret(100, 100, 'Турель-Тест', -Math.PI / 2, 45); // attackRange = 70
        const sideInvader = new SimpleInvader(150, 100); // Дистанция 50 пикселей СПРАВА (внутри 70)
        sideInvader.visibilityTimer = 1000;

        turret.attack([sideInvader]);

        expect(turret.angleDir).to.equal(0); // Развернулся вправо
        expect(turret.lockedTarget).to.equal(sideInvader);
        expect(sideInvader.hp).to.equal(95); // Урон равен 5 (100 - 5 = 95)
    });

    it('должен сбрасывать фиксацию цели, если враг улетел за пределы максимального радиуса', () => {
        const turret = new SimpleTurret(100, 100, 'Турель-Тест', -Math.PI / 2); // attackRange = 70
        const invader = new SimpleInvader(100, 140); // Дистанция 40 (внутри 70)
        invader.visibilityTimer = 1000;

        turret.attack([invader]);
        expect(turret.lockedTarget).to.equal(invader);

        invader.visibilityTimer = 0; // Скрылся в тумане
        invader.y = 200;             // Дистанция 100 > attackRange 70
        turret.attack([invader]);

        expect(turret.lockedTarget).to.be.null; // Боевой замок снят
    });

    it('должен сохранять последнее направление ствола (замирать), если на поле исчезли видимые цели', () => {
        const turret = new SimpleTurret(100, 100, 'Турель-Тест', -Math.PI / 2); // Изначально вверх
        const sideInvader = new SimpleInvader(200, 100); // Строго справа (угол 0 градусов)
        sideInvader.visibilityTimer = 1000;

        // Поворачиваем турель вправо к видимой цели
        turret.attack([sideInvader]);
        expect(turret.angleDir).to.equal(0);

        // Симулируем, что цель мгновенно исчезла с поля
        sideInvader.visibilityTimer = 0;

        // Производим еще один тик атаки при отсутствии видимых целей
        turret.attack([sideInvader]);

        // Ствол НЕ возвращается наверх (-Math.PI / 2), а остается смотреть вправо (0)
        expect(turret.angleDir).to.equal(0);
    });

    it('должен наносить измененный урон врагу, если свойство damagePerFrame было переписано', () => {
        const turret = new SimpleTurret(100, 100, 'Тяжелое ПВО');
        const invader = new SimpleInvader(150, 100); // Дистанция 50 пикселей (внутри 70)
        invader.visibilityTimer = 1000;

        turret.damagePerFrame = 20; // Прокачиваем урон до 20

        turret.attack([invader]);
        expect(invader.hp).to.equal(80); // 100 - 20 = 80
    });

    it('должен правильно изменять целевые координаты при вызове moveTo', () => {
        const turret = new SimpleTurret(100, 100, 'Тест-ПВО');
        turret.moveTo(200, 300);

        expect(turret.targetX).to.equal(200);
        expect(turret.targetY).to.equal(300);
    });

    it('должен плавно перемещать турель к целевой точке по времени', () => {
        const turret = new SimpleTurret(100, 100, 'Тест-ПВО'); // moveSpeed = 0.12
        turret.moveTo(200, 100); // Движемся направо по оси X на 100 пикселей

        // Прошло 100 миллисекунд. Расстояние шага: 100 * 0.12 = 12 пикселей
        turret.updateMovement(100);

        expect(turret.x).to.equal(112);
        expect(turret.y).to.equal(100);
    });

    it('должен мгновенно фиксировать турель в конечной точке, если шаг превышает оставшееся расстояние', () => {
        const turret = new SimpleTurret(100, 100, 'Тест-ПВО');
        turret.moveTo(105, 100); // Отрезок всего 5 пикселей

        // Прошло 100 мс (расчетный шаг 12 пикселей, что больше чем оставшиеся 5)
        turret.updateMovement(100);

        expect(turret.x).to.equal(105); // Встали идеально в цель
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