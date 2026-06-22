// ============================================================
// UI.js — Interfaz de usuario (overlays)
// ============================================================
// El HUD de score/nivel ahora vive en el DOM HTML externo.
// Este archivo gestiona únicamente:
//   • Overlay de Game Over
//   • Overlay de Victoria

import { Container, Graphics, Text } from 'pixi.js';
import { CANVAS_HEIGHT } from './Grid.js';

export class UI {
    /**
     * @param {import('pixi.js').Container} stage - Stage principal de Pixi
     * @param {number} CANVAS_WIDTH
     * @param {number} CELL_SIZE
     */
    constructor(stage, CANVAS_WIDTH, CELL_SIZE) {
        // Referencias al HUD externo en el DOM
        this._scoreEl = document.getElementById('hud-score-value');
        this._levelEl = document.getElementById('hud-level-value');

        // Barras negras para cubrir a Pac-Man cuando pasa por el portal
        this.coverContainer = new Container();
        stage.addChild(this.coverContainer);
        this.coverContainer.zIndex = 10;

        this.leftCover = new Graphics();
        this.leftCover.rect(0, CANVAS_HEIGHT - 3, CELL_SIZE, CANVAS_HEIGHT);
        this.leftCover.fill(0x000000);
        this.coverContainer.addChild(this.leftCover);

        this.rightCover = new Graphics();
        this.rightCover.rect(CANVAS_WIDTH - CELL_SIZE, 0, CELL_SIZE, CANVAS_HEIGHT + 2);
        this.rightCover.fill(0x000000);
        this.coverContainer.addChild(this.rightCover);

        // ── Overlay de Game Over ──────────────────────────────
        this.gameOverContainer = new Container();
        this.gameOverContainer.visible = false;
        this.gameOverContainer.zIndex = 20;
        stage.addChild(this.gameOverContainer);

        const gameOverBg = new Graphics();
        gameOverBg.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        gameOverBg.fill({ color: 0x000000, alpha: 0.78 });
        this.gameOverContainer.addChild(gameOverBg);

        const gameOverTitle = new Text({
            text: 'GAME OVER',
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 52,
                fontWeight: 'bold',
                fill: 0xff2222,
                dropShadow: {
                    alpha: 0.6,
                    angle: Math.PI / 4,
                    blur: 6,
                    color: 0x000000,
                    distance: 5,
                },
            },
        });
        gameOverTitle.anchor.set(0.5);
        gameOverTitle.x = CANVAS_WIDTH / 2;
        gameOverTitle.y = CANVAS_HEIGHT * 0.38;
        this.gameOverContainer.addChild(gameOverTitle);

        this.gameOverScoreText = new Text({
            text: '',
            style: { fontFamily: 'Arial, sans-serif', fontSize: 22, fill: 0xffffff },
        });
        this.gameOverScoreText.anchor.set(0.5);
        this.gameOverScoreText.x = CANVAS_WIDTH / 2;
        this.gameOverScoreText.y = CANVAS_HEIGHT * 0.55;
        this.gameOverContainer.addChild(this.gameOverScoreText);

        const restartText = new Text({
            text: 'Presioná SPACE para reiniciar',
            style: { fontFamily: 'Arial, sans-serif', fontSize: 17, fill: 0x888888 },
        });
        restartText.anchor.set(0.5);
        restartText.x = CANVAS_WIDTH / 2;
        restartText.y = CANVAS_HEIGHT * 0.68;
        this.gameOverContainer.addChild(restartText);

        // ── Overlay de Victoria ───────────────────────────────
        this.winContainer = new Container();
        this.winContainer.visible = false;
        this.winContainer.zIndex = 20;
        stage.addChild(this.winContainer);

        const winBg = new Graphics();
        winBg.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        winBg.fill({ color: 0x000000, alpha: 0.75 });
        this.winContainer.addChild(winBg);

        const winTitle = new Text({
            text: '¡GANASTE!',
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 52,
                fontWeight: 'bold',
                fill: 0xffff00,
                dropShadow: {
                    alpha: 0.6,
                    angle: Math.PI / 4,
                    blur: 6,
                    color: 0x000000,
                    distance: 5,
                },
            },
        });
        winTitle.anchor.set(0.5);
        winTitle.x = CANVAS_WIDTH / 2;
        winTitle.y = CANVAS_HEIGHT * 0.38;
        this.winContainer.addChild(winTitle);

        this.winScoreText = new Text({
            text: '',
            style: { fontFamily: 'Arial, sans-serif', fontSize: 22, fill: 0xffffff },
        });
        this.winScoreText.anchor.set(0.5);
        this.winScoreText.x = CANVAS_WIDTH / 2;
        this.winScoreText.y = CANVAS_HEIGHT * 0.55;
        this.winContainer.addChild(this.winScoreText);

        const winRestartText = new Text({
            text: 'Presioná SPACE para jugar de nuevo',
            style: { fontFamily: 'Arial, sans-serif', fontSize: 17, fill: 0x888888 },
        });
        winRestartText.anchor.set(0.5);
        winRestartText.x = CANVAS_WIDTH / 2;
        winRestartText.y = CANVAS_HEIGHT * 0.68;
        this.winContainer.addChild(winRestartText);
    }

    // ── Métodos públicos ──────────────────────────────────────

    /** Actualiza el score en el HUD del DOM */
    updateScore(score) {
        if (this._scoreEl) this._scoreEl.textContent = score;
    }

    /** Actualiza el nivel en el HUD del DOM */
    updateLevel(level) {
        if (this._levelEl) this._levelEl.textContent = level;
    }

    /** No-op: las vidas ya no se muestran en el canvas. Se puede usar para DOM si se agrega un elemento. */
    updateLives(_lives) {}

    /** Muestra el overlay de Game Over */
    showGameOver(score) {
        this.gameOverScoreText.text = `Puntaje final: ${score}`;
        this.gameOverContainer.visible = true;
    }

    /** Oculta el overlay de Game Over */
    hideGameOver() {
        this.gameOverContainer.visible = false;
    }

    /** Muestra el overlay de Victoria */
    showWin(score) {
        this.winScoreText.text = `Puntaje: ${score}`;
        this.winContainer.visible = true;
    }

    /** Oculta el overlay de Victoria */
    hideWin() {
        this.winContainer.visible = false;
    }

    destroy() {
        this.coverContainer.destroy({ children: true });
        this.gameOverContainer.destroy({ children: true });
        this.winContainer.destroy({ children: true });
    }
}