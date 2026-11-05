import { expect } from 'chai';
import { SimpleInvader } from './SimpleInvader';

describe('Юнит-тестирование врага (SimpleInvader)', () => {
    
    it('должен инициализировать врага скрытым по умолчанию со 100 HP', () => {
        const invader = new SimpleInvader(100, 100);
        expect(invader.isVisible).to.be.false;
        expect(invader.hp).to.equal(100);
    });

    it('должен правильно управлять таймером угасания видимости врага', () => {
        const invader = new SimpleInvader(100, 100);

        invader.visibilityTimer = 500; // Даем 500 мс видимости
        expect(invader.isVisible).to.be.true;

        invader.updateVisibility(200); // Прошло 200 мс
        expect(invader.visibilityTimer).to.equal(300);
        expect(invader.isVisible).to.be.true;

        invader.updateVisibility(400); // Прошло еще 400 мс (ушли в ноль)
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
});