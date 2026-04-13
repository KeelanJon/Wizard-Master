import { MAP_W, MAP_H, TILE } from "./config.js";

export function createInitialState() {
  return {
    scene: "overworld",
    transitionCooldown: 0,
    wallet: 0,
    areaNorthUnlocked: false,
    upgrades: { damage: 1, speed: 1, maxHp: 3, multishot: 0 },
    player: {
      x: MAP_W * TILE * 0.5,
      y: MAP_H * TILE * 0.65,
      vx: 0,
      vy: 0,
      hp: 3,
      facing: 1,
      attackT: 0,
      invuln: 0,
      castT: 0,
      dashT: 0,
      dashCooldown: 0,
      dashVx: 0,
      dashVy: 0,
    },
    skills: {
      fireball: { owned: false, cooldownT: 0, cooldownMax: 6.0 },
    },
    enemies: [],
    projectiles: [],
    fireballs: [],
    drops: [],
    particles: [],
    floatTexts: [],
    camX: 0,
    camY: 0,
    joystick: { active: false, dx: 0, dy: 0, originX: 0, originY: 0 },
    fade: { alpha: 0, dir: 0, cb: null },
  };
}

/** Single mutable game state for the running session. */
export const state = createInitialState();
