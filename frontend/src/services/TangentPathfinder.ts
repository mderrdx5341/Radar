import { DiscoveredHazard, Waypoint } from '../entities/RouteManager';

interface PathfinderNode {
    x: number;
    y: number;
    parent: PathfinderNode | null;
    g: number;
    f: number;
}

export class TangentPathfinder {
    public openList: Array<PathfinderNode> = new Array<PathfinderNode>();
    public closedSet: Set<string> = new Set();
    public endNode: PathfinderNode | null = null;
    
    private startX: number = 0;
    private startY: number = 0;
    private targetX: number = 0;
    private targetY: number = 0;
    private gridStep: number = 20;

    private readonly dx = [0, -20, 20, 0];
    private readonly dy = [20, 0, 0, -20];

    public startNewSearch(startX: number, startY: number, targetX: number, targetY: number): void {
        this.openList = new Array<PathfinderNode>();
        this.closedSet.clear();
        this.endNode = null;

        this.startX = startX;
        this.startY = startY;
        
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
     * Статический метод для расчёта штрафа конкретной точки (нужен и навигатору, и рендереру теплокарты)
     */
    public static calculatePenaltyAt(x: number, y: number, hazards: Array<DiscoveredHazard>): number {
        let totalPenalty = 0;

        for (let t = 0; t < hazards.length; t++) {
            const hazard = hazards[t];
            const tdx = x - hazard.x;
            const tdy = y - hazard.y;
            const distSq = tdx * tdx + tdy * tdy;
            const radSq = hazard.radius * hazard.radius;

            // Если ячейка находится внутри радиуса поражения ПВО
            if (distSq < radSq) {
                const dist = Math.sqrt(distSq);
                // Градиентный штраф: чем ближе к центру пушки, тем экспоненциально выше "цена боли"
                const proximityFactor = (hazard.radius - dist) / hazard.radius;
                totalPenalty += Math.round(proximityFactor * 2500); 
            }
        }

        return totalPenalty;
    }

    public searchStep(maxSteps: number, hazards: Array<DiscoveredHazard>): boolean {
        if (this.openList.length === 0 || this.endNode) return true;

        let stepsDone = 0;

        while (this.openList.length > 0 && stepsDone < maxSteps) {
            stepsDone++;

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

            if (Math.abs(curr.x - this.targetX) <= this.gridStep && Math.abs(curr.y - this.targetY) <= this.gridStep) {
                this.endNode = curr;
                return true;
            }

            for (let k = 0; k < this.dx.length; k++) {
                const nextX = curr.x + this.dx[k];
                const nextY = curr.y + this.dy[k];

                if (nextX < -150 || nextX > 1750 || nextY > 1250 || nextY < -100) continue;

                // ИСПРАВЛЕНО (ЖЁСТКИЕ СТЕНЫ УБРАНЫ): Больше нет continue при попадании в зону ПВО!
                // Вместо этого мы вычисляем градиентный штраф ячейки
                const penalty = TangentPathfinder.calculatePenaltyAt(nextX, nextY, hazards);

                // Итоговая стоимость шага g теперь динамическая: базовая цена сетки (20) + штраф ПВО!
                const g = curr.g + this.gridStep + penalty;
                const h = Math.abs(this.targetX - nextX) + Math.abs(this.targetY - nextY);

                this.openList.push({ x: nextX, y: nextY, parent: curr, g, f: g + h });
            }
        }

        return this.openList.length === 0 || this.endNode !== null;
    }

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

        const optimizedPath: Array<Waypoint> = new Array<Waypoint>();
        if (rawPath.length > 0) {
            optimizedPath.push(rawPath[0]);
            let currIdx = 0;

            while (currIdx < rawPath.length - 1) {
                let nextIdx = rawPath.length - 1;
                while (nextIdx > currIdx + 1) {
                    if (this.isLineSafe(rawPath[currIdx], rawPath[nextIdx], hazards)) {
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

    private isLineSafe(p1: Waypoint, p2: Waypoint, hazards: Array<DiscoveredHazard>): boolean {
        const samples = 14;
        for (let i = 1; i <= samples; i++) {
            const t = i / (samples + 1);
            const checkX = p1.x + (p2.x - p1.x) * t;
            const checkY = p1.y + (p2.y - p1.y) * t;

            // При сглаживании мы разрешаем линии проходить через ПВО, 
            // ТОЛЬКО если штраф в этой точке не превышает умеренный порог прорыва (например, 600)
            const penalty = TangentPathfinder.calculatePenaltyAt(checkX, checkY, hazards);
            if (penalty > 600) return false; 
        }
        return true;
    }
}
