// ============================================================
// Maze.js — Laberinto del juego
// ============================================================
// Contiene el layout ASCII del laberinto, lo transforma en una
// grilla de tipos de celda (CELL.*) y dibuja paredes y orbes.
//
// La grilla es accesible como maze.grid[y][x].
// Los métodos isWalkable / isGhostWalkable sirven para validar
// movimientos de Pac-Man y fantasmas respectivamente.

import { Graphics } from 'pixi.js';
import { CELL, CELL_SIZE, COLS, ROWS, UI_HEIGHT } from './Grid.js';
import PF from 'pathfinding'

// ── Posiciones de inicio ──────────────────────────────────────

/** Posición inicial de Pac-Man en la grilla */
export const PACMAN_START = { x: 13, y: 23 };

/**
 * Configuración de cada fantasma: posición inicial, nombre y color.
 * El id coincide con el índice del array y se usa en Ghost.js.
 * Blinky empieza fuera de la casa (row 11); los demás adentro (row 14).
 */
export const GHOST_CONFIGS = [
    { id: 0, x: 14, y: 11, name: 'Blinky', color: 0xff0000 }, // rojo
    { id: 1, x: 14, y: 11, name: 'Pinky', color: 0xff69b4 }, // rosa
    { id: 2, x: 12, y: 14, name: 'Inky', color: 0x00ffff }, // cian
    { id: 3, x: 16, y: 14, name: 'Clyde', color: 0xffa500 }, // naranja
];

/** Fila del túnel horizontal: los bordes izquierdo y derecho se conectan */
export const TUNNEL_ROW = 14;

// ── ASCII del laberinto ───────────────────────────────────────
// 28 columnas × 31 filas. Cada caracter define el tipo de celda:
//   '#' = pared          '.' = orbe pequeño     'o' = orbe de poder
//   ' ' = vacío          '-' = puerta casa       'H' = interior casa
const MAZE_ASCII = [
    ' ############################ ',  //  0
    ' #............##............# ',  //  1
    ' #.####.#####.##.#####.####.# ',  //  2
    ' #o####.#####.##.#####.####o# ',  //  3
    ' #.####.#####.##.#####.####.# ',  //  4
    ' #..........................# ',  //  5
    ' #.####.##.########.##.####.# ',  //  6
    ' #.####.##.########.##.####.# ',  //  7
    ' #......##....##....##......# ',  //  8
    ' ######.#####.##.#####.###### ',  //  9
    ' ######.#####.##.#####.###### ',  // 10
    ' ######.##          ##.###### ',  // 11  espacio sobre la casa (Blinky)
    ' ######.##.########.##.###### ',  // 12
    '#######.##.#------#.##.#######',  // 13  puerta de la casa de fantasmas
    '       .   #HHHHHH#   .       ',  // 14  túnel + interior casa
    '#######.##.#HHHHHH#.##.#######',  // 15  interior casa
    ' ######.##.########.##.###### ',  // 16
    ' ######.##          ##.###### ',  // 17
    ' ######.##.########.##.###### ',  // 18
    ' ######.##.########.##.###### ',  // 19
    ' #............##............# ',  // 20
    ' #.####.#####.##.#####.####.# ',  // 21
    ' #.####.#####.##.#####.####.# ',  // 22
    ' #o..##................##..o# ',  // 23  Pac-Man empieza en col 13
    ' ###.##.##.########.##.##.### ',  // 24
    ' ###.##.##.########.##.##.### ',  // 25
    ' #......##....##....##......# ',  // 26
    ' #.##########.##.##########.# ',  // 27
    ' #.##########.##.##########.# ',  // 28
    ' #..........................# ',  // 29
    ' ############################ ',  // 30
];

export class Maze {
    /**
     * @param {import('pixi.js').Container} container - Contenedor de la escena
     */
    constructor(container) {
        /** Grilla 2D de tipos de celda: grid[y][x] = CELL.* */
        this.grid = [];

        // Grilla secundaria para pathfinding de fantasmas
        this.gridPathfinding;

        /** Orbes totales al inicio (sirve para detectar victoria) */
        this.totalOrbs = 0;

        this._parseAscii();
        this._buildGraphics(container);
    }

    // ── Inicialización ────────────────────────────────────────

    /** Transforma el ASCII en la grilla de tipos de celda */
    _parseAscii() {
        for (let y = 0; y < ROWS; y++) {
            this.grid[y] = [];
            const row = MAZE_ASCII[y];

            for (let x = 0; x < COLS; x++) {
                const ch = row[x] ?? ' ';
                let cell;

                switch (ch) {
                    case '#': cell = CELL.WALL; break;
                    case '.': cell = CELL.ORB; this.totalOrbs++; break;
                    case 'o': cell = CELL.PELLET; this.totalOrbs++; break;
                    case '-': cell = CELL.GHOST_DOOR; break;
                    case 'H': cell = CELL.GHOST_HOUSE; break;
                    default: cell = CELL.EMPTY; break;
                }

                this.grid[y][x] = cell;
            }
        }

        // La celda de inicio de Pac-Man no tiene orbe
        this.grid[PACMAN_START.y][PACMAN_START.x] = CELL.EMPTY;


        // 0 = caminable, 1 = no caminable
        const pfMatrix = [];
        for (let y = 0; y < ROWS; y++) {
            pfMatrix[y] = [];
            for (let x = 0; x < COLS; x++) {
                pfMatrix[y][x] = this.grid[y][x] == CELL.WALL ? 1 : 0;
            }
        }


        this.gridPathfinding = new PF.Grid(pfMatrix);
    }

