import { db } from "./db";
import type { AppEvent, EventType } from "../types";

export interface CreateEventInput {
  cultivationId: number;
  scheduledDate: Date;
  title: string;
  description: string;
  emoji: string;
  type: EventType;
  notify?: boolean;
  wikiUrl?: string;
}

export async function createManualEvent(input: CreateEventInput): Promise<number> {
  const id = (await db.events.add({
    cultivationId: input.cultivationId,
    scheduledDate: input.scheduledDate,
    title: input.title,
    description: input.description,
    emoji: input.emoji,
    type: input.type,
    status: "pending",
    notify: input.notify ?? true,
    wikiUrl: input.wikiUrl,
  } as AppEvent)) as number;

  await db.history.add({
    cultivationId: input.cultivationId,
    eventId: id,
    action: "event.create",
    payload: { title: input.title },
    timestamp: new Date(),
  });
  return id;
}

export async function updateEvent(eventId: number, patch: Partial<AppEvent>) {
  const existing = await db.events.get(eventId);
  if (!existing) return;

  const data: Partial<AppEvent> = { ...patch };
  if (patch.scheduledDate && patch.scheduledDate.getTime() !== existing.scheduledDate.getTime()) {
    data.originalDate = existing.originalDate ?? existing.scheduledDate;
  }

  await db.events.update(eventId, data);
  await db.history.add({
    cultivationId: existing.cultivationId,
    eventId,
    action: "event.update",
    payload: { fields: Object.keys(patch) },
    timestamp: new Date(),
  });
}

export async function deleteEvent(eventId: number) {
  const existing = await db.events.get(eventId);
  if (!existing) return;

  await db.events.delete(eventId);
  await db.history.add({
    cultivationId: existing.cultivationId,
    eventId,
    action: "event.delete",
    payload: { title: existing.title },
    timestamp: new Date(),
  });
}

export async function rescheduleEvent(eventId: number, newDate: Date) {
  await updateEvent(eventId, { scheduledDate: newDate });
}
