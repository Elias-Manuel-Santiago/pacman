import html from './styles/index.html';
import { updateVisualLeaderboard } from '../engine/LeaderboardStorage.js';


// MenuHTML.js
export class MenuHTML {
    /**
     * @param {HTMLElement} rootContainer - El contenedor principal del DOM (#app-root)
     * @param {Function} onStartGame - Callback ejecutado al enviar el formulario
     */
    constructor(rootContainer, onStartGame) {
        this.root = rootContainer;
        this.onStartGame = onStartGame;
        this.render();
        updateVisualLeaderboard();

        this.initEvents();
    }

    render() {
        this.root.innerHTML = html;
    }


    initEvents() {
        const startScreen = document.getElementById('start-screen');
        const gameLayout = document.getElementById('main-game-layout');
        const themeToggle = document.getElementById('theme-toggle');

        // Formularios independientes
        const formSingle = document.getElementById('form-singleplayer');
        const formVersus = document.getElementById('form-versus');

        // Toggle del Tema Día/Noche (Se mantiene igual)
        themeToggle.addEventListener('click', () => {
            const body = document.body;
            if (body.classList.contains('theme-night')) {
                body.classList.remove('theme-night');
                body.classList.add('theme-day');
            } else {
                body.classList.remove('theme-day');
                body.classList.add('theme-night');
            }
        });

        // Handler común para cambiar la pantalla e iniciar el juego
        const startGameTransition = (gameData) => {
            startScreen.classList.add('hidden');
            gameLayout.classList.remove('hidden');
            this.onStartGame(gameData);
        };

        // Submit de Singleplayer
        formSingle.addEventListener('submit', (e) => {
            e.preventDefault();
            const p1Data = document.getElementById('player1-single').value;

            startGameTransition({
                mode: 'single',
                player1: p1Data,
                player2: ''
            });
        });

        // Submit de 1 VS 1
        formVersus.addEventListener('submit', (e) => {
            e.preventDefault();
            const p1Data = document.getElementById('player1-versus').value;
            const p2Data = document.getElementById('player2-versus').value;

            startGameTransition({
                mode: 'versus',
                player1: p1Data,
                player2: p2Data
            });
        });

    }
}

