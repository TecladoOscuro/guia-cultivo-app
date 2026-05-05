import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { format, isToday, isPast, differenceInDays, addDays, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "../lib/db";
import { getTemplate } from "../templates";
import { abortCultivation, completeCultivation, reactivateCultivation, deleteCultivationFully, startCultivation } from "../lib/cultivationActions";
import { confirmDialog } from "../lib/confirmDialog";
import type { Cultivation, AppEvent, ShoppingItem, PrepChecklistItem, JournalEntry, Harvest, Stock } from "../types";

export default function CultivoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cultivationId = id ? Number(id) : null;

  const cultivation = useLiveQuery(() => (cultivationId ? db.cultivations.get(cultivationId) : undefined), [id]) as Cultivation | undefined;
  const events = useLiveQuery(() => (cultivationId ? db.events.where({ cultivationId }).toArray() : []), [id]) ?? [];
  const shopItems = useLiveQuery(() => (cultivationId ? db.shoppingList.where({ cultivationId }).toArray() : []), [id]) ?? [];
  const prepItems = useLiveQuery(() => (cultivationId ? db.prepChecklists.where({ cultivationId }).toArray() : []), [id]) ?? [];
  const journals = useLiveQuery(() => (cultivationId ? db.journal.where({ cultivationId }).reverse().sortBy("date") : []), [id]) ?? [];
  const harvests = useLiveQuery(() => (cultivationId ? db.harvests.where({ cultivationId }).toArray() : []), [id]) ?? [];
  const stocks = useLiveQuery(() => db.stock.toArray(), []) ?? [];

  const [actionBusy, setActionBusy] = useState(false);

  if (!cultivationId) return <div className="text-text-muted">ID inválido</div>;
  if (!cultivation) return <div className="text-text-muted">Cargando...</div>;

  const template = getTemplate(cultivation.templateId);
  const done = events.filter((e) => e.status === "done").length;
  const total = events.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const daysInto = cultivation.status === "active" ? differenceInDays(new Date(), cultivation.startDate) + 1 : 0;

  const now = new Date();
  const todayEvents = events.filter((e) => isToday(e.scheduledDate) && e.status === "pending");
  const overdueEvents = events.filter((e) => isPast(e.scheduledDate) && !isToday(e.scheduledDate) && e.status === "pending");
  const upcomingEvents = events
    .filter((e) => isWithinInterval(e.scheduledDate, { start: addDays(now, 1), end: addDays(now, 14) }) && e.status === "pending")
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  const statusColors: Record<string, string> = {
    active: "text-accent border-accent",
    planning: "text-warn border-warn",
    completed: "text-success border-success",
    aborted: "text-error border-error",
  };
  const statusLabels: Record<string, string> = {
    active: "🌿 Activo",
    planning: "📋 Planeado",
    completed: "✅ Completado",
    aborted: "⚠️ Abortado",
  };

  const onAbort = async () => {
    const ok = await confirmDialog({ title: "Abortar cultivo", message: `¿Abortar "${cultivation.name}"? Libera reservas, conserva datos.`, confirmLabel: "Abortar", danger: true });
    if (!ok) return;
    setActionBusy(true);
    await abortCultivation(cultivationId);
    setActionBusy(false);
  };

  const onComplete = async () => {
    const ok = await confirmDialog({ title: "Marcar completado", message: `¿Marcar "${cultivation.name}" como completado?`, confirmLabel: "Completar" });
    if (!ok) return;
    setActionBusy(true);
    await completeCultivation(cultivationId);
    setActionBusy(false);
  };

  const onReactivate = async () => {
    setActionBusy(true);
    await reactivateCultivation(cultivationId);
    setActionBusy(false);
  };

  const onDelete = async () => {
    const ok = await confirmDialog({ title: "Borrar permanentemente", message: `¿Borrar "${cultivation.name}" y todos sus datos? Irreversible.`, confirmLabel: "Borrar", danger: true });
    if (!ok) return;
    setActionBusy(true);
    await deleteCultivationFully(cultivationId);
    setActionBusy(false);
    navigate("/cultivations");
  };

  return (
    <div>
      <Link to="/cultivations" className="text-xs text-text-muted hover:text-accent mb-2 inline-block">← Cultivos</Link>

      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-2">
        <div>
          <h1 className="text-xl font-bold text-text-bright">
            {template?.emoji} {cultivation.name}
          </h1>
          <div className="text-xs text-text-muted mt-1">
            <span className={statusColors[cultivation.status]}>{statusLabels[cultivation.status]}</span>
            {cultivation.status === "active" && ` · día ${daysInto} de ${template?.totalDuration.days ?? "?"}`}
            {` · desde ${format(cultivation.startDate, "d MMM yyyy", { locale: es })}`}
          </div>
        </div>
        <ActionsMenu
          cultivation={cultivation}
          busy={actionBusy}
          onAbort={onAbort}
          onComplete={onComplete}
          onReactivate={onReactivate}
          onDelete={onDelete}
        />
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>{done}/{total} eventos completados</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 bg-bg-3 rounded overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {/* Start button for planning cultivations — blocked until essentials ready */}
      {cultivation.status === "planning" && (() => {
        const essentials = computeReadiness(shopItems, prepItems, stocks);
        const canStart = essentials.missing.length === 0;

        return (
          <div className="mb-4">
            {!canStart && (
              <div className="p-3 border border-warn/50 bg-warn/5 rounded text-xs mb-2">
                <div className="font-bold text-warn mb-1">⚠️ Antes de iniciar necesitas:</div>
                <ul className="grid gap-0.5">
                  {essentials.missing.map((m, i) => (
                    <li key={i} className="text-text-muted">• {m}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={async () => {
                if (!canStart) return;
                const ok = await confirmDialog({
                  title: "Iniciar cultivo",
                  message: `¿Iniciar "${cultivation.name}" ahora?\n\nSe generarán los eventos en el calendario a partir de hoy y se reservará el stock necesario.`,
                  confirmLabel: "🚀 Iniciar",
                });
                if (!ok) return;
                setActionBusy(true);
                try {
                  await startCultivation(cultivationId);
                } catch (_) {}
                setActionBusy(false);
              }}
              disabled={actionBusy || !canStart}
              className={`w-full p-4 rounded-lg font-bold text-base transition active:scale-[0.98] disabled:opacity-50 ${
                canStart
                  ? "bg-accent text-bg hover:brightness-110"
                  : "bg-bg-3 text-text-muted border border-border cursor-not-allowed"
              }`}
            >
              {canStart ? "🚀 Iniciar cultivo — empezar hoy" : "🔒 Te faltan cosas para iniciar"}
            </button>
          </div>
        );
      })()}

      {/* Prep checklist — recordatorio, no bloquea */}
      {(cultivation.status === "active" || cultivation.status === "planning") && prepItems.length > 0 && (
        <DetailSection title="✅ Preparación" emoji="📋">
          <PrepSection items={prepItems} />
        </DetailSection>
      )}

      {/* Shopping list for this cultivation */}
      {shopItems.length > 0 && (
        <DetailSection title="🛒 Compras de este cultivo" emoji="🛒">
          <ShoppingSection items={shopItems} stocks={stocks} />
        </DetailSection>
      )}

      {/* Events: Hoy + Atrasados + Próximos */}
      {todayEvents.length > 0 && (
        <DetailSection title="🔥 Hoy" emoji="🔥">
          <EventList events={todayEvents} />
        </DetailSection>
      )}

      {overdueEvents.length > 0 && (
        <DetailSection title="⚠️ Atrasados" emoji="⚠️">
          <EventList events={overdueEvents} />
        </DetailSection>
      )}

      {upcomingEvents.length > 0 && (
        <DetailSection title="📅 Próximos eventos" emoji="📅">
          <EventList events={upcomingEvents.slice(0, 10)} />
        </DetailSection>
      )}

      {/* Journal (last 5) */}
      {journals.length > 0 && (
        <DetailSection title="📔 Journal" emoji="📔">
          <JournalSection entries={journals.slice(0, 5)} />
        </DetailSection>
      )}

      {/* Harvests */}
      {harvests.length > 0 && (
        <DetailSection title="✂️ Cosechas" emoji="✂️">
          <HarvestSection harvests={harvests} />
        </DetailSection>
      )}

      {cultivation.status === "planning" && prepItems.length === 0 && (
        <div className="p-4 border border-border rounded text-center">
          <p className="text-text-muted text-sm mb-2">Sin tareas de preparación definidas.</p>
          <Link to="/calendar" className="text-accent text-sm font-bold">Ver calendario →</Link>
        </div>
      )}
    </div>
  );
}

function ActionsMenu({
  cultivation,
  busy,
  onAbort,
  onComplete,
  onReactivate,
  onDelete,
}: {
  cultivation: Cultivation;
  busy: boolean;
  onAbort: () => void;
  onComplete: () => void;
  onReactivate: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={busy}
        className="px-3 py-2 border border-border rounded text-sm hover:border-accent"
      >
        ⋮ Acciones
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-bg-2 border border-border rounded shadow-lg min-w-[180px]">
            {(cultivation.status === "active" || cultivation.status === "planning") && (
              <button onClick={() => { onComplete(); setOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-success hover:bg-bg-3">
                ✅ Marcar completado
              </button>
            )}
            {(cultivation.status === "completed" || cultivation.status === "aborted") && (
              <button onClick={() => { onReactivate(); setOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-accent hover:bg-bg-3">
                🔄 Reactivar
              </button>
            )}
            {(cultivation.status === "active" || cultivation.status === "planning") && (
              <button onClick={() => { onAbort(); setOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-warn hover:bg-bg-3">
                ⚠️ Abortar
              </button>
            )}
            <button onClick={() => { onDelete(); setOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-error hover:bg-bg-3">
              🗑️ Borrar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DetailSection({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <section className="mb-4 border border-border rounded overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2 bg-bg-2 hover:bg-bg-3 transition text-left"
      >
        <h2 className="text-sm font-bold text-text-bright">{emoji} {title}</h2>
        <span className="text-xs text-text-muted">{collapsed ? "▶" : "▼"}</span>
      </button>
      {!collapsed && <div className="px-4 py-3">{children}</div>}
    </section>
  );
}

function PrepSection({ items }: { items: PrepChecklistItem[] }) {
  const toggle = async (item: PrepChecklistItem) => {
    if (item.id === undefined) return;
    const isDone = item.status === "done";
    await db.prepChecklists.update(item.id, {
      status: isDone ? "pending" : "done",
      completedAt: isDone ? undefined : new Date(),
    });
  };

  return (
    <div className="grid gap-2">
      {items.map((it) => {
        const isDone = it.status === "done";
        return (
          <button
            key={it.id}
            onClick={() => toggle(it)}
            className={`text-left p-2 border rounded flex items-start gap-2 text-sm ${
              isDone ? "border-success/40 opacity-70" : "border-border hover:border-accent"
            }`}
          >
            <span>{isDone ? "✅" : "⬜"}</span>
            <div className="flex-1 min-w-0">
              <span className={isDone ? "line-through text-text-muted" : "text-text-bright"}>
                {it.title}
              </span>
              {it.blocking && !isDone && <span className="ml-1 text-xs text-warn">recomendado</span>}
              {it.description && <div className="text-xs text-text-muted mt-0.5">{it.description}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ShoppingSection({ items, stocks }: { items: ShoppingItem[]; stocks: Stock[] }) {
  const markPurchased = async (item: ShoppingItem) => {
    if (item.id === undefined) return;
    await db.shoppingList.update(item.id, { status: "purchased", purchasedAt: new Date() });
    const fresh = await db.stock.toArray();
    const existing = fresh.find((s) => s.key === item.itemKey);
    if (existing?.id !== undefined) {
      await db.stock.update(existing.id, { qty: existing.qty + item.qty });
    } else {
      await db.stock.add({ key: item.itemKey, name: item.name, category: "fungible", qty: item.qty, unit: item.unit, addedAt: new Date() } as Stock);
    }
  };

  const pendingItems = items.filter((i) => i.status === "pending");
  const purchasedItems = items.filter((i) => i.status === "purchased");

  return (
    <div className="grid gap-2">
      {pendingItems.length === 0 && purchasedItems.length === 0 && (
        <div className="text-xs text-text-muted">Sin compras necesarias.</div>
      )}

      {pendingItems.map((it) => {
        const inStock = stocks.find((s) => s.key === it.itemKey);
        return (
          <div key={it.id} className="flex justify-between items-center gap-2 p-2 border border-border rounded">
            <div className="flex-1 min-w-0">
              <div className="text-sm text-text-bright">{it.name}</div>
              <div className="text-xs text-text-muted">
                {it.qty}{it.unit}{it.approxPrice ? ` · ${it.approxPrice}` : ""}
                {inStock && ` · 📦 tienes ${inStock.qty}${inStock.unit}`}
              </div>
            </div>
            <button
              onClick={() => markPurchased(it)}
              className="px-2 py-1 bg-success text-bg rounded text-xs font-bold whitespace-nowrap"
            >
              🛒 Comprado
            </button>
          </div>
        );
      })}

      {purchasedItems.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-text-muted">✅ Cubierto ({purchasedItems.length})</summary>
          <div className="mt-2 grid gap-1">
            {purchasedItems.map((it) => {
              const autoCovered = !it.purchasedAt; // auto-marked at creation because stock existed
              return (
                <div key={it.id} className="p-2 border border-success/30 bg-success/5 rounded text-sm flex justify-between">
                  <span className="text-success">{it.name} · {it.qty}{it.unit}</span>
                  <span className="text-xs text-success/70">{autoCovered ? "ya lo tenías" : "comprado"}</span>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}

function EventList({ events }: { events: AppEvent[] }) {
  return (
    <div className="grid gap-2">
      {events.map((e) => {
        const dateStr = format(e.scheduledDate, "d MMM", { locale: es });
        return (
          <Link
            key={e.id}
            to={`/calendar?event=${e.id}`}
            className="block p-2 border border-border rounded hover:border-accent text-sm"
          >
            <div className="flex justify-between gap-2">
              <span className="text-text-bright">{e.emoji} {e.title}</span>
              <span className="text-xs text-text-muted whitespace-nowrap">{dateStr}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function JournalSection({ entries }: { entries: JournalEntry[] }) {
  return (
    <div>
      <div className="grid gap-2 mb-2">
        {entries.map((e) => (
          <div key={e.id} className="p-2 border border-border rounded text-sm">
            <div className="text-xs text-text-muted">{format(e.date, "d MMM yyyy", { locale: es })}</div>
            <div className="text-text-bright mt-1">{e.note}</div>
            {e.mood != null && <div className="text-xs text-text-muted mt-0.5">{"⭐".repeat(e.mood)}</div>}
          </div>
        ))}
      </div>
      <Link to="/journal" className="text-xs text-accent hover:underline">Ver todo el journal →</Link>
    </div>
  );
}

function HarvestSection({ harvests }: { harvests: Harvest[] }) {
  return (
    <div>
      <div className="grid gap-2 mb-2">
        {harvests.map((h) => (
          <div key={h.id} className="p-2 border border-border rounded text-sm">
            <div className="flex justify-between">
              <span className="text-text-bright font-bold">{h.type}</span>
              <span className="text-xs text-text-muted">{format(h.date, "d MMM yyyy", { locale: es })}</span>
            </div>
            <div className="text-xs text-text-muted mt-1">
              {h.weightWet != null && `Fresco: ${h.weightWet}g `}
              {h.weightDry != null && `Seco: ${h.weightDry}g `}
              {h.quality != null && `· Calidad: ${"⭐".repeat(h.quality)}`}
            </div>
          </div>
        ))}
      </div>
      <Link to="/harvests" className="text-xs text-accent hover:underline">Registrar cosecha →</Link>
    </div>
  );
}

function computeReadiness(
  shopItems: ShoppingItem[],
  prepItems: PrepChecklistItem[],
  stocks: Stock[],
): { missing: string[] } {
  const missing: string[] = [];

  // Blocking prep items not done
  const blockingPending = prepItems.filter((p) => p.blocking && p.status !== "done");
  for (const p of blockingPending) {
    missing.push(`Preparación: ${p.title}`);
  }

  // Essential shopping items not covered by stock
  const essentialItems = shopItems.filter((s) => s.category === "esencial" && s.status !== "purchased");
  for (const s of essentialItems) {
    const inStock = stocks.find((st) => st.key === s.itemKey);
    if (!inStock || inStock.qty < s.qty) {
      const have = inStock ? ` (tienes ${inStock.qty}${inStock.unit})` : " (no tienes)";
      missing.push(`${s.name}: necesitas ${s.qty}${s.unit}${have}`);
    }
  }

  return { missing };
}
