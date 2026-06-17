// ============================================================
// Maze.js — Laberinto del juego con Autotiling
// ============================================================

import { Graphics, Assets, Sprite, Texture, Rectangle, Container } from 'pixi.js';
import { CELL, CELL_SIZE, COLS, ROWS, UI_HEIGHT } from './Grid.js';
import PF from 'pathfinding';

export const PACMAN_START = { x: 13, y: 23 };

export const GHOST_CONFIGS = [
    { id: 0, x: 14, y: 11, name: 'Blinky', color: 0xff0000 },
    { id: 1, x: 14, y: 14, name: 'Pinky', color: 0xff69b4 },
    { id: 2, x: 16, y: 14, name: 'Inky', color: 0x00ffff },
    { id: 3, x: 16, y: 14, name: 'Clyde', color: 0xffa500 },
];

export const TUNNEL_ROW = 14;

const MAZE_ASCII = [
    ' ############################ ',
    ' #............##............# ',
    ' #.####.#####.##.#####.####.# ',
    ' #o####.#####.##.#####.####o# ',
    ' #.####.#####.##.#####.####.# ',
    ' #..........................# ',
    ' #.####.##.########.##.####.# ',
    ' #.####.##.########.##.####.# ',
    ' #......##....##....##......# ',
    ' ######.#####.##.#####.###### ',
    ' ######.#####.##.#####.###### ',
    ' ######.##..........##.###### ',
    ' ######.##.        .##.###### ',
    '#######.##.#------#.##.#######',
    '       .   #HHHHHH#   .       ',
    '#######.##.#HHHHHH#.##.#######',
    ' ######.##.########.##.###### ',
    ' ######.##          ##.###### ',
    ' ######.##.########.##.###### ',
    ' ######.##.########.##.###### ',
    ' #............##............# ',
    ' #.####.#####.##.#####.####.# ',
    ' #.####.#####.##.#####.####.# ',
    ' #o..##................##..o# ',
    ' ###.##.##.########.##.##.### ',
    ' ###.##.##.########.##.##.### ',
    ' #......##....##....##......# ',
    ' #.##########.##.##########.# ',
    ' #.##########.##.##########.# ',
    ' #..........................# ',
    ' ############################ ',
];

export class Maze {
    /**
     * @param {Container} container - Contenedor de la escena
     */
    constructor(container) {
        this.grid = [];
        this.gridPathfinding = null;
        this.totalOrbs = 0;

        // Contenedores visuales
        this.wallContainer = new Container();
        this.orbGraphics = new Graphics();

        container.addChild(this.wallContainer);
        container.addChild(this.orbGraphics);

        this.wallContainer.zIndex = 2;
        this.orbGraphics.zIndex = 3; // Orbes sutilmente por encima de los bordes si colisionan

        this._parseAscii();
        this._initTexturesAndDraw();
    }

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

        this.grid[PACMAN_START.y][PACMAN_START.x] = CELL.EMPTY;

