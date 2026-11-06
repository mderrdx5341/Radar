export abstract class EntityController {
    // Хранит ссылку на управляемый физический объект (РЛС или ПВО)
    protected entity: any;

    constructor(entity: any) {
        this.entity = entity;
    }

    /**
     * Геттер для получения физической сущности (нужен для рендерера рамок выбора)
     */
    public getEntity(): any {
        return this.entity;
    }

    /**
     * Локальное действие при выборе (ЛКМ) — по умолчанию пусто
     */
    public handleLeftClick(worldX: number, worldY: number): void {
        // Дочерние контроллеры переопределяют при необходимости
    }

    /**
     * Контекстный приказ по клику ПКМ (У ПВО — ехать, у РЛС — навестись)
     */
    public handleRightClick(worldX: number, worldY: number): void {
        // Дочерние контроллеры переопределяют при необходимости
    }

    /**
     * Покадровый апдейт зажатия мыши (Нужен РЛС для удержания луча)
     */
    public handleMouseMove(worldX: number, worldY: number, isMouseDown: boolean): void {
        // Дочерние контроллеры переопределяют при необходимости
    }

    /**
     * Деструктор-деселектор. Вызывается InterfaceController при сбросе фокуса
     */
    public onDeselect(): void {
        // Дочерние контроллеры переопределяют для очистки залипших состояний
    }
}