import { expect } from 'chai';
import { SimpleInvader } from './SimpleInvader';
import { SimpleTurret } from './SimpleTurret';
import { RouteManager } from './RouteManager';
import { SimpleBuilding } from './buildings';

describe('Юнит-тестирование врага с путевыми листами Менеджера Маршрутов (SimpleInvader)', () => {
    
    it('должен инициализировать врага скрытым по умолчанию со 100 HP и пустыми путями', () => {
        const invader = new SimpleInvader(100, 40);
        expect(invader.isVisible).to.be.false;
        expect(invader.hp).to.equal(100);
        expect(invader.spawnPointX).to.equal(100);
        expect(invader.waypoints).to.be.an('array').that.is.empty;
    });

    it('должен правильно управлять таймером угасания видимости врага', () => {
        const invader = new SimpleInvader(100, 100);
        invader.visibilityTimer = 500; 
        expect(invader.isVisible).to.be.true;

        invader.updateVisibility(200); 
        expect(invader.visibilityTimer).to.equal(300);

        invader.updateVisibility(400); 
        expect(invader.visibilityTimer).to.equal(0);
        expect(invader.isVisible).to.be.false;
    });

    it('должен игнорировать уменьшение видимости, если дельта времени меньше или равна нулю', () => {
        const invader = new SimpleInvader(100, 100);
        invader.visibilityTimer = 300;
        invader.updateVisibility(0);
        invader.updateVisibility(-50);
        expect(invader.visibilityTimer).to.equal(300);
    });

    it('должен плавно изменять курс и лететь по точкам, выданным менеджером маршрутов', () => {
        const manager = new RouteManager();
        const turret = new SimpleTurret(100, 150, 'Тест-ПВО');

        const mockBuildings = [
            new (class extends SimpleBuilding {
                update() {}
            })(100, 300, 'POWER', 'Тестовый бункер', 100)
        ];
        
        // Имитируем, что рой уже знает про турель
        manager.reportHazard(turret);

        const invader = new SimpleInvader(105, 20);
        // Получаем готовый полетный план из менеджера
        invader.waypoints = manager.generateFlightPlan(invader.spawnPointX, invader.y, mockBuildings);

        expect(invader.waypoints.length).to.be.greaterThan(0);

        // Симулируем шаги полета
        for (let i = 0; i < 30; i++) {
            invader.moveDown(1.5);
        }

        // Дрон продвинулся по оси Y и отклонился по X для огибания
        expect(invader.y).to.be.greaterThan(20);
        expect(invader.x).to.not.equal(105);
    });

    it('должен удерживать дрона в пределах игрового коридора экрана', () => {
        const invaderLeft = new SimpleInvader(10, 50);
        const invaderRight = new SimpleInvader(790, 50);

        invaderLeft.moveDown(1.5);
        invaderRight.moveDown(1.5);

        expect(invaderLeft.x).to.equal(20);
        expect(invaderRight.x).to.equal(780);
    });
});