import { Ghost } from './Ghost.js';
import PF from 'pathfinding';

export class Yellow extends Ghost {
    constructor(container, id, startX, startY, color, name, cellSize, esquina, maze) {
        super(container, id, startX, startY, color, name, cellSize, maze);
        this.firstScatterDone = false;
        this.esquina  = esquina;
        this.objetivo = { ...esquina };
        this.wait(12000);
    }

    pathfinding(grid, maze) {
        const pathfinder = new PF.AStarFinder({ allowDiagonals: false, dontCrossCorners: true });
        let path;

        if (this.state === 'chase') {
            if (this.posicion.x === this.objetivo.x && this.posicion.y === this.objetivo.y) {
                do {
                    const minX = Math.ceil(2);
                    const maxX = Math.floor(maze.COLS - 3);
                    const minY = Math.ceil(1);
                    const maxY = Math.floor(maze.ROWS - 2);
                    this.objetivo.x = Math.floor(Math.random() * (maxX - minX) + minX);
                    this.objetivo.y = Math.floor(Math.random() * (maxY - minY) + minY);
                    console.log(this.objetivo);
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