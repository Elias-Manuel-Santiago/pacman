import * as mapa1 from './mapas/mapalvl1.js';



export const LEVEL_CONFIGS = {
    1: { 
        ghostCount: 2, pelletMode: 'full', 
        ghostMoveInterval: MOVE_INTERVAL_GHOST,
        map = mapa1,
    },
    2: { ghostCount: 3, pelletMode: 'full', ghostMoveInterval: MOVE_INTERVAL_GHOST },
    3: { ghostCount: 4, pelletMode: 'half', ghostMoveInterval: MOVE_INTERVAL_GHOST },
    4: { ghostCount: 4, pelletMode: 'none', ghostMoveInterval: MOVE_INTERVAL_GHOST },
    5: { ghostCount: 4, pelletMode: 'full', ghostMoveInterval: MOVE_INTERVAL_GHOST_FAST },
};