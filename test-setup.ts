import { JSDOM } from 'jsdom';

// 1. Создаем виртуальное окно браузера в памяти
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true
});

const globalAny: any = global;

// 2. Безопасно объявляем базовые глобальные переменные браузера
globalAny.window = dom.window;
globalAny.document = dom.window.document;

// 3. Для защищенных свойств, таких как navigator, используем defineProperty
Object.defineProperty(global, 'navigator', {
    value: dom.window.navigator,
    writable: true,
    configurable: true,
    enumerable: true
});

// 4. Безопасно копируем все конструкторы элементов (HTMLElement, HTMLButtonElement и т.д.)
Object.getOwnPropertyNames(dom.window)
    .filter(prop => !prop.startsWith('_') && !(prop in global))
    .forEach(prop => {
        try {
            globalAny[prop] = (dom.window as any)[prop];
        } catch (e) {
            // Игнорируем свойства, которые Node.js запрещает перезаписывать
        }
    });