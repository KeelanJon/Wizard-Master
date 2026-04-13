import { TILE, MAP_W, MAP_H } from "./config.js";
import { state } from "./state.js";
import { overworldTowerTileType, TOWER_IN } from "./tower.js";

// --- Terrain tile IDs (internal) ---
const T_GRASS      = 0;
const T_DARKGRASS  = 1;
const T_WATER      = 2;
const T_SAND       = 3;
const T_STONE_WALL = 4;
const T_PATH       = 5;
const T_STONE_FLOOR= 6;

const TILE_STR = ["grass1", "grass2", "water", "sand", "stone_wall", "path", "stone_floor"];

// --- World anchor points (tile coords) ---
export const WORLD_SPAWN_TX = Math.round(MAP_W * 0.5);   // 100
export const WORLD_SPAWN_TY = Math.round(MAP_H * 0.65);  // 130

export const LANDMARKS = {
  ruins:   { tx: 40,  ty: 50,  name: "Ancient Ruins"     },
  shrine:  { tx: 162, ty: 58,  name: "Forest Shrine"     },
  village: { tx: 130, ty: 145, name: "Riverside Village"  },
};

// Tower tile positions (must match TOWER_OW in tower.js)
const TOWER_WALL_TX = 98;
const TOWER_WALL_TY = 121;
const TOWER_CENTER_TX = 100;
const TOWER_PORCH_TY  = 126;

// --- Deterministic noise ---
function hash2d(ix, iy) {
  let h = Math.imul(ix ^ 0x1234, 0x9e3779b9) ^ Math.imul(iy ^ 0x5678, 0x6b43a9cb);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 0x100000000;
}

function smoothstep(t) { return t * t * (3 - 2 * t); }

function valueNoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = smoothstep(fx), sy = smoothstep(fy);
  const a = hash2d(ix,     iy);
  const b = hash2d(ix + 1, iy);
  const c = hash2d(ix,     iy + 1);
  const d = hash2d(ix + 1, iy + 1);
  return a + (b - a) * sx + (c - a) * sy + (b + d - c - a) * sx * sy;
}

function fbm(x, y, oct) {
  let v = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < oct; i++) {
    v   += valueNoise(x * freq, y * freq) * amp;
    max += amp;
    amp  *= 0.5;
    freq *= 2;
  }
  return v / max;
}

// --- Pre-generated terrain grid ---
const grid = new Uint8Array(MAP_W * MAP_H);

(function initWorld() {
  const elevScale  = 0.028;
  const moistScale = 0.042;

  // Base terrain from noise
  for (let ty = 0; ty < MAP_H; ty++) {
    for (let tx = 0; tx < MAP_W; tx++) {
      const elev  = fbm(tx * elevScale,           ty * elevScale,           5);
      const moist = fbm((tx + 400) * moistScale,  (ty + 300) * moistScale,  4);
      let tile;
      if      (elev < 0.30)  tile = T_WATER;
      else if (elev < 0.35)  tile = T_SAND;
      else if (moist > 0.62) tile = T_DARKGRASS;
      else                   tile = T_GRASS;
      grid[ty * MAP_W + tx] = tile;
    }
  }

  // Clear a circle to grass around a tile centre
  function clearCircle(cx, cy, r) {
    for (let ty = cy - r; ty <= cy + r; ty++) {
      for (let tx = cx - r; tx <= cx + r; tx++) {
        if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
        if (Math.hypot(tx - cx, ty - cy) <= r) grid[ty * MAP_W + tx] = T_GRASS;
      }
    }
  }

  // Safe zone around player spawn
  clearCircle(WORLD_SPAWN_TX, WORLD_SPAWN_TY, 12);

  // Tower footprint — rectangular clear
  for (let ty = TOWER_WALL_TY - 2; ty <= TOWER_WALL_TY + 10; ty++) {
    for (let tx = TOWER_WALL_TX - 2; tx <= TOWER_WALL_TX + 8; tx++) {
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
      grid[ty * MAP_W + tx] = T_GRASS;
    }
  }

  // Landmark clearings
  clearCircle(LANDMARKS.ruins.tx,   LANDMARKS.ruins.ty,   7);
  clearCircle(LANDMARKS.shrine.tx,  LANDMARKS.shrine.ty,  5);
  clearCircle(LANDMARKS.village.tx, LANDMARKS.village.ty, 8);

  // Carve dirt paths (1-tile wide, skips water)
  function carvePath(x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 0; i <= steps; i++) {
      const t  = steps ? i / steps : 0;
      const cx = Math.round(x0 + dx * t);
      const cy = Math.round(y0 + dy * t);
      // Plus-shaped 1-wide brush
      for (const [ox, oy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = cx + ox, ny = cy + oy;
        if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
        if (grid[ny * MAP_W + nx] !== T_WATER) grid[ny * MAP_W + nx] = T_PATH;
      }
    }
  }

  const spX = WORLD_SPAWN_TX, spY = WORLD_SPAWN_TY;
  const tX = TOWER_CENTER_TX,  tY = TOWER_PORCH_TY;
  const { ruins: r, shrine: sh, village: v } = LANDMARKS;

  carvePath(spX, spY, tX, tY);
  carvePath(spX, spY, v.tx, v.ty);
  carvePath(tX,  tY,  r.tx, r.ty);
  carvePath(tX,  tY,  sh.tx, sh.ty);
  carvePath(v.tx, v.ty, r.tx, r.ty);

  // --- Ancient Ruins: partial stone-wall outline, stone-floor interior ---
  const rW = 4, rH = 3;
  for (let dy = -rH; dy <= rH; dy++) {
    for (let dx = -rW; dx <= rW; dx++) {
      const tx = r.tx + dx, ty = r.ty + dy;
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
      const isEdge = Math.abs(dx) === rW || Math.abs(dy) === rH;
      if (!isEdge) {
        grid[ty * MAP_W + tx] = T_STONE_FLOOR;
      } else if (hash2d(tx, ty + 11) > 0.45) {
        // Deterministic gaps in walls give a "ruined" look
        grid[ty * MAP_W + tx] = T_STONE_WALL;
      }
    }
  }

  // --- Forest Shrine: stone-floor disc + partial wall ring ---
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const tx = sh.tx + dx, ty = sh.ty + dy;
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
      const d = Math.hypot(dx, dy);
      if (d <= 2.5) {
        grid[ty * MAP_W + tx] = T_STONE_FLOOR;
      } else if (d > 3.2 && d <= 4.2 && hash2d(tx + 7, ty + 3) > 0.50) {
        grid[ty * MAP_W + tx] = T_STONE_WALL;
      }
    }
  }

  // --- Riverside Village: path plaza + stone-floor building footprints (no walls = no obstacles) ---
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const tx = v.tx + dx, ty = v.ty + dy;
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
      grid[ty * MAP_W + tx] = T_PATH;
    }
  }
  // Building footprints (stone_floor, all walkable)
  const huts = [
    { dx: -5, dy: -3, w: 3, h: 3 },
    { dx:  3, dy: -3, w: 3, h: 3 },
    { dx: -1, dy:  2, w: 3, h: 3 },
  ];
  for (const hut of huts) {
    for (let row = 0; row < hut.h; row++) {
      for (let col = 0; col < hut.w; col++) {
        const tx = v.tx + hut.dx + col, ty = v.ty + hut.dy + row;
        if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) continue;
        grid[ty * MAP_W + tx] = T_STONE_FLOOR;
      }
    }
  }
})();

