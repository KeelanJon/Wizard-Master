/**
 * Coin Quest — entry point.
 * @see config.js for balance constants
 */
import { MAP_W, MAP_H, TILE, VIEW_W, VIEW_H } from "./config.js";
import { state } from "./state.js";
import { session } from "./session.js";
import { coinEl, canvas, menuPanel, volSlider, btnMute,
         btnGbDash, btnGbFireball, btnGbAuto, btnGbMenu2 } from "./dom.js";
import { loadSave, saveGame, removeSave } from "./persistence.js";
import { updateHearts, showToast } from "./ui.js";
import { bindJoystick } from "./input.js";
import { resize, drawFrame } from "./render.js";
import { update } from "./game-loop.js";
import { openShop, closeShop } from "./shop.js";
import { spawnEnemy } from "./spawn.js";
import { ensureAudio, setVolume, setMuted, getVolume, getMuted } from "./audio.js";
import { exitTower, canExitTower } from "./tower.js";
import { updateSceneHud } from "./hud.js";
import { manualFireSpell } from "./combat.js";

const AUDIO_KEY = "coinQuestAudioV1";

function loadAudioSettings() {
  try {
    const d = JSON.parse(localStorage.getItem(AUDIO_KEY) || "{}");
    const vol = typeof d.volume === "number" ? d.volume : 0.8;
    const muted = !!d.muted;
    setVolume(vol);
    setMuted(muted);
    volSlider.value = Math.round(vol * 100);
    btnMute.textContent = muted ? "Unmute" : "Mute";
    btnMute.classList.toggle("muted", muted);
  } catch (_) {}
}

function saveAudioSettings() {
  try {
    localStorage.setItem(AUDIO_KEY, JSON.stringify({ volume: getVolume(), muted: getMuted() }));
  } catch (_) {}
}

function openMenu() {
  session.paused = true;
  session.wantDash = false;
  // Sync controls to current audio state
  volSlider.value = Math.round(getVolume() * 100);
  btnMute.textContent = getMuted() ? "Unmute" : "Mute";
  btnMute.classList.toggle("muted", getMuted());
  menuPanel.classList.remove("hidden");
}

function closeMenu() {
  session.paused = false;
  menuPanel.classList.add("hidden");
}

function resetProgress() {
  if (!confirm("Erase all progress and return to starting stats?")) return;
  removeSave();
  state.wallet = 0;
  state.areaNorthUnlocked = false;
  state.upgrades.damage = 1;
  state.upgrades.speed = 1;
  state.upgrades.maxHp = 3;
  state.upgrades.multishot = 0;
  const p = state.player;
  p.x = MAP_W * TILE * 0.5;
  p.y = MAP_H * TILE * 0.65;
  p.vx = 0;
  p.vy = 0;
  p.hp = 3;
  p.facing = 1;
  p.attackT = 0;
  p.castT = 0;
  p.invuln = 0;
  p.dashT = 0;
  p.dashCooldown = 0;
  state.skills.fireball.owned = false;
  state.skills.fireball.cooldownT = 0;
  state.enemies.length = 0;
  state.projectiles.length = 0;
  state.fireballs.length = 0;
  state.drops.length = 0;
  state.particles.length = 0;
  state.floatTexts.length = 0;
  state.scene = "overworld";
  state.transitionCooldown = 0;
  coinEl.textContent = "0";
  updateHearts();
  updateSceneHud();
  for (let i = 0; i < 5; i++) spawnEnemy();
  saveGame();
  closeShop();
  closeMenu();
  showToast("Progress cleared — fresh start!");
}

/** Keep gameboy button states in sync with game state (runs every frame). */
function syncGamepadHUD() {
  // Auto button: reflect current toggle state
  if (btnGbAuto) {
    const on = session.autoAttack;
    btnGbAuto.textContent = on ? "AUTO ON" : "AUTO OFF";
    btnGbAuto.classList.toggle("on", on);
  }
  // Fireball button: locked style when not yet purchased, dimmed when on CD
  if (btnGbFireball) {
    const skill = state.skills.fireball;
    if (!skill.owned) {
      btnGbFireball.classList.add("locked");
      btnGbFireball.querySelector(".gba-label").textContent = "FIRE";
      btnGbFireball.querySelector(".gba-key").textContent   = "—";
    } else {
      btnGbFireball.classList.remove("locked");
      const onCd = skill.cooldownT > 0;
      btnGbFireball.style.opacity = onCd ? "0.55" : "1";
      btnGbFireball.querySelector(".gba-key").textContent =
        onCd ? Math.ceil(skill.cooldownT) + "s" : "E";
    }
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - session.lastTime) / 1000) || 0.016;
  session.lastTime = now;
  update(dt);
  drawFrame();
  syncGamepadHUD();
  requestAnimationFrame(frame);
}

