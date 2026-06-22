// ============================================================
// Maze.js — Laberinto del juego con Autotiling
// ============================================================

import { Graphics, Assets, Sprite, Texture, Rectangle, Container } from 'pixi.js';
import { CELL, calcCellSize } from './Grid.js';
import { LEVEL_CONFIGS } from './LevelsConfig.js';
import { tileMapping, tileMappingBorder, SPRITE_TILE_SIZE } from './tileMap.js';
import PF from 'pathfinding';

export class Maze {
    /**
     * @param {Container} container - Contenedor de la escena
     * @param {Object} [options]
     * @param {'full'|'half'|'none'} [options.pelletMode] - Cantidad de píldoras de poder
     */
    constructor(container, options = {}, level) {
        this.grid = [];
        this.gridPathfinding = null;
        this.totalOrbs = 0;
        this.pelletMode = options.pelletMode || 'full';

        this.mazeData = LEVEL_CONFIGS[level].map;

        this.ROWS = this.mazeData.ROWS;
        this.COLS = this.mazeData.COLS;
        this.CELL_SIZE = calcCellSize(this.ROWS);

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
        for (let y = 0; y < this.ROWS; y++) {
            this.grid[y] = [];
            const row = this.mazeData.MAZE_ASCII[y];

            for (let x = 0; x < this.COLS; x++) {
                const ch = row[x] ?? ' ';
                let cell;

                switch (ch) {
                    case '#': cell = CELL.WALL; break;
                    case '.': cell = CELL.ORB; this.totalOrbs++; break;
                    case 'o': cell = CELL.PELLET; this.totalOrbs++; break;
                    case '-': cell = CELL.GHOST_DOOR; break;
                    case 'H': cell = CELL.GHOST_HOUSE; break;
                    case 'X': cell = CELL.OUT_OF_BONDS; break;
                    default: cell = CELL.EMPTY; break;
                }
                this.grid[y][x] = cell;
            }
        }

        this.grid[this.mazeData.PACMAN_START.y][this.mazeData.PACMAN_START.x] = CELL.EMPTY;

        this._applyPelletMode();

        const pfMatrix = [];
        for (let y = 0; y < this.ROWS; y++) {
            pfMatrix[y] = [];
            for (let x = 0; x < this.COLS; x++) {
                pfMatrix[y][x] = this.grid[y][x] === CELL.WALL ? 1 : 0;
            }
        }
        this.gridPathfinding = new PF.Grid(pfMatrix);
    }

