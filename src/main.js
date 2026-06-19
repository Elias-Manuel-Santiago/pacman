// ============================================================
// main.js — Punto de entrada de la aplicación
// ============================================================

import { Application } from 'pixi.js';
import { Game } from './Game.js';

(async () => {
    const app = new Application();

    await app.init({
        background: 0x000000,
        width: 320,
        height: 180,
        resizeTo: window,
        roundPixels: true,
        antialias: false,
    });
    app.canvas.style.imageRendering = 'pixelated';
    app.canvas.style.webkitImageRendering = 'pixelated';

    document.getElementById('pixi-container').appendChild(app.canvas);

    const game = new Game(app);

    const resize = () => game._resize();
    app.renderer.on('resize', resize);
    resize();
})();