function init() {
  loadSave();
  loadAudioSettings();
  state.player.hp = state.upgrades.maxHp;
  coinEl.textContent = String(state.wallet);
  updateHearts();
  resize();
  // Re-run after paint so the mobile viewport is fully settled
  setTimeout(resize, 100);
  window.addEventListener("resize", resize);
  bindJoystick();

  // Shop / Speak button (tower only)
  document.getElementById("btn-shop").addEventListener("click", () => {
    if (session.shopOpen) closeShop();
    else openShop();
  });
  document.getElementById("shop-close").addEventListener("click", closeShop);

  // Tower leave button
  document.getElementById("btn-tower").addEventListener("click", () => {
    const p = state.player;
    if (state.scene === "tower" && canExitTower(p.x, p.y)) exitTower();
  });

  // Menu button
  document.getElementById("btn-menu").addEventListener("click", () => {
    ensureAudio();
    if (session.paused) closeMenu();
    else openMenu();
  });

  // Menu controls
  document.getElementById("btn-resume").addEventListener("click", closeMenu);

  volSlider.addEventListener("input", () => {
    const v = volSlider.value / 100;
    setVolume(v);
    // Un-mute automatically when slider is moved up from zero
    if (getMuted() && v > 0) {
      setMuted(false);
      btnMute.textContent = "Mute";
      btnMute.classList.remove("muted");
    }
    saveAudioSettings();
  });

  btnMute.addEventListener("click", () => {
    ensureAudio();
    const nowMuted = !getMuted();
    setMuted(nowMuted);
    btnMute.textContent = nowMuted ? "Unmute" : "Mute";
    btnMute.classList.toggle("muted", nowMuted);
    saveAudioSettings();
  });

  document.getElementById("btn-reset-prog").addEventListener("click", resetProgress);

  // ── Canvas pointer: mouse + touch aiming ──────────────────────
  function updateMouseWorld(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    // Use actual CSS display size for coordinate mapping (handles float scale)
    const scaleX = VIEW_W / rect.width;
    const scaleY = VIEW_H / rect.height;
    session.mouseWorldX = (clientX - rect.left) * scaleX + state.camX;
    session.mouseWorldY = (clientY - rect.top)  * scaleY + state.camY;
  }

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    if (state.scene !== "overworld") return;
    if (session.paused || session.shopOpen) return;
    ensureAudio();
    updateMouseWorld(e.clientX, e.clientY);
    session.mouseDown = true;
    manualFireSpell(session.mouseWorldX, session.mouseWorldY);
  });

  canvas.addEventListener("mousemove", (e) => {
    updateMouseWorld(e.clientX, e.clientY);
  });

  canvas.addEventListener("mouseup",    (e) => { if (e.button === 0) session.mouseDown = false; });
  canvas.addEventListener("mouseleave", ()  => { session.mouseDown = false; });

  // Touch aiming on the canvas (portrait: canvas is above controls, no joystick overlap)
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (state.scene !== "overworld" || session.paused || session.shopOpen) return;
    ensureAudio();
    const t = e.touches[0];
    updateMouseWorld(t.clientX, t.clientY);
    session.mouseDown = true;
    manualFireSpell(session.mouseWorldX, session.mouseWorldY);
  }, { passive: false });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const t = e.touches[0];
    if (t) updateMouseWorld(t.clientX, t.clientY);
  }, { passive: false });

  canvas.addEventListener("touchend",    () => { session.mouseDown = false; });
  canvas.addEventListener("touchcancel", () => { session.mouseDown = false; });

  // ── Gameboy buttons ───────────────────────────────────────────
  function gbPress(btn, handler) {
    if (!btn) return;
    btn.addEventListener("touchstart", (e) => { e.preventDefault(); ensureAudio(); handler(); }, { passive: false });
    btn.addEventListener("mousedown",  (e) => { e.preventDefault(); ensureAudio(); handler(); });
  }

  gbPress(btnGbDash, () => {
    if (!session.paused) session.wantDash = true;
  });

  gbPress(btnGbFireball, () => {
    if (!session.paused) session.wantFireball = true;
  });

  gbPress(btnGbAuto, () => {
    if (session.paused) return;
    session.autoAttack = !session.autoAttack;
    showToast(session.autoAttack ? "Auto-attack ON" : "Auto-attack OFF");
  });

  gbPress(btnGbMenu2, () => {
    if (session.shopOpen) { closeShop(); return; }
    if (session.paused)   { closeMenu(); return; }
    openMenu();
  });

  window.addEventListener("keydown", (e) => {
    // Escape: close shop → close menu → open menu
    if (e.code === "Escape") {
      if (session.shopOpen) { closeShop(); return; }
      if (session.paused)   { closeMenu(); return; }
      openMenu();
      return;
    }

    session.keys[e.code] = true;
    ensureAudio();

    // Q — toggle auto-attack
    if (e.code === "KeyQ" && !session.paused) {
      session.autoAttack = !session.autoAttack;
      showToast(session.autoAttack ? "Auto-attack ON" : "Auto-attack OFF");
    }
    // E — manual fireball
    if (e.code === "KeyE" && !session.paused) {
      session.wantFireball = true;
    }
    // Space — dash
    if (e.code === "Space" && !session.paused) {
      e.preventDefault();
      session.wantDash = true;
    }
  });

  window.addEventListener("keyup", (e) => {
    session.keys[e.code] = false;
  });

  for (let i = 0; i < 5; i++) spawnEnemy();
  updateSceneHud();

  requestAnimationFrame((t) => {
    session.lastTime = t;
    requestAnimationFrame(frame);
  });
}

init();
