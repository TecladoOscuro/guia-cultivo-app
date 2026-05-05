import { db } from "./db";
import { generateEvents } from "./eventGenerator";
import { reserveAll, releasePending, consume } from "./stockPipeline";
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
  startDate: Date;
  notes?: string;
  customParams?: Record<string, unknown>;
  forceWithoutStock?: boolean;
}

export async function createCultivation(input: CreateCultivationInput): Promise<{
  cultivationId: number;
  eventCount: number;
  shoppingCount: number;
  prepCount: number;
}> {
  const template = getTemplate(input.templateId);
  if (!template) throw new Error(`Template not found: ${input.templateId}`);

  const cultivationId = (await db.cultivations.add({
    templateId: input.templateId,
    name: input.name,
    startDate: input.startDate,
    status: "active", // directo activo. prep checklist es recordatorio, no bloquea
    notes: input.notes,
    customParams: input.customParams,
    createdAt: new Date(),
  })) as number;

  // Generate events
  const events = generateEvents({
    template,
    startDate: input.startDate,
    cultivationId,
  });
  await db.events.bulkAdd(events as AppEvent[]);

  // Generate shopping items — solo lo que NO tienes ya en stock
  const allStock = await db.stock.toArray();
  const shoppingItems: Omit<ShoppingItem, "id">[] = template.shoppingList
    .filter((s) => {
      const inStock = allStock.find((st) => st.key === s.key);
      return !inStock || inStock.qty < s.qty;
    })
    .map(
      (s) => ({
        cultivationId,
        itemKey: s.key,
        name: s.name,
        qty: s.qty,
        unit: s.unit,
        category: s.category,
        approxPrice: s.approxPrice,
        source: s.source,
        notes: s.notes,
        status: "pending",
        addedAt: new Date(),
        wikiUrl: s.wikiPhase
          ? `${template.wikiBase ?? ""}&phase=${s.wikiPhase}`
          : undefined,
      })
    );
  await db.shoppingList.bulkAdd(shoppingItems as ShoppingItem[]);

  // Generate prep checklist
  const prepItems: Omit<PrepChecklistItem, "id">[] = template.prepChecklist.map(
    (p) => ({
      cultivationId,
      templateChecklistId: p.id,
      title: p.title,
      description: p.description,
      blocking: p.blocking,
      estimatedMinutes: p.estimatedMinutes,
      status: "pending",
    })
  );
  await db.prepChecklists.bulkAdd(prepItems as PrepChecklistItem[]);

  // Reserve stock
  await reserveAll(cultivationId, template);

  // History log
  await db.history.add({
    cultivationId,
    action: "cultivo.create",
    payload: { templateId: input.templateId, name: input.name },
    timestamp: new Date(),
  });

  refreshAllNotifications();
  return {
    cultivationId,
    eventCount: events.length,
    shoppingCount: shoppingItems.length,
    prepCount: prepItems.length,
  };
}

export async function startCultivation(cultivationId: number) {
  await db.cultivations.update(cultivationId, { status: "active" });
  await db.history.add({
    cultivationId,
    action: "cultivo.start",
    payload: {},
    timestamp: new Date(),
  });
  refreshAllNotifications();
}

export async function completeCultivation(cultivationId: number) {
  // Cancel notif eventos pendientes
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
  // Cancel notif eventos
  const events = await db.events.where({ cultivationId }).toArray();
  for (const e of events) {
    if (e.id) cancelEventNotification(e.id);
  }
  // Borrar todos los datos del cultivo
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
  // Cancel notif de eventos pendientes
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

export function listAvailableTemplates(): CultivoTemplate[] {
  return Object.values(templates);
}
