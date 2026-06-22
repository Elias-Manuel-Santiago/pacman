import { GHOST_STATE } from './Grid.js';
import { Ghost } from './Ghost.js';
import PF from 'pathfinding';

export class Cyan extends Ghost {
    constructor(container, id, startX, startY, color, name, cellSize, esquina, maze) {
        super(container, id, startX, startY, color, name, cellSize, maze);
        this.firstScatterDone = false;
        this.esquina = esquina;
        this.wait(8000);
    }

    pathfinding(posObjetivo, grid, pacman) {
        const pathfinder = new PF.AStarFinder({ allowDiagonals: false, dontCrossCorners: true });
        const dist = Math.abs(this.posicion.x - pacman.posicion.x)
                   + Math.abs(this.posicion.y - pacman.posicion.y);

        if (this.posicion.x === this.esquina.x && this.posicion.y === this.esquina.y) {
            this.firstScatterDone = true;
        }

        if (this.firstScatterDone && this.state !== 'frightened') {
            this.state = dist >= 10 ? 'chase' : 'scatter';
        }

        const path = pathfinder.findPath(this.posicion.x, this.posicion.y, posObjetivo.x, posObjetivo.y, grid);
        path.shift();
        this.movimientos = path;
    }
}