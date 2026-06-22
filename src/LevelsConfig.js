import * as mapa1 from './mapas/mapalvl1.js';
import * as mapa2 from './mapas/mapalvl2.js';
import * as mapa3 from './mapas/mapalvl3.js';
import * as mapa4 from './mapas/mapalvl4.js';
import * as mapa5 from './mapas/mapalvl5.js';
import { MOVE_INTERVAL_GHOST, MOVE_INTERVAL_GHOST_FAST } from './Grid.js';


export const LEVEL_CONFIGS = {
    1: {
        ghostCount: 2,
        pelletMode: 'full',
        ghostMoveInterval: MOVE_INTERVAL_GHOST,
        map: mapa1,
    },
    2: {
        ghostCount: 3,
        pelletMode: 'full',
        ghostMoveInterval: MOVE_INTERVAL_GHOST,
        map: mapa2,
    },
    3: {
        ghostCount: 4,
        pelletMode: 'half',
        ghostMoveInterval: MOVE_INTERVAL_GHOST,
        map: mapa3,
    },
    4: {
        ghostCount: 4,
        pelletMode: 'none',
        ghostMoveInterval: MOVE_INTERVAL_GHOST,
        map: mapa4,
    },
    5: {
        ghostCount: 4,
        pelletMode: 'full',
        ghostMoveInterval: MOVE_INTERVAL_GHOST_FAST,
        map: mapa5,

    },
};