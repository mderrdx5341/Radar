import { expect } from 'chai';
import { SimpleRadar } from './SimpleRadar';
import { SimpleInvader } from './SimpleInvader';
import { Player } from '../services/Player';

describe('SimpleRadar', () => {
    let player: Player;

    beforeEach(() => {
        // Создаем чистый экземпляр игрока перед каждым тестом
        player = new Player();
    });

    it('должен инициализироваться с корректными базовыми параметрами', () => {
        const radar = new SimpleRadar(400, 300, 'Тест-РЛС');
        expect(radar.x).to.equal(400);
        expect(radar.y).to.equal(300);
        expect(radar.name).to.equal('Тест-РЛС');
        expect(radar.visionRadius).to.equal(180);
        expect(radar.isTrackingMouse).to.be.false;
    });

    it('должен корректно изменять флаги отслеживания мыши', () => {
        const radar = new SimpleRadar(400, 300, 'Тест-РЛС');
        radar.startTracking();
        expect(radar.isTrackingMouse).to.be.true;
        radar.stopTracking();
        expect(radar.isTrackingMouse).to.be.false;
    });

    it('должен корректно вычислять targetAngle при наведении на мировые координаты', () => {
        const radar = new SimpleRadar(0, 0, 'Центральный-РЛС');
        // Наводим строго вправо по оси X
        radar.setTargetDirection(100, 0);
        expect(radar.targetAngle).to.equal(0);

        // Наводим строго вниз по оси Y
        radar.setTargetDirection(0, 100);
        expect(radar.targetAngle).to.equal(Math.PI / 2);
    });

    it('должен плавно поворачивать currentAngle к targetAngle при обновлении rotate', () => {
        const radar = new SimpleRadar(0, 0, 'Ротатор-РЛС');
        radar.currentAngle = 0;
        radar.targetAngle = Math.PI; // Хотим развернуться в противоположную сторону

        radar.rotate(16.66); // Симулируем один кадр (60 FPS)
        expect(radar.currentAngle).to.be.greaterThan(0);
        expect(radar.currentAngle).to.be.lessThan(Math.PI);
    });

    it('должен регистрировать БПЛА у игрока, если он находится внутри сектора обзора луча', () => {
        const radar = new SimpleRadar(0, 0, 'РЛС-Сканер');
        radar.currentAngle = Math.PI / 2; // Смотрит строго вниз
        radar.targetAngle = Math.PI / 2;

        // Создаем БПЛА строго под радаром на расстоянии 50px (внутри радиуса 180px)
        const invader = new SimpleInvader(0, 50);
        const invaders: Array<SimpleInvader> = [invader];

        player.clearActiveTargets();
        radar.scan(invaders, player);

        // Дрон должен получить таймер видимости, а плеер — зарегистрировать цель
        expect(invader.visibilityTimer).to.equal(1000);
    });
});