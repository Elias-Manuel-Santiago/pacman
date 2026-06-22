// main.js
import { Application } from 'pixi.js';
import { Game } from './Game.js';
import { injectRetroStyles } from './stylesManager.js';
import { MenuHTML } from './MenuHTML.js';
import { VersusGame } from './VersusGame.js'; // Importamos el módulo nuevo

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
            // Inicializar el controlador del torneo 1v1
            document.getElementById('top_ranking').classList.add('hidden');
            const versusSession = new VersusGame(app, gameSettings, () => {
                // Al terminar el torneo, limpiamos y recargamos para volver al menú inicial
                location.reload();
            });

            window.addEventListener('resize', () => {
                if (versusSession.currentGameInstance) versusSession.currentGameInstance._resize();
            });
        } else {
            // Modo Singleplayer por defecto
            const game = new Game(app, gameSettings);
            window.addEventListener('resize', () => {
                game._resize();
            });
            game._resize();
        }
    });
})();