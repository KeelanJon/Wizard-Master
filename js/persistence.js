import { SAVE_KEY } from "./config.js";
import { state } from "./state.js";

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    state.wallet = d.coins | 0;
    state.areaNorthUnlocked = !!d.areaNorthUnlocked;
    if (d.upgrades) {
      state.upgrades.damage = Math.max(1, d.upgrades.damage | 0);
      state.upgrades.speed = Math.max(1, d.upgrades.speed | 0);
      state.upgrades.maxHp = Math.max(3, d.upgrades.maxHp | 0);
      state.upgrades.multishot = Math.min(2, Math.max(0, d.upgrades.multishot | 0));
    }
    if (d.skills) {
      if (d.skills.fireball) state.skills.fireball.owned = true;
    }
    state.player.hp = state.upgrades.maxHp;
  } catch (_) {}
}

export function saveGame() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        coins: state.wallet,
        areaNorthUnlocked: state.areaNorthUnlocked,
        upgrades: { ...state.upgrades },
        skills: { fireball: state.skills.fireball.owned },
      })
    );
  } catch (_) {}
}

export function removeSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (_) {}
}
