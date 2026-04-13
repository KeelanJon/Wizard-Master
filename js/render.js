import { COL, TILE, MAP_W, MAP_H, VIEW_W, VIEW_H } from "./config.js";
import { state } from "./state.js";
import { session } from "./session.js";
import { canvas, ctx } from "./dom.js";
import { tileAt, LANDMARKS } from "./world.js";
import { TOWER_IN, WIZARD_MASTER } from "./tower.js";

export function resize() {
  const portrait = window.innerHeight > window.innerWidth;
  // On portrait mobile leave the bottom 44% for the controls panel
  const maxW = portrait ? window.innerWidth        : window.innerWidth - 8;
  const maxH = portrait ? window.innerHeight * 0.54 : window.innerHeight - 8;
  const sx = maxW / VIEW_W;
  const sy = maxH / VIEW_H;
  // Integer scale on desktop (crisp pixels); nearest on portrait (fills width)
  const raw = Math.min(sx, sy);
  session.scale = portrait
    ? Math.max(1, raw)
    : Math.max(1, Math.floor(raw));
  canvas.width  = Math.round(VIEW_W * session.scale);
  canvas.height = Math.round(VIEW_H * session.scale);
  ctx.imageSmoothingEnabled = false;
}

function drawTile(tx, ty, worldX, worldY) {
  const t = tileAt(tx, ty);

  if (t === "tower_stone") {
    ctx.fillStyle = (tx + ty) & 1 ? "#4a4e69" : "#3d4258";
    ctx.fillRect(worldX, worldY, TILE, TILE);
    ctx.fillStyle = "#2a2d3d";
    ctx.fillRect(worldX + 2, worldY + 4, 12, 2);
    ctx.fillRect(worldX + 4, worldY + 10, 8, 2);
    return;
  }
  if (t === "tower_foyer") {
    ctx.fillStyle = (tx + ty) & 1 ? "#5c4033" : "#4a3428";
    ctx.fillRect(worldX, worldY, TILE, TILE);
    ctx.fillStyle = "#3d2818";
    ctx.fillRect(worldX + 1, worldY + 12, 14, 2);
    return;
  }
  if (t === "tower_porch") {
    ctx.fillStyle = "#4a4f5c";
    ctx.fillRect(worldX, worldY, TILE, TILE);
    ctx.fillStyle = "#3a3f4a";
    ctx.fillRect(worldX + 2, worldY + 2, 4, 4);
    ctx.fillRect(worldX + 10, worldY + 8, 4, 4);
    return;
  }
  if (t === "tower_wall_in") {
    ctx.fillStyle = "#252030";
    ctx.fillRect(worldX, worldY, TILE, TILE);
    ctx.fillStyle = "#1a1525";
    ctx.fillRect(worldX + 1, worldY + 1, 14, 3);
    return;
  }
  if (t === "tower_floor_in" || t === "tower_door_floor") {
    ctx.fillStyle = (tx + ty) & 1 ? "#3d3548" : "#453d52";
    ctx.fillRect(worldX, worldY, TILE, TILE);
    if (t === "tower_door_floor") {
      ctx.fillStyle = "#2a2435";
      ctx.fillRect(worldX + 2, worldY + 10, 12, 4);
      ctx.fillStyle = "#1e1828";
      ctx.fillRect(worldX + 4, worldY + 12, 8, 2);
    }
    return;
  }
  if (t === "tower_bed") {
    ctx.fillStyle = "#3d3548";
    ctx.fillRect(worldX, worldY, TILE, TILE);
    ctx.fillStyle = "#5c4a6a";
    ctx.fillRect(worldX + 1, worldY + 4, 14, 10);
    ctx.fillStyle = "#8b7aa0";
    ctx.fillRect(worldX + 2, worldY + 5, 12, 6);
    return;
  }
  if (t === "tower_fireplace") {
    ctx.fillStyle = "#3d3548";
    ctx.fillRect(worldX, worldY, TILE, TILE);
    ctx.fillStyle = "#5c4033";
    ctx.fillRect(worldX + 2, worldY + 2, 12, 12);
    ctx.fillStyle = "#2a1810";
    ctx.fillRect(worldX + 4, worldY + 4, 8, 8);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255,140,60,0.5)";
    ctx.fillRect(worldX + 5, worldY + 5, 6, 6);
    ctx.fillStyle = "rgba(255,200,120,0.35)";
    ctx.fillRect(worldX + 6, worldY + 6, 4, 4);
    ctx.restore();
    return;
  }

  if (t === "water") {
    ctx.fillStyle = (tx + ty) & 1 ? COL.water1 : COL.water2;
    ctx.fillRect(worldX, worldY, TILE, TILE);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    if (((tx * 3 + ty * 5) & 3) === 0) ctx.fillRect(worldX + 3, worldY + 5, 10, 2);
    return;
  }
  if (t === "sand") {
    ctx.fillStyle = (tx + ty) & 1 ? COL.sand1 : COL.sand2;
    ctx.fillRect(worldX, worldY, TILE, TILE);
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    if (((tx * 5 + ty * 7) & 7) === 0) ctx.fillRect(worldX + 4, worldY + 10, 3, 2);
    return;
  }
  if (t === "stone_wall") {
    ctx.fillStyle = (tx + ty) & 1 ? COL.stoneWall1 : COL.stoneWall2;
    ctx.fillRect(worldX, worldY, TILE, TILE);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(worldX + 2, worldY + 4, 12, 2);
    ctx.fillRect(worldX + 4, worldY + 10, 8, 2);
    return;
  }
  if (t === "stone_floor") {
    ctx.fillStyle = (tx + ty) & 1 ? COL.stoneFloor1 : COL.stoneFloor2;
    ctx.fillRect(worldX, worldY, TILE, TILE);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(worldX + 1, worldY + 1, 14, 1);
    ctx.fillRect(worldX + 1, worldY + 9, 14, 1);
    return;
  }

  let c1 = COL.grass1;
  let c2 = COL.grass2;
  if (t === "grass2") {  // darkgrass
    c1 = COL.darkgrass1;
    c2 = COL.darkgrass2;
  } else if (t === "path") {
    c1 = COL.path;
    c2 = "#7d6b5a";
  } else if (t === "void") {
    c1 = COL.void;
    c2 = COL.void;
  }
  const checker = (tx + ty) & 1;
  ctx.fillStyle = checker ? c1 : c2;
  ctx.fillRect(worldX, worldY, TILE, TILE);
  if (t === "grass1") {
    if (((tx * 7 + ty * 3) & 7) === 0) {
      ctx.fillStyle = "#1b4332";
      ctx.fillRect(worldX + 6, worldY + 10, 2, 4);
      ctx.fillRect(worldX + 10, worldY + 8, 2, 3);
    }
  } else if (t === "grass2") {  // darkgrass — denser foliage detail
    if (((tx * 5 + ty * 7) & 3) === 0) {
      ctx.fillStyle = "#0f2b1a";
      ctx.fillRect(worldX + 3, worldY + 8, 2, 5);
      ctx.fillRect(worldX + 8, worldY + 6, 2, 4);
      ctx.fillRect(worldX + 12, worldY + 10, 2, 4);
    }
  }
}

