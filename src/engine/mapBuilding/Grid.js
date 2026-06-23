// ============================================================
// Grid.js — Constantes de la grilla y utilidades compartidas
// ============================================================
// Las medidas que dependen del mapa (CELL_SIZE, CANVAS_WIDTH)
// se calculan dinámicamente en Game.js a partir del mapa del nivel.
// Las constantes aquí son independientes del nivel.



/** Alto total del canvas */
export const CANVAS_HEIGHT = 180; // 180 del laberinto + 20 de la UI

/**
 * Calcula el tamaño de celda en píxeles para un mapa dado.
 * @param {number} rows - Número de filas del mapa
 */
export function calcCellSize(rows) {
    // Dividimos por las filas para que las celdas encajen exactamente.
    const playAreaHeight = CANVAS_HEIGHT;
    return playAreaHeight / rows;
}

/**
 * Calcula el ancho total del canvas para un mapa dado.
 * @param {number} cols - Número de columnas del mapa
 * @param {number} cellSize - Tamaño de celda calculado con calcCellSize
 */
export function calcCanvasWidth(cols, cellSize) {
    return cellSize * cols;
}

/**
 * Milisegundos entre cada tick de lógica.
 * Valores menores = juego más rápido.
 */
export const MOVE_INTERVAL = 200;

export const MOVE_INTERVAL_GHOST = 250;

export const MOVE_INTERVAL_GHOST_FRIGHTENED = 450;

/**
 * Intervalo de fantasmas para el nivel 5: menor que MOVE_INTERVAL
 * de Pac-Man, por lo que se mueven más rápido que él.
 */
export const MOVE_INTERVAL_GHOST_FAST = 205;

/**
 * Duración del estado FRIGHTENED de los fantasmas (ms).
 */
export const FRIGHTEN_DURATION = 8000;

// ── Tipos de celda ────────────────────────────────────────────
export const CELL = {
    WALL:         0,  // '#'  pared, ninguno puede pasar
    ORB:          1,  // '.'  orbe pequeño, Pac-Man lo recolecta
    PELLET:       2,  // 'o'  orbe de poder, activa modo asustado en fantasmas
    EMPTY:        3,  // ' '  espacio vacío y caminable
    GHOST_DOOR:   4,  // '-'  puerta de la casa de fantasmas (solo fantasmas pasan)
    GHOST_HOUSE:  5,  // 'H'  interior de la casa de fantasmas (solo fantasmas)
    OUT_OF_BONDS: 6,  // 'X'  límites personalizados para el spritesheet
};

// ── Estados de la IA de los fantasmas ────────────────────────
export const GHOST_STATE = {
    HOUSE:      'house',
    SCATTER:    'scatter',
    CHASE:      'chase',
    FRIGHTENED: 'frightened',
    EATEN:      'eaten',
};

// ── Puntuaciones ──────────────────────────────────────────────
export const SCORE = {
    ORB:     10,
    PELLET:  50,
    GHOST_1: 200,
    GHOST_2: 400,
    GHOST_3: 800,
    GHOST_4: 1600,
};

/**
 * Interpolación lineal entre a y b según el factor t.
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Convierte coordenadas de grilla al centro de esa celda en píxeles.
 * Incluye el offset vertical del HUD.
 */
export function gridToPixelCenter(gridX, gridY, cellSize) {
    return {
        x: gridX * cellSize + cellSize / 2,
        y: gridY * cellSize + cellSize / 2 + UI_HEIGHT,
    };
}