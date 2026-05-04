import { addDays } from "date-fns";
import type {
  CultivoTemplate,
  AppEvent,
  EventTemplate,
  RecurringTask,
} from "../types";

interface GenerateOptions {
  template: CultivoTemplate;
  startDate: Date;
  cultivationId: number;
}

export function generateEvents(opts: GenerateOptions): Omit<AppEvent, "id">[] {
  const { template, startDate, cultivationId } = opts;
  const events: Omit<AppEvent, "id">[] = [];

  const wikiBase = template.wikiBase ?? "";

  // 1. Milestone events
  for (const e of template.events) {
    events.push({
      cultivationId,
      templateEventId: e.id,
      scheduledDate: addDays(startDate, e.offsetDays),
      title: e.title,
      description: buildEventDescription(e),
      emoji: e.emoji,
      type: e.type,
      status: "pending",
      wikiUrl: e.wikiPhase ? `${wikiBase}&phase=${e.wikiPhase}` : undefined,
      notify: e.notify,
    });
  }

  // 2. Recurring tasks
  for (const rt of template.recurringTasks) {
    let day = rt.startDayOffset;
    while (day <= rt.endDayOffset) {
      events.push({
        cultivationId,
        templateEventId: rt.id,
        scheduledDate: addDays(startDate, day),
        title: rt.title,
        description: buildRecurringDescription(rt),
        emoji: rt.emoji,
        type: rt.type,
        status: "pending",
        wikiUrl: rt.wikiPhase ? `${wikiBase}&phase=${rt.wikiPhase}` : undefined,
        notify: rt.notify,
      });
      day += rt.cadence.everyDays;
    }
  }

  // Order chronological
  events.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  return events;
}

function buildEventDescription(e: EventTemplate): string {
  const parts: string[] = [e.description];
  if (e.checklistInline?.length) {
    parts.push("\n\n**Pasos:**");
    e.checklistInline.forEach((s) => parts.push(`- ${s}`));
  }
  if (e.expectedSignals?.length) {
    parts.push("\n\n**Señales esperadas:**");
    e.expectedSignals.forEach((s) => parts.push(`- ✅ ${s}`));
  }
  if (e.warningIf?.length) {
    parts.push("\n\n**⚠️ Atención si:**");
    e.warningIf.forEach((s) => parts.push(`- ${s}`));
  }
  return parts.join("\n");
}

function buildRecurringDescription(rt: RecurringTask): string {
  const parts: string[] = [];
  if (rt.description) parts.push(rt.description);
  if (rt.cadence.notes) parts.push(`\n_${rt.cadence.notes}_`);
  return parts.join("\n");
}