    /** Crea los Graphics para paredes y orbes y los agrega al contenedor */
    _buildGraphics(container) {
        this.wallGraphics = new Graphics();
        this.orbGraphics = new Graphics();

        // Las paredes van primero (detrás de orbes y personajes)
        container.addChild(this.wallGraphics);
        container.addChild(this.orbGraphics);
        this.wallGraphics.zIndex = 2;
        this.orbGraphics.zIndex = 2;

        this._drawWalls();
        this._drawOrbs();
    }

    // ── Dibujo ────────────────────────────────────────────────

    /** Dibuja todas las paredes. Solo se llama una vez (son estáticas). */
    _drawWalls() {
        this.wallGraphics.clear();

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE + UI_HEIGHT;

                if (this.grid[y][x] === CELL.WALL) {
                    // Borde exterior oscuro
                    this.wallGraphics.rect(px, py, CELL_SIZE, CELL_SIZE);
                    this.wallGraphics.fill(0x000055);

                    // Interior más claro: da apariencia de pared sólida con borde
                    this.wallGraphics.rect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                    this.wallGraphics.fill(0x0000cc);

                } else if (this.grid[y][x] === CELL.GHOST_DOOR) {
                    // Puerta de la casa: barra horizontal en el centro de la celda
                    this.wallGraphics.rect(
                        px,
                        py + Math.round(CELL_SIZE * 0.35),
                        CELL_SIZE,
                        Math.round(CELL_SIZE * 0.3),
                    );
                    this.wallGraphics.fill(0xff99cc);

                } else if (this.grid[y][x] === CELL.GHOST_HOUSE) {
                    // Interior de la casa: fondo ligeramente diferente
                    this.wallGraphics.rect(px, py, CELL_SIZE, CELL_SIZE);
                    this.wallGraphics.fill(0x110022);
                }
            }
        }
    }

    /**
     * Dibuja todos los orbes activos.
     * Se vuelve a llamar cada vez que Pac-Man recolecta uno.
     * Redibujar todos es simple y suficientemente rápido para este tamaño.
     */
    _drawOrbs() {
        this.orbGraphics.clear();

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                // Centro de la celda en píxeles
                const cx = x * CELL_SIZE + CELL_SIZE / 2;
                const cy = y * CELL_SIZE + CELL_SIZE / 2 + UI_HEIGHT;

                if (this.grid[y][x] === CELL.ORB) {
                    this.orbGraphics.circle(cx, cy, 2);
                    this.orbGraphics.fill(0xffeeaa);

                } else if (this.grid[y][x] === CELL.PELLET) {
                    this.orbGraphics.circle(cx, cy, 5);
                    this.orbGraphics.fill(0xffeeaa);
                }
            }
        }
    }

    // ── Consultas de navegación ───────────────────────────────

    /**
     * Indica si Pac-Man puede moverse a la celda (x, y).
     * Pac-Man no puede atravesar paredes, la puerta ni el interior de la casa.
     */
    isWalkable(x, y) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
        const c = this.grid[y][x];
        return c !== CELL.WALL && c !== CELL.GHOST_DOOR && c !== CELL.GHOST_HOUSE;
    }

    /**
     * Indica si un fantasma puede moverse a la celda (x, y).
     * Los fantasmas pueden atravesar la puerta pero no las paredes.
     */
    isGhostWalkable(x, y) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
        return this.grid[y][x] !== CELL.WALL;
    }

    // ── Recolección ───────────────────────────────────────────

    /**
     * Intenta recolectar el orbe en la celda (x, y).
     * Si había un orbe, lo elimina de la grilla y redibuja.
     * @returns {number|null} El tipo de celda recolectado (CELL.ORB o CELL.PELLET), o null.
     */
    collectAt({ x, y }) {
        const cell = this.grid[y][x];
        if (cell === CELL.ORB || cell === CELL.PELLET) {
            this.grid[y][x] = CELL.EMPTY;
            this._drawOrbs();
            return cell;
        }
        return null;
    }

    /** Cuenta los orbes que quedan en el laberinto */
    countRemainingOrbs() {
        let count = 0;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const c = this.grid[y][x];
                if (c === CELL.ORB || c === CELL.PELLET) count++;
            }
        }
        return count;
    }

    destroy() {
        this.wallGraphics.destroy();
        this.orbGraphics.destroy();
    }
}
