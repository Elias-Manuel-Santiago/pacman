// ============================================================
// Ghost.js — Entidad Fantasma
// ============================================================
// Cada fantasma tiene su propio estado (GHOST_STATE) y dirección,
// preparados para recibir la lógica de pathfinding.
//
// La estructura de estados es:
//   HOUSE      → espera dentro de la casa; cuando salga, pasa a SCATTER
//   SCATTER    → patrulla hacia su "esquina objetivo" en el mapa
//   CHASE      → persigue a Pac-Man usando pathfinding (A*, BFS, etc.)
//   FRIGHTENED → huye tras un orbe de poder; Pac-Man puede comerlo
//   EATEN      → vuelve a la casa como par de ojos; luego vuelve a SCATTER
//
// CÓMO IMPLEMENTAR EL PATHFINDING (en el método move()):
//   • maze.isGhostWalkable(x, y)  → devuelve true si esa celda es válida
//   • maze.grid[y][x]             → tipo de celda (CELL.* de Grid.js)
//   • pacman.gridX / pacman.gridY → posición objetivo para CHASE
//   • this.direction              → guardar la dirección elegida cada tick
//
// La grilla es un array 2D clásico, ideal para BFS o A*.
// Los vecinos de (x, y) son los cuatro cardinales: (x±1, y) y (x, y±1).

import { Graphics } from 'pixi.js';
import { CELL_SIZE, UI_HEIGHT, COLS, GHOST_STATE, lerp } from './Grid.js';

/** Color de los fantasmas cuando están asustados */
const COLOR_FRIGHTENED = 0x2222ff;
/** Color de los fantasmas cuando están comidos (solo se ven los ojos) */
const COLOR_EATEN      = 0x444444;

export class Ghost {
    /**
     * @param {import('pixi.js').Container} container - Contenedor de la escena
     * @param {number} id      - Índice del fantasma (0=Blinky, 1=Pinky, 2=Inky, 3=Clyde)
     * @param {number} startX  - Columna inicial
     * @param {number} startY  - Fila inicial
     * @param {number} color   - Color base (normal, no asustado)
     * @param {string} name    - Nombre del fantasma (informativo / debug)
     */
    constructor(container, id, startX, startY, color, name) {
        this.id    = id;
        this.name  = name;
        this.color = color;

        // ── Estado lógico ─────────────────────────────────────

        /** Posición actual en la grilla */
        this.gridX = startX;
        this.gridY = startY;

        /** Posición del tick anterior (para interpolación visual) */
        this.prevX = startX;
        this.prevY = startY;

        /** Dirección de movimiento actual */
        this.direction = { x: 0, y: -1 }; // empieza mirando arriba

        /** Estado actual de la IA (ver GHOST_STATE en Grid.js) */
        this.state = (startY <= 12)
            ? GHOST_STATE.SCATTER   // Blinky empieza fuera, en modo patrulla
            : GHOST_STATE.HOUSE;    // los demás esperan dentro de la casa

        /** Timer interno para salir del estado FRIGHTENED */
        this._frightenTimer = null;

        // ── Visual ────────────────────────────────────────────
        // TODO: reemplazar por Sprite/AnimatedSprite cuando haya assets.
        this.graphics = new Graphics();
        container.addChild(this.graphics);

        this.graphics.x = _cellCenter(startX);
        this.graphics.y = _cellCenterY(startY);
        this._redraw();
    }

    // ── Lógica de movimiento ──────────────────────────────────

    /**
     * Mueve el fantasma un paso en la grilla.
     * Llamado una vez por tick de juego.
     *
     * ════════════════════════════════════════════════════════
     *  AQUÍ VA EL PATHFINDING — instrucciones por estado:
     *
     *  HOUSE:
     *    Salir por la puerta (moverse hacia row 13, col 13).
     *    maze.isGhostWalkable(x, y) devuelve true para GHOST_DOOR.
     *    Al salir, cambiar state a SCATTER.
     *
     *  SCATTER:
     *    Cada fantasma tiene una "esquina objetivo":
     *      Blinky  → arriba-derecha  (col 25, row 0)
     *      Pinky   → arriba-izquierda (col 2,  row 0)
     *      Inky    → abajo-derecha   (col 25, row 30)
     *      Clyde   → abajo-izquierda (col 2,  row 30)
     *    Usar BFS o A* para navegar hacia esa esquina.
     *
     *  CHASE:
     *    Target = posición de Pac-Man (pacman.gridX, pacman.gridY).
     *    Blinky apunta directo a Pac-Man.
     *    Los demás usan offsets (ver comportamiento original de Pac-Man).
     *    Usar BFS o A* hacia el target.
     *
     *  FRIGHTENED:
     *    Moverse aleatoriamente o alejarse de Pac-Man.
     *    Nunca dar media vuelta.
     *
     *  EATEN:
     *    Target = entrada de la casa (col 13, row 13).
     *    Usar BFS o A* hasta llegar.
     *    Al llegar, cambiar state a HOUSE (o SCATTER si se quiere).
     *
     *  Regla general de movimiento en Pac-Man:
     *    Los fantasmas NO pueden dar media vuelta (invertir dirección).
     *    En cada intersección eligen la dirección que minimiza la
     *    distancia al target (greedy) o usan BFS/A* completo.
     * ════════════════════════════════════════════════════════
     *
     * @param {import('./Maze.js').Maze} maze
     * @param {import('./Pacman.js').Pacman} pacman
     */
    move(maze, pacman) {
        // Guardar posición anterior para la interpolación visual
        this.prevX = this.gridX;
        this.prevY = this.gridY;

        // ── PATHFINDING PENDIENTE ────────────────────────────
        // Los fantasmas no se mueven por ahora.
        // Implementar cada caso según los comentarios de arriba.
        // ─────────────────────────────────────────────────────
    }

