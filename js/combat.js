import {
  TILE,
  SPELL_CD,
  SPELL_SPEED,
  SPELL_ACQUIRE_RANGE,
  SPELL_MAX_RANGE,
  PROJ_HIT_R,
  MAP_W,
  MAP_H,
  VIEW_W,
  VIEW_H,
} from "./config.js";
import { state } from "./state.js";
import { session } from "./session.js";
import { tileAt, solidTile } from "./world.js";
import { dist } from "./math-utils.js";
import { sfxHit, sfxKill, sfxCast, ensureAudio } from "./audio.js";
import { burstCoins, spawnParticles, floatText } from "./effects.js";
import { saveGame } from "./persistence.js";
import { updateHearts, showToast } from "./ui.js";

export function damageEnemy(best, dmg) {
  best.hp -= dmg;
  best.hitFlash = 0.12;
  sfxHit();
  spawnParticles(best.x, best.y, best.tier ? "#c77dff" : "#95d5b2", 6);
  floatText(best.x, best.y - 14, String(-dmg), "#fff");
  if (best.hp <= 0) {
    const idx = state.enemies.indexOf(best);
    if (idx >= 0) state.enemies.splice(idx, 1);
    const coinReward = 8 + best.maxHp * 5 + best.tier * 12;
    burstCoins(best.x, best.y, coinReward);
    sfxKill();
    spawnParticles(best.x, best.y, "#ffd166", 14);
  }
}

export function projectileBlocked(px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  return solidTile(tileAt(tx, ty));
}

export function playerDamage() {
  if (state.player.invuln > 0) return;
  state.player.hp -= 1;
  state.player.invuln = 1.2;
  session.shakeT = 0.42;
  sfxHit();
  updateHearts();
  spawnParticles(state.player.x, state.player.y, "#ff6b6b", 10);
  if (state.player.hp <= 0) {
    state.player.hp = state.upgrades.maxHp;
    state.player.x = MAP_W * TILE * 0.5;
    state.player.y = MAP_H * TILE * 0.65;
    session.shakeT = 0.7;
    showToast("You faint and wake at the village edge…");
    saveGame();
  }
}

/** Returns true if the enemy world position falls within the current viewport. */
function isEnemyOnScreen(e) {
  const margin = TILE * 2;
  return (
    e.x >= state.camX - margin &&
    e.x <= state.camX + VIEW_W + margin &&
    e.y >= state.camY - margin &&
    e.y <= state.camY + VIEW_H + margin
  );
}

/** Shared spell-firing logic — direction given as raw (dx, dy), normalised internally. */
function fireSpell(dx, dy) {
  const p = state.player;
  ensureAudio();
  sfxCast();
  p.attackT = SPELL_CD;
  p.castT = 0.22;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;
  p.facing = nx >= 0 ? 1 : -1;
  const dmg = Math.max(1, state.upgrades.damage);

  // Multishot: center bolt + angled flanking bolts based on upgrade level
  const offsets = [0];
  const ms = state.upgrades.multishot || 0;
  if (ms >= 1) offsets.push(-0.35, 0.35);   // ±20°
  if (ms >= 2) offsets.push(-0.62, 0.62);   // ±35°

  for (const angle of offsets) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const fx = nx * cos - ny * sin;
    const fy = nx * sin + ny * cos;
    state.projectiles.push({
      x: p.x + fx * 14,
      y: p.y + fy * 14,
      vx: fx * SPELL_SPEED,
      vy: fy * SPELL_SPEED,
      dmg,
      traveled: 0,
      maxRange: SPELL_MAX_RANGE,
    });
  }
}

/** Auto-cast: targets the nearest visible enemy. Respects attackT cooldown and autoAttack toggle. */
export function tryAutoCastSpell() {
  if (state.scene !== "overworld") return;
  if (!session.autoAttack) return;
  const p = state.player;
  if (p.attackT > 0) return;
  let best = null;
  let bestD = SPELL_ACQUIRE_RANGE;
  for (const e of state.enemies) {
    if (!isEnemyOnScreen(e)) continue;
    const d = dist(p.x, p.y, e.x, e.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  if (!best) return;
  fireSpell(best.x - p.x, best.y - p.y);
}

/**
 * Manual attack: fires toward the given world-space position.
 * Shares the same attackT cooldown as auto-attack.
 */
export function manualFireSpell(worldX, worldY) {
  if (state.scene !== "overworld") return;
  const p = state.player;
  if (p.attackT > 0) return;
  fireSpell(worldX - p.x, worldY - p.y);
}

export function updateProjectiles(dt) {
  if (state.scene !== "overworld") return;
  outer: for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const pr = state.projectiles[i];
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    pr.traveled += SPELL_SPEED * dt;

    if (pr.traveled >= pr.maxRange || projectileBlocked(pr.x, pr.y)) {
      spawnParticles(pr.x, pr.y, "#94a3b8", 5);
      state.projectiles.splice(i, 1);
      continue;
    }

    for (const e of state.enemies) {
      if (dist(pr.x, pr.y, e.x, e.y) < PROJ_HIT_R) {
        damageEnemy(e, pr.dmg);
        state.projectiles.splice(i, 1);
        continue outer;
      }
    }
  }
}
