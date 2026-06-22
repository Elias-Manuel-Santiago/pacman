// ============================================================
// Game.js — Controlador principal del juego
// ============================================================

import { Graphics } from 'pixi.js';
import { Maze } from './Maze.js';
import { Pacman, DIRECTION } from './Pacman.js';
import { Rojo } from './Rojo.js';
import { Pink } from './Pink.js';
import { Cyan } from './Cyan.js';
import { Yellow } from './Yellow.js';
import { LEVEL_CONFIGS } from './LevelsConfig.js';
import { UI } from './UI.js';
import {
    CANVAS_HEIGHT,
    UI_HEIGHT,
    MOVE_INTERVAL,
    FRIGHTEN_DURATION,
    GHOST_STATE,
    CELL,
    SCORE,
    calcCellSize,
    calcCanvasWidth,
} from './Grid.js';

import PF from 'pathfinding';

const STATE = {
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    WIN: 'win',
};

const MAX_LEVEL = 5;

export class Game {
    constructor(app, settings) {
        this.app = app;
        this.gameSettings = settings;

        this.timeSinceLastMove = 0;
        this.inputDirection = { x: 0, y: 0 };
        this.ghostsEatenThisPellet = 0;

        this._setupInput();
        this._start();

        this._onTick = (ticker) => this._update(ticker);
        this.app.ticker.add(this._onTick);
    }

    // ── Ciclo de vida ─────────────────────────────────────────

// En tu Game.js busca el método _start y cámbialo para que no sobreescriba tu nivel:
_start() {
    // Si ya viene predefinido por el VersusGame no lo reseteamos a 5
    if (!this.level) {
        this.level = 1; 
    }
    this.score = 0;
    this.lives = 1; // O las vidas iniciales de tu preferencia
    this._buildLevel();
}

    _nextLevel() {
        if (this.level >= MAX_LEVEL) {
            this.state = STATE.WIN;
            this.ui.showWin(this.score);
            return;
        }
        this.level++;
        this._buildLevel();
    }

    _buildLevel() {
        this._clearScene();

        this.state = STATE.PLAYING;
        this.timeSinceLastMove = 0;
        this.ghostsEatenThisPellet = 0;
        this.inputDirection = DIRECTION.NONE;

        this.config = LEVEL_CONFIGS[this.level];

        this.CELL_SIZE = calcCellSize(this.config.map.ROWS);
        this.CANVAS_WIDTH = calcCanvasWidth(this.config.map.COLS, this.CELL_SIZE);

        this.PACMAN_START = this.config.map.PACMAN_START;
        this.GHOST_STARTS = this.config.map.GHOST_STARTS;

        this._createBackground();
        this.app.stage.sortableChildren = true;

        this.ui = new UI(this.app.stage, this.CANVAS_WIDTH, this.CELL_SIZE);

        this.maze = new Maze(this.app.stage, { pelletMode: this.config.pelletMode }, this.level);

        this.pacman = new Pacman(
            this.app.stage,
            this.PACMAN_START.x,
            this.PACMAN_START.y,
            this.config.map.COLS,
            this.CELL_SIZE,
        );

        const corners = this.config.map.GHOST_CORNERS;
        const ghostBuilders = [
            () => new Rojo(this.app.stage, 0, this.GHOST_STARTS[0].x, this.GHOST_STARTS[0].y, 0xff0000, 'rojito', this.CELL_SIZE, corners[0], this.maze),
            () => new Pink(this.app.stage, 1, this.GHOST_STARTS[1].x, this.GHOST_STARTS[1].y, 0xff69b4, 'rosita', this.CELL_SIZE, corners[1], this.maze),
            () => new Cyan(this.app.stage, 2, this.GHOST_STARTS[2].x, this.GHOST_STARTS[2].y, 0x00ffff, 'celestito', this.CELL_SIZE, corners[2], this.maze),
            () => new Yellow(this.app.stage, 3, this.GHOST_STARTS[3].x, this.GHOST_STARTS[3].y, 0xffa500, 'amarillito', this.CELL_SIZE, corners[3], this.maze),
        ];
        this.ghosts = ghostBuilders.slice(0, this.config.ghostCount).map((build) => build());

        for (const ghost of this.ghosts) {
            ghost.moveInterval = this.config.ghostMoveInterval;
        }

        this.ui.updateScore(this.score);
        this.ui.updateLives(this.lives);
        this.ui.updateLevel(this.level);

        this._resize();
    }