    /**
     * Convierte píldoras de poder (CELL.PELLET) en orbes normales (CELL.ORB)
     * según this.pelletMode:
     *   'full' → no se tocan
     *   'half' → se convierte la mitad
     *   'none' → se convierten todas
     */
    _applyPelletMode() {
        if (this.pelletMode === 'full') return;

        const pelletPositions = [];
        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                if (this.grid[y][x] === CELL.PELLET) pelletPositions.push({ x, y });
            }
        }

        const cantidad = this.pelletMode === 'none'
            ? pelletPositions.length
            : Math.floor(pelletPositions.length / 2);

        for (let i = 0; i < cantidad; i++) {
            const { x, y } = pelletPositions[i];
            this.grid[y][x] = CELL.ORB;
        }
    }

    /** Carga el spritesheet de manera asíncrona o usa texturas ya cargadas */
    async _initTexturesAndDraw() {
        // Asumiendo que spritesheet.png está en tu carpeta de assets públicos
        const baseTexture = await Assets.load('spritesheet.png');
        baseTexture.source.scaleMode = 'nearest';

        // El tamaño de cada sub-tile en el spritesheet original. 
        // Si tu spritesheet mide, por ejemplo, 16x16 px por cuadro en la imagen original:
        // Mapeo de coordenadas (Columna, Fila) en el spritesheet de 3 filas
        // Calculamos un índice binario simple basado en vecinos cardinales:
        // Celdas contiguas: Norte (1), Sur (2), Este (4), Oeste (8)


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


            if (checkx <= 0 || checkx >= this.COLS - 1 || checky < 0 || checky >= this.ROWS) {
                return true;
            }
            if (this.grid[checky][checkx] === CELL.OUT_OF_BONDS) return true;
        }
        return false;
    }

    _isOutOfBounds(x, y) {
        if (x <= 0 || x >= this.COLS - 1 || y < 0 || y >= this.ROWS) return true;
        if (this.grid[y][x] === CELL.OUT_OF_BONDS) return true;
        return false;
    }
    /** Retorna si una coordenada dentro o fuera del mapa actúa como muro para el autotiling */
    _isWallAt(x, y) {
        // Los bordes exteriores extremos cuentan como muro para cerrar los sprites del perímetro
        if (x < 0 || x >= this.COLS || y < 0 || y >= this.ROWS) return true;
        return this.grid[y][x] === CELL.WALL;
    }

    _isGhostHouse(x, y) {
        if (x < 0 || x >= this.COLS || y < 0 || y >= this.ROWS) return true;
        return this.grid[y][x] === CELL.GHOST_HOUSE;
    }

    /** Dibuja el entorno procesando cada Tile */
    _drawWalls(baseTexture, spriteSize) {
        // Limpiamos elementos previos si los hubiera
        this.wallContainer.removeChildren();

        // Creamos una sub-gráfica para elementos procedimentales como las puertas
        const proceduralGraphics = new Graphics();
        this.wallContainer.addChild(proceduralGraphics);

        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                const px = x * this.CELL_SIZE;
                const py = y * this.CELL_SIZE;

                if (this.grid[y][x] === CELL.WALL) {
                    // Calcular máscara binaria de los 8 vecinos cardinales
                    let mask = 0;
                    if (this._isBorderOfMap(x, y)) {

                        if (this._isOutOfBounds(x - 1, y + 1)) mask += 1; // Suroeste
                        if (this._isOutOfBounds(x + 1, y + 1)) mask += 2; // Sureste
                        if (this._isOutOfBounds(x + 1, y - 1)) mask += 4; // Noreste
                        if (this._isOutOfBounds(x - 1, y - 1)) mask += 8; // Noroeste
                        if (this._isOutOfBounds(x, y + 1)) mask += 16; // Sur
                        if (this._isOutOfBounds(x, y - 1)) mask += 32; // Norte
                        if (this._isOutOfBounds(x - 1, y)) mask += 64; // Oeste
                        if (this._isOutOfBounds(x + 1, y)) mask += 128; // Este

                        if (mask == 73 && this._isWallAt(x + 1, y - 1) && this._isWallAt(x + 1, y)) mask = 200;
                        if (mask == 73 && this._isWallAt(x + 1, y + 1) && this._isWallAt(x + 1, y)) mask = 201;
                        if (mask == 134 && this._isWallAt(x - 1, y + 1) && this._isWallAt(x - 1, y)) mask = 202;
                        if (mask == 134 && this._isWallAt(x - 1, y - 1) && this._isWallAt(x - 1, y)) mask = 203;
                        if (mask == 44 && this._isWallAt(x + 1, y + 1) && this._isWallAt(x, y + 1)) mask = 204;
                        if (mask == 44 && this._isWallAt(x - 1, y + 1) && this._isWallAt(x, y + 1)) mask = 205;
                        if (mask == 19 && this._isWallAt(x + 1, y - 1) && this._isWallAt(x, y - 1)) mask = 206;
                        if (mask == 19 && this._isWallAt(x - 1, y - 1) && this._isWallAt(x, y - 1)) mask = 207;


                        if (this._isOutOfBounds(x, y)) mask = 256; // Vacio
                        console.log(x + ', ' + y + ' mask: ' + mask);

                        // Obtener coordenadas en el spritesheet. Por defecto usa la caja sólida.
                        const coords = tileMappingBorder[mask] || { cx: 4, cy: 2 };

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
                        // Escalar el sprite de forma exacta al this.CELL_SIZE de tu juego
                        wallSprite.width = this.CELL_SIZE;
                        wallSprite.height = this.CELL_SIZE;

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




                        // Obtener coordenadas en el spritesheet. Por defecto usa la caja sólida.
                        const coords = tileMapping[mask] || { cx: 4, cy: 2 };

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
                        // Escalar el sprite de forma exacta al this.CELL_SIZE de tu juego
                        wallSprite.width = this.CELL_SIZE;
                        wallSprite.height = this.CELL_SIZE;

                        this.wallContainer.addChild(wallSprite);

                    }
                } else if (this.grid[y][x] === CELL.GHOST_DOOR) {
                    // Conservamos el estilo original para la puerta rosa de la casa
                    proceduralGraphics.rect(px, py + Math.round(this.CELL_SIZE * 0.35), this.CELL_SIZE, Math.round(this.CELL_SIZE * 0.3));
                    proceduralGraphics.fill(0xff99cc);

                } else if (this.grid[y][x] === CELL.GHOST_HOUSE) {
                    // Fondo oscuro interior casa
                    proceduralGraphics.rect(px, py, this.CELL_SIZE, this.CELL_SIZE);
                    proceduralGraphics.fill(0x110022);
                }


            }
        }
    }

    _drawOrbs() {
        if (!this.orbGraphics || this.orbGraphics.destroyed) return;
        
        this.orbGraphics.clear();

        // Calculamos los radios de forma dinámica para que se adapten al CELL_SIZE
        const orbRadius = this.CELL_SIZE * 0.15;
        const pelletRadius = this.CELL_SIZE * 0.4;

        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
                const cx = x * this.CELL_SIZE + this.CELL_SIZE / 2;
                const cy = y * this.CELL_SIZE + this.CELL_SIZE / 2;

                if (this.grid[y][x] === CELL.ORB) {
                    this.orbGraphics.circle(cx, cy, orbRadius);
                    this.orbGraphics.fill(0xffeeaa);
                } else if (this.grid[y][x] === CELL.PELLET) {
                    this.orbGraphics.circle(cx, cy, pelletRadius);
                    this.orbGraphics.fill(0xffeeaa);
                }
            }
        }
    }

    isWalkable(x, y) {
        if (x < 0 || x >= this.COLS || y < 0 || y >= this.ROWS) return false;
        const c = this.grid[y][x];
        return c !== CELL.WALL && c !== CELL.GHOST_DOOR && c !== CELL.GHOST_HOUSE;
    }

    isGhostWalkable(x, y) {
        if (x < 0 || x >= this.COLS || y < 0 || y >= this.ROWS) return false;
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
        for (let y = 0; y < this.ROWS; y++) {
            for (let x = 0; x < this.COLS; x++) {
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