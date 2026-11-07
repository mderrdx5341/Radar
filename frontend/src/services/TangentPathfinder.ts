import { DiscoveredHazard, Waypoint } from '../entities/RouteManager';

export interface PathfinderNode {
    x: number;
    y: number;
    parent: PathfinderNode | null;
    g: number;
    f: number;
}

export class TangentPathfinder {
    // Состояние текущей сессии поиска пути, сохраняющееся между кадрами
    public openList: Array<PathfinderNode> = new Array<PathfinderNode>();
    public closedSet: Set<string> = new Set();
    public endNode: PathfinderNode | null = null;
    
    // Параметры текущей задачи
    private startX: number = 0;
    private startY: number = 0;
    private targetX: number = 0;
    private targetY: number = 0;
    private gridStep: number = 20;

    // Направления движения (4 ортогональных вектора)
    private readonly dx = [0, -20, 20, 0];
    private readonly dy = [20, 0, 0, -20];

    /**
     * Инициализация новой сессии поиска пути (вызывается при изменении карты ПВО)
     */
    public startNewSearch(startX: number, startY: number, targetX: number, targetY: number): void {
        this.openList = new Array<PathfinderNode>();
        this.closedSet.clear();
        this.endNode = null;

        this.startX = startX;
        this.startY = startY;
        
        // Выравниваем финиш по сетке ячеек 20px
        this.targetX = Math.round(targetX / this.gridStep) * this.gridStep;
        this.targetY = Math.round(targetY / this.gridStep) * this.gridStep;

        const sX = Math.round(startX / this.gridStep) * this.gridStep;
        const sY = Math.round(startY / this.gridStep) * this.gridStep;

        const startNode: PathfinderNode = {
            x: sX,
            y: sY,
            parent: null,
            g: 0,
            f: Math.abs(this.targetX - sX) + Math.abs(this.targetY - sY)
        };
        this.openList.push(startNode);
    }

    /**
     * ПОКАДРОВЫЙ ШАГ ВЫЧИСЛЕНИЙ (Тайм-слайсинг)
     * Выполняет ровно maxSteps (300) шагов и ставит алгоритм на паузу
     * @returns true, если путь успешно найден или поиск полностью зашел в тупик
     */
    public searchStep(maxSteps: number, hazards: Array<DiscoveredHazard>): boolean {
        if (this.openList.length === 0 || this.endNode) return true;

        let stepsDone = 0;

        while (this.openList.length > 0 && stepsDone < maxSteps) {
            stepsDone++;

            // Линейная выборка лучшего узла O(N) вместо тяжелой сортировки
            let bestIdx = 0;
            for (let i = 1; i < this.openList.length; i++) {
                if (this.openList[i].f < this.openList[bestIdx].f) {
                    bestIdx = i;
                }
            }

            const curr = this.openList.splice(bestIdx, 1)[0];

            const key = `${curr.x},${curr.y}`;
            if (this.closedSet.has(key)) continue;
            this.closedSet.add(key);

            // Условие финиша
            if (Math.abs(curr.x - this.targetX) <= this.gridStep && Math.abs(curr.y - this.targetY) <= this.gridStep) {
                this.endNode = curr;
                return true;
            }

            for (let k = 0; k < this.dx.length; k++) {
                const nextX = curr.x + this.dx[k];
                const nextY = curr.y + this.dy[k];

                // Границы маневров за экраном
                if (nextX < -200 || nextX > 1800 || nextY > 1250 || nextY < -100) continue;

                let hitWall = false;
                for (let t = 0; t < hazards.length; t++) {
                    const hazard = hazards[t];
                    const tdx = nextX - hazard.x;
                    const tdy = nextY - hazard.y;
                    if ((tdx * tdx + tdy * tdy) < (hazard.radius * hazard.radius)) {
                        hitWall = true;
                        break;
                    }
                }

                if (hitWall) continue;

                const g = curr.g + this.gridStep;
                const h = Math.abs(this.targetX - nextX) + Math.abs(this.targetY - nextY);

                this.openList.push({ x: nextX, y: nextY, parent: curr, g, f: g + h });
            }
        }

        // Если openList опустел — поиск завершен (путь найти невозможно)
        // Если шаги maxSteps кончились, но openList полон — возвращаем false (продолжим на следующем кадре)
        return this.openList.length === 0 || this.endNode !== null;
    }

    /**
     * Сборка и нитевое сглаживание финального пути (вызывается один раз при успехе)
     */
    public compileFinalPath(hazards: Array<DiscoveredHazard>): Array<Waypoint> {
        const rawPath: Array<Waypoint> = new Array<Waypoint>();
        
        if (this.endNode) {
            let n: PathfinderNode | null = this.endNode;
            while (n !== null) {
                rawPath.push({ x: n.x, y: n.y });
                n = n.parent;
            }
            rawPath.reverse();
        } else {
            rawPath.push({ x: this.startX, y: this.startY });
            rawPath.push({ x: this.targetX, y: this.targetY });
            return rawPath;
        }

        rawPath.push({ x: this.targetX, y: this.targetY });

        // Сглаживание String Pulling
        const optimizedPath: Array<Waypoint> = new Array<Waypoint>();
        if (rawPath.length > 0) {
            optimizedPath.push(rawPath[0]);
            let currIdx = 0;
            const lineRadiusSq = (70 + 4) * (70 + 4);

            while (currIdx < rawPath.length - 1) {
                let nextIdx = rawPath.length - 1;
                while (nextIdx > currIdx + 1) {
                    if (this.isLineSafe(rawPath[currIdx], rawPath[nextIdx], hazards, lineRadiusSq)) {
                        break;
                    }
                    nextIdx--;
                }
                optimizedPath.push(rawPath[nextIdx]);
                currIdx = nextIdx;
            }
        }
        return optimizedPath;
    }

    private isLineSafe(p1: Waypoint, p2: Waypoint, hazards: Array<DiscoveredHazard>, radiusSq: number): boolean {
        const samples = 14;
        for (let i = 1; i <= samples; i++) {
            const t = i / (samples + 1);
            const checkX = p1.x + (p2.x - p1.x) * t;
            const checkY = p1.y + (p2.y - p1.y) * t;

            for (let g = 0; g < hazards.length; g++) {
                const hazard = hazards[g];
                const tdx = checkX - hazard.x;
                const tdy = checkY - hazard.y;
                if ((tdx * tdx + tdy * tdy) < radiusSq) return false;
            }
        }
        return true;
    }
}
