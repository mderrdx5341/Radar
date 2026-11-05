import { SimpleTurret } from './SimpleTurret';
import { Waypoint } from './RouteManager';

export class TangentPathfinder {
    /**
     * Ищет кратчайший геометрический путь в обход массива турелей ПВО
     */
    public findShortestPath(startX: number, startY: number, turrets: SimpleTurret[]): Waypoint[] {
        const criticalRadius = 70 + 6; // 76px (Радиус атаки + корпус дрона)
        const targetY = startY + 600;

        interface Node {
            x: number;
            y: number;
            parent: Node | null;
            g: number;
            f: number;
        }

        const openList: Node[] = [];
        const closedSet: Set<string> = new Set();

        const startNode: Node = {
            x: Math.round(startX),
            y: Math.round(startY),
            parent: null,
            g: 0,
            f: targetY - startY
        };
        openList.push(startNode);

        let endNode: Node | null = null;
        let iterations = 0;
        
        while (openList.length > 0 && iterations < 2500) {
            iterations++;
            
            openList.sort((a, b) => a.f - b.f);
            const curr = openList.shift()!;

            const key = `${Math.round(curr.x / 15)},${Math.round(curr.y / 15)}`;
            if (closedSet.has(key)) continue;
            closedSet.add(key);

            if (curr.y >= targetY) {
                endNode = curr;
                break;
            }

            const dx = [-20, -10, 0, 10, 20];
            const dy = 25; 

            for (const offset_x of dx) {
                const nextX = curr.x + offset_x;
                const nextY = curr.y + dy;

                if (nextX < 30 || nextX > 770) continue;

                let hitWall = false;
                for (const turret of turrets) {
                    const distSq = (nextX - turret.x) ** 2 + (nextY - turret.y) ** 2;
                    if (distSq < criticalRadius * criticalRadius) {
                        hitWall = true;
                        break;
                    }
                }

                if (hitWall) continue;

                const stepDist = Math.sqrt(offset_x * offset_x + dy * dy);
                const g = curr.g + stepDist;
                const h = targetY - nextY;
                const f = g + h;

                openList.push({
                    x: nextX,
                    y: nextY,
                    parent: curr,
                    g,
                    f
                });
            }
        }

        let rawPath: Waypoint[] = [];
        if (endNode) {
            let n: Node | null = endNode;
            while (n !== null) {
                rawPath.push({ x: n.x, y: n.y });
                n = n.parent;
            }
            rawPath.reverse();
        } else {
            rawPath.push({ x: startX, y: startY });
            rawPath.push({ x: startX, y: targetY });
        }

        // --- АЛГОРИТМ НАТЯЖЕНИЯ НИТИ (PATH SMOOTHING) ---
        const optimizedPath: Waypoint[] = [];
        if (rawPath.length > 0) {
            optimizedPath.push(rawPath[0]);
            
            let currIdx = 0;
            while (currIdx < rawPath.length - 1) {
                let nextIdx = rawPath.length - 1;
                
                while (nextIdx > currIdx + 1) {
                    if (this.isLineSafe(rawPath[currIdx], rawPath[nextIdx], turrets, criticalRadius)) {
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

    /**
     * Вспомогательный метод проверки прямой видимости между двумя точками
     */
    private isLineSafe(p1: Waypoint, p2: Waypoint, turrets: SimpleTurret[], radius: number): boolean {
        for (let i = 1; i <= 8; i++) {
            const t = i / 9;
            const checkX = p1.x + (p2.x - p1.x) * t;
            const checkY = p1.y + (p2.y - p1.y) * t;

            for (const turret of turrets) {
                const distSq = (checkX - turret.x) ** 2 + (checkY - turret.y) ** 2;
                if (distSq < radius * radius) {
                    return false; 
                }
            }
        }
        return true; 
    }
}