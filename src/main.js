// main.js
import { Application } from 'pixi.js';
import { Game } from './Game.js';
import { injectRetroStyles } from './stylesManager.js';
import { MenuHTML } from './MenuHTML.js';
import { VersusGame } from './VersusGame.js';
import { DJ, SOUND_GROUP } from './DJ.js';
// IMPORTAMOS EL NUEVO ALMACENAMIENTO DE DATOS
import { updateVisualLeaderboard, submitSingleplayerScore } from './LeaderboardStorage.js';

const levelThemeUrl = new URL('./sfx/level-theme.mp3', import.meta.url).href;

DJ.registerMany({
    'level-theme': { src: levelThemeUrl, group: SOUND_GROUP.MUSIC, loop: true, volume: 0.7 },
});

(async () => {
    injectRetroStyles();
    const rootElement = document.getElementById('app-root');

    new MenuHTML(rootElement, async (gameSettings) => {


        const app = new Application();

        await app.init({
            background: 0x000000,
            width: 320,
            height: 180,
            resizeTo: document.getElementById('pixi-game'),
            roundPixels: true,
            antialias: false,
        });

        app.canvas.style.imageRendering = 'pixelated';
        app.canvas.style.webkitImageRendering = 'pixelated';
        app.canvas.style.maxWidth = '100%';
        app.canvas.style.maxHeight = '100%';

        document.getElementById('pixi-game').appendChild(app.canvas);

        // EVALUACIÓN DE MODO DE JUEGO
        if (gameSettings.mode === 'versus') {
            document.getElementById('top_ranking').classList.add('hidden');

            const versusSession = new VersusGame(app, gameSettings, () => {
                location.reload();
            });

            window.addEventListener('resize', () => {
                if (versusSession.currentGameInstance) versusSession.currentGameInstance._resize();
            });
        } else {
            // MODO SINGLEPLAYER
            document.getElementById('top_ranking').classList.remove('hidden');

            const title = document.getElementById('vs-player-title');
            const subtitle = document.getElementById('vs-player-subtitle');
            const overlay = document.getElementById('versus-turn-overlay');
            const btnReady = document.getElementById('btn-versus-ready');

            title.innerText = "¡PREPÁRATE!";
            subtitle.innerText = "PRESIONA EL BOTÓN PARA EMPEZAR LA PARTIDA";
            overlay.classList.remove('hidden');

            btnReady.onclick = () => {
                overlay.classList.add('hidden');

                const game = new Game(app, {
                    isVersus: false,
                    player1: gameSettings.player1,
                    onQuitCallback: () => {
                        document.getElementById('main-game-layout').classList.add('hidden');
                        document.getElementById('start-screen').classList.remove('hidden');
                        game.destroy();
                        app.destroy(true, { children: true, texture: true, baseTexture: true });
                        document.getElementById('pixi-game').innerHTML = '';
                    }
                });

                // Renderizado inicial de la tabla utilizando la UI del juego recién creado
                updateVisualLeaderboard();

                // Interceptamos la llamada a GameOver de la instancia de Game
                const originalShowGameOver = game.ui.showGameOver.bind(game.ui);
                game.ui.showGameOver = (score, isVersus, isFinalTournament, actions) => {
                    let isNewRecord = false;
                    if (!isVersus) {
                        // Guardamos datos en storage de forma limpia
                        isNewRecord = submitSingleplayerScore(gameSettings.player1, score);
                        // Refrescamos la UI visual con todos los registros actualizados
                        updateVisualLeaderboard();
                    }
                    // Le enviamos el resultado a la UI para saber si añade el cartel parpadeante
                    originalShowGameOver(score, isVersus, isFinalTournament, actions, isNewRecord);
                };

                // Interceptamos la llamada a Win de la instancia de Game
                const originalShowWin = game.ui.showWin.bind(game.ui);
                game.ui.showWin = (score, isVersus, isFinalTournament, isMaxLevel, actions) => {
                    let isNewRecord = false;
                    if (!isVersus) {
                        isNewRecord = submitSingleplayerScore(gameSettings.player1, score);
                        game.ui.renderLeaderboard(getLeaderboard());
                    }
                    originalShowWin(score, isVersus, isFinalTournament, isMaxLevel, actions, isNewRecord);
                };
            }
        }
    });
})();
