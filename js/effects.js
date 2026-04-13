import { state } from "./state.js";

export function burstCoins(x, y, amount) {
  const n = Math.min(24, Math.max(4, 6 + Math.floor(amount / 2)));
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const sp = 60 + Math.random() * 100;
    const v = Math.floor(amount / n) + (i < amount % n ? 1 : 0);
    if (v <= 0) continue;
    state.drops.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 40,
      phase: "burst",
      t: 0,
      value: v,
    });
  }
}

export function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 30 + Math.random() * 80;
    state.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 20,
      life: 0.35 + Math.random() * 0.25,
      color,
      size: 2 + (Math.random() > 0.5 ? 2 : 0),
    });
  }
}

export function floatText(x, y, text, color) {
  state.floatTexts.push({ x, y, text, color, t: 0 });
}
