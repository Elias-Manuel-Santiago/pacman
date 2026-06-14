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
import { Maze, PACMAN_START, GHOST_CONFIGS} from './Maze.js';
import { Pacman }                             from './Pacman.js';
import { Ghost }                              from './Ghost.js';
import { UI }                                 from './UI.js';
import {
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    UI_HEIGHT,
    MOVE_INTERVAL,
    FRIGHTEN_DURATION,
    GHOST_STATE,
    CELL,
    SCORE,
} from './Grid.js';

// Estados posibles del juego
const STATE = {
    PLAYING:   'playing',
    GAME_OVER: 'game_over',
    WIN:       'win',
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

        this.state                 = STATE.PLAYING;
        this.score                 = 0;
        this.lives                 = 3;
        this.timeSinceLastMove     = 0;
        this.ghostsEatenThisPellet = 0;
        this.inputDirection        = { x: 0, y: 0 };

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
        this.ghosts = GHOST_CONFIGS.map((cfg) =>
            new Ghost(this.app.stage, cfg.id, cfg.x, cfg.y, cfg.color, cfg.name),
        );

        this.ui.updateScore(this.score);
        this.ui.updateLives(this.lives);
    }

    /** Destruye todas las entidades activas y limpia el stage */
    _clearScene() {
        if (this.background) this.background.destroy();
        if (this.maze)       this.maze.destroy();
        if (this.pacman)     this.pacman.destroy();
        if (this.ghosts)     this.ghosts.forEach((g) => g.destroy());
        if (this.ui)         this.ui.destroy();

        this.background = null;
        this.maze       = null;
        this.pacman     = null;
        this.ghosts     = [];
        this.ui         = null;
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
                case 'ArrowLeft':  case 'KeyA': this.inputDirection = { x: -1, y:  0 }; break;
                case 'ArrowRight': case 'KeyD': this.inputDirection = { x:  1, y:  0 }; break;
                case 'ArrowUp':    case 'KeyW': this.inputDirection = { x:  0, y: -1 }; break;
                case 'ArrowDown':  case 'KeyS': this.inputDirection = { x:  0, y:  1 }; break;
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

        // Ejecutar todos los ticks pendientes
        // (puede haber más de uno si el frame fue muy lento)
        while (this.timeSinceLastMove > MOVE_INTERVAL) {
            this.timeSinceLastMove -= MOVE_INTERVAL;
            this._tick();
            if (this.state !== STATE.PLAYING) return;
        }

        // Fracción completada del tick actual: 0 = recién empezó, ~1 = casi termina
        const progress = this.timeSinceLastMove / MOVE_INTERVAL;

        this.pacman.render(progress);
        for (const ghost of this.ghosts) ghost.render(progress);
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

        this.ghosts[0].pathfinding(this.pacman.posicion, this.maze.gridPathfinding.clone());
        console.log(this.maze.grid); 


        // Recolectar orbe o pellet en la celda actual de Pac-Man
        const collected = this.maze.collectAt(this.pacman.posicion);
        if (collected !== null) {
            this._onCollect(collected);
        }

        // Mover cada fantasma un paso
        for (const ghost of this.ghosts) {
            ghost.move(this.maze, this.pacman);
        }

        // Evaluar colisiones Pac-Man ↔ fantasmas
        for (const ghost of this.ghosts) {
            if (this._overlaps(this.pacman, ghost)) {
                this._resolveCollision(ghost);
                // Salir del tick si el juego terminó o Pac-Man murió
                if (this.state !== STATE.PLAYING) return;
            }
        }

        // Victoria: todos los orbes recolectados
        if (this.maze.countRemainingOrbs() === 0) {
            this.state = STATE.WIN;
            this.ui.showWin(this.score);
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
     * Devuelve true si Pac-Man y el fantasma ocupan la misma celda.
     * @param {Pacman} pacman
     * @param {Ghost} ghost
     */
    _overlaps(pacman, ghost) {
        return ghost.posicion.x === pacman.posicion.x && ghost.posicion.y === pacman.posicion.y;
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
            this.score    += SCORE[scoreKey];
            this.ui.updateScore(this.score);

            ghost.eat();

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
        this.inputDirection        = { x: 0, y: 0 };
        this.timeSinceLastMove     = 0;
    }

    /** Libera todos los recursos del juego */
    destroy() {
        this.app.ticker.remove(this._onTick);
        this._clearScene();
    }
}
