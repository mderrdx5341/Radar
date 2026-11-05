import { expect } from 'chai';
import { SimpleInvader, SimpleRadar, SimpleTurret } from './SimpleEntities';

describe('Тестирование Тумана Войны и Радаров (SimpleEntities)', () => {
    
    it('должен инициализировать врага скрытым по умолчанию', () => {
        const invader = new SimpleInvader(100, 100);
        expect(invader.isVisible).to.be.false;
        expect(invader.hp).to.equal(100);
    });

    it('должен делать врага видимым, если он внутри радиуса И внутри конуса обзора (45 градусов вверх)', () => {
        const radar = new SimpleRadar(200, 200, -Math.PI / 2, 45);
        const insideInvader = new SimpleInvader(200, 100); // Строго НАД радаром (угол -90 градусов, внутри конуса)
        
        radar.scan([insideInvader]);
        expect(insideInvader.isVisible).to.be.true;
    });

    it('должен оставлять врага невидимым, если он близко, но находится СБОКУ от сектора обзора', () => {
        const radar = new SimpleRadar(200, 200, -Math.PI / 2, 45);
        const sideInvader = new SimpleInvader(100, 200); // Слева от радара (угол 180 градусов, вне конуса 45 градусов)
        
        radar.scan([sideInvader]);
        expect(sideInvader.isVisible).to.be.false;
    });

    it('должен корректно обрабатывать пустой массив врагов в радаре', () => {
        const radar = new SimpleRadar(200, 200);
        expect(() => radar.scan([])).not.to.throw();
    });
});

describe('Тестирование Комбинированной Турели (SimpleTurret)', () => {

    it('должен делать видимыми врагов в БЛИЖНЕМ КРУГЕ обзора на 360 градусов при вызове scan', () => {
        const turret = new SimpleTurret(100, 100); 
        const sideInvader = new SimpleInvader(40, 100); // Слева (сзади сектора атаки)

        expect(sideInvader.isVisible).to.be.false;
        turret.scan([sideInvader]);
        expect(sideInvader.isVisible).to.be.true;
    });

    it('должен делать видимым ДАЛЬНЕГО врага, если он попадает в сектор обстрела турели при scan', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2, 45);
        const farInvader = new SimpleInvader(100, -30); // Дистанция 130 (дальше круга 90, но внутри сектора 45 градусов)

        expect(farInvader.isVisible).to.be.false;
        
        // Пассивный обзор сектора атаки должен обнаружить врага
        turret.scan([farInvader]);
        expect(farInvader.isVisible).to.be.true;
    });

    it('НЕ должен делать видимым дальнего врага через scan, если он находится СБОКУ от сектора атаки', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2, 45);
        const farSideInvader = new SimpleInvader(0, 50); // Вне круга и вне конуса

        turret.scan([farSideInvader]);
        expect(farSideInvader.isVisible).to.be.false;
    });

    it('должен удерживать цель (Target Lock) и успешно наносить урон зафиксированному врагу', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2, 45);
        const invader = new SimpleInvader(100, -30);

        turret.scan([invader]);
        turret.attack([invader]);

        expect(invader.hp).to.equal(99);
        expect(turret.lockedTarget).to.equal(invader);
    });

    it('должен сбрасывать фиксацию цели, если враг улетел за пределы максимального радиуса', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2);
        const invader = new SimpleInvader(100, 150);

        turret.scan([invader]);
        turret.attack([invader]);
        expect(turret.lockedTarget).to.equal(invader);

        // Симулируем новый кадр: враг улетает далеко
        invader.isVisible = false;
        invader.y = 400; // Дистанция 300px > 160px

        turret.scan([invader]); 
        turret.attack([invader]);

        expect(turret.lockedTarget).to.be.null;
        expect(turret.angleDir).to.equal(-Math.PI / 2);
    });

    it('должен возвращать ствол в исходное положение, если на поле нет видимых целей', () => {
        const turret = new SimpleTurret(100, 100, -Math.PI / 2);
        turret.attack([]);
        expect(turret.angleDir).to.equal(-Math.PI / 2);
    });
});