    // ── Cambios de estado ─────────────────────────────────────

    /**
     * Activa el estado FRIGHTENED (Pac-Man comió un orbe de poder).
     * Tras `duration` ms, el fantasma vuelve a SCATTER automáticamente.
     * @param {number} duration - Duración en milisegundos
     */
    frighten(duration) {
        // No asustar a un fantasma ya comido (está volviendo a la casa)
        if (this.state === GHOST_STATE.EATEN) return;

        this.state = GHOST_STATE.FRIGHTENED;
        this._redraw();

        // Cancelar el timer anterior si el jugador reactivó el poder
        if (this._frightenTimer) clearTimeout(this._frightenTimer);

        this._frightenTimer = setTimeout(() => {
            if (this.state === GHOST_STATE.FRIGHTENED) {
                this.state = GHOST_STATE.SCATTER;
                this._redraw();
            }
        }, duration);
    }

    /**
     * Marca el fantasma como comido. Vuelve a la casa antes de reactivarse.
     * (La lógica de retorno está pendiente en move() — estado EATEN.)
     */
    eat() {
        this.state = GHOST_STATE.EATEN;
        if (this._frightenTimer) {
            clearTimeout(this._frightenTimer);
            this._frightenTimer = null;
        }
        this._redraw();
    }

    // ── Render ────────────────────────────────────────────────

    /**
     * Actualiza la posición visual interpolada entre ticks.
     * @param {number} progress - 0 a 1
     */
    render(progress) {
        // Si el fantasma cruzó el túnel, no interpolar (sin deslizamiento visual)
        const wrapping = Math.abs(this.prevX - this.gridX) > COLS / 2;

        const interpX = wrapping ? this.gridX : lerp(this.prevX, this.gridX, progress);
        const interpY = lerp(this.prevY, this.gridY, progress);

        this.graphics.x = _cellCenter(interpX);
        this.graphics.y = _cellCenterY(interpY);
    }

    /**
     * Redibuja la forma del fantasma según su estado actual.
     * El dibujo está centrado en (0, 0); la posición real va en .x/.y.
     * TODO: reemplazar por Sprite/AnimatedSprite cuando haya assets.
     */
    _redraw() {
        const r = CELL_SIZE * 0.42;

        // Color según estado
        let bodyColor;
        if (this.state === GHOST_STATE.FRIGHTENED) {
            bodyColor = COLOR_FRIGHTENED;
        } else if (this.state === GHOST_STATE.EATEN) {
            bodyColor = COLOR_EATEN;
        } else {
            bodyColor = this.color;
        }

        this.graphics.clear();

        // ── Cuerpo ────────────────────────────────────────────
        // Semicírculo superior
        this.graphics.moveTo(-r, 0);
        this.graphics.arc(0, 0, r, Math.PI, 0, false); // arco de izq a der (parte alta)
        // Bajada por el lado derecho
        this.graphics.lineTo(r, r * 0.55);
        // Tres "patas" zigzag en la parte inferior
        const legW = (r * 2) / 3;
        this.graphics.arc(r - legW / 2,       r * 0.55, legW / 2, 0,        Math.PI, false);
        this.graphics.arc(r - legW - legW / 2, r * 0.55, legW / 2, 0,        Math.PI, false);
        this.graphics.arc(-r + legW / 2,       r * 0.55, legW / 2, 0,        Math.PI, false);
        // Subida por el lado izquierdo
        this.graphics.lineTo(-r, 0);
        this.graphics.closePath();
        this.graphics.fill(bodyColor);

        // ── Ojos ──────────────────────────────────────────────
        if (this.state === GHOST_STATE.FRIGHTENED) {
            // Ojos tristes: dos puntos blancos pequeños
            this.graphics.circle(-r * 0.32, -r * 0.1, r * 0.14);
            this.graphics.fill(0xffffff);
            this.graphics.circle( r * 0.32, -r * 0.1, r * 0.14);
            this.graphics.fill(0xffffff);
        } else {
            // Ojos normales: círculo blanco con pupila azul oscuro
            this.graphics.circle(-r * 0.32, -r * 0.15, r * 0.22);
            this.graphics.fill(0xffffff);
            this.graphics.circle( r * 0.32, -r * 0.15, r * 0.22);
            this.graphics.fill(0xffffff);

            this.graphics.circle(-r * 0.28, -r * 0.12, r * 0.11);
            this.graphics.fill(0x000088);
            this.graphics.circle( r * 0.36, -r * 0.12, r * 0.11);
            this.graphics.fill(0x000088);
        }
    }

    // ── Ciclo de vida ─────────────────────────────────────────

    /**
     * Reinicia el fantasma a su posición y estado iniciales.
     * @param {number} x - Columna
     * @param {number} y - Fila
     */
    reset(x, y) {
        this.gridX = x;
        this.gridY = y;
        this.prevX = x;
        this.prevY = y;
        this.direction = { x: 0, y: -1 };
        this.state     = (y <= 12) ? GHOST_STATE.SCATTER : GHOST_STATE.HOUSE;

        if (this._frightenTimer) {
            clearTimeout(this._frightenTimer);
            this._frightenTimer = null;
        }

        this.graphics.x = _cellCenter(x);
        this.graphics.y = _cellCenterY(y);
        this._redraw();
    }

    destroy() {
        if (this._frightenTimer) clearTimeout(this._frightenTimer);
        this.graphics.destroy();
    }
}

// ── Helpers privados del módulo ───────────────────────────────

function _cellCenter(gridX) {
    return gridX * CELL_SIZE + CELL_SIZE / 2;
}

function _cellCenterY(gridY) {
    return gridY * CELL_SIZE + CELL_SIZE / 2 + UI_HEIGHT;
}
