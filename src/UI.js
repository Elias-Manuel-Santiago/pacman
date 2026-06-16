// ============================================================
// UI.js — Interfaz de usuario (HUD y overlays)
// ============================================================
// Gestiona:
//   • Barra HUD superior: puntaje y vidas
//   • Overlay de Game Over
//   • Overlay de Victoria (todos los orbes recolectados)

import { Container, Graphics, Text } from 'pixi.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, UI_HEIGHT, CELL_SIZE } from './Grid.js';

export class UI {
    /**
     * @param {import('pixi.js').Container} stage - Stage principal de Pixi
     */
    constructor(stage) {
        // ── HUD superior ──────────────────────────────────────
        this.hudContainer = new Container();
        stage.addChild(this.hudContainer);
        this.hudContainer.zIndex = 10;

        // Fondo de la barra
        const hudBg = new Graphics();
        hudBg.rect(0, 0, CANVAS_WIDTH, UI_HEIGHT);
        hudBg.fill(0x1a1a2e);
        this.hudContainer.addChild(hudBg);


        // Barras negras para cubrir al pacman cuando pasa por el portal
        this.leftCover = new Graphics();
        this.leftCover.rect(0, UI_HEIGHT - 3, CELL_SIZE, CANVAS_HEIGHT - UI_HEIGHT + 2);
        this.leftCover.fill(0x000000);
        this.hudContainer.addChild(this.leftCover);

        this.rightCover = new Graphics();
        this.rightCover.rect(CANVAS_WIDTH - CELL_SIZE, UI_HEIGHT - 3, CELL_SIZE, CANVAS_HEIGHT - UI_HEIGHT + 2);
        this.rightCover.fill(0x000000);
        this.hudContainer.addChild(this.rightCover);






        // Línea separadora

        const separator = new Graphics();
        separator.rect(0, UI_HEIGHT - 2, CANVAS_WIDTH, 2);
        separator.fill(0xffff00);
        this.hudContainer.addChild(separator);

        // Texto del puntaje
        this.scoreText = new Text({
            text: 'SCORE: 0',
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: 0xffffff,
            },
        });
        this.scoreText.x = 12;
        this.scoreText.y = (UI_HEIGHT - this.scoreText.height) / 2;
        this.hudContainer.addChild(this.scoreText);

        // Indicador de vidas (texto + círculos amarillos)
        this.livesContainer = new Container();
        this.livesContainer.x = CANVAS_WIDTH - 10;
        this.livesContainer.y = UI_HEIGHT / 2;
        this.hudContainer.addChild(this.livesContainer);

