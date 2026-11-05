import { expect } from 'chai';
import { SimpleInvader, SimpleRadar, SimpleTurret } from './SimpleEntities';

describe('Тестирование Тумана Войны и Радаров с послесвечением (SimpleEntities)', () => {
    
    it('должен правильно управлять таймером угасания видимости врага', () => {
        const invader = new SimpleInvader(100, 100);
        expect(invader.isVisible).to.be.false;

        invader.visibilityTimer = 500; // Даем 500 мс видимости
        expect(invader.isVisible).to.be.true;

        invader.updateVisibility(200); // Прошло 200 мс
        expect(invader.visibilityTimer).to.equal(300);
        expect(invader.isVisible).to.be.true;

        invader.updateVisibility(400); // Прошло еще 400 мс (ушли в ноль)
        expect(invader.visibilityTimer).to.equal(0);
        expect(invader.isVisible).to.be.false;

        invader.updateVisibility(-50); // Игнорирует отрицательную дельту
    });

    it('должен выставлять 1500 мс послесвечения при пересечении луча РЛС', () => {
        const radar = new SimpleRadar(200, 200, -Math.PI / 2, 90, 0.01);
        const invader = new SimpleInvader(200, 100); // Строго над радаром

        radar.scan([invader]);
        expect(invader.visibilityTimer).to.equal(1500);
        expect(invader.isVisible).to.be.true;
    });

    it('должен плавно изменять угол сканирующей линии scanLineAngle по времени', () => {
        const radar = new SimpleRadar(200, 200, -Math.PI / 2, 90, 0.01);
        const startLineAngle = radar.scanLineAngle;

        radar.rotate(10);
        expect(radar.scanLineAngle).to.equal(startLineAngle + 0.1);
    });

    it('должен разворачивать сканирующую линию обратно при достижении границ 90-градусного сектора', () => {
        const radar = new SimpleRadar(200, 200, -Math.PI / 2, 90, 0.1);
        radar.rotate(10); 
        
        const angleAfterTurn = radar.scanLineAngle;
        radar.rotate(1);
        expect(radar.scanLineAngle).to.be.lessThan(angleAfterTurn);
    });

    it('должен игнорировать вращение луча, если deltaTime меньше или равен нулю', () => {
        const radar = new SimpleRadar(200, 200);
        const startLineAngle = radar.scanLineAngle;
        
        radar.rotate(0);
        expect(radar.scanLineAngle).to.equal(startLineAngle);
    });

    it('должен корректно обрабатывать пустой массив врагов в радаре', () => {
        const radar = new SimpleRadar(200, 200);
        expect(() => radar.scan([])).not.to.throw();
    });

    it('должен МГНОВЕННО обнулять таймер видимости врага, если он сместился за боковые границы сектора радара', () => {
        const radar = new SimpleRadar(200, 200, -Math.PI / 2, 90, 0.01);
        const invader = new SimpleInvader(200, 100); // Строго над радаром (внутри сектора)

        // 1. Луч РЛС изначально пересекает его — даём послесвечение
        radar.scan([invader]);
        expect(invader.visibilityTimer).to.equal(1500);

        // 2. Симулируем, что враг сместился по горизонтали далеко вбок (на X: 50, Y: 200 — это угол 180 градусов, вне сектора)
        invader.x = 50;
        invader.y = 200;

        // 3. Запускаем сканирование
        radar.scan([invader]);

        // ИТОГ: Таймер послесвечения должен мгновенно занулиться, проигнорировав 1.5 секунды задержки!
        expect(invader.visibilityTimer).to.equal(0);
        expect(invader.isVisible).to.be.false;
    });
});

describe('Тестирование Комбинированной Турели (SimpleTurret)', () => {

    it('должен делать видимыми врагов в БЛИЖНЕМ КРУГЕ обзора на 360 градусов при вызове scan', () => {
        const turret = new SimpleTurret(100, 100); 
        const sideInvader = new SimpleInvader(40, 100); // Дистанция 60

        turret.scan([sideInvader]);
        expect(sideInvader.isVisible).to.be.true;
        expect(sideInvader.visibilityTimer).to.equal(100);
    });

    it('должен делать видимым ДАЛЬНЕГО врага, если он попадает в сектор обстрела турели при scan', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2, 45);
        const farInvader = new SimpleInvader(100, -30); // Дистанция 130

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
        sideInvader.visibilityTimer = 1000; // Сделаем его видимым

        turret.attack([sideInvader]);

        expect(turret.angleDir).to.equal(0);
        expect(turret.lockedTarget).to.equal(sideInvader);
        expect(sideInvader.hp).to.equal(99);
    });

    it('должен сбрасывать фиксацию цели, если враг улетел за пределы максимального радиуса', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2); // defaultAngle = -Math.PI / 2 (вверх)
        const invader = new SimpleInvader(100, 150); // Враг изначально внизу (дистанция 50)
        invader.visibilityTimer = 1000;

        // 1. Захватываем цель
        turret.attack([invader]);
        expect(turret.lockedTarget).to.equal(invader);

        // Симулируем угасание и улет врага (как в реальной игре)
        invader.visibilityTimer = 0; // Враг скрылся в тумане войны
        invader.y = 400;             // И улетел далеко вниз (дистанция 300 > 160)

        // 2. Вызываем боевой тик наведения
        turret.attack([invader]);

        // ТЕПЕРЬ ВСЁ СОВПАДЕТ:
        // Боевой замок лазера снят
        expect(turret.lockedTarget).to.be.null;
        
        // Видимых целей на поле больше нет, ствол обязан вернуться в исходное положение по умолчанию (-Math.PI / 2)
        expect(turret.angleDir).to.equal(-Math.PI / 2);
    });

    it('должен возвращать ствол в исходное положение, если на поле нет видимых целей', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2);
        turret.attack([]);
        expect(turret.angleDir).to.equal(-Math.PI / 2);
    });
});