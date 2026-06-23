import style from './styles/style.css';

// stylesManager.js
export function injectRetroStyles() {
    if (document.getElementById('pacman-retro-styles')) return;

    const styleElement = document.createElement('style');
    styleElement.id = 'pacman-retro-styles';
    styleElement.textContent = style;
    document.head.appendChild(styleElement);
}