function drawWizard(sx, sy, facing, castPulse) {
  const x = Math.floor(sx);
  const y = Math.floor(sy);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.fillStyle = "#3d2f5c";
  ctx.fillRect(-5, -8, 10, 12);
  ctx.fillStyle = "#5a4a7a";
  ctx.fillRect(-4, -6, 8, 8);
  ctx.fillStyle = "#e8d5c4";
  ctx.fillRect(-3, -15, 6, 7);
  ctx.fillStyle = "#1e1633";
  ctx.fillRect(-4, -22, 8, 7);
  ctx.fillRect(-6, -21, 12, 4);
  ctx.fillStyle = "#22223b";
  ctx.fillRect(-1, -14, 2, 2);
  ctx.fillStyle = "#6b5a4a";
  ctx.fillRect(6, -14, 2, 18);
  ctx.fillStyle = "#9b86c9";
  ctx.fillRect(5, -16, 4, 3);
  ctx.fillStyle = "#2d1f45";
  ctx.fillRect(-2, 0, 4, 4);
  if (castPulse > 0) {
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(160, 210, 255, 0.95)";
    ctx.fillRect(3, -20, 8, 8);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(5, -18, 4, 4);
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();
}

/** Elder wizard — gold trim, no staff bolt flash. */
function drawWizardMaster(sx, sy) {
  const x = Math.floor(sx);
  const y = Math.floor(sy);
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#2a2040";
  ctx.fillRect(-5, -8, 10, 12);
  ctx.fillStyle = "#4a3a6a";
  ctx.fillRect(-4, -6, 8, 8);
  ctx.fillStyle = "#d4c4a8";
  ctx.fillRect(-3, -15, 6, 7);
  ctx.fillStyle = "#1a1028";
  ctx.fillRect(-5, -23, 10, 8);
  ctx.fillRect(-7, -22, 14, 4);
  ctx.strokeStyle = "#c9a227";
  ctx.lineWidth = 1;
  ctx.strokeRect(-5, -23, 10, 8);
  ctx.fillStyle = "#c9a227";
  ctx.fillRect(-2, -12, 4, 2);
  ctx.fillStyle = "#222";
  ctx.fillRect(-1, -14, 2, 2);
  ctx.fillStyle = "#8b7355";
  ctx.fillRect(5, -12, 3, 14);
  ctx.fillStyle = "#a67c52";
  ctx.fillRect(4, -14, 5, 4);
  ctx.fillStyle = "#2d1f45";
  ctx.fillRect(-2, 0, 4, 4);
  ctx.restore();
}

function drawProjectile(wx, wy) {
  const x = Math.floor(wx);
  const y = Math.floor(wy);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(x - 3, y - 3, 7, 7);
  ctx.fillStyle = "#e0f2fe";
  ctx.fillRect(x - 2, y - 2, 4, 4);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x - 1, y - 1, 2, 2);
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();
}

