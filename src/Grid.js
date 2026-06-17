// ============================================================
// Grid.js — Constantes de la grilla y utilidades compartidas
// ============================================================
// Todas las medidas del juego se derivan de estas constantes.
// Cambiar CELL_SIZE reescala el juego entero sin tocar otra cosa.
// Cambiar COLS/ROWS requiere rediseñar el laberinto en Maze.js.

/** Cantidad de columnas del laberinto */
export const COLS = 30;
/** Cantidad de filas del laberinto */
export const ROWS = 31;

/** Alto de la barra HUD en píxeles (encima del área de juego) */
export const UI_HEIGHT = 50;

/** Alto total del canvas (laberinto + HUD) */
export const CANVAS_HEIGHT = window.innerHeight;   // 670px

/** Tamaño de cada celda en píxeles */
export const CELL_SIZE = window.innerHeight / ROWS - 3;

/** Ancho total del canvas */
export const CANVAS_WIDTH  = CELL_SIZE * COLS;               // 560px



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
 * Tiempo en que Pac-Man puede comerse a los fantasmas tras un orbe de poder.
 */
export const FRIGHTEN_DURATION = 8000;

// ── Tipos de celda ────────────────────────────────────────────
// Usados en Maze.grid[y][x] para representar el contenido de cada celda.
export const CELL = {
    WALL:        0,  // '#'  pared, ninguno puede pasar
    ORB:         1,  // '.'  orbe pequeño, Pac-Man lo recolecta
    PELLET:      2,  // 'o'  orbe de poder, activa modo asustado en fantasmas
    EMPTY:       3,  // ' '  espacio vacío y caminable
    GHOST_DOOR:  4,  // '-'  puerta de la casa de fantasmas (solo fantasmas pasan)
    GHOST_HOUSE: 5,  // 'H'  interior de la casa de fantasmas (solo fantasmas)
};

// ── Estados de la IA de los fantasmas ────────────────────────
// Cada estado define una estrategia de movimiento diferente.
// Ver Ghost.js para los comentarios de implementación de pathfinding.
export const GHOST_STATE = {
    HOUSE:      'house',      // espera dentro de la casa, sale después de un tiempo
    SCATTER:    'scatter',    // se mueve hacia su esquina objetivo del laberinto
    CHASE:      'chase',      // persigue a Pac-Man usando pathfinding
    FRIGHTENED: 'frightened', // huye de Pac-Man tras un orbe de poder
    EATEN:      'eaten',      // vuelve a la casa de fantasmas tras ser comido
};

// ── Puntuaciones ──────────────────────────────────────────────
export const SCORE = {
    ORB:     10,
    PELLET:  50,
    GHOST_1: 200,   // primer fantasma comido durante un orbe de poder
    GHOST_2: 400,   // segundo fantasma (se duplica cada vez)
    GHOST_3: 800,
    GHOST_4: 1600,
};

/**
 * Interpolación lineal entre a y b según el factor t.
 * t=0 devuelve a, t=1 devuelve b.
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Convierte coordenadas de grilla al centro de esa celda en píxeles.
 * Incluye el offset vertical del HUD.
 */
export function gridToPixelCenter(gridX, gridY) {
    return {
        x: gridX * CELL_SIZE + CELL_SIZE / 2,
        y: gridY * CELL_SIZE + CELL_SIZE / 2 + UI_HEIGHT,
    };
}