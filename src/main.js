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
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './Grid.js';

(async () => {
    const app = new Application();

    await app.init({
        width:      CANVAS_WIDTH,
        height:     CANVAS_HEIGHT,
        background: 0x000000,
        antialias:  true,
    });

    document.getElementById('pixi-container').appendChild(app.canvas);

    new Game(app);
})();
