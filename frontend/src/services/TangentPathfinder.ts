import { SimpleTurret } from '../entities/SimpleTurret';
import { Waypoint } from '../entities/RouteManager';

interface PathfinderNode {
    x: number;
    y: number;
    parent: PathfinderNode | null;
    g: number;
    f: number;
}

export class TangentPathfinder {
    /**
     * Волновой навигатор с мощным боковым маневрированием для карт 1600x1200
     */
    public findShortestPath(startX: number, startY: number, turrets: Array<SimpleTurret>, targetX: number, targetY: number): Array<Waypoint> {
        const criticalRadius = 70 + 6; // 76px (Зона ПВО + корпус дрона)

        const openList: Array<PathfinderNode> = [];
        const closedSet: Set<string> = new Set();

        const startNode: PathfinderNode = {
            x: Math.round(startX),
            y: Math.round(startY),
            parent: null,
            g: 0,
            f: Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2)
        };
        openList.push(startNode);

        let endNode: PathfinderNode | null = null;
        let iterations = 0;
        
        while (openList.length > 0 && iterations < 6000) {
            iterations++;
            
            openList.sort((a, b) => a.f - b.f);
            const curr = openList.shift()!;

            const key = `${Math.round(curr.x / 15)},${Math.round(curr.y / 15)}`;
            if (closedSet.has(key)) continue;
            closedSet.add(key);

            if (curr.y >= targetY - 20) {
                endNode = curr;
                break;
            }

            const dx = [-60, -30, -10, 0, 30, 60];
            const dy = 20; 

            for (const offset_x of dx) {
                const nextX = curr.x + offset_x;
                const nextY = curr.y + dy;

                if (nextX < 20 || nextX > 1580) continue;

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
                const h = Math.sqrt((targetX - nextX) ** 2 + (targetY - nextY) ** 2);
                const f = g + h;

                openList.push({ x: nextX, y: nextY, parent: curr, g, f });
            }
        }

        const rawPath: Array<Waypoint> = [];
        if (endNode) {
            let n: PathfinderNode | null = endNode;
            while (n !== null) {
                rawPath.push({ x: n.x, y: n.y });
                n = n.parent;
            }
            rawPath.reverse();
        } else {
            rawPath.push({ x: startX, y: startY });
            rawPath.push({ x: targetX, y: targetY });
        }
        
        rawPath.push({ x: targetX, y: targetY });

        const optimizedPath: Array<Waypoint> = [];
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

    private isLineSafe(p1: Waypoint, p2: Waypoint, turrets: Array<SimpleTurret>, radius: number): boolean {
        for (let i = 1; i <= 15; i++) {
            const t = i / 16;
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