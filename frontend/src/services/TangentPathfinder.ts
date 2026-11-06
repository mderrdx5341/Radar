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
     * Дальноходный волновой навигатор, оптимизированный под геометрию карты 1600x1200
     */
    public findShortestPath(startX: number, startY: number, turrets: Array<SimpleTurret>, targetX: number, targetY: number): Array<Waypoint> {
        // Радиус турели 70 + корпус дрона 6 + 14 пикселей тактического запаса упреждения
        const criticalRadius = 70 + 6 + 14; 

        const openList: Array<PathfinderNode> = new Array<PathfinderNode>();
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
        
        // Оптимальный шаг дискретизации для большой карты
        const gridStep = 25;

        while (openList.length > 0 && iterations < 7000) {
            iterations++;
            
            openList.sort((a, b) => a.f - b.f);
            const curr = openList.shift()!;

            const key = `${Math.round(curr.x / gridStep)},${Math.round(curr.y / gridStep)}`;
            if (closedSet.has(key)) continue;
            closedSet.add(key);

            // Если успешно подобрались к финишу бункера по вертикали
            if (curr.y >= targetY - 30) {
                endNode = curr;
                break;
            }

            // МАСШТАБНЫЙ КРИТИЧЕСКИЙ ФИКС: Увеличиваем шаг продвижения вниз (dy = 35) 
            // и даем мощный, широкий веер боковых маневров (dx до 90px по горизонтали).
            // Это открывает лучу возможность делать резкие развороты на фланги и уходить от ПВО.
            const dx = Array.of(-90, -45, -15, 0, 45, 90);
            const dy = 35; 

            dx.forEach(offset_x => {
                const nextX = curr.x + offset_x;
                const nextY = curr.y + dy;

                if (nextX < 20 || nextX > 1580) return;

                // Жесткая проверка входа в зону поражения известных ПВО ПВО
                let hitWall = false;
                turrets.forEach(turret => {
                    const distSq = (nextX - turret.x) ** 2 + (nextY - turret.y) ** 2;
                    if (distSq < criticalRadius * criticalRadius) {
                        hitWall = true;
                    }
                });

                if (hitWall) return;

                const stepDist = Math.sqrt(offset_x * offset_x + dy * dy);
                const g = curr.g + stepDist;
                
                // Честная тригонометрическая оценка до координат целевого здания
                const h = Math.sqrt((targetX - nextX) ** 2 + (targetY - nextY) ** 2);
                const f = g + h;

                openList.push({ x: nextX, y: nextY, parent: curr, g, f });
            });
        }

        const rawPath: Array<Waypoint> = new Array<Waypoint>();
        if (endNode) {
            let n: PathfinderNode | null = endNode;
            while (n !== null) {
                rawPath.push({ x: n.x, y: n.y });
                n = n.parent;
            }
            rawPath.reverse();
        } else {
            // Если волновой алгоритм зажат пушками ПВО, выдаем прямой тактический рельс до цели
            rawPath.push({ x: startX, y: startY });
            rawPath.push({ x: targetX, y: targetY });
        }
        
        rawPath.push({ x: targetX, y: targetY });

        // --- АЛГОРИТМ НАТЯЖЕНИЯ НИТИ (PATH SMOOTHING) ---
        const optimizedPath: Array<Waypoint> = new Array<Waypoint>();
        if (rawPath.length > 0) {
            const firstElement = rawPath.at(0);
            if (firstElement) {
                optimizedPath.push(firstElement);
            }
            
            let currIdx = 0;
            while (currIdx < rawPath.length - 1) {
                let nextIdx = rawPath.length - 1;
                
                while (nextIdx > currIdx + 1) {
                    const p1 = rawPath.at(currIdx);
                    const p2 = rawPath.at(nextIdx);
                    
                    // Проверяем отрезок с запасом радиуса, чтобы нить не натягивалась сквозь ПВО ПВО
                    if (p1 && p2 && this.isLineSafe(p1, p2, turrets, criticalRadius - 5)) {
                        break; 
                    }
                    nextIdx--;
                }
                
                const nextElement = rawPath.at(nextIdx);
                if (nextElement) {
                    optimizedPath.push(nextElement);
                }
                currIdx = nextIdx;
            }
        }

        return optimizedPath;
    }

    private isLineSafe(p1: Waypoint, p2: Waypoint, turrets: Array<SimpleTurret>, radius: number): boolean {
        // Высокая плотность сканирования отрезка нити (18 точек контроля)
        for (let i = 1; i <= 18; i++) {
            const t = i / 19;
            const checkX = p1.x + (p2.x - p1.x) * t;
            const checkY = p1.y + (p2.y - p1.y) * t;

            let isSafe = true;
            turrets.forEach(turret => {
                const distSq = (checkX - turret.x) ** 2 + (checkY - turret.y) ** 2;
                if (distSq < radius * radius) {
                    isSafe = false;
                }
            });
            
            if (!isSafe) return false;
        }
        return true; 
    }
}