    _clearScene() {
        if (this.background) this.background.destroy();
        if (this.maze) this.maze.destroy();
        if (this.pacman) this.pacman.destroy();
        if (this.ghosts) this.ghosts.forEach((g) => g.destroy());
        if (this.ui) this.ui.destroy();

        this.background = null;
        this.maze = null;
        this.pacman = null;
        this.ghosts = [];
        this.ui = null;
    }

    _createBackground() {
        this.background = new Graphics();
        // El canvas ya no tiene barra HUD interna: ocupa todo el alto
        this.background.rect(0, 0, this.CANVAS_WIDTH, CANVAS_HEIGHT);
        this.background.fill(0x000000);
        this.app.stage.addChildAt(this.background, 0);
    }

    // ── Input ─────────────────────────────────────────────────

    _setupInput() {
        window.addEventListener('keydown', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            if (this.state !== STATE.PLAYING) {
                if (e.code === 'Space') this._start();
                return;
            }

            switch (e.code) {
                case 'ArrowLeft': case 'KeyA': this.inputDirection = DIRECTION.LEFT; break;
                case 'ArrowRight': case 'KeyD': this.inputDirection = DIRECTION.RIGHT; break;
                case 'ArrowUp': case 'KeyW': this.inputDirection = DIRECTION.UP; break;
                case 'ArrowDown': case 'KeyS': this.inputDirection = DIRECTION.DOWN; break;
            }
        });
        // --- Input Táctil (Swipe y Tap) ---
        let touchStartX = 0;
        let touchStartY = 0;

        window.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;

