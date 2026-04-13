import { heartsEl, toastEl } from "./dom.js";
import { state } from "./state.js";

export function updateHearts() {
  heartsEl.innerHTML = "";
  const max = state.upgrades.maxHp;
  const cur = Math.max(0, Math.ceil(state.player.hp));
  for (let i = 0; i < max; i++) {
    const h = document.createElement("span");
    h.className = "heart" + (i < cur ? " full" : "");
    heartsEl.appendChild(h);
  }
}

export function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove("show"), 2200);
}
