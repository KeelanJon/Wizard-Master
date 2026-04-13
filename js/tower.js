import { TILE } from "./config.js";
import { state } from "./state.js";
import { showToast } from "./ui.js";

/** Overworld tower (tiles). Stone shell; foyer + porch walkable. */
export const TOWER_OW = {
  wallX0:  98,
  wallX1:  102,
  wallYTop: 121,
  wallYMid: 123,
  foyerY0:  124,
  foyerY1:  125,
  foyerX0:  99,
  foyerX1:  101,
  porchY:   126,
  porchX0:  99,
  porchX1:  101,
  owExitX: 100 * TILE + TILE / 2,
  owExitY: 127 * TILE + TILE * 0.65,
};

/** Interior 12×9 tiles. */
export const TOWER_IN = {
  W: 12,
  H: 9,
  spawnX: 6 * TILE + TILE / 2,
  spawnY: 5 * TILE + TILE / 2,
  exitDoorX0: 5,
  exitDoorX1: 6,
  exitRowY: 8,
};

export const WIZARD_MASTER = {
  x: 6 * TILE + TILE / 2,
  y: 3 * TILE + TILE / 2,
  talkR: 38,
};

function playerTileCoords(px, py) {
  return { tx: Math.floor(px / TILE), ty: Math.floor(py / TILE) };
}

/** True = unwalkable stone on overworld tower structure. */
export function isOverworldTowerSolid(tx, ty) {
  const T = TOWER_OW;
  if (tx < T.wallX0 || tx > T.wallX1 || ty < T.wallYTop || ty > T.porchY) return false;
  if (ty <= T.wallYMid) return true;
  if (ty >= T.foyerY0 && ty <= T.foyerY1 && tx >= T.foyerX0 && tx <= T.foyerX1) return false;
  if (ty === T.porchY && tx >= T.porchX0 && tx <= T.porchX1) return false;
  if (ty >= T.foyerY0 && ty <= T.porchY) return tx === T.wallX0 || tx === T.wallX1;
  return false;
}

export function overworldTowerTileType(tx, ty) {
  if (isOverworldTowerSolid(tx, ty)) return "tower_stone";
  const T = TOWER_OW;
  if (ty >= T.foyerY0 && ty <= T.foyerY1 && tx >= T.foyerX0 && tx <= T.foyerX1) return "tower_foyer";
  if (ty === T.porchY && tx >= T.porchX0 && tx <= T.porchX1) return "tower_porch";
  return null;
}

export function canEnterTower(px, py) {
  if (state.scene !== "overworld") return false;
  const { tx, ty } = playerTileCoords(px, py);
  const T = TOWER_OW;
  const inFoyer =
    ty >= T.foyerY0 && ty <= T.foyerY1 && tx >= T.foyerX0 && tx <= T.foyerX1;
  const onPorch = ty === T.porchY && tx >= T.porchX0 && tx <= T.porchX1;
  return inFoyer || onPorch;
}

export function canExitTower(px, py) {
  if (state.scene !== "tower") return false;
  const { tx, ty } = playerTileCoords(px, py);
  const I = TOWER_IN;
  if (ty < I.exitRowY - 1 || ty > I.exitRowY) return false;
  return tx >= I.exitDoorX0 - 1 && tx <= I.exitDoorX1 + 1;
}

export function nearWizardMaster(px, py) {
  if (state.scene !== "tower") return false;
  const dx = px - WIZARD_MASTER.x;
  const dy = py - WIZARD_MASTER.y;
  return Math.hypot(dx, dy) < WIZARD_MASTER.talkR;
}

export function enterTower() {
  if (state.scene !== "overworld" || state.transitionCooldown > 0) return;
  if (state.fade.dir !== 0 || state.fade.alpha > 0) return;
  // Lock out re-triggers for the duration of the full fade cycle
  state.transitionCooldown = 1.4;
  state.fade.alpha = 0;
  state.fade.dir = 1;
  state.fade.cb = () => {
    state.scene = "tower";
    state.player.x = TOWER_IN.spawnX;
    state.player.y = TOWER_IN.spawnY;
    state.player.vx = 0;
    state.player.vy = 0;
    state.projectiles.length = 0;
    showToast("Wizard's tower — warm and quiet.");
  };
}

export function exitTower() {
  if (state.scene !== "tower" || state.transitionCooldown > 0) return;
  if (state.fade.dir !== 0 || state.fade.alpha > 0) return;
  state.transitionCooldown = 1.4;
  state.fade.alpha = 0;
  state.fade.dir = 1;
  state.fade.cb = () => {
    state.scene = "overworld";
    state.player.x = TOWER_OW.owExitX;
    state.player.y = TOWER_OW.owExitY;
    state.player.vx = 0;
    state.player.vy = 0;
    showToast("Back to the wilds.");
  };
}
