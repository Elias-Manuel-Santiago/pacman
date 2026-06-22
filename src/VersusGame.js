// ============================================================
// VersusGame.js — Controlador del Modo Competitivo 1v1
// ============================================================

import { Game } from './Game.js';

export class VersusGame {
    constructor(app, gameSettings, onQuit) {
        this.app = app;
        this.onQuit = onQuit; // Callback para volver al menú principal

        this.player1 = gameSettings.player1 || 'P1';
        this.player2 = gameSettings.player2 || 'P2';

        this.currentLevel = 1;
        this.currentPlayer = 1; // 1 = Jugador 1, 2 = Jugador 2

        // Estructura de almacenamiento para los 5 niveles
        this.scores = {
            p1: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            p2: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };

        this.currentGameInstance = null;

        // Referencias del DOM
        this.overlay = document.getElementById('versus-turn-overlay');
        this.playerTitle = document.getElementById('vs-player-title');
        this.btnReady = document.getElementById('btn-versus-ready');
        this.rightPanel = document.getElementById('right-panel-container');

        this.init();
    }

    init() {
        this.btnReady.onclick = () => {
            this.overlay.classList.add('hidden');
            this.startActiveTurn();
        };

        this.updateScoreboardUI();
        this.showTurnOverlay();
    }

    showTurnOverlay() {
        const activeName = this.currentPlayer === 1 ? this.player1 : this.player2;
        this.playerTitle.innerText = `TURNO DE: ${activeName.toUpperCase()}`;
        this.overlay.classList.remove('hidden');
    }

    startActiveTurn() {
        // Instanciamos el Game.js original de forma limpia
        this.currentGameInstance = new Game(this.app, {
            mode: 'single',
            player1: this.currentPlayer === 1 ? this.player1 : this.player2
        });

        // Forzamos el nivel inicial al nivel del Torneo actual
        this.currentGameInstance.level = this.currentLevel;
        this.currentGameInstance._buildLevel();

        // Interceptamos la finalización de nivel o Game Over (Hooks de captura)
        
        // Caso A: Muere por completo (Game Over)
        this.currentGameInstance.ui.showGameOver = (finalScore) => {
            this.handleRoundEnd(this.currentGameInstance.score);
        };

        // Caso B: Pasa de nivel ganando
        this.currentGameInstance._nextLevel = () => {
            this.handleRoundEnd(this.currentGameInstance.score);
        };

        // Caso C: Completó el juego completo (Nivel 5 Win)
        this.currentGameInstance.ui.showWin = (finalScore) => {
            this.handleRoundEnd(this.currentGameInstance.score);
        };
    }

    handleRoundEnd(scoreObtained) {
        // Guardamos los puntos obtenidos en este nivel para el jugador activo
        if (this.currentPlayer === 1) {
            this.scores.p1[this.currentLevel] = scoreObtained;
            this.cleanCurrentGame();

            // Pasa el turno al Jugador 2 en el mismo nivel
            this.currentPlayer = 2;
            this.updateScoreboardUI();
            this.showTurnOverlay();
        } else {
            this.scores.p2[this.currentLevel] = scoreObtained;
            this.cleanCurrentGame();

            // Si el Jugador 2 termina el Nivel 5, el torneo finaliza por completo
            if (this.currentLevel >= 5) {
                this.endTournament();
            } else {
                // Avanzamos de nivel y vuelve el Jugador 1
                this.currentLevel++;
                this.currentPlayer = 1;
                this.updateScoreboardUI();
                this.showTurnOverlay();
            }
        }
    }

    cleanCurrentGame() {
        if (this.currentGameInstance) {
            this.currentGameInstance.destroy();
            this.currentGameInstance = null;
        }
    }

    getTotalScore(playerKey) {
        return Object.values(this.scores[playerKey]).reduce((sum, current) => sum + current, 0);
    }

    updateScoreboardUI() {
        let rowsHtml = '';
        for (let i = 1; i <= 5; i++) {
            const isCurrent = i === this.currentLevel ? 'class="active-lvl-row"' : '';
            rowsHtml += `
                <tr ${isCurrent}>
                    <td>LVL ${i}</td>
                    <td>${this.scores.p1[i]}</td>
                    <td>${this.scores.p2[i]}</td>
                </tr>
            `;
        }

        const totalP1 = this.getTotalScore('p1');
        const totalP2 = this.getTotalScore('p2');

        this.rightPanel.innerHTML = `
            <h2 class="panel-title">PUNTOS 1VS1</h2>
            <table class="versus-table">
                <thead>
                    <tr>
                        <th>NIVEL</th>
                        <th>${this.player1.toUpperCase()}</th>
                        <th>${this.player2.toUpperCase()}</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                    <tr class="total-row">
                        <td>TOTAL</td>
                        <td>${totalP1}</td>
                        <td>${totalP2}</td>
                    </tr>
                </tbody>
            </table>
            <button id="btn-abort-tournament" class="btn-end-tournament">TERMINAR TORNEO</button>
        `;

        // Botón manual para terminar el torneo en cualquier momento
        document.getElementById('btn-abort-tournament').onclick = () => {
            this.endTournament();
        };
    }

    endTournament() {
        this.cleanCurrentGame();
        this.overlay.classList.add('hidden');

        const totalP1 = this.getTotalScore('p1');
        const totalP2 = this.getTotalScore('p2');

        let endMessage = '';
        if (totalP1 > totalP2) {
            endMessage = `¡GANADOR: ${this.player1.toUpperCase()}!\n\n${totalP1} PTS frente a ${totalP2} PTS.`;
        } else if (totalP2 > totalP1) {
            endMessage = `¡GANADOR: ${this.player2.toUpperCase()}!\n\n${totalP2} PTS frente a ${totalP1} PTS.`;
        } else {
            endMessage = `¡EMPATE EMOCIONANTE!\n\nAmbos consiguieron ${totalP1} PTS.`;
        }

        this.onQuit();
    }
}