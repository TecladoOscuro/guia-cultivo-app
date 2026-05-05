import { db } from "./db";
import { generateEvents } from "./eventGenerator";
import { releasePending, consume, getStockAvailable } from "./stockPipeline";
import { templates, getTemplate } from "../templates";
import { refreshAllNotifications, cancelEventNotification } from "./notifSync";
import type {
  CultivoTemplate,
  ShoppingItem,
  PrepChecklistItem,
  AppEvent,
} from "../types";

export interface CreateCultivationInput {
  templateId: string;
  name: string;
  scale?: number;
  notes?: string;
  customParams?: Record<string, unknown>;
  forceWithoutStock?: boolean;
}

// Step 1: Create cultivation in "planning" — no events, no date, no reservations
export async function createCultivation(input: CreateCultivationInput): Promise<{
  cultivationId: number;
  shoppingCount: number;
  prepCount: number;
}> {
  const template = getTemplate(input.templateId);
  if (!template) throw new Error(`Template not found: ${input.templateId}`);

  const cultivationId = (await db.cultivations.add({
    templateId: input.templateId,
    name: input.name,
    startDate: new Date(), // placeholder, se actualiza al iniciar
    status: "planning",
    scale: input.scale ?? 1,
    notes: input.notes,
    customParams: input.customParams,
    createdAt: new Date(),
  })) as number;

  // Generate shopping items — todos, pero marcamos los cubiertos por stock DISPONIBLE
  const availableStock = await getStockAvailable();
  const shoppingItems: Omit<ShoppingItem, "id">[] = template.shoppingList.map(
    (s) => {
      const qtyNeeded = s.qty * (input.scale ?? 1);
      const haveAvailable = availableStock[s.key] ?? 0;
      const covered = haveAvailable >= qtyNeeded;
      return {
        cultivationId,
        itemKey: s.key,
        name: s.name,
        qty: qtyNeeded,
        unit: s.unit,
        category: s.category,
        approxPrice: s.approxPrice,
        source: s.source,
        notes: s.notes,
        status: covered ? "purchased" as const : "pending" as const,
        addedAt: new Date(),
        wikiUrl: s.wikiPhase
          ? `${template.wikiBase ?? ""}&phase=${s.wikiPhase}`
          : undefined,
      };
    }
  );
  await db.shoppingList.bulkAdd(shoppingItems as ShoppingItem[]);

  // Reserve "once" consumables NOW (planning) to prevent double-booking
  for (const c of template.consumables) {
    if (c.trigger === "once") {
      await db.stockReservations.add({
        stockKey: c.stockKey,
        cultivationId,
        qty: c.qty * (input.scale ?? 1),
        unit: c.unit,
        status: "reserved",
        createdAt: new Date(),
      });
    }
  }

  // Generate prep checklist
  const prepItems: Omit<PrepChecklistItem, "id">[] = template.prepChecklist.map(
    (p) => ({
      cultivationId,
      templateChecklistId: p.id,
      title: p.title,
      description: p.description,
      blocking: p.blocking,
      estimatedMinutes: p.estimatedMinutes,
      status: "pending" as const,
    })
  );
  await db.prepChecklists.bulkAdd(prepItems as PrepChecklistItem[]);

  await db.history.add({
    cultivationId,
    action: "cultivo.create",
    payload: { templateId: input.templateId, name: input.name },
    timestamp: new Date(),
  });

  refreshAllNotifications();
  return {
    cultivationId,
    shoppingCount: shoppingItems.length,
    prepCount: prepItems.length,
  };
}

