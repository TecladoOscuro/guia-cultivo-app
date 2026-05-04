// Local notifications + badge counter (sin server, sin VAPID).
// iOS PWA: badge persiste cuando app cerrada (16.4+). Notif background limitada.

export type NotifPermission = "default" | "granted" | "denied" | "unsupported";

export function getPermission(): NotifPermission {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission as NotifPermission;
}

export async function requestPermission(): Promise<NotifPermission> {
  if (typeof Notification === "undefined") return "unsupported";
  const result = await Notification.requestPermission();
  return result as NotifPermission;
}

export function showNotification(title: string, opts?: NotificationOptions): boolean {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") return false;
  try {
    new Notification(title, {
      icon: "/guia-cultivo-app/icons/icon-192.png",
      badge: "/guia-cultivo-app/icons/icon-192.png",
      ...opts,
    });
    return true;
  } catch {
    return false;
  }
}

export async function setBadge(count: number) {
  const nav = navigator as Navigator & {
    setAppBadge?: (n: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  try {
    if (count <= 0 && nav.clearAppBadge) {
      await nav.clearAppBadge();
    } else if (nav.setAppBadge) {
      await nav.setAppBadge(count);
    }
  } catch {
    // Badge API no soportado o permiso denegado
  }
}

// Schedule notification con setTimeout (foreground-only fiable;
// background depende de SW + iOS susponer).
const scheduledTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function scheduleNotification(key: string, when: Date, title: string, body: string) {
  cancelNotification(key);
  const ms = when.getTime() - Date.now();
  if (ms <= 0) return;
  // Limit: setTimeout max ~24.8 días (signed 32-bit ms)
  if (ms > 2_000_000_000) return;
  const t = setTimeout(() => {
    showNotification(title, { body, tag: key });
    scheduledTimers.delete(key);
  }, ms);
  scheduledTimers.set(key, t);
}

export function cancelNotification(key: string) {
  const t = scheduledTimers.get(key);
  if (t) {
    clearTimeout(t);
    scheduledTimers.delete(key);
  }
}

export function clearAllScheduled() {
  for (const [, t] of scheduledTimers) clearTimeout(t);
  scheduledTimers.clear();
}
