import { joystickZone, joystickStick } from "./dom.js";
import { state } from "./state.js";
import { ensureAudio } from "./audio.js";

export function bindJoystick() {
  const start = (e) => {
    e.preventDefault();
    state.joystick.active = true;
    const t = e.touches ? e.touches[0] : e;
    joystickSetFromPointer(t.clientX, t.clientY, true);
    ensureAudio();
  };
  const move = (e) => {
    if (!state.joystick.active) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    joystickSetFromPointer(t.clientX, t.clientY, false);
  };
  const end = () => {
    state.joystick.active = false;
    state.joystick.dx = 0;
    state.joystick.dy = 0;
    joystickStick.style.transform = "translate(0,0)";
  };
  joystickZone.addEventListener("touchstart", start, { passive: false });
  joystickZone.addEventListener("touchmove", move, { passive: false });
  joystickZone.addEventListener("touchend", end);
  joystickZone.addEventListener("touchcancel", end);
  joystickZone.addEventListener("mousedown", start);
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end);
}

function joystickSetFromPointer(clientX, clientY, start) {
  const rect = joystickZone.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  if (start) {
    state.joystick.originX = cx;
    state.joystick.originY = cy;
  }
  let dx = clientX - cx;
  let dy = clientY - cy;
  const maxR = rect.width * 0.35;
  const len = Math.hypot(dx, dy) || 1;
  if (len > maxR) {
    dx = (dx / len) * maxR;
    dy = (dy / len) * maxR;
  }
  state.joystick.dx = dx / maxR;
  state.joystick.dy = dy / maxR;
  joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
}
