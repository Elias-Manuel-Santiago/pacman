export    const SPRITE_TILE_SIZE = 8;


export const tileMapping = {
    1: { cx: 2, cy: 0 }, // Casa este
    2: { cx: 3, cy: 0 }, // Casa oeste
    4: { cx: 10, cy: 0 }, // Casa norte
    5: { cx: 13, cy: 1 }, // Casa sureste
    6: { cx: 12, cy: 1 }, // Casa suroeste
    7: { cx: 15, cy: 1 }, // Casa noreste
    8: { cx: 14, cy: 1 }, // Casa noroeste

    208: { cx: 7, cy: 2 }, // Este, Sur, Sureste
    248: { cx: 14, cy: 0 }, // Este, Sur, Sureste, Oeste, Suroeste
    104: { cx: 6, cy: 2 }, //Este, Sur, Suroeste
    214: { cx: 9, cy: 1 }, // Norte, noreste, este,sur, sureste
    107: { cx: 8, cy: 1 }, // Noroeste, norte, oeste, suroeste, sur
    22: { cx: 11, cy: 1 }, // Norte, noreste, este
    31: { cx: 4, cy: 1 }, // Oeste, Noroeste, norte, noreste, este
    11: { cx: 8, cy: 2 }, // Noroeste, norte, oeste
    215: { cx: 9, cy: 1 }, // Noroeste, norte, noreste, este, sur, sureste
    111: { cx: 8, cy: 1 }, // Noroeste, norte, oeste, sur, suroeste, noreste
    254: { cx: 5, cy: 2 }, // Todo menos noreste
    252: { cx: 14, cy: 0 }, // Todo menos norte y noroeste
    246: { cx: 9, cy: 1 }, // Todo menos noroeste y oeste
    235: { cx: 8, cy: 1 }, // Todo menos noreste y este
    249: { cx: 14, cy: 0 }, // Todo menos norte y noreste
    159: { cx: 4, cy: 1 }, // Todo menos suroeste y sur
    223: { cx: 3, cy: 2 }, // Todo menos suroeste
    127: { cx: 2, cy: 2 }, // Todo menos sureste
    63: { cx: 4, cy: 1 }, // Todo menos sureste y sur



    255: { cx: 12, cy: 2 }, // Vacio
};

export const tileMappingBorder = {
    151: { cx: 4, cy: 0 }, // Suroeste, sureste, noreste, sur, este
    91: { cx: 5, cy: 0 }, // Noroeste, oeste, suroeste, sur, sureste
    174: { cx: 0, cy: 0 }, // Noroeste, norte, noreste, este, sureste
    109: { cx: 1, cy: 0 }, // Suroeste, oeste, noroeste, norte, noreste
    19: { cx: 12, cy: 0 }, //Suroeste, sureste, sur
    44: { cx: 10, cy: 0 }, //Noroeste, noreste, norte
    73: { cx: 3, cy: 0 }, //Noroeste,oeste, suroeste
    134: { cx: 2, cy: 0 }, //Noreste,este, sureste
    1: { cx: 6, cy: 2 }, // Suroeste
    2: { cx: 7, cy: 2 }, // Sureste
    17: { cx: 12, cy: 0 }, // Suroeste, sur
    18: { cx: 12, cy: 0 }, // Sureste, sur
    65: { cx: 3, cy: 0 }, // Oeste, suroeste
    65: { cx: 3, cy: 0 }, // Oeste, suroeste
    72: { cx: 3, cy: 0 }, // Oeste, noroeste
    40: { cx: 11, cy: 0 }, // Norte, noroeste
    8: { cx: 10, cy: 1 }, // Noroeste
    2: { cx: 7, cy: 1 }, // Sureste
    4: { cx: 11, cy: 1 }, // Noreste
    130: { cx: 2, cy: 0 }, // Este, sureste
    132: { cx: 2, cy: 0 }, // Este, noreste
    36: { cx: 11, cy: 0 }, // Norte, noreste
    46: { cx: 11, cy: 0 }, // Norte, noreste, noroeste, sureste
    23: { cx: 12, cy: 0 }, // Sur, suroeste, sureste, noreste
    190: { cx: 11, cy: 0 }, // Todo menos oeste y suroeste
    183: { cx: 12, cy: 0 }, // Todo menos oeste y noroeste
    45: { cx: 11, cy: 0 }, // Norte, noreste, noroeste, suroeste
    125: { cx: 11, cy: 0 }, // Todo menos este y sureste
    27: { cx: 12, cy: 0 }, // Sur, sureste, suroeste, noroeste
    123: { cx: 12, cy: 0 }, // Todo menos este y noreste

    200: { cx: 9, cy: 0 },
    201: { cx: 7, cy: 0 },
    202: { cx: 6, cy: 0 },
    203: { cx: 8, cy: 0 },
    204: { cx: 11, cy: 2 },
    205: { cx: 10, cy: 2 },
    206: { cx: 6, cy: 0 },
    207: { cx: 7, cy: 0 },

    256: { cx: 12, cy: 2 },

}