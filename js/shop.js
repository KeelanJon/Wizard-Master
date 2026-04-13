import { state } from "./state.js";
import { session } from "./session.js";
import { coinEl, shopList, shopPanel, shopTitleEl, shopSubEl } from "./dom.js";
import { saveGame } from "./persistence.js";
import { sfxUpgrade, sfxUnlock, ensureAudio } from "./audio.js";
import { updateHearts, showToast } from "./ui.js";
import { nearWizardMaster } from "./tower.js";

const SHOP_DEF = [
  {
    id: "dmg",
    name: "Arcane focus",
    desc: "+1 damage per spell bolt.",
    price: () => 25 + (state.upgrades.damage - 1) * 35,
    buy() {
      state.upgrades.damage++;
      sfxUpgrade();
      showToast("Your spells bite harder!");
    },
  },
  {
    id: "spd",
    name: "Swift boots",
    desc: "Move faster in the wilds.",
    price: () => 30 + (state.upgrades.speed - 1) * 40,
    buy() {
      state.upgrades.speed++;
      sfxUpgrade();
      showToast("The wind is at your heels!");
    },
  },
  {
    id: "hp",
    name: "Blessed charm",
    desc: "+1 max heart (heals to full).",
    price: () => 50 + (state.upgrades.maxHp - 3) * 60,
    buy() {
      state.upgrades.maxHp++;
      state.player.hp = state.upgrades.maxHp;
      updateHearts();
      sfxUpgrade();
      showToast("Your spirit feels sturdier.");
    },
  },
  {
    id: "fireball",
    name: "Fireball tome",
    desc: "Unlock Fireball — a slow AOE blast that scorches all nearby foes (E key / auto).",
    price: () => 150,
    canShow: () => !state.skills.fireball.owned,
    buy() {
      state.skills.fireball.owned = true;
      sfxUnlock();
      showToast("Fireball mastered! Press E to unleash it.");
    },
  },
  {
    id: "multishot",
    name: "Forked bolt",
    desc: () =>
      state.upgrades.multishot === 0
        ? "Your bolt splits into 3 — two flanking arcs."
        : "Two more bolts — five arcs of crackling force.",
    price: () => 85 + state.upgrades.multishot * 60,
    canShow: () => (state.upgrades.multishot || 0) < 2,
    buy() {
      state.upgrades.multishot = (state.upgrades.multishot || 0) + 1;
      sfxUpgrade();
      showToast(state.upgrades.multishot === 1 ? "Your bolt forks — three strike as one!" : "Five-bolt spread unleashed!");
    },
  },
];

export function renderShop() {
  shopList.innerHTML = "";
  for (const item of SHOP_DEF) {
    if (item.canShow && !item.canShow()) continue;
    const price = item.price();
    const li = document.createElement("li");
    li.className = "shop-item";
    const canBuy = state.wallet >= price;
    li.innerHTML =
      `<span class="name">${item.name}</span>` +
      `<button type="button" ${canBuy ? "" : "disabled"}>${price} ◆</button>` +
      `<span class="desc">${typeof item.desc === "function" ? item.desc() : item.desc}</span>`;
    const btn = li.querySelector("button");
    btn.addEventListener("click", () => {
      if (state.wallet < price) return;
      state.wallet -= price;
      coinEl.textContent = String(state.wallet);
      item.buy();
      saveGame();
      renderShop();
    });
    shopList.appendChild(li);
  }
}

export function openShop() {
  if (state.scene !== "tower") {
    showToast("Seek the Wizard Master in the tower.");
    return;
  }
  if (!nearWizardMaster(state.player.x, state.player.y)) {
    showToast("Step closer to the Wizard Master.");
    return;
  }
  session.shopOpen = true;
  shopPanel.classList.remove("hidden");
  shopTitleEl.textContent = "Wizard Master";
  shopSubEl.textContent = "Arcane wares and paths yet untraveled.";
  renderShop();
  ensureAudio();
}

export function closeShop() {
  session.shopOpen = false;
  shopPanel.classList.add("hidden");
}
