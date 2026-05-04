import { registerSW } from "virtual:pwa-register";

export type UpdateState = "idle" | "available" | "updating";

let updateAvailable = false;
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
const listeners = new Set<(state: UpdateState) => void>();

export function initPwaUpdate() {
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateAvailable = true;
      notify("available");
    },
    onOfflineReady() {
      console.log("[PWA] offline ready");
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Poll cada 60s para nueva versión
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60_000);
    },
  });
}

export function applyUpdate() {
  if (!updateAvailable || !updateSW) return;
  notify("updating");
  updateSW(true);
}

export function isUpdateAvailable() {
  return updateAvailable;
}

export function subscribeUpdate(fn: (state: UpdateState) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(state: UpdateState) {
  listeners.forEach((fn) => fn(state));
}
