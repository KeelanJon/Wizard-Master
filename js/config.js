/** World size, view, colours, combat tuning — tweak balance here. */
export const SAVE_KEY = "coinQuestSaveV1";

export const TILE = 16;
export const MAP_W = 200;
export const MAP_H = 200;
export const VIEW_W = 320;
export const VIEW_H = 200;

/** Seconds between spell casts at base upgrade level (higher = slower). */
export const SPELL_CD = 1.38;

/** Fireball skill */
export const FIREBALL_CD      = 6.0;   // seconds per cast
export const FIREBALL_SPEED   = 52;    // px / s  (slower than spell bolt)
export const FIREBALL_BLAST_R = 40;    // AOE explosion radius in px
export const FIREBALL_RANGE   = 300;   // max travel before detonating
export const SPELL_SPEED = 82;
export const SPELL_ACQUIRE_RANGE = 252;
export const SPELL_MAX_RANGE = 300;
export const PROJ_HIT_R = 13;

export const COL = {
  void:      "#120a18",
  grass1:    "#2d6a4f",
  grass2:    "#40916c",
  darkgrass1:"#1a4a2e",
  darkgrass2:"#235c38",
  water1:    "#1a5c8c",
  water2:    "#1e6fa8",
  sand1:     "#b8964a",
  sand2:     "#c9a84c",
  path:      "#6b5a4a",
  stoneWall1:"#4a4a56",
  stoneWall2:"#585862",
  stoneFloor1:"#78788a",
  stoneFloor2:"#8a8a9c",
  uiBg:      "#1a1025",
};