function drawSlime(ex, ey, e) {
  const wob = Math.sin(e.wobble * 3) * 1;
  const x = Math.floor(ex);
  const y = Math.floor(ey + wob);

  let col, col2, rx, ry;
  if (e.tier >= 2) {
    col = "#7d0b0b"; col2 = "#e03030"; rx = 13; ry = 10;
  } else if (e.tier === 1) {
    col = "#7b2cbf"; col2 = "#c77dff"; rx = 10; ry = 8;
  } else {
    col = "#2d6a4f"; col2 = "#52b788"; rx = 10; ry = 8;
  }

  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = col2;
  ctx.beginPath();
  ctx.ellipse(x - Math.round(rx * 0.3), y - Math.round(ry * 0.25), Math.round(rx * 0.3), Math.round(rx * 0.3), 0, 0, Math.PI * 2);
  ctx.ellipse(x + Math.round(rx * 0.4), y - Math.round(ry * 0.25), Math.round(rx * 0.2), Math.round(rx * 0.2), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#081c15";
  ctx.fillRect(x - Math.round(rx * 0.4), y - 1, 2, 2);
  ctx.fillRect(x + Math.round(rx * 0.2), y - 1, 2, 2);

  if (e.hitFlash > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const ratio = e.hp / e.maxHp;
  const barW = rx * 2 + 2;
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x - rx - 1, y - ry - 7, barW, 3);
  ctx.fillStyle = ratio > 0.5 ? "#2a9d8f" : "#e76f51";
  ctx.fillRect(x - rx, y - ry - 6, Math.round((barW - 2) * ratio), 2);
}

function drawFireball(wx, wy) {
  const x = Math.floor(wx);
  const y = Math.floor(wy);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  // Outer fire glow
  ctx.fillStyle = "rgba(255,80,0,0.38)";
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  // Mid orange body
  ctx.fillStyle = "#ff6b00";
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  // Yellow core
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  // White-hot centre
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCoin(cx, cy) {
  const x = Math.floor(cx);
  const y = Math.floor(cy);
  ctx.fillStyle = "#e9c46a";
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4a261";
  ctx.fillRect(x - 2, y - 3, 4, 5);
  ctx.fillStyle = "#ffe066";
  ctx.fillRect(x - 1, y - 2, 2, 2);
}

function drawOverworldScene() {
  const p = state.player;
  state.camX = p.x - VIEW_W / 2;
  state.camY = p.y - VIEW_H / 2;
  const maxCX = MAP_W * TILE - VIEW_W;
  const maxCY = MAP_H * TILE - VIEW_H;
  state.camX = Math.max(0, Math.min(maxCX, state.camX));
  state.camY = Math.max(0, Math.min(maxCY, state.camY));

  const startTX = Math.floor(state.camX / TILE) - 1;
  const startTY = Math.floor(state.camY / TILE) - 1;
  const endTX = startTX + Math.ceil(VIEW_W / TILE) + 2;
  const endTY = startTY + Math.ceil(VIEW_H / TILE) + 2;

  for (let ty = startTY; ty <= endTY; ty++) {
    for (let tx = startTX; tx <= endTX; tx++) {
      const wx = tx * TILE - state.camX;
      const wy = ty * TILE - state.camY;
      drawTile(tx, ty, wx, wy);
    }
  }

  const sorted = [...state.enemies].sort((a, b) => a.y - b.y);
  for (const e of sorted) {
    drawSlime(e.x - state.camX, e.y - state.camY, e);
  }

  for (const c of state.drops) {
    drawCoin(c.x - state.camX, c.y - state.camY);
  }

  for (const pr of state.projectiles) {
    drawProjectile(pr.x - state.camX, pr.y - state.camY);
  }

  for (const fb of state.fireballs) {
    drawFireball(fb.x - state.camX, fb.y - state.camY);
  }

  drawWizard(p.x - state.camX, p.y - state.camY, p.facing, p.castT > 0 ? p.castT / 0.22 : 0);

  drawOverworldOverlays(p);
}

function drawOverworldOverlays(p) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const pt of state.particles) {
    ctx.fillStyle = pt.color;
    const px = pt.x - state.camX;
    const py = pt.y - state.camY;
    ctx.fillRect(
      Math.floor(px - pt.size / 2),
      Math.floor(py - pt.size / 2),
      pt.size,
      pt.size
    );
  }
  ctx.restore();

  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  for (const ft of state.floatTexts) {
    ctx.fillStyle = ft.color;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    const tx = ft.x - state.camX;
    const ty = ft.y - state.camY;
    ctx.strokeText(ft.text, tx, ty);
    ctx.fillText(ft.text, tx, ty);
  }

  // Landmark labels — show name when nearby
  ctx.font = "7px monospace";
  ctx.textAlign = "center";
  for (const lm of Object.values(LANDMARKS)) {
    const wx = lm.tx * TILE + TILE / 2 - state.camX;
    const wy = lm.ty * TILE - state.camY - 12;
    if (wx < -20 || wx > VIEW_W + 20 || wy < -10 || wy > VIEW_H + 10) continue;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    const tw = ctx.measureText(lm.name).width;
    ctx.fillRect(wx - tw / 2 - 3, wy - 9, tw + 6, 11);
    ctx.fillStyle = "#e9c46a";
    ctx.fillText(lm.name, wx, wy);
  }

  if (p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0) {
    ctx.fillStyle = "rgba(255,100,100,0.25)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function drawTowerInteriorScene() {
  const p = state.player;
  const roomPxW = TOWER_IN.W * TILE;
  const roomPxH = TOWER_IN.H * TILE;
  state.camX = Math.max(0, Math.min(roomPxW - VIEW_W, p.x - VIEW_W / 2));
  state.camY = Math.max(0, Math.min(roomPxH - VIEW_H, p.y - VIEW_H / 2));

  for (let ty = 0; ty < TOWER_IN.H; ty++) {
    for (let tx = 0; tx < TOWER_IN.W; tx++) {
      const wx = tx * TILE - state.camX;
      const wy = ty * TILE - state.camY;
      drawTile(tx, ty, wx, wy);
    }
  }

  const mx = WIZARD_MASTER.x - state.camX;
  const my = WIZARD_MASTER.y - state.camY;
  const px = p.x - state.camX;
  const py = p.y - state.camY;
  if (p.y < WIZARD_MASTER.y) {
    drawWizard(px, py, p.facing, p.castT > 0 ? p.castT / 0.22 : 0);
    drawWizardMaster(mx, my);
  } else {
    drawWizardMaster(mx, my);
    drawWizard(px, py, p.facing, p.castT > 0 ? p.castT / 0.22 : 0);
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const pt of state.particles) {
    ctx.fillStyle = pt.color;
    const pxx = pt.x - state.camX;
    const pyy = pt.y - state.camY;
    ctx.fillRect(
      Math.floor(pxx - pt.size / 2),
      Math.floor(pyy - pt.size / 2),
      pt.size,
      pt.size
    );
  }
  ctx.restore();

  ctx.font = "bold 8px monospace";
  ctx.textAlign = "center";
  for (const ft of state.floatTexts) {
    ctx.fillStyle = ft.color;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    const tx = ft.x - state.camX;
    const ty = ft.y - state.camY;
    ctx.strokeText(ft.text, tx, ty);
    ctx.fillText(ft.text, tx, ty);
  }

  if (p.invuln > 0 && Math.floor(p.invuln * 12) % 2 === 0) {
    ctx.fillStyle = "rgba(255,100,100,0.25)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

// ── Skill bar ─────────────────────────────────────────────────────────────────
// Draws owned skill icons centered above the hint bar.
// Each icon shows a clock-wipe cooldown overlay and a key-bind label.

function drawFireballSkillIcon(cx, cy, r) {
  // Icon art — concentric fire circles
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255,60,0,0.45)";
  ctx.beginPath(); ctx.arc(cx, cy, r - 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#ff6b00";
  ctx.beginPath(); ctx.arc(cx, cy, r - 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffd166";
  ctx.beginPath(); ctx.arc(cx, cy, r - 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.arc(cx, cy, r - 8, 0, Math.PI * 2); ctx.fill();

  // Flame wisps
  ctx.fillStyle = "#ff4400";
  ctx.fillRect(cx - 4, cy - r + 1, 2, 4);
  ctx.fillRect(cx + 2, cy - r + 2, 2, 3);
}

function drawSkillIcon(id, skill, x, y, size) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r  = size / 2;
  const frac   = skill.cooldownMax > 0 ? skill.cooldownT / skill.cooldownMax : 0; // 1=just fired, 0=ready
  const ready  = frac <= 0;

  // Background panel
  ctx.fillStyle = ready ? "#2a0e00" : "#111";
  ctx.fillRect(x, y, size, size);

  // Icon art
  if (id === "fireball") drawFireballSkillIcon(cx, cy, r);

  // Clock-wipe cooldown overlay (dark sector sweeping clockwise from top)
  if (frac > 0) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.70)";
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r + 1, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2, false);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Countdown number
    ctx.fillStyle = "#fff";
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    ctx.fillText(Math.ceil(skill.cooldownT) + "s", cx, cy + 3);
  }

  // Border — orange when ready, dim grey when cooling
  ctx.strokeStyle = ready ? "#ff8c00" : "#3a3a3a";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.75, y + 0.75, size - 1.5, size - 1.5);

  // Ready glow behind border
  if (ready) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgba(255,100,0,0.15)";
    ctx.fillRect(x, y, size, size);
    ctx.restore();
    // "READY" label above icon
    ctx.fillStyle = "#ff8c00";
    ctx.font = "5px monospace";
    ctx.textAlign = "center";
    ctx.fillText("READY", cx, y - 3);
  }

  // Key-bind label below icon (sits in the hint bar background)
  ctx.fillStyle = "#888";
  ctx.font = "5px monospace";
  ctx.textAlign = "center";
  ctx.fillText("[E]", cx, y + size + 6);
}

