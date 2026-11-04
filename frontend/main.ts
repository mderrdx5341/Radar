//import './styles/App.scss';
import App from './src/App';

(function(){

	let app = new App();
	app.run();
})();

import { Player } from './src/GameLoop/Player';
import { GameLoop } from './src/GameLoop/GameLoop';

// 1. Создаем игрока и наносим ему немного урона, чтобы проверить регенерацию
const player = new Player('Mderrdx', 100);
player.changeHp(15); // Опускаем здоровье до 85 HP

// 2. Находим элементы на реальной странице
const nameEl = document.getElementById('player-name');
const hpEl = document.getElementById('player-hp');
const maxHpEl = document.getElementById('player-max-hp');

if (nameEl && hpEl && maxHpEl) {
    // Отрисовываем стартовое состояние
    nameEl.textContent = player.getName();
    hpEl.textContent = player.getHp().toString();
    maxHpEl.textContent = player.getMaxHp().toString();

    // 3. Создаем игровой цикл
    const gameLoop = new GameLoop(player);

    // 4. Чтобы экран обновлялся на каждый тик, расширим метод update
    const originalUpdate = gameLoop.update;
    gameLoop.update = function(deltaTime: number) {
        originalUpdate.call(this, deltaTime);
        // Обновляем циферку здоровья на экране
        hpEl.textContent = player.getHp().toString();
    };

    // Запускаем цикл!
    gameLoop.start();
}