        // Texto de controles (centro del HUD)
        const helpText = new Text({
            text: 'WASD / ↑↓←→',
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 13,
                fill: 0x7f8c8d,
            },
        });
        helpText.anchor.set(0.5);
        helpText.x = CANVAS_WIDTH / 2;
        helpText.y = UI_HEIGHT / 2;
        this.hudContainer.addChild(helpText);

        // ── Overlay de Game Over ──────────────────────────────
        this.gameOverContainer = new Container();
        this.gameOverContainer.visible = false;
        stage.addChild(this.gameOverContainer);
        this.gameOverContainer.zIndex = 10;

        // Fondo semitransparente
        const gameOverBg = new Graphics();
        gameOverBg.rect(0, UI_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - UI_HEIGHT);
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
        gameOverTitle.y = UI_HEIGHT + (CANVAS_HEIGHT - UI_HEIGHT) * 0.38;
        this.gameOverContainer.addChild(gameOverTitle);

        this.gameOverScoreText = new Text({
            text: '',
            style: { fontFamily: 'Arial, sans-serif', fontSize: 22, fill: 0xffffff },
        });
        this.gameOverScoreText.anchor.set(0.5);
        this.gameOverScoreText.x = CANVAS_WIDTH / 2;
        this.gameOverScoreText.y = UI_HEIGHT + (CANVAS_HEIGHT - UI_HEIGHT) * 0.55;
        this.gameOverContainer.addChild(this.gameOverScoreText);

        const restartText = new Text({
            text: 'Presioná SPACE para reiniciar',
            style: { fontFamily: 'Arial, sans-serif', fontSize: 17, fill: 0x888888 },
        });
        restartText.anchor.set(0.5);
        restartText.x = CANVAS_WIDTH / 2;
        restartText.y = UI_HEIGHT + (CANVAS_HEIGHT - UI_HEIGHT) * 0.68;
        this.gameOverContainer.addChild(restartText);

        // ── Overlay de Victoria ───────────────────────────────
        this.winContainer = new Container();
        this.winContainer.visible = false;
        stage.addChild(this.winContainer);

        const winBg = new Graphics();
        winBg.rect(0, UI_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - UI_HEIGHT);
        winBg.fill({ color: 0x000000, alpha: 0.75 });
        this.winContainer.addChild(winBg);
        this.gameOverContainer.zIndex = 10;


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
        winTitle.y = UI_HEIGHT + (CANVAS_HEIGHT - UI_HEIGHT) * 0.38;
        this.winContainer.addChild(winTitle);

        this.winScoreText = new Text({
            text: '',
            style: { fontFamily: 'Arial, sans-serif', fontSize: 22, fill: 0xffffff },
        });
        this.winScoreText.anchor.set(0.5);
        this.winScoreText.x = CANVAS_WIDTH / 2;
        this.winScoreText.y = UI_HEIGHT + (CANVAS_HEIGHT - UI_HEIGHT) * 0.55;
        this.winContainer.addChild(this.winScoreText);

        const winRestartText = new Text({
            text: 'Presioná SPACE para jugar de nuevo',
            style: { fontFamily: 'Arial, sans-serif', fontSize: 17, fill: 0x888888 },
        });
        winRestartText.anchor.set(0.5);
        winRestartText.x = CANVAS_WIDTH / 2;
        winRestartText.y = UI_HEIGHT + (CANVAS_HEIGHT - UI_HEIGHT) * 0.68;
        this.winContainer.addChild(winRestartText);
    }

    // ── Métodos públicos ──────────────────────────────────────

    /**
     * Actualiza el texto del puntaje en el HUD.
     * @param {number} score
     */
    updateScore(score) {
        this.scoreText.text = `SCORE: ${score}`;
    }

    /**
     * Actualiza el indicador visual de vidas (círculos amarillos).
     * @param {number} lives - Vidas restantes
     */
    updateLives(lives) {
        this.livesContainer.removeChildren();

        // Mostrar un mini Pac-Man por cada vida restante
        const iconSize = 10;
        const spacing = 26;

        for (let i = 0; i < lives; i++) {
            const icon = new Graphics();
            const cx = -(i * spacing) - iconSize;
            // Forma de Pac-Man mirando a la derecha
            icon.moveTo(cx, 0);
            icon.arc(cx, 0, iconSize, -Math.PI * 0.75, Math.PI * 0.75, false);
            icon.closePath();
            icon.fill(0xffff00);
            this.livesContainer.addChild(icon);
        }
    }

    /**
     * Muestra el overlay de Game Over.
     * @param {number} score - Puntaje final
     */
    showGameOver(score) {
        this.gameOverScoreText.text = `Puntaje final: ${score}`;
        this.gameOverContainer.visible = true;
    }

    /** Oculta el overlay de Game Over */
    hideGameOver() {
        this.gameOverContainer.visible = false;
    }

    /**
     * Muestra el overlay de Victoria.
     * @param {number} score - Puntaje final
     */
    showWin(score) {
        this.winScoreText.text = `Puntaje: ${score}`;
        this.winContainer.visible = true;
    }

    /** Oculta el overlay de Victoria */
    hideWin() {
        this.winContainer.visible = false;
    }

    destroy() {
        this.hudContainer.destroy({ children: true });
        this.gameOverContainer.destroy({ children: true });
        this.winContainer.destroy({ children: true });
    }


}
