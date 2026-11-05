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
        // Явно передаем скорость 0.01 радиана за мс для точности теста
        const radar = new SimpleRadar(200, 200, 'РЛС-Тест', -Math.PI / 2, 90, 0.01);
        const startLineAngle = radar.scanLineAngle;

        radar.rotate(10);
        expect(radar.scanLineAngle).to.equal(startLineAngle + 0.1);
        expect(radar.angleDir).to.equal(-Math.PI / 2);
    });

    it('должен разворачивать сканирующую линию обратно при достижении границ 90-градусного сектора', () => {
        // Передаем скорость 0.1, чтобы за 10 мс гарантированно дойти до края (45 градусов)
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
        expect(invader.isVisible).to.be.false;
    });

    it('должен МГНОВЕННО обнулять таймер видимости врага, если он сместился за боковые границы сектора радара', () => {
        const radar = new SimpleRadar(200, 200, 'РЛС-Тест', -Math.PI / 2, 90, 0.01);
        const invader = new SimpleInvader(200, 100);

        radar.scan([invader]);
        expect(invader.visibilityTimer).to.equal(1500);

        // Враг сместился за пределы угла 90 градусов
        invader.x = 50;
        invader.y = 200;

        radar.scan([invader]);
        expect(invader.visibilityTimer).to.equal(0);
        expect(invader.isVisible).to.be.false;
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
});