import { Ghost } from './Ghost.js';
import PF from 'pathfinding';

export class Yellow extends Ghost {
    constructor(container, id, startX, startY, color, name, cellSize) {
        super(container, id, startX, startY, color, name, cellSize);
        this.firstScatterDone = false;
        this.esquina  = { x: 2, y: 29 };
        this.objetivo = { x: 2, y: 29 };
        this.wait(12000);
    }

    pathfinding(grid, maze) {
        const pathfinder = new PF.AStarFinder({ allowDiagonals: false, dontCrossCorners: true });
        let path;

        if (this.state === 'chase') {
            if (this.posicion.x === this.objetivo.x && this.posicion.y === this.objetivo.y) {
                do {
                    this.objetivo.x = Math.floor(Math.random() * 27) + 1;
                    this.objetivo.y = Math.floor(Math.random() * 29) + 1;
                } while (!maze.isWalkable(this.objetivo.x, this.objetivo.y));
            }
            path = pathfinder.findPath(this.posicion.x, this.posicion.y, this.objetivo.x, this.objetivo.y, grid);
        } else {
            path = pathfinder.findPath(this.posicion.x, this.posicion.y, this.esquina.x, this.esquina.y, grid);
        }
        path.shift();
        this.movimientos = path;
    }
}
