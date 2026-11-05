export class InputManager {
    private canvas: HTMLCanvasElement;
    
    // Текущее состояние зажатых клавиш (для непрерывного движения WASD)
    private keys: Record<string, boolean> = {};
    
    // Текущие экранные координаты мыши
    private mouseX: number = 0;
    private mouseY: number = 0;
    
    // Состояние кнопок мыши (0 - ЛКМ, 1 - Колесико, 2 - ПКМ)
    private mouseButtons: Record<number, boolean> = {};

    // Хранилища колбэков для разовых триггеров (Пауза, Покупка, Выбор)
    private keyPressListeners: Record<string, () => void> = {};
    private mouseClickListeners: Record<number, (x: number, y: number) => void> = {};

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.initKeyboardListeners();
        this.initMouseListeners();
    }

    /**
     * Проверяет, зажата ли клавиша в данный кадр (для WASD скроллинга)
     */
    public isKeyDown(code: string): boolean {
        return !!this.keys[code];
    }

    /**
     * Проверяет, зажата ли конкретная кнопка мыши (для Pan Drag перетаскивания карты)
     */
    public isMouseButtonDown(button: number): boolean {
        return !!this.mouseButtons[button];
    }

    /**
     * Возвращает текущие ЭКРАННЫЕ координаты курсора мыши
     */
    public getMousePosition(): { x: number; y: number } {
        return { x: this.mouseX, y: this.mouseY };
    }

    /**
     * Подписка на разовое нажатие клавиши (например, Space для Паузы)
     */
    public onKeyPress(code: string, callback: () => void): void {
        this.keyPressListeners[code] = callback;
    }

    /**
     * Подписка на разовый клик мыши (например, ЛКМ для покупки/выбора, ПКМ для движения турели)
     */
    public onMouseClick(button: number, callback: (x: number, y: number) => void): void {
        this.mouseClickListeners[button] = callback;
    }

    /**
     * Инициализация клавиатурных слушателей (Аппаратные коды KeyW, Space и т.д.)
     */
    private initKeyboardListeners(): void {
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            const code = e.code;
            
            // Если клавиша ещё не была зажата и на неё есть разовый слушатель — вызываем его
            if (!this.keys[code] && this.keyPressListeners[code]) {
                this.keyPressListeners[code]();
            }
            
            this.keys[code] = true;
        });

        window.addEventListener('keyup', (e: KeyboardEvent) => {
            this.keys[e.code] = false;
        });
    }

    /**
     * Инициализация мышиных слушателей (Координаты считываются строго относительно Canvas)
     */
    private initMouseListeners(): void {
        // Отключаем стандартное контекстное меню браузера при клике ПКМ по игре
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.mouseButtons[e.button] = true;

            // Вызываем разовый колбэк клика, если он зарегистрирован
            if (this.mouseClickListeners[e.button]) {
                this.mouseClickListeners[e.button](x, y);
            }
            
            // Предотвращаем дефолтное поведение для колесика мыши (чтобы страница не скроллилась)
            if (e.button === 1) {
                e.preventDefault();
            }
        });

        window.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        window.addEventListener('mouseup', (e: MouseEvent) => {
            this.mouseButtons[e.button] = false;
        });
    }
}