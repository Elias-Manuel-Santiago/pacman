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
import { CELL_SIZE, UI_HEIGHT, COLS, ROWS, GHOST_STATE, lerp, MOVE_INTERVAL_GHOST, MOVE_INTERVAL_GHOST_FRIGHTENED } from './Grid.js';
import { Maze } from './Maze.js'
import PF from 'pathfinding'

/** Color de los fantasmas cuando están asustados */
const COLOR_FRIGHTENED = 0x2222ff;
/** Color de los fantasmas cuando están comidos (solo se ven los ojos) */
const COLOR_EATEN = 0x444444;

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
        this.id = id;
        this.name = name;
        this.color = color;

        // ── Estado lógico ─────────────────────────────────────

        /** Posición actual en la grilla */
        this.posicion = { x: startX, y: startY };

        /** Posición del tick anterior (para interpolación visual) */
        this.prevPos = { x: startX, y: startY };

        /** Dirección de movimiento actual */
        this.direction = { x: 0, y: -1 }; // empieza mirando arriba

        /** Estado actual de la IA (ver GHOST_STATE en Grid.js) */
        this.state = (startY <= 12)
            ? GHOST_STATE.SCATTER   // Blinky empieza fuera, en modo patrulla
            : GHOST_STATE.HOUSE;    // los demás esperan dentro de la casa

        /** Timer interno para salir del estado FRIGHTENED */
        this._frightenTimer = null;
        this.respawnTimer = null;
        this.respawnDuration = 8000;

        this.timeSinceLastMove = 0;

        this.movimientos = [];

        // ── Visual ────────────────────────────────────────────
        // TODO: reemplazar por Sprite/AnimatedSprite cuando haya assets.
        this.graphics = new Graphics();
        container.addChild(this.graphics);
        this.graphics.zIndex = 3;

        this.graphics.x = _cellCenter(startX);
        this.graphics.y = _cellCenterY(startY);
        this._redraw();

    }

    /**
     * @param {import('./Maze.js').Maze} maze
     * @param {import('./Pacman.js').Pacman} pacman
     */
    move() {
        // Guardar posición actual como "anterior" para la interpolación del render
        this.prevPos.x = this.posicion.x;
        this.prevPos.y = this.posicion.y;

        if (!this.movimientos || this.movimientos.length === 0) return;

        let sigMov = this.movimientos.shift();

        // Calcular la celda destino en la dirección actual
        let newX = sigMov[0];
        let newY = sigMov[1];


        // Túnel horizontal: salir por un lado y entrar por el otro
        if (newX < 0) newX = COLS - 1;
        if (newX >= COLS) newX = 0;


        this.posicion.x = newX;
        this.posicion.y = newY;


    }

    pathfindingFrightened(pacmanPos, grid) {
        this.movimientos = [];


        // ─── EL TRUCO: CONVERTIR A PAC-MAN EN PARED ───
        // */ Usamos el método nativo de la librería 'pathfinding' para bloquear su celda

        if (pacmanPos.x >= 0 && pacmanPos.x < grid.width &&
            pacmanPos.y >= 0 && pacmanPos.y < grid.height) {
            grid.setWalkableAt(pacmanPos.x, pacmanPos.y, false);
        }

        // Instanciamos el buscador de caminos
        const finder = new PF.AStarFinder();

        // Calculamos la ruta desde la posición actual del fantasma hasta la esquina elegida
        const path = finder.findPath(
            this.posicion.x,
            this.posicion.y,
            this.esquina.x,
            this.esquina.y,
            grid
        );

        // 4. Si encontró un camino, le asignamos el siguiente paso
        if (path && path.length > 1) {
            // path[0] es la posición actual, path[1] es el siguiente paso en la grilla
            path.shift();
            this.movimientos = path;
        } else {
            // En caso de emergencia (si la esquina está bloqueada), nos quedamos quietos o recalculamos
            this.movimientos = [];
        }
    }

    // ── Cambios de estado ─────────────────────────────────────

    /**
     * Activa el estado FRIGHTENED (Pac-Man comió un orbe de poder).
     * Tras `duration` ms, el fantasma vuelve a SCATTER automáticamente.
     * @param {number} duration - Duración en milisegundos
     */
    frighten(duration) {
        // No asustar a un fantasma ya comido 
        // No asustar a un fantasma en casa
        if (this.state === GHOST_STATE.EATEN) return;
        if (this.state === GHOST_STATE.HOUSE) return;

        this.state = GHOST_STATE.FRIGHTENED;
        this.timeSinceLastMove = 0;
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

    // ── Render ────────────────────────────────────────────────

    /**
     * Actualiza la posición visual interpolada entre ticks.
     * @param {number} progress - 0 a 1
     */
    render(progress) {
        // Si el fantasma cruzó el túnel, no interpolar (sin deslizamiento visual)
        const wrapping = Math.abs(this.prevPos.x - this.posicion.x) > COLS / 2;

        const interpX = wrapping ? this.posicion.x : lerp(this.prevPos.x, this.posicion.x, progress);
        const interpY = lerp(this.prevPos.y, this.posicion.y, progress);

        this.graphics.x = _cellCenter(interpX);
        this.graphics.y = _cellCenterY(interpY);

        this._redraw();

    }

    /**
     * Redibuja la forma del fantasma según su estado actual.
     * El dibujo está centrado en (0, 0); la posición real va en .x/.y.
     * TODO: reemplazar por Sprite/AnimatedSprite cuando haya assets.
     */
    _redraw() {
        const r = CELL_SIZE * 0.55;

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
        this.graphics.arc(r - legW / 2, r * 0.55, legW / 2, 0, Math.PI, false);
        this.graphics.arc(r - legW - legW / 2, r * 0.55, legW / 2, 0, Math.PI, false);
        this.graphics.arc(-r + legW / 2, r * 0.55, legW / 2, 0, Math.PI, false);
        // Subida por el lado izquierdo
        this.graphics.lineTo(-r, 0);
        this.graphics.closePath();
        this.graphics.fill(bodyColor);

        // ── Ojos ──────────────────────────────────────────────
        if (this.state === GHOST_STATE.FRIGHTENED) {
            // Ojos tristes: dos puntos blancos pequeños
            this.graphics.circle(-r * 0.32, -r * 0.1, r * 0.14);
            this.graphics.fill(0xffffff);
            this.graphics.circle(r * 0.32, -r * 0.1, r * 0.14);
            this.graphics.fill(0xffffff);
        } else {
            // Ojos normales: círculo blanco con pupila azul oscuro
            this.graphics.circle(-r * 0.32, -r * 0.15, r * 0.22);
            this.graphics.fill(0xffffff);
            this.graphics.circle(r * 0.32, -r * 0.15, r * 0.22);
            this.graphics.fill(0xffffff);

            this.graphics.circle(-r * 0.28, -r * 0.12, r * 0.11);
            this.graphics.fill(0x000088);
            this.graphics.circle(r * 0.36, -r * 0.12, r * 0.11);
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
        this.posicion = { x: x, y: y };
        this.prevPos = { x: x, y: y };
        this.direction = { x: 0, y: -1 };

        if (this._frightenTimer) {
            clearTimeout(this._frightenTimer);
            this._frightenTimer = null;
        }
        this.graphics.visible = true;
        this.graphics.x = _cellCenter(x);
        this.graphics.y = _cellCenterY(y);
        this._redraw();
    }



    respawn() {
        this.graphics.visible = false;
        this.movimientos = [];
        this.state = GHOST_STATE.EATEN;
        clearTimeout(this._frightenTimer);
        this._frightenTimer = null;
        this.respawnTimer = setTimeout(() => {
            this.state = GHOST_STATE.CHASE;
            this.reset(14, 14);
        }, this.respawnDuration);
    }

    destroy() {
        clearTimeout(this._frightenTimer);
        this._frightenTimer = null;
        this.graphics.destroy();
    }
    getInterpPos(progress) {
        const wrapping = Math.abs(this.prevPos.x - this.posicion.x) > COLS / 2;
        const x = wrapping ? this.posicion.x : lerp(this.prevPos.x, this.posicion.x, progress);
        const y = lerp(this.prevPos.y, this.posicion.y, progress);
        return { x, y };
    }

    getSpeedInterval() {
        if (this.state == GHOST_STATE.FRIGHTENED) {
            return MOVE_INTERVAL_GHOST_FRIGHTENED;
        } else {
            return MOVE_INTERVAL_GHOST;
        }
    }

    wait(duration) {
        setTimeout(() => {
            this.state = GHOST_STATE.SCATTER;
        }, duration);
    }
}

// ── Helpers privados del módulo ───────────────────────────────

function _cellCenter(gridX) {
    return gridX * CELL_SIZE + CELL_SIZE / 2;
}

function _cellCenterY(gridY) {
    return gridY * CELL_SIZE + CELL_SIZE / 2 + UI_HEIGHT;
}

