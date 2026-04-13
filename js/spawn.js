import { TILE, MAP_W, MAP_H } from "./config.js";
import { state } from "./state.js";
import { worldCollide, WORLD_SPAWN_TX, WORLD_SPAWN_TY } from "./world.js";
import { dist } from "./math-utils.js";

const MAX_ENEMIES = 50;
const MIN_SPAWN_DIST = 85;
const MAX_SPAWN_DIST = 230;

// World-space spawn origin (pixel coords)
const SPAWN_PX = WORLD_SPAWN_TX * TILE + TILE / 2;
const SPAWN_PY = WORLD_SPAWN_TY * TILE + TILE / 2;

/** Enemy tier based on distance from the world spawn point. */
function tierForPos(x, y) {
  const d = dist(x, y, SPAWN_PX, SPAWN_PY);
  if (d > 1800) return 2;
  if (d > 900)  return 1;
  return 0;
}

export function spawnEnemy() {
  if (state.scene !== "overworld") return;
  if (state.enemies.length >= MAX_ENEMIES) return;

  const px = state.player.x;
  const py = state.player.y;
  let x, y, tries = 0;

  do {
    const angle = Math.random() * Math.PI * 2;
    const r = MIN_SPAWN_DIST + Math.random() * (MAX_SPAWN_DIST - MIN_SPAWN_DIST);
    x = px + Math.cos(angle) * r;
    y = py + Math.sin(angle) * r;
    x = Math.max(TILE, Math.min(MAP_W * TILE - TILE, x));
    y = Math.max(TILE, Math.min(MAP_H * TILE - TILE, y));
    tries++;
  } while (worldCollide(x, y, 8) && tries < 48);

  if (worldCollide(x, y, 8)) return; // couldn't find a clear spot

  const tier   = tierForPos(x, y);
  const baseHp = tier === 2 ? 8 : tier === 1 ? 4 : 2;

  state.enemies.push({
    x,
    y,
    vx: 0,
    vy: 0,
    hp: baseHp,
    maxHp: baseHp,
    tier,
    hitFlash: 0,
    wobble: Math.random() * Math.PI * 2,
    wanderAngle: Math.random() * Math.PI * 2,
    wanderChangeT: 1 + Math.random() * 2.5,
  });
}
