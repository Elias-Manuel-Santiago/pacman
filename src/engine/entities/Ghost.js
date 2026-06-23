// ============================================================
// Ghost.js — Entidad Fantasma
// ============================================================

import { Graphics } from 'pixi.js';
import { GHOST_STATE, lerp, MOVE_INTERVAL_GHOST, MOVE_INTERVAL_GHOST_FRIGHTENED } from '../mapBuilding/Grid.js';
import PF from 'pathfinding';

const COLOR_FRIGHTENED = 0x2222ff;
const COLOR_EATEN      = 0x444444;

export class Ghost {
    /**
     * @param {import('pixi.js').Container} container
     * @param {number} id
     * @param {number} startX
     * @param {number} startY
     * @param {number} color
     * @param {string} name
     * @param {number} cellSize - Tamaño de celda en píxeles
     */
    constructor(container, id, startX, startY, color, name, cellSize, maze) {
        this.id       = id;
        this.name     = name;
        this.color    = color;
        this.CELL_SIZE = cellSize;

        // ── Estado lógico ─────────────────────────────────────
        this.posicion = { x: startX, y: startY };
        this.prevPos  = { x: startX, y: startY };
        this.direction = { x: 0, y: -1 };

        this.state = (!maze._isGhostHouse(startX, startY))
            ? GHOST_STATE.SCATTER
            : GHOST_STATE.HOUSE;

        this._frightenTimer  = null;
        this.respawnTimer    = null;
        this.respawnDuration = 8000;
        this.timeSinceLastMove = 0;
        this.moveInterval    = MOVE_INTERVAL_GHOST;
        this.movimientos     = [];

        // ── Visual ────────────────────────────────────────────
        this.graphics = new Graphics();
        container.addChild(this.graphics);
        this.graphics.zIndex = 3;

        this.graphics.x = this._cellCenter(startX);
        this.graphics.y = this._cellCenterY(startY);
        this._redraw();
    }

    // ── Lógica ────────────────────────────────────────────────

    move() {
        this.prevPos.x = this.posicion.x;
        this.prevPos.y = this.posicion.y;

        if (!this.movimientos || this.movimientos.length === 0) return;

        const sigMov = this.movimientos.shift();
        this.posicion.x = sigMov[0];
        this.posicion.y = sigMov[1];
    }

    pathfindingFrightened(pacmanPos, grid) {
        this.movimientos = [];

        if (pacmanPos.x >= 0 && pacmanPos.x < grid.width &&
            pacmanPos.y >= 0 && pacmanPos.y < grid.height) {
            grid.setWalkableAt(pacmanPos.x, pacmanPos.y, false);
        }

        const finder = new PF.AStarFinder();
        const path = finder.findPath(
            this.posicion.x, this.posicion.y,
            this.esquina.x,  this.esquina.y,
            grid
        );

        if (path && path.length > 1) {
            path.shift();
            this.movimientos = path;
        } else {
            this.movimientos = [];
        }
    }

    // ── Cambios de estado ─────────────────────────────────────

    frighten(duration) {
        if (this.state === GHOST_STATE.EATEN) return;
        if (this.state === GHOST_STATE.HOUSE) return;

        this.state = GHOST_STATE.FRIGHTENED;
        this.timeSinceLastMove = 0;
        this._redraw();

        if (this._frightenTimer) clearTimeout(this._frightenTimer);

        this._frightenTimer = setTimeout(() => {
            if (this.state === GHOST_STATE.FRIGHTENED) {
                this.state = GHOST_STATE.SCATTER;
                this._redraw();
            }
        }, duration);
    }

    // ── Render ────────────────────────────────────────────────

    render(progress) {
        const interpX = lerp(this.prevPos.x, this.posicion.x, progress);
        const interpY = lerp(this.prevPos.y, this.posicion.y, progress);

        this.graphics.x = this._cellCenter(interpX);
        this.graphics.y = this._cellCenterY(interpY);

        this._redraw();
    }

    _redraw() {
        const r = this.CELL_SIZE * 0.55;

        let bodyColor;
        if (this.state === GHOST_STATE.FRIGHTENED) {
            bodyColor = COLOR_FRIGHTENED;
        } else if (this.state === GHOST_STATE.EATEN) {
            bodyColor = COLOR_EATEN;
        } else {
            bodyColor = this.color;
        }

        this.graphics.clear();

        // Cuerpo
        this.graphics.moveTo(-r, 0);
        this.graphics.arc(0, 0, r, Math.PI, 0, false);
        this.graphics.lineTo(r, r * 0.55);
        const legW = (r * 2) / 3;
        this.graphics.arc(r - legW / 2,         r * 0.55, legW / 2, 0, Math.PI, false);
        this.graphics.arc(r - legW - legW / 2,  r * 0.55, legW / 2, 0, Math.PI, false);
        this.graphics.arc(-r + legW / 2,         r * 0.55, legW / 2, 0, Math.PI, false);
        this.graphics.lineTo(-r, 0);
        this.graphics.closePath();
        this.graphics.fill(bodyColor);

        // Ojos
        if (this.state === GHOST_STATE.FRIGHTENED) {
            this.graphics.circle(-r * 0.32, -r * 0.1, r * 0.14);
            this.graphics.fill(0xffffff);
            this.graphics.circle( r * 0.32, -r * 0.1, r * 0.14);
            this.graphics.fill(0xffffff);
        } else {
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

    reset(x, y) {
        this.posicion  = { x, y };
        this.prevPos   = { x, y };
        this.direction = { x: 0, y: -1 };

        if (this._frightenTimer) {
            clearTimeout(this._frightenTimer);
            this._frightenTimer = null;
        }
        this.graphics.visible = true;
        this.graphics.x = this._cellCenter(x);
        this.graphics.y = this._cellCenterY(y);
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
        clearTimeout(this.respawnTimer);
        this._frightenTimer = null;
        this.respawnTimer   = null;
        this.graphics.destroy();
    }

    getInterpPos(progress) {
        const x = lerp(this.prevPos.x, this.posicion.x, progress);
        const y = lerp(this.prevPos.y, this.posicion.y, progress);
        return { x, y };
    }

    getSpeedInterval() {
        return this.state === GHOST_STATE.FRIGHTENED
            ? MOVE_INTERVAL_GHOST_FRIGHTENED
            : this.moveInterval;
    }

    wait(duration) {
        setTimeout(() => {
            this.state = GHOST_STATE.SCATTER;
        }, duration);
    }

    // ── Helpers privados ──────────────────────────────────────

    _cellCenter(gridX) {
        return gridX * this.CELL_SIZE + this.CELL_SIZE / 2;
    }

    _cellCenterY(gridY) {
        return gridY * this.CELL_SIZE + this.CELL_SIZE / 2;
    }
}
