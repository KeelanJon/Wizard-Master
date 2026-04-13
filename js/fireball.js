/**
 * Fireball skill — slow AOE projectile, purchased from Wizard Master.
 * Auto-fires at nearest enemy when off cooldown; E key fires manually.
 */
import { FIREBALL_CD, FIREBALL_SPEED, FIREBALL_BLAST_R, FIREBALL_RANGE } from "./config.js";
import { state } from "./state.js";
import { session } from "./session.js";
import { dist } from "./math-utils.js";
import { projectileBlocked, damageEnemy } from "./combat.js";
import { spawnParticles, floatText } from "./effects.js";
import { sfxFireball, ensureAudio } from "./audio.js";

function launch(dx, dy) {
  const p = state.player;
  const skill = state.skills.fireball;
  ensureAudio();
  sfxFireball();
  skill.cooldownT = FIREBALL_CD;
  const len = Math.hypot(dx, dy) || 1;
  state.fireballs.push({
    x: p.x,
    y: p.y,
    vx: (dx / len) * FIREBALL_SPEED,
    vy: (dy / len) * FIREBALL_SPEED,
    traveled: 0,
  });
}

function explode(fb) {
  const baseDmg = Math.max(3, 3 + state.upgrades.damage * 2);
  let totalDmg = 0;
  // Reverse-iterate so damageEnemy splices don't skip entries
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (dist(fb.x, fb.y, e.x, e.y) <= FIREBALL_BLAST_R) {
      damageEnemy(e, baseDmg);
      totalDmg += baseDmg;
    }
  }
  session.shakeT = Math.max(session.shakeT, 0.28);
  spawnParticles(fb.x, fb.y, "#ff6b35", 24);
  spawnParticles(fb.x, fb.y, "#ffd166", 14);
  spawnParticles(fb.x, fb.y, "#ff2200", 10);
  if (totalDmg > 0) floatText(fb.x, fb.y - 18, `-${totalDmg}`, "#ff8c00");
}

/** Auto-fire: targets nearest enemy when owned + off cooldown. */
export function tryAutoFireball() {
  if (state.scene !== "overworld") return;
  const skill = state.skills.fireball;
  if (!skill.owned || skill.cooldownT > 0) return;
  const p = state.player;
  let best = null;
  let bestD = 420;
  for (const e of state.enemies) {
    const d = dist(p.x, p.y, e.x, e.y);
    if (d < bestD) { bestD = d; best = e; }
  }
  if (!best) return;
  launch(best.x - p.x, best.y - p.y);
}

/** Manual fire: toward mouse world position, or facing direction if no mouse target. */
export function manualFireball() {
  if (state.scene !== "overworld") return;
  const skill = state.skills.fireball;
  if (!skill.owned || skill.cooldownT > 0) return;
  const p = state.player;
  const dx = session.mouseWorldX - p.x;
  const dy = session.mouseWorldY - p.y;
  if (Math.hypot(dx, dy) < 2) {
    // No mouse delta — fire in facing direction
    launch(p.facing, 0);
  } else {
    launch(dx, dy);
  }
}

/** Tick cooldown + move fireballs, check collisions, explode on hit/range. */
export function updateFireballs(dt) {
  if (state.scene !== "overworld") return;
  const skill = state.skills.fireball;
  skill.cooldownT = Math.max(0, skill.cooldownT - dt);

  for (let i = state.fireballs.length - 1; i >= 0; i--) {
    const fb = state.fireballs[i];
    fb.x += fb.vx * dt;
    fb.y += fb.vy * dt;
    fb.traveled += Math.hypot(fb.vx, fb.vy) * dt;

    let hit = fb.traveled >= FIREBALL_RANGE || projectileBlocked(fb.x, fb.y);
    if (!hit) {
      for (const e of state.enemies) {
        if (dist(fb.x, fb.y, e.x, e.y) < 14) { hit = true; break; }
      }
    }

    if (hit) {
      explode(fb);
      state.fireballs.splice(i, 1);
    }
  }
}
