// ============================================================
// Game.js — Controlador principal del juego
// ============================================================
// Orquesta todos los sistemas:
//   • Estado global (PLAYING, GAME_OVER, WIN)
//   • Loop de tick con intervalo fijo + render interpolado
//   • Input de teclado
//   • Creación y destrucción de entidades
//
// La separación tick / frame es idéntica a snake2:
//   - tick()   → lógica de juego, se ejecuta cada MOVE_INTERVAL ms
//   - update() → render, se ejecuta cada frame con progress [0,1)

import { Graphics } from 'pixi.js';
import { Maze, PACMAN_START, GHOST_CONFIGS } from './Maze.js';
import { Pacman } from './Pacman.js';
import { Ghost } from './Ghost.js';
import { Rojo } from './Rojo.js';
import { Pink } from './Pink.js';
import { Cyan } from './Cyan.js';
import { Yellow } from './Yellow.js';
import { UI } from './UI.js';
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    UI_HEIGHT,
    MOVE_INTERVAL,
    MOVE_INTERVAL_GHOST,
    MOVE_INTERVAL_GHOST_FRIGHTENED,
    FRIGHTEN_DURATION,
    GHOST_STATE,
    CELL,
    SCORE,
} from './Grid.js';

// Estados posibles del juego
const STATE = {
    PLAYING: 'playing',
    GAME_OVER: 'game_over',
    WIN: 'win',
};
import PF from 'pathfinding'


export class Game {
    /**
     * @param {import('pixi.js').Application} app - Instancia de Pixi Application
     */
    constructor(app) {
        this.app = app;

        // Acumulador de tiempo para el tick de lógica (ver _update)
        this.timeSinceLastMove = 0;
        this.timeSinceLastMoveGhost = 0;

        // Dirección pedida por el teclado; se aplica en el próximo tick
        this.inputDirection = { x: 0, y: 0 };

        // Contador de fantasmas comidos durante el mismo orbe de poder
        // (puntos crecientes: 200 → 400 → 800 → 1600)
        this.ghostsEatenThisPellet = 0;

        // Registrar listeners de teclado una sola vez en toda la vida del Game
        this._setupInput();

        // Crear la primera partida
        this._start();

        // Guardar referencia al callback para poder quitarlo en destroy()
        this._onTick = (ticker) => this._update(ticker);
        this.app.ticker.add(this._onTick);
    }

    // ── Ciclo de vida ─────────────────────────────────────────

    /**
     * Inicializa (o reinicia) una partida nueva.
     * Destruye las entidades anteriores, resetea el estado y recrea todo.
     */
    _start() {
        this._clearScene();

        this.state = STATE.PLAYING;
        this.score = 0;
        this.lives = 1;
        this.timeSinceLastMove = 0;
        this.ghostsEatenThisPellet = 0;
        this.inputDirection = { x: 0, y: 0 };

        // El fondo negro cubre toda el área de juego
        this._createBackground();

        this.app.stage.sortableChildren = true;

        // La UI se crea antes que las entidades para que quede detrás visualmente
        this.ui = new UI(this.app.stage);

        // Laberinto: paredes y orbes
        this.maze = new Maze(this.app.stage);

        // Pac-Man en su posición inicial
        this.pacman = new Pacman(this.app.stage, PACMAN_START.x, PACMAN_START.y);

        // Fantasmas: uno por cada entrada en GHOST_CONFIGS
        this.ghosts = [
            new Rojo(this.app.stage, 0, 15, 11, 0xff0000, 'rojito'),
            new Pink(this.app.stage, 1, 14, 14, 0xff69b4, 'rosita'),
            new Cyan(this.app.stage, 2, 16, 14, 0x00ffff, 'celestito'),
            new Yellow(this.app.stage, 3, 13, 14, 0xffa500, 'amarillito')
        ]

        this.ghosts[0].pathfinding

        this.ui.updateScore(this.score);
        this.ui.updateLives(this.lives);
    }

    /** Destruye todas las entidades activas y limpia el stage */
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

    /** Dibuja el fondo negro del área de juego */
    _createBackground() {
        this.background = new Graphics();
        this.background.rect(0, UI_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - UI_HEIGHT);
        this.background.fill(0x000000);
        this.app.stage.addChildAt(this.background, 0);
    }

    // ── Input ─────────────────────────────────────────────────

