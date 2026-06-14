// ============================================================
// Pacman.js — Entidad Pac-Man
// ============================================================
// Mantiene dos capas de estado separadas, igual que en snake2:
//   • Lógica:  gridX, gridY  (enteros, avanzan por tick)
//   • Visual:  graphics.x/y (píxeles interpolados cada frame)
//
// La boca se anima con progress: abre y cierra en cada tick.
//
// TODO: cuando haya assets, reemplazar el Graphics de esta clase
//       por un Sprite o AnimatedSprite. El método render() ya
//       actualiza .x e .y, así que el sprite se moverá solo.

import { Graphics } from 'pixi.js';
import { CELL_SIZE, UI_HEIGHT, COLS, lerp } from './Grid.js';

export class Pacman {
    /**
     * @param {import('pixi.js').Container} container - Contenedor de la escena
     * @param {number} startX - Columna inicial
     * @param {number} startY - Fila inicial
     */
    constructor(container, startX, startY) {
        // ── Estado lógico ─────────────────────────────────────
        this.posicion = { x: startX, y: startY };

        /** Posición en el tick anterior, usada para lerp en render() */
        this.prevPos = { x: startX, y: startY };

        /** Dirección en la que Pac-Man se está moviendo actualmente */
        this.direction = { x: 1, y: 0 }; // empieza mirando a la derecha

        /**
         * Próxima dirección deseada por el jugador.
         * Se aplica al inicio del siguiente tick si la celda es libre.
         * Esto permite "pre-girar" antes de llegar a una esquina.
         */
        this.nextDirection = { x: 1, y: 0 };

        // ── Visual ────────────────────────────────────────────
        // TODO: reemplazar por Sprite/AnimatedSprite cuando haya assets.
        this.graphics = new Graphics();
        container.addChild(this.graphics);
        this.graphics.zIndex = 3;

        // Posicionar en el punto de inicio y dibujar la forma inicial
        this.graphics.x = _cellCenter(startX);
        this.graphics.y = _cellCenterY(startY);
        this._redraw(0.5);
    }

    // ── Lógica ────────────────────────────────────────────────

    /**
     * Registra la próxima dirección solicitada por el jugador.
     * @param {{ x: number, y: number }} dir
     */
    setNextDirection(dir) {
        this.nextDirection = { ...dir };
    }

    /**
     * Avanza Pac-Man un paso en la grilla.
     * Llamado una vez por tick de juego (no por frame).
     * @param {import('./Maze.js').Maze} maze
     */
    move(maze) {
        // Guardar posición actual como "anterior" para la interpolación del render
        this.prevPos.x = this.posicion.x;
        this.prevPos.y = this.posicion.y;


        // Intentar girar a la dirección deseada si la celda vecina lo permite
        const turnX = this.posicion.x + this.nextDirection.x;
        const turnY = this.posicion.y + this.nextDirection.y;
        if (maze.isWalkable(turnX, turnY)) {
            this.direction = { ...this.nextDirection };
        }

        // Calcular la celda destino en la dirección actual
        let newX = this.posicion.x + this.direction.x;
        let newY = this.posicion.y + this.direction.y;

        // Túnel horizontal: salir por un lado y entrar por el otro
        if (newX < 0) newX = COLS - 1;
        if (newX >= COLS) newX = 0;

        // Solo avanzar si la celda destino es caminable
        if (maze.isWalkable(newX, newY)) {

            this.posicion.x = newX;
            this.posicion.y = newY;
        }
    }

    // ── Render ────────────────────────────────────────────────

    /**
     * Actualiza la posición visual de Pac-Man interpolando entre el tick
     * anterior y el actual. Llamado cada frame por el ticker de Pixi.
     * @param {number} progress - 0 a 1: avance dentro del tick actual
     */
    render(progress) {
        // Si Pac-Man cruzó el túnel, no interpolar (evita deslizamiento visual)
        const wrapping = Math.abs(this.prevPos.x - this.posicion.x) > COLS / 2;

        const interpX = wrapping ? this.posicion.x : lerp(this.prevPos.x, this.posicion.x, progress);
        const interpY = lerp(this.prevPos.y, this.posicion.y, progress);

        this.graphics.x = _cellCenter(interpX);
        this.graphics.y = _cellCenterY(interpY);

        this._redraw(progress);
    }

    /**
     * Redibuja la forma de Pac-Man (pie con boca animada) centrada en (0, 0).
     * La posición real se controla con graphics.x / graphics.y.
     * TODO: reemplazar por AnimatedSprite cuando haya assets.
     * @param {number} progress - 0 a 1, controla la apertura de la boca
     */
    _redraw(progress) {
        const radius = CELL_SIZE * 0.45;
        const maxMouth = Math.PI * 0.25; // apertura máxima: 45°

        // Onda senoidal: la boca abre y cierra suavemente en cada tick.
        // Math.max(0.05) evita que el ángulo sea exactamente 0 (canvas lo trata
        // como sin arco y solo dibujaría una línea en lugar del círculo completo).
        const mouth = Math.max(0.05, maxMouth * Math.abs(Math.sin(progress * Math.PI)));

        // Ángulo de rotación según la dirección actual de movimiento
        const rotation = Math.atan2(this.direction.y, this.direction.x);

        this.graphics.clear();

        // Dibujar el cuerpo: arco grande (counterclockwise) que abarca todo
        // excepto la cuña de la boca. El path se cierra hacia el centro (0,0)
        // para formar el triángulo de la mandíbula.
        this.graphics.moveTo(0, 0);
        this.graphics.arc(0, 0, radius, rotation - mouth, rotation + mouth, true);
        this.graphics.closePath();
        this.graphics.fill(0xffff00);
    }

    // ── Ciclo de vida ─────────────────────────────────────────

    /**
     * Reinicia Pac-Man a una posición dada (al perder una vida).
     * @param {number} x - Columna
     * @param {number} y - Fila
     */
    reset(x, y) {
        this.posicion = { x: x, y: y };
        this.prevPos = { x: x, y: y };
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };

        this.graphics.x = _cellCenter(x);
        this.graphics.y = _cellCenterY(y);
        this._redraw(0.5);
    }

    destroy() {
        this.graphics.destroy();
    }

    // En Pacman.js y Ghost.js, agregar un getter:
    getInterpPos(progress) {
        const wrapping = Math.abs(this.prevPos.x - this.posicion.x) > COLS / 2;
        const x = wrapping ? this.posicion.x : lerp(this.prevPos.x, this.posicion.x, progress);
        const y = lerp(this.prevPos.y, this.posicion.y, progress);
        return { x, y };
    }
}

// ── Helpers privados del módulo ───────────────────────────────

/** Coordenada X en píxeles del centro de la columna gridX */
function _cellCenter(gridX) {
    return gridX * CELL_SIZE + CELL_SIZE / 2;
}

/** Coordenada Y en píxeles del centro de la fila gridY (incluye UI_HEIGHT) */
function _cellCenterY(gridY) {
    return gridY * CELL_SIZE + CELL_SIZE / 2 + UI_HEIGHT;
}