// Step 2: Start cultivation — generates events, reservations, sets date = today
export async function startCultivation(cultivationId: number): Promise<{
  eventCount: number;
}> {
  const cultivation = await db.cultivations.get(cultivationId);
  if (!cultivation) throw new Error("Cultivo no encontrado");

  const template = getTemplate(cultivation.templateId);
  if (!template) throw new Error("Template no encontrado");

  const scale = cultivation.scale ?? 1;
  const today = new Date();

  // Generate events from today
  const events = generateEvents({
    template,
    startDate: today,
    cultivationId,
  });

  await db.events.bulkAdd(events as AppEvent[]);

  // Fetch events back to get their IDs, then link per-event reservations
  const persistedEvents = await db.events.where({ cultivationId }).toArray();

  for (const event of persistedEvents) {
    if (!event.id || !event.templateEventId) continue;

    const reservationIds: number[] = [];

    const tplEvent = template.events.find((e) => e.id === event.templateEventId);
    if (tplEvent?.consumes) {
      for (const c of tplEvent.consumes) {
        if (c.trigger === "per_event") {
          const rid = (await db.stockReservations.add({
            stockKey: c.stockKey,
            cultivationId,
            eventId: event.id,
            qty: c.qty * scale,
            unit: c.unit,
            status: "reserved",
            createdAt: new Date(),
          })) as number;
          reservationIds.push(rid);
        }
      }
    }

    const tplRecurring = template.recurringTasks.find((rt) => rt.id === event.templateEventId);
    if (tplRecurring?.consumes) {
      for (const c of tplRecurring.consumes) {
        if (c.trigger === "per_event") {
          const rid = (await db.stockReservations.add({
            stockKey: c.stockKey,
            cultivationId,
            eventId: event.id,
            qty: c.qty * scale,
            unit: c.unit,
            status: "reserved",
            createdAt: new Date(),
          })) as number;
          reservationIds.push(rid);
        }
      }
    }

    if (reservationIds.length > 0) {
      await db.events.update(event.id, {
        consumesReservationIds: reservationIds,
      });
    }
  }

  // Reserve "per_phase" consumables
  for (const c of template.consumables) {
    if (c.trigger === "per_phase") {
      const phases = template.phases?.length ?? 1;
      await db.stockReservations.add({
        stockKey: c.stockKey,
        cultivationId,
        qty: c.qty * phases,
        unit: c.unit,
        status: "reserved",
        createdAt: new Date(),
      });
    }
  }

  // Update cultivation
  await db.cultivations.update(cultivationId, {
    status: "active",
    startDate: today,
  });

  await db.history.add({
    cultivationId,
    action: "cultivo.start",
    payload: { startDate: today.toISOString() },
    timestamp: new Date(),
  });

  refreshAllNotifications();
  return { eventCount: events.length };
}

export async function completeCultivation(cultivationId: number) {
  const pendingEvents = await db.events
    .where({ cultivationId })
    .and((e) => e.status === "pending")
    .toArray();
  for (const e of pendingEvents) {
    if (e.id) cancelEventNotification(e.id);
  }

  await db.cultivations.update(cultivationId, {
    status: "completed",
    endedAt: new Date(),
  });
  await releasePending(cultivationId);
  await db.history.add({
    cultivationId,
    action: "cultivo.complete",
    payload: {},
    timestamp: new Date(),
  });
  refreshAllNotifications();
}

export async function reactivateCultivation(cultivationId: number) {
  await db.cultivations.update(cultivationId, {
    status: "active",
    endedAt: undefined,
  });
  await db.history.add({
    cultivationId,
    action: "cultivo.reactivate",
    payload: {},
    timestamp: new Date(),
  });
  refreshAllNotifications();
}

export async function deleteCultivationFully(cultivationId: number) {
  const events = await db.events.where({ cultivationId }).toArray();
  for (const e of events) {
    if (e.id) cancelEventNotification(e.id);
  }
  await db.events.where({ cultivationId }).delete();
  await db.shoppingList.where({ cultivationId }).delete();
  await db.prepChecklists.where({ cultivationId }).delete();
  await db.journal.where({ cultivationId }).delete();
  await db.harvests.where({ cultivationId }).delete();
  await db.product.where({ cultivationId }).delete();
  await db.stockReservations.where({ cultivationId }).delete();
  await db.history.where({ cultivationId }).delete();
  await db.cultivations.delete(cultivationId);
  refreshAllNotifications();
}

export async function abortCultivation(cultivationId: number) {
  const pendingEvents = await db.events
    .where({ cultivationId })
    .and((e) => e.status === "pending")
    .toArray();
  for (const e of pendingEvents) {
    if (e.id) cancelEventNotification(e.id);
  }

  await db.cultivations.update(cultivationId, {
    status: "aborted",
    endedAt: new Date(),
  });
  await releasePending(cultivationId);
  await db.history.add({
    cultivationId,
    action: "cultivo.abort",
    payload: {},
    timestamp: new Date(),
  });
  refreshAllNotifications();
}

export async function completeEvent(eventId: number) {
  const event = await db.events.get(eventId);
  if (!event) return;

  await db.events.update(eventId, {
    status: "done",
    completedAt: new Date(),
  });

  if (event.consumesReservationIds?.length) {
    for (const rid of event.consumesReservationIds) {
      await consume(rid);
    }
  }

  cancelEventNotification(eventId);
  await db.history.add({
    cultivationId: event.cultivationId,
    eventId,
    action: "event.done",
    payload: { title: event.title },
    timestamp: new Date(),
  });
  refreshAllNotifications();
}

export async function markSkipped(eventId: number) {
  const event = await db.events.get(eventId);
  if (!event) return;

  await db.events.update(eventId, {
    status: "skipped",
    completedAt: new Date(),
  });

  cancelEventNotification(eventId);
  await db.history.add({
    cultivationId: event.cultivationId,
    eventId,
    action: "event.skipped",
    payload: { title: event.title },
    timestamp: new Date(),
  });
  refreshAllNotifications();
}

export function listAvailableTemplates(): CultivoTemplate[] {
  return Object.values(templates);
}
