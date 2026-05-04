import { db } from "./db";
import type { CultivoTemplate } from "../types";

export interface StockCheck {
  ok: boolean;
  missing: { stockKey: string; need: number; have: number; unit: string }[];
  total: { stockKey: string; need: number; unit: string }[];
}

export async function checkAvailability(
  template: CultivoTemplate
): Promise<StockCheck> {
  const totals = computeConsumptionTotals(template);
  const stocksByKey = await getStockAvailable();

  const missing: StockCheck["missing"] = [];
  for (const t of totals) {
    const have = stocksByKey[t.stockKey] ?? 0;
    if (have < t.need) {
      missing.push({
        stockKey: t.stockKey,
        need: t.need,
        have,
        unit: t.unit,
      });
    }
  }

  return { ok: missing.length === 0, missing, total: totals };
}

export async function reserveAll(
  cultivationId: number,
  template: CultivoTemplate
): Promise<number[]> {
  const totals = computeConsumptionTotals(template);
  const ids: number[] = [];
  for (const t of totals) {
    const id = (await db.stockReservations.add({
      stockKey: t.stockKey,
      cultivationId,
      qty: t.need,
      unit: t.unit,
      status: "reserved",
      createdAt: new Date(),
    })) as number;
    ids.push(id);
  }
  return ids;
}

export async function releasePending(cultivationId: number) {
  const reservs = await db.stockReservations
    .where({ cultivationId })
    .and((r) => r.status === "reserved")
    .toArray();
  for (const r of reservs) {
    if (r.id !== undefined) {
      await db.stockReservations.update(r.id, { status: "released" });
    }
  }
}

export async function consume(reservationId: number) {
  const r = await db.stockReservations.get(reservationId);
  if (!r || !r.id) return;
  if (r.status !== "reserved") return;

  const stock = await db.stock.where("key").equals(r.stockKey).first();
  if (stock?.id !== undefined) {
    await db.stock.update(stock.id, { qty: stock.qty - r.qty });
  }
  await db.stockReservations.update(r.id, {
    status: "consumed",
    consumedAt: new Date(),
  });
}

export async function getStockAvailable(): Promise<Record<string, number>> {
  const stocks = await db.stock.toArray();
  const reservs = await db.stockReservations
    .where("status")
    .equals("reserved")
    .toArray();

  const availableByKey: Record<string, number> = {};
  for (const s of stocks) {
    availableByKey[s.key] = (availableByKey[s.key] ?? 0) + s.qty;
  }
  for (const r of reservs) {
    availableByKey[r.stockKey] = (availableByKey[r.stockKey] ?? 0) - r.qty;
  }
  return availableByKey;
}

function computeConsumptionTotals(template: CultivoTemplate) {
  const totals: Record<string, { qty: number; unit: string }> = {};

  // Direct template.consumables (trigger: once)
  for (const c of template.consumables) {
    if (c.trigger === "once") {
      add(totals, c.stockKey, c.qty, c.unit);
    }
  }

  // Per-event consumables
  for (const e of template.events) {
    if (!e.consumes) continue;
    for (const c of e.consumes) {
      add(totals, c.stockKey, c.qty, c.unit);
    }
  }

  // Per-recurring consumables (qty × number of occurrences)
  for (const rt of template.recurringTasks) {
    if (!rt.consumes) continue;
    const occurrences = Math.max(
      1,
      Math.floor((rt.endDayOffset - rt.startDayOffset) / rt.cadence.everyDays) + 1
    );
    for (const c of rt.consumes) {
      add(totals, c.stockKey, c.qty * occurrences, c.unit);
    }
  }

  return Object.entries(totals).map(([stockKey, v]) => ({
    stockKey,
    need: v.qty,
    unit: v.unit,
  }));
}

function add(
  acc: Record<string, { qty: number; unit: string }>,
  key: string,
  qty: number,
  unit: string
) {
  if (!acc[key]) acc[key] = { qty: 0, unit };
  acc[key].qty += qty;
}

// Capacity calculator
export interface CapacityResult {
  capacity: number; // Infinity if no consumables
  bottleneck: { key: string; have: number; need: number; unit: string } | null;
}

export async function calculateCapacity(
  template: CultivoTemplate
): Promise<CapacityResult> {
  const totals = computeConsumptionTotals(template);
  if (totals.length === 0) return { capacity: Infinity, bottleneck: null };

  const stocksByKey = await getStockAvailable();
  let minN = Infinity;
  let bottleneck: CapacityResult["bottleneck"] = null;
  for (const t of totals) {
    const have = stocksByKey[t.stockKey] ?? 0;
    const n = t.need > 0 ? Math.floor(have / t.need) : Infinity;
    if (n < minN) {
      minN = n;
      bottleneck = { key: t.stockKey, have, need: t.need, unit: t.unit };
    }
  }
  return { capacity: minN, bottleneck };
}
