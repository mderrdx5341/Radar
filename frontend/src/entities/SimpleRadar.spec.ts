import { expect } from 'chai';
import { SimpleInvader } from './SimpleInvader';
import { SimpleRadar } from './SimpleRadar';

describe('Юнит-тестирование радиолокатора РЛС (SimpleRadar)', () => {

    it('должен правильно сохранять тактическое имя при создании', () => {
        const radar = new SimpleRadar(100, 100, 'Тестовый Локатор');
        expect(radar.name).to.equal('Тестовый Локатор');
    });

    it('должен выставлять 1500 мс послесвечения при пересечении луча РЛС', () => {
        const radar = new SimpleRadar(200, 200, 'РЛС-Тест', -Math.PI / 2, 90, 0.01);
        const invader = new SimpleInvader(200, 100); // Строго над радаром

        radar.scan([invader]);
        expect(invader.visibilityTimer).to.equal(1500);
        expect(invader.isVisible).to.be.true;
    });

    it('должен плавно изменять угол сканирующей линии scanLineAngle по времени', () => {
        const radar = new SimpleRadar(200, 200, 'РЛС-Тест', -Math.PI / 2, 90, 0.01);
        const startLineAngle = radar.scanLineAngle;

        radar.rotate(10);
        expect(radar.scanLineAngle).to.equal(startLineAngle + 0.1);
        expect(radar.angleDir).to.equal(-Math.PI / 2);
    });

    it('должен разворачивать сканирующую линию обратно при достижении границ 90-градусного сектора', () => {
        const radar = new SimpleRadar(200, 200, 'РЛС-Тест', -Math.PI / 2, 90, 0.1);
        radar.rotate(10); 
        
        const angleAfterTurn = radar.scanLineAngle;
        radar.rotate(1);
        expect(radar.scanLineAngle).to.be.lessThan(angleAfterTurn);
    });

    it('должен обнаруживать врага, только если его координаты пересекает сканирующий луч', () => {
        const radar = new SimpleRadar(200, 200, 'РЛС-Тест', -Math.PI / 2, 90, 0.01);
        const invader = new SimpleInvader(200, 100);

        radar.scan([invader]);
        expect(invader.isVisible).to.be.true;

        radar.rotate(52); // Сдвигаем луч в сторону
        invader.visibilityTimer = 0;

        radar.scan([invader]);
        expect(invader.isVisible).to.be.false; // Луч отвернулся, враг скрылся
    });

    it('не должен принудительно занулять таймер видимости врага, если он вышел за боковые границы сектора', () => {
        const radar = new SimpleRadar(200, 200, 'РЛС-Тест', -Math.PI / 2, 90, 0.01);
        const invader = new SimpleInvader(200, 100);

        // 1. Луч РЛС изначально пересекает его — даём послесвечение
        radar.scan([invader]);
        expect(invader.visibilityTimer).to.equal(1500);

        // 2. Смещаем врага далеко вбок за пределы угла 90 градусов
        invader.x = 50;
        invader.y = 200;

        // 3. Запускаем сканирование
        radar.scan([invader]);

        // ИТОГ: Таймер НЕ должен зануляться РЛС-кой, он плавно угаснет сам в основном цикле времени
        expect(invader.visibilityTimer).to.equal(1500);
        expect(invader.isVisible).to.be.true;
    });

    it('должен игнорировать вращение луча, если deltaTime меньше или равен нулю', () => {
        const radar = new SimpleRadar(200, 200, 'РЛС-Тест');
        const startLineAngle = radar.scanLineAngle;
        
        radar.rotate(0);
        expect(radar.scanLineAngle).to.equal(startLineAngle);
    });

    it('должен корректно обрабатывать пустой массив врагов в радаре', () => {
        const radar = new SimpleRadar(200, 200, 'РЛС-Тест');
        expect(() => radar.scan([])).not.to.throw();
    });

    it('должен правильно управлять флагом удержания мыши (isTrackingMouse)', () => {
        const radar = new SimpleRadar(200, 200, 'РЛС-Тест');
        expect(radar.isTrackingMouse).to.be.false;

        radar.startTracking();
        expect(radar.isTrackingMouse).to.be.true;

        radar.stopTracking();
        expect(radar.isTrackingMouse).to.be.false;
    });

    it('должен возвращать true, если цель внутри сектора, и false, если снаружи или далеко', () => {
        const radar = new SimpleRadar(200, 200, 'РЛС-Тест', -Math.PI / 2, 90);
        const inside = new SimpleInvader(200, 100);
        const outsideAngle = new SimpleInvader(50, 200);
        const outsideDist = new SimpleInvader(200, -50); // Дистанция 250 > 180

        expect(radar.isInsideSector(inside)).to.be.true;
        expect(radar.isInsideSector(outsideAngle)).to.be.false;
        expect(radar.isInsideSector(outsideDist)).to.be.false;
    });
});