// --- Tile type accessors ---
function overworldTileAt(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return "void";
  const tt = overworldTowerTileType(tx, ty);
  if (tt) return tt;
  return TILE_STR[grid[ty * MAP_W + tx]];
}

function interiorTileAt(tx, ty) {
  const W = TOWER_IN.W;
  const H = TOWER_IN.H;
  if (tx < 0 || ty < 0 || tx >= W || ty >= H) return "void";

  const doorY = TOWER_IN.exitRowY;
  const d0    = TOWER_IN.exitDoorX0;
  const d1    = TOWER_IN.exitDoorX1;

  if (ty === 0 || tx === 0 || tx === W - 1) return "tower_wall_in";
  if (ty === doorY) {
    if (tx >= d0 && tx <= d1) return "tower_door_floor";
    return "tower_wall_in";
  }

  if (tx >= 1 && tx <= 2 && ty >= 1 && ty <= 2) return "tower_bed";
  if (tx >= 9 && tx <= 10 && ty >= 1 && ty <= 2) return "tower_fireplace";

  return "tower_floor_in";
}

export function tileAt(tx, ty) {
  if (state.scene === "tower") return interiorTileAt(tx, ty);
  return overworldTileAt(tx, ty);
}

export function solidTile(t) {
  return (
    t === "void"           ||
    t === "water"          ||
    t === "stone_wall"     ||
    t === "tower_stone"    ||
    t === "tower_wall_in"  ||
    t === "tower_bed"      ||
    t === "tower_fireplace"
  );
}

export function worldCollide(px, py, r) {
  const minTX = Math.floor((px - r) / TILE);
  const maxTX = Math.floor((px + r) / TILE);
  const minTY = Math.floor((py - r) / TILE);
  const maxTY = Math.floor((py + r) / TILE);
  for (let ty = minTY; ty <= maxTY; ty++) {
    for (let tx = minTX; tx <= maxTX; tx++) {
      if (solidTile(tileAt(tx, ty))) {
        const cx  = tx * TILE + TILE / 2;
        const cy  = ty * TILE + TILE / 2;
        const dx  = px - cx;
        const dy  = py - cy;
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);
        const hx  = TILE / 2 + r;
        const hy  = TILE / 2 + r;
        if (adx < hx && ady < hy) {
          const ox = hx - adx;
          const oy = hy - ady;
          if (ox < oy) return { nx: Math.sign(dx) || 1, ny: 0, ox };
          return { nx: 0, ny: Math.sign(dy) || 1, oy };
        }
      }
    }
  }
  return null;
}

export function resolveMove(ent, r, dt) {
  ent.x += ent.vx * dt;
  let c = worldCollide(ent.x, ent.y, r);
  if (c) {
    if (c.nx) ent.x += c.nx * c.ox;
    if (c.ny) ent.y += c.ny * c.oy;
  }
  ent.y += ent.vy * dt;
  c = worldCollide(ent.x, ent.y, r);
  if (c) {
    if (c.nx) ent.x += c.nx * c.ox;
    if (c.ny) ent.y += c.ny * c.oy;
  }
}

export function clampPlayerToMap(r) {
  const p = state.player;
  if (state.scene === "tower") {
    const maxX = TOWER_IN.W * TILE - r;
    const maxY = TOWER_IN.H * TILE - r;
    p.x = Math.max(r, Math.min(maxX, p.x));
    p.y = Math.max(r, Math.min(maxY, p.y));
    return;
  }
  const maxX = MAP_W * TILE - r;
  const maxY = MAP_H * TILE - r;
  p.x = Math.max(r, Math.min(maxX, p.x));
  p.y = Math.max(r, Math.min(maxY, p.y));
}
