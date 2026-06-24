// ============================================================
// Pacman.js — Entidad Pac-Man
// ============================================================

import { Graphics } from 'pixi.js';
import { lerp } from '../mapBuilding/Grid.js';

export const DIRECTION = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
    NONE: { x: 0, y: 0 },
};

export class Pacman {
    /**
     * @param {import('pixi.js').Container} container
     * @param {number} startX - Columna inicial
     * @param {number} startY - Fila inicial
     * @param {number} cols   - Columnas del mapa actual (para el túnel)
     * @param {number} cellSize - Tamaño de celda en píxeles
     */
    constructor(container, startX, startY, cols, cellSize) {
        this.COLS = cols;
        this.CELL_SIZE = cellSize;

        // ── Estado lógico ─────────────────────────────────────
        this.posicion = { x: startX, y: startY };
        this.prevPos = { x: startX, y: startY };

        this.direction = DIRECTION.NONE;
        this.nextDirection = DIRECTION.NONE;

        // ── Visual ────────────────────────────────────────────
        this.graphics = new Graphics();
        container.addChild(this.graphics);
        this.graphics.zIndex = 3;

        this.graphics.x = this._cellCenter(startX);
        this.graphics.y = this._cellCenterY(startY);
        this._redraw(0.5);
    }

    // ── Lógica ────────────────────────────────────────────────

    setNextDirection(dir) {
        this.nextDirection = { ...dir };
    }

    move(maze) {
        this.prevPos.x = this.posicion.x;
        this.prevPos.y = this.posicion.y;

        const turnX = this.posicion.x + this.nextDirection.x;
        const turnY = this.posicion.y + this.nextDirection.y;
        if (maze.isWalkable(turnX, turnY)) {
            this.direction = { ...this.nextDirection };
        }

        let newX = this.posicion.x + this.direction.x;
        let newY = this.posicion.y + this.direction.y;

        // Túnel horizontal
        if (newX < 0) newX = this.COLS - 1;
        if (newX >= this.COLS) newX = 0;

        if (maze.isWalkable(newX, newY)) {
            this.posicion.x = newX;
            this.posicion.y = newY;
        }
    }

    // ── Render ────────────────────────────────────────────────

    render(progress) {
        const wrapping = Math.abs(this.prevPos.x - this.posicion.x) > this.COLS / 2;

        const interpX = wrapping
            ? this.posicion.x
            : lerp(this.prevPos.x, this.posicion.x, progress);
        const interpY = lerp(this.prevPos.y, this.posicion.y, progress);

        this.graphics.x = this._cellCenter(interpX);
        this.graphics.y = this._cellCenterY(interpY);

        this._redraw(progress);
    }

    _redraw(progress) {
        const radius = this.CELL_SIZE * 0.55;
        const maxMouth = Math.PI * 0.25;
        const isMoving = this.direction.x !== 0 || this.direction.y !== 0;
        const mouth = isMoving
            ? Math.max(0.05, maxMouth * Math.abs(Math.sin(progress * Math.PI)))
            : maxMouth * 0.5;

        const rotation = isMoving
            ? Math.atan2(this.direction.y, this.direction.x)
            : 0;

        this.graphics.clear();
        this.graphics.moveTo(0, 0);
        this.graphics.arc(0, 0, radius, rotation - mouth, rotation + mouth, true);
        this.graphics.closePath();
        this.graphics.fill(0xffff00);
    }

    // ── Ciclo de vida ─────────────────────────────────────────

    reset(x, y) {
        this.posicion = { x, y };
        this.prevPos = { x, y };

        this.direction = DIRECTION.NONE;
        this.nextDirection = DIRECTION.NONE;

        this.graphics.x = this._cellCenter(x);
        this.graphics.y = this._cellCenterY(y);
        this._redraw(0.5);
    }

    destroy() {
        this.graphics.destroy();
    }

    getInterpPos(progress) {
        const wrapping = Math.abs(this.prevPos.x - this.posicion.x) > this.COLS / 2;
        const x = wrapping ? this.posicion.x : lerp(this.prevPos.x, this.posicion.x, progress);
        const y = lerp(this.prevPos.y, this.posicion.y, progress);
        return { x, y };
    }

    // ── Helpers privados ──────────────────────────────────────

    _cellCenter(gridX) {
        return gridX * this.CELL_SIZE + this.CELL_SIZE / 2;
    }

    _cellCenterY(gridY) {
        return gridY * this.CELL_SIZE + this.CELL_SIZE / 2;
    }
}