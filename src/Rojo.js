import { GHOST_STATE } from './Grid.js';
import { Ghost } from './Ghost.js';
import PF from 'pathfinding';

export class Rojo extends Ghost {
    constructor(container, id, startX, startY, color, name, cellSize, esquina, maze) {
        super(container, id, startX, startY, color, name, cellSize, maze);
        this.esquina = esquina;
    }

    pathfinding(posObjetivo, grid) {
        const pathfinder = new PF.AStarFinder({ allowDiagonals: false, dontCrossCorners: true });
        const path = pathfinder.findPath(this.posicion.x, this.posicion.y, posObjetivo.x, posObjetivo.y, grid);
        path.shift();
        this.movimientos = path;
    }
}