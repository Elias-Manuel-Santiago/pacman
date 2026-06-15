import { Graphics } from 'pixi.js';
import { CELL_SIZE, UI_HEIGHT, COLS, ROWS, GHOST_STATE, lerp } from './Grid.js';
import { Maze } from './Maze.js'
import { Ghost } from './Ghost.js';
import PF from 'pathfinding'

export class Rojo extends Ghost {

    constructor(container, id, startX, startY, color, name){
        super(container, id, startX, startY, color, name);


        this.esquina = { x: 2, y: 1};
    }
    pathfinding(posObjetivo, grid) {
        const pathfinder = new PF.AStarFinder({
            allowDiagonals: false,
            dontCrossCorners: true,
        });
        const path = pathfinder.findPath(this.posicion.x, this.posicion.y, posObjetivo.x, posObjetivo.y, grid);
        path.shift();
        this.movimientos = path;
    }
}