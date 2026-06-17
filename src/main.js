// ============================================================
// main.js — Punto de entrada de la aplicación
// ============================================================
// Inicializa PixiJS con las dimensiones fijas del juego
// y crea la instancia de Game.
//
// El canvas tiene tamaño fijo derivado de la grilla (ver Grid.js).
// El centrado en pantalla se puede controlar con CSS en el HTML.

import { Application } from 'pixi.js';
import { Game }        from './Game.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, UI_HEIGHT } from './Grid.js';

(async () => {
    const app = new Application();

    await app.init({
        background: 0x000000,
        antialias:  true,
        resizeTo:   window,
    });

    document.getElementById('pixi-container').appendChild(app.canvas);

    const GAME_WIDTH  = CANVAS_WIDTH;
    const GAME_HEIGHT = CANVAS_HEIGHT + UI_HEIGHT;

    const resize = () => {
        const scaleX = app.screen.width  / GAME_WIDTH;
        const scaleY = app.screen.height / GAME_HEIGHT;
        const scale  = Math.min(scaleX, scaleY); // mantener proporciones

        app.stage.scale.set(scale);
        app.stage.x = (app.screen.width  - GAME_WIDTH  * scale) / 2;
        app.stage.y = (app.screen.height - GAME_HEIGHT * scale) / 2;
    };

    app.renderer.on('resize', resize);
    resize();

    new Game(app);
})();