    /** Registra el listener de teclado. Se llama una sola vez. */
    _setupInput() {
        window.addEventListener('keydown', (e) => {
            // Evitar que las flechas hagan scroll en el navegador
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }

            // En cualquier estado que no sea PLAYING, SPACE reinicia
            if (this.state !== STATE.PLAYING) {
                if (e.code === 'Space') this._start();
                return;
            }

            switch (e.code) {
                case 'ArrowLeft': case 'KeyA': this.inputDirection = { x: -1, y: 0 }; break;
                case 'ArrowRight': case 'KeyD': this.inputDirection = { x: 1, y: 0 }; break;
                case 'ArrowUp': case 'KeyW': this.inputDirection = { x: 0, y: -1 }; break;
                case 'ArrowDown': case 'KeyS': this.inputDirection = { x: 0, y: 1 }; break;
            }
        });
    }

    // ── Loop principal ────────────────────────────────────────

    /**
     * Llamado cada frame por el ticker de Pixi.
     * Acumula tiempo y ejecuta los ticks que correspondan,
     * luego renderiza con interpolación.
     * @param {import('pixi.js').Ticker} ticker
     */
    _update(ticker) {
        if (this.state !== STATE.PLAYING) return;

        this.timeSinceLastMove += ticker.deltaMS;
        while (this.timeSinceLastMove > MOVE_INTERVAL) {
            if (this.timeSinceLastMove > MOVE_INTERVAL) {
                this.timeSinceLastMove -= MOVE_INTERVAL;
                this._tick();
            }
            if (this.state !== STATE.PLAYING) return;
        }
        const progress = this.timeSinceLastMove / MOVE_INTERVAL;
        this.pacman.render(progress);


        for (const ghost of this.ghosts) {
            if (!ghost.graphics.visible) continue;

            // Cada uno acumula su delta de tiempo
            ghost.timeSinceLastMove += ticker.deltaMS;
            const currentInterval = ghost.getSpeedInterval();

            // Se ejecutan tantos ticks lógicos como exija su propio intervalo
            while (ghost.timeSinceLastMove > currentInterval) {
                ghost.timeSinceLastMove -= currentInterval;
                this._tickSingleGhost(ghost); // Ejecuta la IA de un solo fantasma
                if (this.state !== STATE.PLAYING) return;
            }

            const progressGhost = ghost.timeSinceLastMove / currentInterval;
            ghost.render(progressGhost);
        }

        // 4. Colisiones
        this._checkVisualCollisions(progress);
    }

    // Colisiones interpoladas
    _checkVisualCollisions(progressPacman) {
        const pacmanPos = this.pacman.getInterpPos(progressPacman);
        for (const ghost of this.ghosts) {
            if (!ghost.graphics.visible) {
                continue;
            }
            const progressGhost = ghost.timeSinceLastMove / ghost.getSpeedInterval();
            const ghostPos = ghost.getInterpPos(progressGhost);
            const dx = pacmanPos.x - ghostPos.x;
            const dy = pacmanPos.y - ghostPos.y;
            // Cuadratica para calcular diagonales
            const distSquared = dx * dx + dy * dy;

            // Umbral: por ejemplo, menos de media celda de distancia
            const threshold = 0.5;

            // Como en la cuadratica no hicimos raiz, entonces tenemos que hacer threshold al cuadrado
            if (distSquared < threshold * threshold) {
                this._resolveCollision(ghost);
                if (this.state !== STATE.PLAYING) return;
            }
        }
    }
    /**
     * Un paso de lógica completo: mover personajes, recolectar orbes,
     * evaluar colisiones, verificar condiciones de fin.
     * Se ejecuta exactamente una vez cada MOVE_INTERVAL ms.
     */
    _tick() {
        let start = false;
        // Aplicar la dirección pedida por el jugador
        this.pacman.setNextDirection(this.inputDirection);
        // Mover Pac-Man un paso
        this.pacman.move(this.maze);



        // Recolectar orbe o pellet en la celda actual de Pac-Man
        const collected = this.maze.collectAt(this.pacman.posicion);
        if (collected !== null) {
            this._onCollect(collected);
        }


        // Victoria: todos los orbes recolectados
        if (this.maze.countRemainingOrbs() === 0) {
            this.state = STATE.WIN;
            this.ui.showWin(this.score);
        }

    }


    _tickSingleGhost(ghost) {
        console.log(ghost.name, ghost.state);

        if (ghost.state === GHOST_STATE.FRIGHTENED) {
            const gridClone = this.maze.gridPathfinding.clone();
            ghost.pathfindingFrightened(this.pacman.posicion, gridClone);
            ghost.move();
            return;
        }

        const gridClone = this.maze.gridPathfinding.clone();

        switch (ghost.id) {
            case 0:
                if (ghost.state == GHOST_STATE.SCATTER) {
                    ghost.pathfinding(ghost.esquina, this.maze.gridPathfinding.clone());
                    if (ghost.posicion.x == ghost.esquina.x && ghost.posicion.y == ghost.esquina.y) {
                        ghost.state = GHOST_STATE.CHASE;
                    }
                    ghost.move();
                    break;
                }else if(ghost.state == GHOST_STATE.HOUSE){
                    break;
                }
                ghost.pathfinding(this.pacman.posicion, this.maze.gridPathfinding.clone());
                ghost.move();
                break;
            case 1:
                if (ghost.state == GHOST_STATE.SCATTER) {
                    ghost.pathfinding(ghost.esquina, this.maze.gridPathfinding.clone(), this.pacman, this.maze);
                    if (ghost.posicion.x == ghost.esquina.x && ghost.posicion.y == ghost.esquina.y) {
                        ghost.state = GHOST_STATE.CHASE;
                    }
                    ghost.move();
                    break;
                }else if(ghost.state == GHOST_STATE.HOUSE){
                    break;
                }
                ghost.pathfinding(this.pacman.posicion, this.maze.gridPathfinding.clone(), this.pacman, this.maze);
                ghost.move();
                break;
            case 2:
                if (ghost.state == GHOST_STATE.SCATTER) {
                    ghost.pathfinding(ghost.esquina, this.maze.gridPathfinding.clone(), this.pacman);
                    if (ghost.posicion.x == ghost.esquina.x && ghost.posicion.y == ghost.esquina.y) {
                        ghost.state = GHOST_STATE.CHASE;
                    }
                    ghost.move();
                    break;
                }else if(ghost.state == GHOST_STATE.HOUSE){
                    break;
                }
                ghost.pathfinding(this.pacman.posicion, this.maze.gridPathfinding.clone(), this.pacman);
                ghost.move();
                break;
            case 3:
                if (ghost.state == GHOST_STATE.SCATTER) {
                    ghost.pathfinding(this.maze.gridPathfinding.clone(), this.maze);
                    if (ghost.posicion.x == ghost.esquina.x && ghost.posicion.y == ghost.esquina.y) {
                        ghost.state = GHOST_STATE.CHASE;
                    }
                    ghost.move();
                    break;
                }else if(ghost.state == GHOST_STATE.HOUSE){
                    break;
                }
                ghost.pathfinding(this.maze.gridPathfinding.clone(), this.maze);
                ghost.move();
                break;
            default:
                console.log('fantasma inexistente');
        }
    }

    // ── Eventos del juego ─────────────────────────────────────

    /**
     * Procesa la recolección de un orbe o pellet.
     * @param {number} cellType - CELL.ORB o CELL.PELLET
     */
    _onCollect(cellType) {
        if (cellType === CELL.ORB) {
            this.score += SCORE.ORB;

        } else if (cellType === CELL.PELLET) {
            this.score += SCORE.PELLET;

            // Reiniciar el contador de fantasmas comidos para este poder
            this.ghostsEatenThisPellet = 0;

            // Asustar a todos los fantasmas
            for (const ghost of this.ghosts) {
                ghost.frighten(FRIGHTEN_DURATION);
            }
        }

        this.ui.updateScore(this.score);
    }

    /**
     * Resuelve el contacto entre Pac-Man y un fantasma:
     *   - Fantasma FRIGHTENED → Pac-Man lo come (puntos dobles acumulados)
     *   - Fantasma EATEN      → ya está fuera de juego, ignorar
     *   - Cualquier otro      → Pac-Man pierde una vida
     * @param {Ghost} ghost
     */
    _resolveCollision(ghost) {
        if (ghost.state === GHOST_STATE.FRIGHTENED) {
            this.ghostsEatenThisPellet++;

            // Los puntos se duplican con cada fantasma comido en el mismo poder
            const scoreKey = `GHOST_${Math.min(this.ghostsEatenThisPellet, 4)}`;
            this.score += SCORE[scoreKey];
            this.ui.updateScore(this.score);

            ghost.respawn();

        } else if (ghost.state !== GHOST_STATE.EATEN) {
            this._pacmanDied();
        }
    }

    /** Pac-Man perdió una vida */
    _pacmanDied() {
        this.lives--;
        this.ui.updateLives(this.lives);

        if (this.lives <= 0) {
            this.state = STATE.GAME_OVER;
            this.ui.showGameOver(this.score);
            return;
        }

        // Quedan vidas: resetear posiciones sin borrar el laberinto
        this.pacman.reset(PACMAN_START.x, PACMAN_START.y);

        for (const ghost of this.ghosts) {
            const cfg = GHOST_CONFIGS[ghost.id];
            ghost.reset(cfg.x, cfg.y);
        }

        this.ghostsEatenThisPellet = 0;
        this.inputDirection = { x: 0, y: 0 };
        this.timeSinceLastMove = 0;
    }

    /** Libera todos los recursos del juego */
    destroy() {
        this.app.ticker.remove(this._onTick);
        this._clearScene();
    }
}
