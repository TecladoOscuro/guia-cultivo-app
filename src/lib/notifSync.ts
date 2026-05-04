// Sincronización notif ↔ DB. Al iniciar app:
// 1. Catch-up: contar eventos hoy + atrasados → badge + posible toast
// 2. Re-schedule todos los notif futuros 24h vista
// Al crear/actualizar evento → refresh schedule

import { db } from "./db";
import {
  scheduleNotification,
  cancelNotification,
  setBadge,
  clearAllScheduled,
  getPermission,
  postScheduleToWorker,
} from "./notifications";
import { isToday, isPast, addDays, isWithinInterval, subHours } from "date-fns";

const PREF_KEY = "notif.enabled";
const REMIND_HOURS_KEY = "notif.remindHoursBefore";
const WORKER_URL_KEY = "notif.workerUrl";
const DEFAULT_REMIND_HOURS = 1;

export async function getNotifEnabled(): Promise<boolean> {
  const pref = await db.settings.get(PREF_KEY);
  return pref?.value === true;
}

export async function setNotifEnabled(enabled: boolean) {
  await db.settings.put({ key: PREF_KEY, value: enabled });
}

export async function getRemindHoursBefore(): Promise<number> {
  const pref = await db.settings.get(REMIND_HOURS_KEY);
  return typeof pref?.value === "number" ? pref.value : DEFAULT_REMIND_HOURS;
}

export async function setRemindHoursBefore(hours: number) {
  await db.settings.put({ key: REMIND_HOURS_KEY, value: hours });
}

export async function getWorkerUrl(): Promise<string | null> {
  const pref = await db.settings.get(WORKER_URL_KEY);
  return typeof pref?.value === "string" ? pref.value : null;
}

export async function setWorkerUrl(url: string | null) {
  if (url) {
    await db.settings.put({ key: WORKER_URL_KEY, value: url });
  } else {
    await db.settings.delete(WORKER_URL_KEY);
  }
}

export async function refreshAllNotifications() {
  clearAllScheduled();

  const enabled = await getNotifEnabled();
  const events = await db.events.toArray();

  // Always update badge regardless of enabled (badge is visual, no notif spam)
  const overdueCount = events.filter(
    (e) =>
      e.status === "pending" &&
      isPast(e.scheduledDate) &&
      !isToday(e.scheduledDate)
  ).length;
  const todayCount = events.filter(
    (e) => e.status === "pending" && isToday(e.scheduledDate)
  ).length;
  await setBadge(overdueCount + todayCount);

  if (!enabled || getPermission() !== "granted") return;

  const hoursBefore = await getRemindHoursBefore();
  const cultivations = await db.cultivations.toArray();
  const cultMap = new Map(cultivations.map((c) => [c.id, c.name]));

  const now = new Date();
  const localHorizon = addDays(now, 1);
  const workerHorizon = addDays(now, 14); // Worker maneja 14 días vista

  const workerUrl = await getWorkerUrl();
  const workerSchedule: { fireAt: number; title: string; body: string; tag: string }[] = [];

  for (const e of events) {
    if (e.status !== "pending") continue;
    if (!e.notify) continue;
    if (!e.id) continue;

    const fireAt = subHours(e.scheduledDate, hoursBefore);
    if (fireAt.getTime() <= now.getTime()) continue;

    const cultName = cultMap.get(e.cultivationId) ?? "?";
    const title = `${e.emoji} ${e.title}`;
    const body = `${cultName} · en ${hoursBefore}h`;

    // Local schedule (foreground 24h)
    if (isWithinInterval(fireAt, { start: now, end: localHorizon })) {
      scheduleNotification(`event-${e.id}`, fireAt, title, body);
    }

    // Worker schedule (background 14 días)
    if (workerUrl && fireAt.getTime() <= workerHorizon.getTime()) {
      workerSchedule.push({
        fireAt: fireAt.getTime(),
        title,
        body,
        tag: `event-${e.id}`,
      });
    }
  }

  // Enviar schedule al Worker (si configurado)
  if (workerUrl && workerSchedule.length > 0) {
    try {
      await postScheduleToWorker(workerUrl, workerSchedule);
    } catch (err) {
      console.error("[notif] worker schedule fail:", err);
    }
  }
}

export interface CatchUp {
  today: number;
  overdue: number;
  upcoming24h: number;
}

export async function getCatchUp(): Promise<CatchUp> {
  const events = await db.events.toArray();
  const now = new Date();
  return {
    today: events.filter((e) => e.status === "pending" && isToday(e.scheduledDate)).length,
    overdue: events.filter(
      (e) =>
        e.status === "pending" &&
        isPast(e.scheduledDate) &&
        !isToday(e.scheduledDate)
    ).length,
    upcoming24h: events.filter(
      (e) =>
        e.status === "pending" &&
        isWithinInterval(e.scheduledDate, { start: now, end: addDays(now, 1) })
    ).length,
  };
}

export function cancelEventNotification(eventId: number) {
  cancelNotification(`event-${eventId}`);
}
