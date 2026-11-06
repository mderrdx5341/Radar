import { expect } from 'chai';
import { SimpleInvader } from './SimpleInvader';
import { SimpleTurret } from './SimpleTurret';
import { RouteManager } from './RouteManager';
import { SimpleBuilding } from './buildings/SimpleBuilding';

describe('SimpleInvader', () => {
    it('должен инициализироваться с корректными базовыми параметрами', () => {
        const invader = new SimpleInvader(100, -50);
        expect(invader.x).to.equal(100);
        expect(invader.y).to.equal(-50);
        expect(invader.hp).to.equal(100);
        expect(invader.radius).to.equal(6);
        expect(invader.isVisible).to.be.false;
    });

    it('должен корректно обновлять таймер видимости в луче радара', () => {
        const invader = new SimpleInvader(100, 50);
        expect(invader.isVisible).to.be.false;

        // Имитируем обнаружение радаром
        invader.visibilityTimer = 1000;
        invader.updateVisibility(16);
        expect(invader.isVisible).to.be.true;

        // Имитируем выход из луча радара и затухание по таймеру
        invader.updateVisibility(1500);
        expect(invader.isVisible).to.be.false;
    });

    it('должен плавно изменять курс и лететь по точкам, выданным менеджером маршрутов', () => {
        const manager = new RouteManager();
        const turret = new SimpleTurret(100, 150, 'Тест-ПВО');
        
        // Создаем тестовое фейковое здание для прохождения строгой проверки типов TS
        const mockBuildings: Array<SimpleBuilding> = [
            new (class extends SimpleBuilding {
                public update(): void {}
            })(100, 300, 'POWER', 'Тестовый бункер', 100)
        ];

        manager.reportHazard(turret);

        const invader = new SimpleInvader(105, 20);
        invader.waypoints = manager.generateFlightPlan(invader.spawnPointX, invader.y, mockBuildings);

        expect(invader.waypoints.length).to.be.greaterThan(0);

        // ИСПРАВЛЕНО: Вызов moveDown() выполняется без аргументов
        for (let i = 0; i < 30; i++) {
            invader.moveDown();
        }

        expect(invader.y).to.be.greaterThan(20);
        expect(invader.x).to.not.equal(105);
    });

    it('должен лететь по умолчанию строго вниз, если массив путевых точек пуст', () => {
        const invader = new SimpleInvader(200, 10);
        invader.waypoints = new Array(); // Пустой маршрут

        // ИСПРАВЛЕНО: Вызовы moveDown() выполняются без аргументов
        invader.moveDown();
        invader.moveDown();

        expect(invader.x).to.equal(200); // Координата X не должна измениться
        expect(invader.y).to.be.greaterThan(10); // Должен продвинуться строго вниз по Y
    });
});