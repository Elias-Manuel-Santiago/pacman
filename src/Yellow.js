import { Graphics } from 'pixi.js';
import { CELL_SIZE, UI_HEIGHT, COLS, ROWS, GHOST_STATE, lerp } from './Grid.js';
import { Maze } from './Maze.js'
import { Ghost } from './Ghost.js';
import PF from 'pathfinding'

export class Yellow extends Ghost {

    constructor(container, id, startX, startY, color, name) {
        super(container, id, startX, startY, color, name);

        this.firstScatterDone = false;
        this.esquina = { x: 2, y: 29 };
        this.objetivo = { x: 2, y: 29 };

        this.wait(12000);
    }
    pathfinding(grid, maze) {
        const pathfinder = new PF.AStarFinder({
            allowDiagonals: false,
            dontCrossCorners: true,
        });
        let path;
        if (this.state == 'chase') {
            if (this.posicion.x == this.objetivo.x && this.posicion.y == this.objetivo.y) {
                this.objetivo.x = Math.floor(Math.random() * 27) + 1;
                this.objetivo.y = Math.floor(Math.random() * 29) + 1;
                while (!maze.isWalkable(this.objetivo.x, this.objetivo.y)) {
                    this.objetivo.x = Math.floor(Math.random() * 27) + 1;
                    this.objetivo.y = Math.floor(Math.random() * 29) + 1;
                }
            }
            path = pathfinder.findPath(this.posicion.x, this.posicion.y, this.objetivo.x, this.objetivo.y, grid);
        } else {
            path = pathfinder.findPath(this.posicion.x, this.posicion.y, this.esquina.x, this.esquina.y, grid);
        }
        path.shift();
        this.movimientos = path;
    }
}