import { db } from "./db";
import { generateEvents } from "./eventGenerator";
import { reserveAll, releasePending, consume } from "./stockPipeline";
import { templates, getTemplate } from "../templates";
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
    status: "planning",
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

  // Generate shopping items
  const shoppingItems: Omit<ShoppingItem, "id">[] = template.shoppingList.map(
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
}

export async function abortCultivation(cultivationId: number) {
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
  await db.history.add({
    cultivationId: event.cultivationId,
    eventId,
    action: "event.done",
    payload: { title: event.title },
    timestamp: new Date(),
  });
}

export function listAvailableTemplates(): CultivoTemplate[] {
  return Object.values(templates);
}
