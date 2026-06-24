// main.js
import { Application } from 'pixi.js';
import { Game } from './engine/Game.js';
import { injectRetroStyles } from './UI/stylesManager.js';
import { MenuHTML } from './UI/menuHTML.js';
import { VersusGame } from './engine/VersusGame.js';
import { DJ, SOUND_GROUP } from './sfx/DJ.js';
import { updateVisualLeaderboard, submitSingleplayerScore } from './engine/LeaderboardStorage.js';

// Solo importamos el archivo que sabemos que existe físicamente en la carpeta sfx/
const levelThemeUrl = new URL('./sfx/level-theme.mp3', import.meta.url).href;

// COMENTADOS: Cuando se agreguen estos archivos a la carpeta src/sfx/, descomentar las líneas:
// const eatSfxUrl = new URL('./sfx/eat.ogg', import.meta.url).href;
// const levelUpSfxUrl = new URL('./sfx/levelup.wav', import.meta.url).href;
// const move1Url = new URL('./sfx/move1.wav', import.meta.url).href;
// const move2Url = new URL('./sfx/move2.wav', import.meta.url).href;
// const move3Url = new URL('./sfx/move3.wav', import.meta.url).href;
// const menuClick = new URL('./sfx/menuClick.wav', import.meta.url).href;
// const win = new URL('./sfx/win.wav', import.meta.url).href;
// const gameOver = new URL('./sfx/gameOver.wav', import.meta.url).href;

DJ.registerMany({
    // Mapeo de nombres exactos que solicita Game.js. Se usa '' (vacío) como fuente para que Webpack compile sin errores.
    'orb': {src: '', group: SOUND_GROUP.SFX, loop: false, volume: 0.5},
    'pellet': {src: '', group: SOUND_GROUP.SFX, loop: false, volume: 0.5},
    'ghost-eaten': {src: '', group: SOUND_GROUP.SFX, loop: false, volume: 0.6},
    'death': {src: '', group: SOUND_GROUP.SFX, loop: false, volume: 0.7},
    'game-over': {src: '', group: SOUND_GROUP.SFX, loop: false, volume: 0.7},
    'level-clear': {src: '', group: SOUND_GROUP.SFX, loop: false, volume: 0.7},
    'win': {src: '', group: SOUND_GROUP.SFX, loop: false, volume: 0.7},
    'level-theme': { src: levelThemeUrl, group: SOUND_GROUP.MUSIC, loop: true, volume: 0.7 },
    
    'eat': {src: '', group: SOUND_GROUP.SFX, loop: false, volume: 0.5},
    'levelup': {src: '', group: SOUND_GROUP.SFX, loop: false, volume: 0.7},
    'move1': {src: '', group: SOUND_GROUP.SFX, loop: false, volume: 0.2},
    'move2': {src: '', group: SOUND_GROUP.SFX, loop: false, volume: 0.2},
    'move3': {src: '', group: SOUND_GROUP.SFX, loop: false, volume: 0.2},
    'menuClick': {src: '', group: SOUND_GROUP.SFX, loop: false, volume: 0.2},
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

                // Desbloquear AudioContext en dispositivos móviles
                if (typeof DJ.resume === 'function') {
                    DJ.resume();
                } else if (DJ.ctx && typeof DJ.ctx.resume === 'function') {
                    DJ.ctx.resume();
                }

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

                window.addEventListener('resize', () => {
                    game._resize();
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
                        updateVisualLeaderboard();
                    }
                    originalShowWin(score, isVersus, isFinalTournament, isMaxLevel, actions, isNewRecord);
                };
            }
        }
    });
})();