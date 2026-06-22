// main.js
import { Application } from 'pixi.js';
import { Game } from './Game.js';
import { injectRetroStyles } from './stylesManager.js';
import { MenuHTML } from './MenuHTML.js';

(async () => {
    // 1. Inyectamos los estilos CSS dinámicos en el head
    injectRetroStyles();

    const rootElement = document.getElementById('app-root');

    // 2. Cargamos el menú HTML de Login en la pantalla
    new MenuHTML(rootElement, async (gameSettings) => {

        // Este callback corre una vez que el usuario clickea "JUGAR"
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

        // Ahora el div 'pixi-game' ya existe de forma segura en el DOM
        document.getElementById('pixi-game').appendChild(app.canvas);


        // Pasamos la configuración al juego si la necesitamos (Modo, Nombres)
        const game = new Game(app, gameSettings);
        window.addEventListener('resize', () => {
            game._resize();
        });

        game._resize();
    });
})();