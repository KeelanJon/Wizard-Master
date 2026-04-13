import { TILE, MAP_W, MAP_H } from "./config.js";
import { session } from "./session.js";
import { state } from "./state.js";
import { coinEl } from "./dom.js";
import { resolveMove, clampPlayerToMap, worldCollide } from "./world.js";
import { dist } from "./math-utils.js";
import { tryAutoCastSpell, updateProjectiles, playerDamage, manualFireSpell } from "./combat.js";
import { spawnEnemy } from "./spawn.js";
import { sfxCoin, sfxDash } from "./audio.js";
import { spawnParticles } from "./effects.js";
import { saveGame } from "./persistence.js";
import { updateSceneHud } from "./hud.js";
import { canEnterTower, canExitTower, enterTower, exitTower } from "./tower.js";
import { tryAutoFireball, manualFireball, updateFireballs } from "./fireball.js";

export function update(dt) {
  state.transitionCooldown = Math.max(0, state.transitionCooldown - dt);
  session.shakeT = Math.max(0, session.shakeT - dt);

  // Fade animation runs even while shop/menu is open
  const f = state.fade;
  if (f.dir !== 0) {
    f.alpha = Math.min(1, Math.max(0, f.alpha + f.dir * dt / 0.3));
    if (f.dir === 1 && f.alpha >= 1) {
      if (f.cb) { f.cb(); f.cb = null; }
      f.dir = -1;
    } else if (f.dir === -1 && f.alpha <= 0) {
      f.dir = 0;
    }
  }

  if (session.shopOpen || session.paused) return;

  const p = state.player;
  const baseSpeed = 55 + state.upgrades.speed * 12;
  const jx = state.joystick.dx;
  const jy = state.joystick.dy;
  const kx = (session.keys.ArrowRight || session.keys.KeyD ? 1 : 0) - (session.keys.ArrowLeft || session.keys.KeyA ? 1 : 0);
  const ky = (session.keys.ArrowDown || session.keys.KeyS ? 1 : 0) - (session.keys.ArrowUp || session.keys.KeyW ? 1 : 0);
  const klen = Math.hypot(kx, ky);
  const kdx = klen ? kx / klen : 0;
  const kdy = klen ? ky / klen : 0;
  const stickMove = state.joystick.active && (Math.abs(jx) > 0.05 || Math.abs(jy) > 0.05);
  if (stickMove) {
    p.vx = jx * baseSpeed;
    p.vy = jy * baseSpeed;
    if (Math.abs(jx) > 0.2) p.facing = jx > 0 ? 1 : -1;
  } else if (klen > 0) {
    p.vx = kdx * baseSpeed;
    p.vy = kdy * baseSpeed;
    if (Math.abs(kdx) > 0.2) p.facing = kdx > 0 ? 1 : -1;
  } else {
    p.vx = 0;
    p.vy = 0;
  }

  // --- Dash ---
  const dashTriggered = session.wantDash && p.dashCooldown <= 0 && p.dashT <= 0;
  session.wantDash = false;
  if (dashTriggered && state.scene === "overworld") {
    let ddx = stickMove ? jx : (klen > 0 ? kdx : p.facing);
    let ddy = stickMove ? jy : (klen > 0 ? kdy : 0);
    const dlen = Math.hypot(ddx, ddy);
    if (dlen > 0) { ddx /= dlen; ddy /= dlen; }
    p.dashVx = ddx * 380;
    p.dashVy = ddy * 380;
    p.dashT = 0.15;
    p.dashCooldown = 1.5;
    p.invuln = Math.max(p.invuln, 0.3);
    sfxDash();
  }

  // Override velocity and spawn trail particles while dashing
  if (p.dashT > 0) {
    p.dashT = Math.max(0, p.dashT - dt);
    p.vx = p.dashVx;
    p.vy = p.dashVy;
    if (Math.random() < 0.75) spawnParticles(p.x, p.y, "#bae6fd", 2);
  }
  p.dashCooldown = Math.max(0, p.dashCooldown - dt);
  // --- End Dash ---

  resolveMove(p, 7, dt);
  clampPlayerToMap(7);

  // Auto-transition into / out of the tower when walking through the doorway
  if (state.transitionCooldown <= 0) {
    if (state.scene === "overworld" && canEnterTower(p.x, p.y)) enterTower();
    else if (state.scene === "tower" && canExitTower(p.x, p.y)) exitTower();
  }

  p.attackT = Math.max(0, p.attackT - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  p.castT = Math.max(0, p.castT - dt);

  tryAutoCastSpell();
  tryAutoFireball();

  if (state.scene === "overworld") {
    if (Math.random() < dt * 0.55) spawnEnemy();

    for (const e of state.enemies) {
      e.wobble += dt * 4;
      e.hitFlash = Math.max(0, e.hitFlash - dt);

      // Wander timer — pick a new random direction occasionally
      e.wanderChangeT = Math.max(0, (e.wanderChangeT || 0) - dt);
      if (e.wanderChangeT <= 0) {
        e.wanderAngle = (e.wanderAngle || 0) + (Math.random() - 0.5) * Math.PI * 1.5;
        e.wanderChangeT = 1.8 + Math.random() * 2.5;
      }

      const d = dist(p.x, p.y, e.x, e.y);
      const aggro = d < 100;
      if (aggro && d > 14) {
        // Chase the player
        const nx = (p.x - e.x) / d;
        const ny = (p.y - e.y) / d;
        const es = 28 + e.tier * 10;
        e.x += nx * es * dt;
        e.y += ny * es * dt;
      } else if (!aggro) {
        // Patrol slowly in current wander direction
        const ws = 10 + e.tier * 4;
        const nx = e.x + Math.cos(e.wanderAngle) * ws * dt;
        const ny = e.y + Math.sin(e.wanderAngle) * ws * dt;
        if (worldCollide(nx, ny, 6)) {
          // Bounce off wall: reverse + randomise direction
          e.wanderAngle += Math.PI + (Math.random() - 0.5) * 1.2;
          e.wanderChangeT = 0.4 + Math.random() * 0.6;
        } else {
          e.x = nx;
          e.y = ny;
        }
        // Steer back toward the map centre when near the border
        if (e.x < 32 || e.x > MAP_W * TILE - 32 || e.y < 32 || e.y > MAP_H * TILE - 32) {
          e.wanderAngle = Math.atan2(MAP_H * TILE / 2 - e.y, MAP_W * TILE / 2 - e.x) + (Math.random() - 0.5) * 0.6;
          e.wanderChangeT = 1 + Math.random();
        }
      }

      if (d < 14 && p.invuln <= 0) {
        playerDamage();
      }
    }

    // Hold-to-attack: fire toward last known mouse position each cooldown tick
    if (session.mouseDown) {
      manualFireSpell(session.mouseWorldX, session.mouseWorldY);
    }

    // E key: manual fireball
    if (session.wantFireball) {
      session.wantFireball = false;
      manualFireball();
    }

    updateProjectiles(dt);

    const magnetR = 48 + state.upgrades.speed * 6;
    for (let i = state.drops.length - 1; i >= 0; i--) {
      const c = state.drops[i];
      c.t += dt;
      if (c.phase === "burst") {
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vy += 220 * dt;
        c.vx *= Math.pow(0.92, dt * 60);
        if (c.t > 0.35 || c.vy > 120) {
          c.phase = "settle";
          c.vx = 0;
          c.vy = 0;
        }
      } else {
        const d = dist(c.x, c.y, p.x, p.y);
        if (d < magnetR && d > 4) {
          const pull = 280 + state.upgrades.speed * 40;
          const nx = (p.x - c.x) / d;
          const ny = (p.y - c.y) / d;
          c.x += nx * pull * dt;
          c.y += ny * pull * dt;
        }
        if (d < 10) {
          state.drops.splice(i, 1);
          state.wallet += c.value;
          coinEl.textContent = String(state.wallet);
          sfxCoin();
          spawnParticles(c.x, c.y, "#ffd166", 5);
          saveGame();
        }
      }
    }
  }

  updateProjectiles(dt);
  updateFireballs(dt);

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 120 * dt;
    pt.life -= dt;
    if (pt.life <= 0) state.particles.splice(i, 1);
  }

  for (let i = state.floatTexts.length - 1; i >= 0; i--) {
    const ft = state.floatTexts[i];
    ft.t += dt;
    ft.y -= 20 * dt;
    if (ft.t > 0.8) state.floatTexts.splice(i, 1);
  }

  updateSceneHud();
}