function drawSkillBar() {
  if (state.scene !== "overworld") return;
  const owned = Object.entries(state.skills).filter(([, s]) => s.owned);
  if (owned.length === 0) return;

  const size = 24;
  const gap  = 4;
  const totalW = owned.length * size + (owned.length - 1) * gap;
  let sx = Math.floor((VIEW_W - totalW) / 2);
  const sy = VIEW_H - 44;   // sits just above the 18-px hint bar

  for (const [id, skill] of owned) {
    drawSkillIcon(id, skill, sx, sy, size);
    sx += size + gap;
  }
}

export function drawWorld() {
  if (state.scene === "tower") drawTowerInteriorScene();
  else drawOverworldScene();
}

function drawStartScreen() {
  // Dark background
  ctx.fillStyle = "#0a0614";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Stars — deterministic pattern so they don't flicker each frame
  for (let i = 0; i < 90; i++) {
    const sx = (i * 137 + 29) % VIEW_W;
    const sy = (i * 97  + 13) % (VIEW_H - 24);
    ctx.fillStyle = i % 7 === 0
      ? `rgba(180,150,255,${0.3 + (i % 4) * 0.1})`
      : `rgba(255,255,255,${0.25 + (i % 5) * 0.08})`;
    ctx.fillRect(sx, sy, 1, 1);
  }

  // Ambient glow behind title
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(70,30,140,0.28)";
  ctx.beginPath();
  ctx.ellipse(VIEW_W / 2, 52, 110, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Title
  ctx.textAlign = "center";
  ctx.font = "bold 22px monospace";
  ctx.strokeStyle = "#200800";
  ctx.lineWidth = 5;
  ctx.strokeText("COIN QUEST", VIEW_W / 2, 52);
  ctx.fillStyle = "#e9c46a";
  ctx.fillText("COIN QUEST", VIEW_W / 2, 52);

  // Subtitle
  ctx.font = "9px monospace";
  ctx.strokeStyle = "#0a0614";
  ctx.lineWidth = 2;
  ctx.strokeText("— Young Wizard —", VIEW_W / 2, 67);
  ctx.fillStyle = "#9b86c9";
  ctx.fillText("— Young Wizard —", VIEW_W / 2, 67);

  // Thin decorative separator
  ctx.fillStyle = "rgba(120,90,180,0.35)";
  ctx.fillRect(50, 76, VIEW_W - 100, 1);

  // Soft glow beneath wizard feet
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(60,30,160,0.3)";
  ctx.beginPath();
  ctx.ellipse(VIEW_W / 2, 140, 28, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Wizard sprite — scaled 2× for the hero pose
  ctx.save();
  ctx.translate(VIEW_W / 2, 128);
  ctx.scale(2, 2);
  drawWizard(0, 0, 1, 0);
  ctx.restore();

  // Second decorative separator
  ctx.fillStyle = "rgba(120,90,180,0.35)";
  ctx.fillRect(50, 150, VIEW_W - 100, 1);

  // Blinking prompt
  if (Math.floor(Date.now() / 550) % 2 === 0) {
    ctx.textAlign = "center";
    ctx.font = "7px monospace";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.strokeText("PRESS ANY KEY TO BEGIN", VIEW_W / 2, 174);
    ctx.fillStyle = "#c8c0e0";
    ctx.fillText("PRESS ANY KEY TO BEGIN", VIEW_W / 2, 174);
  }
}

export function drawFrame() {
  ctx.save();
  ctx.scale(session.scale, session.scale);

  // Camera shake: translate by a random offset scaled to shakeT intensity
  if (session.shakeT > 0) {
    const mag = session.shakeT * 7;
    ctx.translate(
      (Math.random() * 2 - 1) * mag,
      (Math.random() * 2 - 1) * mag
    );
  }

  ctx.fillStyle = COL.void;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  if (session.onStartScreen) {
    drawStartScreen();
  } else {
    drawWorld();

    // Bottom hint bar
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, VIEW_H - 18, VIEW_W, 18);

    ctx.fillStyle = "#ccc";
    ctx.font = "7px monospace";
    ctx.textAlign = "left";
    const autoLabel = session.autoAttack ? "Auto ON" : "Auto OFF";
    const fireballHint = state.skills.fireball.owned ? " · E: Fireball" : "";
    const hint =
      state.scene === "tower"
        ? "Rest · Speak to the Master (shop) · Walk to the door to leave"
        : `WASD/Stick · Click to aim · Q: ${autoLabel}${fireballHint}`;
    ctx.fillText(hint, 6, VIEW_H - 6);

    // Dash cooldown indicator (overworld only) — bottom-right corner of the bar
    if (state.scene === "overworld") {
      const p = state.player;
      const ready = p.dashCooldown <= 0;
      const frac = ready ? 1 : 1 - p.dashCooldown / 1.5;
      const barW = 22;
      const bx = VIEW_W - barW - 4;
      const by = VIEW_H - 13;

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(bx - 1, by - 1, barW + 2, 6);

      ctx.fillStyle = ready ? "#38bdf8" : "#1e4060";
      ctx.fillRect(bx, by, Math.round(barW * frac), 4);

      if (ready) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = "rgba(56,189,248,0.35)";
        ctx.fillRect(bx, by, barW, 4);
        ctx.restore();
      }

      ctx.fillStyle = ready ? "#e0f2fe" : "#64748b";
      ctx.font = "5px monospace";
      ctx.textAlign = "right";
      ctx.fillText("SPC", bx - 3, by + 4);
    }

    drawSkillBar();
  }

  // Fade-to-black overlay (applies to both start screen and game world)
  if (state.fade.alpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${state.fade.alpha.toFixed(3)})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  ctx.restore();
}
