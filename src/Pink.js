import { Graphics, loadTextures } from 'pixi.js';
import { CELL_SIZE, UI_HEIGHT, COLS, ROWS, GHOST_STATE, lerp } from './Grid.js';
import { Maze } from './Maze.js'
import { Ghost } from './Ghost.js';
import PF from 'pathfinding'

export class Pink extends Ghost {

    constructor(container, id, startX, startY, color, name) {
        super(container, id, startX, startY, color, name);


        this.esquina = { x: 27, y: 1 };

        this.wait(4000);
    }
    pathfinding(posObjetivo, grid, pacman, maze) {
        const pathfinder = new PF.AStarFinder({
            allowDiagonals: false,
            dontCrossCorners: true,
        });
        let path = [];

        if (this.state == 'chase') {
            const dist = Math.abs(this.posicion.x - pacman.posicion.x) + Math.abs(this.posicion.y - pacman.posicion.y);

            if (dist <= 8) {
                path = pathfinder.findPath(this.posicion.x, this.posicion.y, pacman.posicion.x, pacman.posicion.y, grid);
                path.shift();
            } else {
                // Buscar la celda caminable más lejana: 4, 3, 2, 1, 0 casilleros adelante
                let target = null;
                for (let i = 4; i >= 0; i--) {
                    const candidate = {
                        x: pacman.posicion.x + pacman.nextDirection.x * i,
                        y: pacman.posicion.y + pacman.nextDirection.y * i,
                    };
                    if (maze.isWalkable(candidate.x, candidate.y) && !candidate.x < 0 && !candidate.x > COLS) {
                        target = candidate;
                        break;
                    }
                }

                if (target) {
                    path = pathfinder.findPath(this.posicion.x, this.posicion.y, target.x, target.y, grid);
                    path.shift();
                }
            }
        }

        if (path.length === 0) {
            path = pathfinder.findPath(this.posicion.x, this.posicion.y, posObjetivo.x, posObjetivo.y, grid);
            path.shift();
        }
        this.movimientos = path;
    }

}