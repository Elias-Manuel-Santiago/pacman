// ============================================================
// UI.js — Interfaz de usuario (Mapeada a elementos HTML/CSS)
// ============================================================

import { Container, Graphics } from 'pixi.js';
import { CANVAS_HEIGHT } from '../engine/mapBuilding/Grid.js';

export class UI {
    constructor(stage, CANVAS_WIDTH, CELL_SIZE) {
        // Referencias al HUD externo en el DOM
        this._scoreEl = document.getElementById('hud-score-value');
        this._levelEl = document.getElementById('hud-level-value');

        // Mapeo de Overlays HTML
        this.htmlGameOverOverlay = document.getElementById('game-over-overlay');
        this.htmlWinOverlay = document.getElementById('win-overlay');
        this.htmlPauseOverlay = document.getElementById('pause-overlay');

        this.gameOverScoreText = document.getElementById('game-over-score');
        this.winScoreText = document.getElementById('win-score');

        this.gameOverActionsContainer = document.getElementById('game-over-actions');
        this.winActionsContainer = document.getElementById('win-actions');

        // Barras negras de Pixi únicamente para cubrir los portales de teleport
        this.coverContainer = new Container();
        stage.addChild(this.coverContainer);
        this.coverContainer.zIndex = 10;

        this.leftCover = new Graphics();
        this.leftCover.rect(-1, 0, CELL_SIZE * 1.1, CANVAS_HEIGHT);
        this.leftCover.fill(0x000000);
        this.coverContainer.addChild(this.leftCover);

        this.rightCover = new Graphics();
        this.rightCover.rect(CANVAS_WIDTH - CELL_SIZE, 0, CELL_SIZE * 1.1, CANVAS_HEIGHT + 2);
        this.rightCover.fill(0x000000);
        this.coverContainer.addChild(this.rightCover);
    }

    updateScore(score) {
        if (this._scoreEl) this._scoreEl.textContent = score;
    }

    updateLevel(level) {
        if (this._levelEl) this._levelEl.textContent = level;
    }

    updateLives(_lives) { }

    /**
     * Muestra el GameOver HTML y renderiza los botones dinámicos correspondientes
     */
    showGameOver(score, isVersus = false, isFinalTournament = false, actions = {}, isNewRecord = false) {
        if (this.gameOverScoreText) this.gameOverScoreText.textContent = `Puntaje final: ${score}`;

        // Limpiamos acciones anteriores
        this.gameOverActionsContainer.innerHTML = '';


        const scorePara = document.getElementById('game-over-score');
        if (scorePara) {
            scorePara.innerHTML = `SCORE: ${score}`;
            // Modificación visual del record solicitada:
            if (!isVersus && isNewRecord) {
                scorePara.innerHTML += `<br><span class="blink-record" style="color:#ffff00; font-size:12px; display:block; margin-top:10px;">¡NUEVO RÉCORD PERSONAL!</span>`;
            }
        }
        if (!isVersus) {
            // SINGLEPLAYER: Reiniciar + Volver al menú
            this._createBtn(this.gameOverActionsContainer, 'REINICIAR', 'btn-arcade', actions.onRestart);
            this._createBtn(this.gameOverActionsContainer, 'VOLVER AL MENÚ', 'btn-arcade', actions.onQuit);
        } else {
            // 1VS1: Siguiente jugador / Ver resultados del Torneo
            const label = isFinalTournament ? 'VER RESULTADOS TORNEO' : 'SIGUIENTE JUGADOR';
            this._createBtn(this.gameOverActionsContainer, label, 'btn-arcade', actions.onNextPlayer);
        }

        this.htmlGameOverOverlay.classList.remove('hidden');
    }

    hideGameOver() {
        this.htmlGameOverOverlay.classList.add('hidden');
    }

    /**
     * Muestra el Win HTML y renderiza los botones dinámicos correspondientes
     */
    showWin(score, isVersus = false, isFinalTournament = false, isMaxLevel = false, actions = {}, isNewRecord = false) {
        if (this.winScoreText) this.winScoreText.textContent = `Puntaje: ${score}`;

        this.winActionsContainer.innerHTML = '';

        const winScorePara = document.getElementById('win-score');
        if (winScorePara) {
            winScorePara.innerHTML = `SCORE: ${score}`;
            // Si ganó en el 5to nivel (isMaxLevel) y es un récord nuevo, lo indicamos de manera llamativa
            if (!isVersus && isMaxLevel && isNewRecord) {
                winScorePara.innerHTML += `<br><span class="blink-record" style="color:#00ff00; font-size:12px; display:block; margin-top:10px;">¡NUEVO RÉCORD HISTÓRICO!</span>`;
            }
        }

        if (!isVersus) {
            // SINGLEPLAYER
            if (isMaxLevel) {
                // Último nivel completado: Reiniciar desde Nivel 1 + Volver al menú
                this._createBtn(this.winActionsContainer, 'REINICIAR (LVL 1)', 'btn-arcade', actions.onRestartFromScratch);
            } else {
                // Siguiente Nivel + Volver al menú
                this._createBtn(this.winActionsContainer, 'SIGUIENTE NIVEL', 'btn-arcade', actions.onNextLevel);
            }
            this._createBtn(this.winActionsContainer, 'VOLVER AL MENÚ', 'btn-arcade', actions.onQuit);
        } else {
            // 1VS1: Siguiente jugador / Ver resultados del Torneo
            const label = isFinalTournament ? 'VER RESULTADOS TORNEO' : 'SIGUIENTE JUGADOR';
            this._createBtn(this.winActionsContainer, label, 'btn-arcade', actions.onNextPlayer);
        }

        this.htmlWinOverlay.classList.remove('hidden');
    }

    renderLeaderboard(leaderboardData) {
        const tbody = document.querySelector('#top_ranking .leaderboard-table tbody');
        if (!tbody) return;

        // Tomamos únicamente los 10 primeros registros para el Top visual
        const topTen = leaderboardData.slice(0, 10);
        let html = '';

        if (topTen.length === 0) {
            html = `<tr><td colspan="3" style="text-align:center;">NO DATA</td></tr>`;
        } else {
            topTen.forEach((entry, index) => {
                let rankClass = '';
                let posText = `${index + 1}TH`;

                if (index === 0) { rankClass = 'rank-1'; posText = '1ST'; }
                else if (index === 1) { rankClass = 'rank-2'; posText = '2ND'; }
                else if (index === 2) { rankClass = 'rank-3'; posText = '3RD'; }

                html += `
                    <tr class="${rankClass}">
                        <td>${posText}</td>
                        <td>${entry.name}</td>
                        <td>${entry.score}</td>
                    </tr>
                `;
            });
        }
        tbody.innerHTML = html;
    }


    hideWin() {
        this.htmlWinOverlay.classList.add('add', 'hidden');
        this.htmlWinOverlay.classList.add('hidden');
    }

    // Utilitario para inyectar botones rápidamente
    _createBtn(container, text, className, callback) {
        const btn = document.createElement('button');
        btn.className = className;
        btn.innerText = text;
        btn.style.width = "100%";
        btn.onclick = (e) => {
            e.preventDefault();
            if (callback) callback();
        };
        container.appendChild(btn);
    }

    // Pausa
    showPause() {
        this.htmlPauseOverlay.classList.remove('hidden');
    }

    hidePause() {
        this.htmlPauseOverlay.classList.add('hidden');
    }

    destroy() {
        this.coverContainer.destroy({ children: true });
        this.htmlGameOverOverlay.classList.add('hidden');
        this.htmlWinOverlay.classList.add('hidden');
        this.htmlPauseOverlay.classList.add('hidden');
    }
}