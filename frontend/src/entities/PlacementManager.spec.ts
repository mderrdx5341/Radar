import { expect } from 'chai';
import { PlacementManager } from './PlacementManager';

describe('Юнит-тестирование системы свободного строительства (PlacementManager)', () => {
    let placement: PlacementManager;

    beforeEach(() => {
        placement = new PlacementManager();
    });

    it('должен правильно включать и отменять режим постройки башен', () => {
        expect(placement.currentBuildType).to.be.null;

        placement.startBuilding('RADAR');
        expect(placement.currentBuildType).to.equal('RADAR');

        placement.cancelBuilding();
        expect(placement.currentBuildType).to.be.null;
    });
});