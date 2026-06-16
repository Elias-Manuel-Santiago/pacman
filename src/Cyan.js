import { Graphics } from 'pixi.js';
import { CELL_SIZE, UI_HEIGHT, COLS, ROWS, GHOST_STATE, lerp } from './Grid.js';
import { Maze } from './Maze.js'
import { Ghost } from './Ghost.js';
import PF from 'pathfinding'

export class Cyan extends Ghost {

    constructor(container, id, startX, startY, color, name) {
        super(container, id, startX, startY, color, name);

        this.firstScatterDone = false;
        this.esquina = { x: 27, y: 29 };
        
        this.wait(8000)
    }
    pathfinding(posObjetivo, grid, pacman) {
        const pathfinder = new PF.AStarFinder({
            allowDiagonals: false,
            dontCrossCorners: true,
        });
        const dist = Math.abs(this.posicion.x - pacman.posicion.x) + Math.abs(this.posicion.y - pacman.posicion.y);

        if (this.posicion.x == this.esquina.x && this.posicion.y == this.esquina.y) {
            this.firstScatterDone = true;
        }

        if (this.firstScatterDone) {
            if (this.state != 'frightened') {
                if (dist >= 10) {
                    this.state = 'chase';
                } else {
                    this.state = 'scatter';
                }
            }

        }

        const path = pathfinder.findPath(this.posicion.x, this.posicion.y, posObjetivo.x, posObjetivo.y, grid);
        path.shift();
        this.movimientos = path;
    }

}