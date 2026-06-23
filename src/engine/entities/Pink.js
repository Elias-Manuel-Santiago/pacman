import { Ghost } from './Ghost.js';
import PF from 'pathfinding';

export class Pink extends Ghost {
    constructor(container, id, startX, startY, color, name, cellSize, esquina, maze) {
        super(container, id, startX, startY, color, name, cellSize, maze);
        this.esquina = esquina;
        this.wait(4000);
    }

    pathfinding(posObjetivo, grid, pacman, maze) {
        const pathfinder = new PF.AStarFinder({ allowDiagonals: false, dontCrossCorners: true });
        let path = [];

        if (this.state === 'chase') {
            const dist = Math.abs(this.posicion.x - pacman.posicion.x)
                + Math.abs(this.posicion.y - pacman.posicion.y);

            if (dist <= 8) {
                path = pathfinder.findPath(this.posicion.x, this.posicion.y, pacman.posicion.x, pacman.posicion.y, grid.clone());
                path.shift();
            } else {
                let target = null;
                for (let i = 4; i >= 0; i--) {
                    const candidate = {
                        x: pacman.posicion.x + pacman.nextDirection.x * i,
                        y: pacman.posicion.y + pacman.nextDirection.y * i,
                    };
                    if (maze.isWalkable(candidate.x, candidate.y) && candidate.x >= 0 && candidate.x < maze.COLS) {
                        target = candidate;
                        break;
                    }
                }
                if (target) {
                    path = pathfinder.findPath(this.posicion.x, this.posicion.y, target.x, target.y, grid.clone());
                    path.shift();
                }
            }
        }

        if (path.length === 0) {
            path = pathfinder.findPath(this.posicion.x, this.posicion.y, posObjetivo.x, posObjetivo.y, grid.clone());
            path.shift();
            console.log(posObjetivo.x);
            console.log(posObjetivo.y);
            console.log(path);

        }
        this.movimientos = path;
    }
}