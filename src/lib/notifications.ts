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

// === Web Push (background reliable iOS via CF Worker) ===

function urlBase64ToBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
  return buf;
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribePush(workerUrl: string): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const vapidRes = await fetch(`${workerUrl}/vapid-public`);
    if (!vapidRes.ok) throw new Error("No se pudo obtener VAPID public");
    const vapidPublic = (await vapidRes.text()).trim();
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToBuffer(vapidPublic),
    });
  }
  return sub;
}

export async function unsubscribePush(workerUrl: string): Promise<void> {
  const sub = await getPushSubscription();
  if (!sub) return;
  await fetch(`${workerUrl}/subscribe`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  await sub.unsubscribe();
}

export async function postScheduleToWorker(
  workerUrl: string,
  schedule: { fireAt: number; title: string; body: string; tag?: string }[]
): Promise<void> {
  const sub = await getPushSubscription();
  if (!sub) throw new Error("No hay subscription push");
  const res = await fetch(`${workerUrl}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sub: sub.toJSON(), schedule }),
  });
  if (!res.ok) throw new Error(`Worker respondió ${res.status}`);
}

export async function pushTest(workerUrl: string): Promise<void> {
  const sub = await getPushSubscription();
  if (!sub) throw new Error("No hay subscription push");
  const res = await fetch(`${workerUrl}/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  if (!res.ok) throw new Error(`Test fallo ${res.status}`);
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