            // Si el movimiento es muy pequeño, se considera un "Tap" (toque)
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
                if (this.state !== STATE.PLAYING) {
                    this._start();
                }
                return;
            }

            if (this.state !== STATE.PLAYING) return;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.inputDirection = dx > 0 ? DIRECTION.RIGHT : DIRECTION.LEFT;
            } else {
                this.inputDirection = dy > 0 ? DIRECTION.DOWN : DIRECTION.UP;
            }
        }, { passive: true });
    }

    // ── Loop principal ────────────────────────────────────────

    _update(ticker) {
        if (this.state !== STATE.PLAYING) return;

        this.timeSinceLastMove += ticker.deltaMS;
        while (this.timeSinceLastMove > MOVE_INTERVAL) {
            this.timeSinceLastMove -= MOVE_INTERVAL;
            this._tick();
            if (this.state !== STATE.PLAYING) return;
        }

        const progress = this.timeSinceLastMove / MOVE_INTERVAL;
        this.pacman.render(progress);

        for (const ghost of this.ghosts) {
            if (!ghost.graphics.visible) continue;

            ghost.timeSinceLastMove += ticker.deltaMS;
            const currentInterval = ghost.getSpeedInterval();

            while (ghost.timeSinceLastMove > currentInterval) {
                ghost.timeSinceLastMove -= currentInterval;
                this._tickSingleGhost(ghost);
                if (this.state !== STATE.PLAYING) return;
            }

            const progressGhost = ghost.timeSinceLastMove / currentInterval;
            ghost.render(progressGhost);
        }

        this._checkVisualCollisions(progress);
    }

    _checkVisualCollisions(progressPacman) {
        const pacmanPos = this.pacman.getInterpPos(progressPacman);
        for (const ghost of this.ghosts) {
            if (!ghost.graphics.visible) continue;

            const progressGhost = ghost.timeSinceLastMove / ghost.getSpeedInterval();
            const ghostPos = ghost.getInterpPos(progressGhost);
            const dx = pacmanPos.x - ghostPos.x;
            const dy = pacmanPos.y - ghostPos.y;
            const distSquared = dx * dx + dy * dy;
            const threshold = 0.5;

            if (distSquared < threshold * threshold) {
                this._resolveCollision(ghost);
                if (this.state !== STATE.PLAYING) return;
            }
        }
    }

    _tick() {
        this.pacman.setNextDirection(this.inputDirection);
        this.pacman.move(this.maze);

        const collected = this.maze.collectAt(this.pacman.posicion);
        if (collected !== null) {
            this._onCollect(collected);
        }

        if (this.maze.countRemainingOrbs() === 0) {
            this._nextLevel();
        }
    }

    _tickSingleGhost(ghost) {
        if (ghost.state === GHOST_STATE.FRIGHTENED) {
            ghost.pathfindingFrightened(this.pacman.posicion, this.maze.gridPathfinding.clone());
            ghost.move();
            return;
        }

        switch (ghost.id) {
            case 0:
                console.log(ghost.state);
                if (ghost.state === GHOST_STATE.HOUSE) break;
                if (ghost.state === GHOST_STATE.SCATTER) {
                    ghost.pathfinding(ghost.esquina, this.maze.gridPathfinding.clone());
                    if (ghost.posicion.x === ghost.esquina.x && ghost.posicion.y === ghost.esquina.y) {
                        ghost.state = GHOST_STATE.CHASE;
                    }
                } else {
                    ghost.pathfinding(this.pacman.posicion, this.maze.gridPathfinding.clone());
                }
                ghost.move();
                break;

            case 1:
                if (ghost.state === GHOST_STATE.HOUSE) break;
                if (ghost.state === GHOST_STATE.SCATTER) {
                    ghost.pathfinding(ghost.esquina, this.maze.gridPathfinding.clone(), this.pacman, this.maze);
                    if (ghost.posicion.x === ghost.esquina.x && ghost.posicion.y === ghost.esquina.y) {
                        ghost.state = GHOST_STATE.CHASE;
                    }
                } else {
                    ghost.pathfinding(this.pacman.posicion, this.maze.gridPathfinding.clone(), this.pacman, this.maze);
                }
                ghost.move();
                break;

            case 2:
                if (ghost.state === GHOST_STATE.HOUSE) break;
                if (ghost.state === GHOST_STATE.SCATTER) {
                    ghost.pathfinding(ghost.esquina, this.maze.gridPathfinding.clone(), this.pacman);
                    if (ghost.posicion.x === ghost.esquina.x && ghost.posicion.y === ghost.esquina.y) {
                        ghost.state = GHOST_STATE.CHASE;
                    }
                } else {
                    ghost.pathfinding(this.pacman.posicion, this.maze.gridPathfinding.clone(), this.pacman);
                }
                ghost.move();
                break;

            case 3:
                if (ghost.state === GHOST_STATE.HOUSE) break;
                if (ghost.state === GHOST_STATE.SCATTER) {
                    ghost.pathfinding(this.maze.gridPathfinding.clone(), this.maze);
                    if (ghost.posicion.x === ghost.esquina.x && ghost.posicion.y === ghost.esquina.y) {
                        ghost.state = GHOST_STATE.CHASE;
                    }
                } else {
                    ghost.pathfinding(this.maze.gridPathfinding.clone(), this.maze);
                }
                ghost.move();
                break;

            default:
                console.warn('fantasma inexistente:', ghost.id);
        }
    }

    // ── Eventos del juego ─────────────────────────────────────

    _onCollect(cellType) {
        if (cellType === CELL.ORB) {
            this.score += SCORE.ORB;
        } else if (cellType === CELL.PELLET) {
            this.score += SCORE.PELLET;
            this.ghostsEatenThisPellet = 0;
            for (const ghost of this.ghosts) {
                ghost.frighten(FRIGHTEN_DURATION);
            }
        }
        this.ui.updateScore(this.score);
    }

    _resolveCollision(ghost) {
        if (ghost.state === GHOST_STATE.FRIGHTENED) {
            this.ghostsEatenThisPellet++;
            const scoreKey = `GHOST_${Math.min(this.ghostsEatenThisPellet, 4)}`;
            this.score += SCORE[scoreKey];
            this.ui.updateScore(this.score);
            ghost.respawn();
        } else if (ghost.state !== GHOST_STATE.EATEN) {
            this._pacmanDied();
        }
    }

    _pacmanDied() {
        this.lives--;
        this.ui.updateLives(this.lives);

        if (this.lives <= 0) {
            this.state = STATE.GAME_OVER;
            this.ui.showGameOver(this.score);
            return;
        }

        this.pacman.reset(this.PACMAN_START.x, this.PACMAN_START.y);

        for (let i = 0; i < this.ghosts.length; i++) {
            const start = this.GHOST_STARTS[i];
            this.ghosts[i].reset(start.x, start.y);
        }

        this.ghostsEatenThisPellet = 0;
        this.inputDirection = DIRECTION.NONE;
        this.timeSinceLastMove = 0;
    }

    /**
     * Centra y escala el stage para ajustarse al contenedor.
     * Sin barra interna: el canvas ocupa todo CANVAS_HEIGHT.
     */
    _resize() {
        if (!this.CANVAS_WIDTH) return;
        const scaleX = this.app.screen.width / this.CANVAS_WIDTH;
        const scaleY = this.app.screen.height / CANVAS_HEIGHT;
        const scale = Math.min(scaleX, scaleY);

        this.app.stage.scale.set(scale);
        this.app.stage.x = (this.app.screen.width - this.CANVAS_WIDTH * scale) / 2;
        this.app.stage.y = (this.app.screen.height - CANVAS_HEIGHT * scale) / 2;
    }

    destroy() {
        this.state = 'destroyed';
        this.app.ticker.remove(this._onTick);
        this._clearScene();
    }
}