        const pfMatrix = [];
        for (let y = 0; y < ROWS; y++) {
            pfMatrix[y] = [];
            for (let x = 0; x < COLS; x++) {
                pfMatrix[y][x] = this.grid[y][x] === CELL.WALL ? 1 : 0;
            }
        }
        this.gridPathfinding = new PF.Grid(pfMatrix);
    }

    /** Carga el spritesheet de manera asíncrona o usa texturas ya cargadas */
    async _initTexturesAndDraw() {
        // Asumiendo que spritesheet.png está en tu carpeta de assets públicos
        const baseTexture = await Assets.load('spritesheet.png');
        baseTexture.source.scaleMode = 'nearest';

        // El tamaño de cada sub-tile en el spritesheet original. 
        // Si tu spritesheet mide, por ejemplo, 16x16 px por cuadro en la imagen original:
        const SPRITE_TILE_SIZE = 8;

        // Mapeo de coordenadas (Columna, Fila) en el spritesheet de 3 filas
        // Calculamos un índice binario simple basado en vecinos cardinales:
        // Celdas contiguas: Norte (1), Sur (2), Este (4), Oeste (8)
        this.tileMapping = {
            1: { cx: 2, cy: 0 }, // Casa este
            2: { cx: 3, cy: 0 }, // Casa oeste
            4: { cx: 10, cy: 0 }, // Casa norte
            5: { cx: 13, cy: 1 }, // Casa sureste
            6: { cx: 12, cy: 1 }, // Casa suroeste
            7: { cx: 15, cy: 1 }, // Casa noreste
            8: { cx: 14, cy: 1 }, // Casa noroeste

            208: { cx: 7, cy: 2 }, // Este, Sur, Sureste
            248: { cx: 14, cy: 0 }, // Este, Sur, Sureste, Oeste, Suroeste
            104: { cx: 6, cy: 2 }, //Este, Sur, Suroeste
            214: { cx: 9, cy: 1 }, // Norte, noreste, este,sur, sureste
            107: { cx: 8, cy: 1 }, // Noroeste, norte, oeste, suroeste, sur
            22: { cx: 11, cy: 1 }, // Norte, noreste, este
            31: { cx: 4, cy: 1 }, // Oeste, Noroeste, norte, noreste, este
            11: { cx: 8, cy: 2 }, // Noroeste, norte, oeste
            215: { cx: 9, cy: 1 }, // Noroeste, norte, noreste, este, sur, sureste
            111: { cx: 8, cy: 1 }, // Noroeste, norte, oeste, sur, suroeste, noreste
            254: { cx: 5, cy: 2 }, // Todo menos noreste
            252: { cx: 14, cy: 0 }, // Todo menos norte y noroeste
            246: { cx: 9, cy: 1 }, // Todo menos noroeste y oeste
            235: { cx: 8, cy: 1 }, // Todo menos noreste y este
            249: { cx: 14, cy: 0 }, // Todo menos norte y noreste
            159: { cx: 4, cy: 1 }, // Todo menos suroeste y sur
            223: { cx: 3, cy: 2 }, // Todo menos suroeste
            127: { cx: 2, cy: 2 }, // Todo menos sureste
            63: { cx: 4, cy: 1 }, // Todo menos sureste y sur



            255: { cx: 12, cy: 2 }, // Vacio
        };

        this.tileMappingBorder = {
            151: { cx: 4, cy: 0 }, // Suroeste, sureste, noreste, sur, este
            91: { cx: 5, cy: 0 }, // Noroeste, oeste, suroeste, sur, sureste
            174: { cx: 0, cy: 0 }, // Noroeste, norte, noreste, este, sureste
            109: { cx: 1, cy: 0 }, // Suroeste, oeste, noroeste, norte, noreste
            19: { cx: 12, cy: 0 }, //Suroeste, sureste, sur
            44: { cx: 10, cy: 0 }, //Noroeste, noreste, norte
            73: { cx: 3, cy: 0 }, //Noroeste,oeste, suroeste
            134: { cx: 2, cy: 0 }, //Noreste,este, sureste
            1: { cx: 6, cy: 2 }, // Suroeste
            2: { cx: 7, cy: 2 }, // Sureste
            17: { cx: 12, cy: 0 }, // Suroeste, sur
            18: { cx: 12, cy: 0 }, // Sureste, sur
            65: { cx: 3, cy: 0 }, // Oeste, suroeste
            65: { cx: 3, cy: 0 }, // Oeste, suroeste
            72: { cx: 3, cy: 0 }, // Oeste, noroeste
            40: { cx: 11, cy: 0 }, // Norte, noroeste
            8: { cx: 10, cy: 1 }, // Noroeste
            2: { cx: 7, cy: 1 }, // Sureste
            4: { cx: 11, cy: 1 }, // Noreste
            130: { cx: 2, cy: 0 }, // Este, sureste
            132: { cx: 2, cy: 0 }, // Este, noreste
            36: { cx: 11, cy: 0 }, // Norte, noreste
            46: { cx: 11, cy: 0 }, // Norte, noreste, noroeste, sureste
            23: { cx: 12, cy: 0 }, // Sur, suroeste, sureste, noreste
            190: { cx: 11, cy: 0 }, // Todo menos oeste y suroeste
            183: { cx: 12, cy: 0 }, // Todo menos oeste y noroeste
            45: { cx: 11, cy: 0 }, // Norte, noreste, noroeste, suroeste
            125: { cx: 11, cy: 0 }, // Todo menos este y sureste
            27: { cx: 12, cy: 0 }, // Sur, sureste, suroeste, noroeste
            123: { cx: 12, cy: 0 }, // Todo menos este y noreste
            
            200: { cx: 9, cy: 0 },
            201: { cx: 7, cy: 0 },
            202: { cx: 6, cy: 0 },
            203: { cx: 8, cy: 0 },
            204: { cx: 11, cy: 2 },
            205: { cx: 10, cy: 2 },
            206: { cx: 6, cy: 0 },
            207: { cx: 7, cy: 0 },

            256: { cx: 12, cy: 2 },

        }

        this._drawWalls(baseTexture, SPRITE_TILE_SIZE);
        this._drawOrbs();
    }


    _isBorderOfMap(x, y) {
        const DIR = [
            [-1, -1], [0, -1], [1, -1], // Fila superior
            [-1, 0], [1, 0], // Izquierda y Derecha
            [-1, 1], [0, 1], [1, 1]  // Fila inferior
        ]
        for (let i = 0; i < 8; i++) {
            let checkx = x + DIR[i][0];
            let checky = y + DIR[i][1];


            if (checkx <= 0 || checkx >= COLS - 1 || checky < 0 || checky >= ROWS) {
                return true;
            }
            if ((checky >= 10 && checky <= 12) || (checky >= 16 && checky <= 18)) {
                if ((checkx >= 1 && checkx <= 5) || (checkx >= 24 && checkx <= 28)) return true;
            }
            if ((x == 1 || x == 28) && y == 14) return true;
        }
        return false;
    }

    _isOutOfBounds(x, y) {
        if (x <= 0 || x >= COLS - 1 || y < 0 || y >= ROWS) return true;
        if ((y >= 10 && y <= 12) || (y >= 16 && y <= 18)) {
            if ((x >= 1 && x <= 5) || (x >= 24 && x <= 28)) return true;
        }
        if ((x == 1 || x == 28) && y == 14) return true;
        return false;
    }
    /** Retorna si una coordenada dentro o fuera del mapa actúa como muro para el autotiling */
    _isWallAt(x, y) {
        // Los bordes exteriores extremos cuentan como muro para cerrar los sprites del perímetro
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
        return this.grid[y][x] === CELL.WALL;
    }

    _isGhostHouse(x, y) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
        return this.grid[y][x] === CELL.GHOST_HOUSE;
    }

    /** Dibuja el entorno procesando cada Tile */
    _drawWalls(baseTexture, spriteSize) {
        // Limpiamos elementos previos si los hubiera
        this.wallContainer.removeChildren();

        // Creamos una sub-gráfica para elementos procedimentales como las puertas
        const proceduralGraphics = new Graphics();
        this.wallContainer.addChild(proceduralGraphics);

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const px = x * CELL_SIZE;
                const py = y * CELL_SIZE + UI_HEIGHT;

                if (this.grid[y][x] === CELL.WALL) {
                    // Calcular máscara binaria de los 8 vecinos cardinales
                    let mask = 0;
                    if (this._isBorderOfMap(x, y)) {

                        if (this._isOutOfBounds(x - 1, y + 1)) mask += 1, console.log('suroeste'); // Suroeste
                        if (this._isOutOfBounds(x + 1, y + 1)) mask += 2, console.log('sureste'); // Sureste
                        if (this._isOutOfBounds(x + 1, y - 1)) mask += 4, console.log('noreste'); // Noreste
                        if (this._isOutOfBounds(x - 1, y - 1)) mask += 8, console.log('noroeste'); // Noroeste
                        if (this._isOutOfBounds(x, y + 1)) mask += 16, console.log('sur'); // Sur
                        if (this._isOutOfBounds(x, y - 1)) mask += 32, console.log('norte'); // Norte
                        if (this._isOutOfBounds(x - 1, y)) mask += 64, console.log('oeste'); // Oeste
                        if (this._isOutOfBounds(x + 1, y)) mask += 128, console.log('este'); // Este

                        if(mask == 73 && this._isWallAt(x + 1, y - 1) && this._isWallAt(x + 1, y)) mask = 200;
                        if(mask == 73 && this._isWallAt(x + 1, y + 1) && this._isWallAt(x + 1, y)) mask = 201;
                        if(mask == 134 && this._isWallAt(x - 1, y + 1) && this._isWallAt(x - 1, y)) mask = 202;
                        if(mask == 134 && this._isWallAt(x - 1, y - 1) && this._isWallAt(x - 1, y)) mask = 203;
                        if(mask == 44 && this._isWallAt(x + 1, y + 1) && this._isWallAt(x, y + 1)) mask = 204;
                        if(mask == 44 && this._isWallAt(x - 1, y + 1) && this._isWallAt(x, y + 1)) mask = 205;
                        if(mask == 19 && this._isWallAt(x + 1, y - 1) && this._isWallAt(x, y - 1)) mask = 206;
                        if(mask == 19 && this._isWallAt(x - 1, y - 1) && this._isWallAt(x, y - 1)) mask = 207;


                        if (this._isOutOfBounds(x, y)) mask = 256, console.log('vacio'); // Vacio

                        console.log(x + ', ' + y + ' mask border: ' + mask);
                        // Obtener coordenadas en el spritesheet. Por defecto usa la caja sólida.
                        const coords = this.tileMappingBorder[mask] || { cx: 4, cy: 2 };

                        // Extraer el rectángulo exacto del archivo PNG
                        const rect = new Rectangle(
                            coords.cx * spriteSize + coords.cx,
                            coords.cy * spriteSize + coords.cy,
                            spriteSize,
                            spriteSize
                        );

                        const tileTexture = new Texture({
                            source: baseTexture.source,
                            frame: rect
                        });

                        

                        const wallSprite = new Sprite(tileTexture);
                        

                        wallSprite.x = px;
                        wallSprite.y = py;
                        // Escalar el sprite de forma exacta al CELL_SIZE de tu juego
                        wallSprite.width = CELL_SIZE;
                        wallSprite.height = CELL_SIZE;

                        this.wallContainer.addChild(wallSprite);
                    } else {
                        if (this._isWallAt(x - 1, y - 1)) mask += 1;   // NW (Noroeste)
                        if (this._isWallAt(x, y - 1)) mask += 2;   // N  (Norte)
                        if (this._isWallAt(x + 1, y - 1)) mask += 4;   // NE (Noreste)
                        if (this._isWallAt(x - 1, y)) mask += 8;   // W  (Oeste)
                        if (this._isWallAt(x + 1, y)) mask += 16;  // E  (Este)
                        if (this._isWallAt(x - 1, y + 1)) mask += 32;  // SW (Suroeste)
                        if (this._isWallAt(x, y + 1)) mask += 64;  // S  (Sur)
                        if (this._isWallAt(x + 1, y + 1)) mask += 128; // SE (Sureste)




                        if (this._isGhostHouse(x - 1, y + 1)) mask = 6;
                        if (this._isGhostHouse(x + 1, y + 1)) mask = 5;
                        if (this._isGhostHouse(x + 1, y - 1)) mask = 7;
                        if (this._isGhostHouse(x - 1, y - 1)) mask = 8;
                        if (this._isGhostHouse(x + 1, y)) mask = 1;
                        if (this._isGhostHouse(x - 1, y)) mask = 2;
                        if (this._isGhostHouse(x, y - 1)) mask = 4;


                        console.log(x + ', ' + y + ' mask: ' + mask);

                        // Obtener coordenadas en el spritesheet. Por defecto usa la caja sólida.
                        const coords = this.tileMapping[mask] || { cx: 4, cy: 2 };

                        // Extraer el rectángulo exacto del archivo PNG
                        const rect = new Rectangle(
                            coords.cx * spriteSize + coords.cx,
                            coords.cy * spriteSize + coords.cy,
                            spriteSize,
                            spriteSize
                        );

                        const tileTexture = new Texture({
                            source: baseTexture.source,
                            frame: rect
                        });

                        const wallSprite = new Sprite(tileTexture);
                        wallSprite.x = px;
                        wallSprite.y = py;
                        // Escalar el sprite de forma exacta al CELL_SIZE de tu juego
                        wallSprite.width = CELL_SIZE;
                        wallSprite.height = CELL_SIZE;

                        this.wallContainer.addChild(wallSprite);

                    }
                } else if (this.grid[y][x] === CELL.GHOST_DOOR) {
                    // Conservamos el estilo original para la puerta rosa de la casa
                    proceduralGraphics.rect(px, py + Math.round(CELL_SIZE * 0.35), CELL_SIZE, Math.round(CELL_SIZE * 0.3));
                    proceduralGraphics.fill(0xff99cc);

                } else if (this.grid[y][x] === CELL.GHOST_HOUSE) {
                    // Fondo oscuro interior casa
                    proceduralGraphics.rect(px, py, CELL_SIZE, CELL_SIZE);
                    proceduralGraphics.fill(0x110022);
                }


            }
        }
    }

    _drawOrbs() {
        this.orbGraphics.clear();

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
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

    isWalkable(x, y) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
        const c = this.grid[y][x];
        return c !== CELL.WALL && c !== CELL.GHOST_DOOR && c !== CELL.GHOST_HOUSE;
    }

    isGhostWalkable(x, y) {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
        return this.grid[y][x] !== CELL.WALL;
    }

    collectAt({ x, y }) {
        const cell = this.grid[y][x];
        if (cell === CELL.ORB || cell === CELL.PELLET) {
            this.grid[y][x] = CELL.EMPTY;
            this._drawOrbs();
            return cell;
        }
        return null;
    }

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
        this.wallContainer.destroy({ children: true });
        this.orbGraphics.destroy();
    }
}