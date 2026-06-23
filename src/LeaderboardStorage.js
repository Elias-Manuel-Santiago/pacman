// ============================================================
// LeaderboardStorage.js — Gestión de Persistencia de Datos
// ============================================================
import { UI } from "./UI.js";


const LOCAL_STORAGE_KEY = 'pacman_leaderboard';

/**
 * Obtiene la lista completa de jugadores y puntajes guardados.
 * @returns {Array<{name: string, score: number}>}
 */
export function getLeaderboard() {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * Guarda la lista en el localStorage.
 * @param {Array} leaderboard 
 */
function saveLeaderboard(leaderboard) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leaderboard));
}

export function updateVisualLeaderboard() {

    console.log("a");
    const tbody = document.querySelector('#top_ranking .leaderboard-table tbody');
    if (!tbody) return;

    console.log(getLeaderboard());
    const leaderboardData = getLeaderboard();
    // Tomamos únicamente los 10 primeros registros para el Top 10 visual
    const topTen = leaderboardData.slice(0, 10);
    let html = '';

    if (topTen.length === 0) {
        html = `<tr><td colspan="3" style="text-align:center;">NO DATA</td></tr>`;
    } else {
        topTen.forEach((entry, index) => {
            let rankClass = '';
            let posText = `${index + 1}TH`;
            
            if (index === 0) { rankClass = 'rank-1'; posText = '1ST'; }
            else if (index === 1) { rankClass = 'rank-2'; posText = '2ND'; }
            else if (index === 2) { rankClass = 'rank-3'; posText = '3RD'; }

            html += `
                <tr class="${rankClass}">
                    <td>${posText}</td>
                    <td>${entry.name}</td>
                    <td>${entry.score}</td>
                </tr>
            `;
        });
    }
    tbody.innerHTML = html;
}
/**
 * Registra o actualiza la puntuación de un jugador en singleplayer.
 * @param {string} name - Nombre del jugador.
 * @param {number} score - Puntuación obtenida.
 * @returns {boolean} Devuelve true si el puntaje superó el récord previo del jugador (o es nuevo).
 */
export function submitSingleplayerScore(name, score) {
    if (!name) return false;
    
    const leaderboard = getLeaderboard();
    const formattedName = name.trim().toUpperCase();
    
    const existingEntry = leaderboard.find(entry => entry.name === formattedName);
    let isNewRecord = false;

    if (existingEntry) {
        if (score > existingEntry.score) {
            existingEntry.score = score;
            isNewRecord = true;
        }
    } else {
        leaderboard.push({ name: formattedName, score: score });
        isNewRecord = true; // El primer registro cuenta como récord
    }

    // Ordenamos la lista de mayor a menor puntuación de forma persistente
    leaderboard.sort((a, b) => b.score - a.score);
    saveLeaderboard(leaderboard);
    
    return isNewRecord;
}