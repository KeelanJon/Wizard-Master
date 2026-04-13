import { state } from "./state.js";
import { btnShop, btnTower } from "./dom.js";
import {
  canExitTower,
  nearWizardMaster,
} from "./tower.js";

export function updateSceneHud() {
  const p = state.player;

  if (state.scene === "overworld") {
    // Shop is tower-only — hide on the overworld
    btnShop.classList.add("hidden");
    // Tower entry is automatic — hide the button
    btnTower.classList.add("hidden");
    return;
  }

  // Inside the tower
  // Show "Leave tower" button only when player is near the exit door
  const nearExit = canExitTower(p.x, p.y);
  btnTower.textContent = "Leave tower";
  btnTower.classList.toggle("hidden", !nearExit);

  // Show "Speak" button only when near the Wizard Master
  if (nearWizardMaster(p.x, p.y)) {
    btnShop.textContent = "Speak";
    btnShop.classList.remove("hidden");
  } else {
    btnShop.classList.add("hidden");
  }
}
