// Detecta conflictos potenciales entre cultivos: solapamiento de eventos
// importantes (cosechas, milestones), recursos compartidos via consumibles.

import { db } from "./db";
import type { AppEvent } from "../types";
import { isWithinInterval, addDays } from "date-fns";

export interface Conflict {
  type: "overlap_milestones" | "stock_competition";
  severity: "info" | "warn" | "critical";
  cultivations: number[];
  message: string;
  date?: Date;
}

export async function detectConflicts(): Promise<Conflict[]> {
  const cultivations = await db.cultivations.toArray();
  const events = await db.events.toArray();
  const reservations = await db.stockReservations
    .where("status")
    .equals("reserved")
    .toArray();

  const active = cultivations.filter(
    (c) => c.status === "active" || c.status === "planning"
  );
  if (active.length < 2) return [];

  const conflicts: Conflict[] = [];

  // 1. Milestones que coinciden mismo día (cosechas, prep crítica)
  const importantEvents = events.filter(
    (e) =>
      e.status === "pending" &&
      ["harvest", "milestone", "preparation"].includes(e.type) &&
      active.some((c) => c.id === e.cultivationId)
  );

  const byDay = new Map<string, AppEvent[]>();
  for (const e of importantEvents) {
    const key = e.scheduledDate.toISOString().slice(0, 10);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }

  for (const [day, dayEvents] of byDay.entries()) {
    const cultIds = new Set(dayEvents.map((e) => e.cultivationId));
    if (cultIds.size > 1 && dayEvents.length >= 2) {
      conflicts.push({
        type: "overlap_milestones",
        severity: dayEvents.length >= 3 ? "warn" : "info",
        cultivations: Array.from(cultIds),
        message: `${dayEvents.length} eventos críticos en ${cultIds.size} cultivos el ${day}`,
        date: new Date(day),
      });
    }
  }

  // 2. Stock competition: mismo stockKey reservado por múltiples cultivos
  const byKey = new Map<string, { cultId: number; qty: number }[]>();
  for (const r of reservations) {
    if (!byKey.has(r.stockKey)) byKey.set(r.stockKey, []);
    byKey.get(r.stockKey)!.push({ cultId: r.cultivationId, qty: r.qty });
  }

  for (const [key, claims] of byKey.entries()) {
    const uniqueCults = new Set(claims.map((c) => c.cultId));
    if (uniqueCults.size < 2) continue;
    const total = claims.reduce((s, c) => s + c.qty, 0);
    const stock = await db.stock.where("key").equals(key).first();
    const available = stock?.qty ?? 0;
    if (total > available) {
      conflicts.push({
        type: "stock_competition",
        severity: "critical",
        cultivations: Array.from(uniqueCults),
        message: `${uniqueCults.size} cultivos compiten por ${key}: necesitan ${total}${claims[0].qty > 0 ? "" : ""}, hay ${available}`,
      });
    }
  }

  return conflicts;
}

// Sugerencia próximo cultivo: hueco temporal libre + stock suficiente
export async function suggestNextCultivo(): Promise<{
  templateId: string;
  reason: string;
} | null> {
  const cultivations = await db.cultivations.toArray();
  const events = await db.events.toArray();
  const active = cultivations.filter(
    (c) => c.status === "active" || c.status === "planning"
  );

  // Si no hay activos, sugiere mushroom-kit (más fácil)
  if (active.length === 0) {
    return {
      templateId: "mushroom-kit",
      reason: "Empezar primer cultivo. Setas Kit es la opción más fácil.",
    };
  }

  // Si hay 1 active de tipo X, sugiere otro tipo distinto
  // que no compita por mismo recurso (simplificación)
  const lastTemplateId = active[active.length - 1].templateId;

  // Eventos próximos 14 días
  const upcoming = events.filter(
    (e) =>
      e.status === "pending" &&
      isWithinInterval(e.scheduledDate, { start: new Date(), end: addDays(new Date(), 14) })
  );

  if (upcoming.length > 5) {
    return null; // Mucha actividad, no sugerir
  }

  // Sugerencia básica: si tienes setas → sugiere fermentar; si fermentaste → sugiere planta
  const suggestions: Record<string, { id: string; reason: string }> = {
    "mushroom-kit": { id: "ferment-hidromiel", reason: "Hidromiel usa equipo distinto, fermenta mientras setas crecen." },
    "mushroom-friendly": { id: "ferment-hidromiel", reason: "Hidromiel mientras setas." },
    "mushroom-advanced": { id: "ferment-hidromiel", reason: "Hidromiel mientras setas." },
    "cannabis-interior": { id: "ferment-cerveza", reason: "Cerveza usa cocina, no compite con armario cannabis." },
    "cannabis-exterior": { id: "mushroom-kit", reason: "Setas interior mientras cannabis crece fuera." },
    "ferment-hidromiel": { id: "mushroom-kit", reason: "Setas Kit fácil entre lotes hidromiel." },
    "ferment-cerveza": { id: "ferment-sidra", reason: "Sidra otoño usa mismo equipo." },
    "trufas": { id: "ferment-hidromiel", reason: "Hidromiel rápido mientras trufas incuban 90 días." },
  };

  const sug = suggestions[lastTemplateId];
  if (!sug) return null;
  return { templateId: sug.id, reason: sug.reason };
}
