import { registerSW } from "virtual:pwa-register";

export type UpdateState = "idle" | "available";

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
    onRegisteredSW(_, registration) {
      if (!registration) return;
      // Poll cada 30s
      const pollInterval = setInterval(() => {
        registration.update().catch(() => {});
      }, 30_000);

      // Check on visibility change (user returns to app)
      const onVisible = () => {
        if (document.visibilityState === "visible") {
          registration.update().catch(() => {});
        }
      };
      document.addEventListener("visibilitychange", onVisible);
      // Cleanup if needed (optional)
      window.addEventListener("beforeunload", () => {
        clearInterval(pollInterval);
        document.removeEventListener("visibilitychange", onVisible);
      });
    },
  });
}

export function applyUpdate() {
  if (!updateAvailable || !updateSW) return;
  // A small delay so the user can see the toast before reload
  updateSW(true);
}

export function subscribeUpdate(fn: (state: UpdateState) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(state: UpdateState) {
  listeners.forEach((fn) => fn(state));
}
