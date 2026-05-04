import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { addDays, format, isToday, isPast, isWithinInterval, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "../lib/db";
import { calculateCapacity } from "../lib/stockPipeline";
import { listAvailableTemplates, abortCultivation, completeCultivation } from "../lib/cultivationActions";
import { getTemplate } from "../templates";
import { detectConflicts, suggestNextCultivo, type Conflict } from "../lib/planningConflicts";
import type { CapacityResult } from "../lib/stockPipeline";
import type { Cultivation, AppEvent } from "../types";

export default function Dashboard() {
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];
  const events = useLiveQuery(() => db.events.toArray(), []) ?? [];
  const stocks = useLiveQuery(() => db.stock.toArray(), []) ?? [];
  const prepItems = useLiveQuery(() => db.prepChecklists.toArray(), []) ?? [];
  const shopItems = useLiveQuery(() => db.shoppingList.toArray(), []) ?? [];

  const active = cultivations.filter((c) => c.status === "active" || c.status === "planning");
  const today = events.filter((e) => isToday(e.scheduledDate) && e.status === "pending");
  const upcoming = events.filter((e) =>
    isWithinInterval(e.scheduledDate, {
      start: addDays(new Date(), 1),
      end: addDays(new Date(), 7),
    }) && e.status === "pending"
  );
  const overdue = events.filter(
    (e) => isPast(e.scheduledDate) && !isToday(e.scheduledDate) && e.status === "pending"
  );

  // EMPTY STATE: sin cultivos, mostrar onboarding claro
  if (cultivations.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">🏠 Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Cultivos activos" value={active.length} />
        <Stat label="Eventos hoy" value={today.length} />
        <Stat label="Atrasados" value={overdue.length} highlight={overdue.length > 0} />
        <Stat label="Items stock" value={stocks.length} />
      </div>

      {today.length > 0 && (
        <Section title="🔥 Hoy">
          <EventList events={today} cultivations={cultivations} />
        </Section>
      )}

      {overdue.length > 0 && (
        <Section title="⚠️ Atrasados">
          <EventList events={overdue} cultivations={cultivations} />
        </Section>
      )}

      <Section title="🌱 Cultivos en curso">
        <div className="grid gap-3">
          {active.map((c) => (
            <CultivoCard
              key={c.id}
              cultivation={c}
              events={events.filter((e) => e.cultivationId === c.id)}
              prepItems={prepItems.filter((p) => p.cultivationId === c.id)}
              shopItems={shopItems.filter((s) => s.cultivationId === c.id)}
            />
          ))}
        </div>
      </Section>

      {upcoming.length > 0 && (
        <Section title="📅 Próximos 7 días">
          <EventList events={upcoming} cultivations={cultivations} limit={5} />
        </Section>
      )}

      <Section title="➕ Empezar otro cultivo">
        <Link
          to="/new"
          className="block p-3 border border-border rounded hover:border-accent text-sm text-center"
        >
          ➕ Nuevo cultivo
        </Link>
      </Section>

      <Section title="🎯 Planning automático">
        <PlanningWidget />
      </Section>

      <HistorySection cultivations={cultivations} />

      <Section title="📊 Capacidad por template">
        <CapacityWidget />
      </Section>
    </div>
  );
}

function HistorySection({ cultivations }: { cultivations: Cultivation[] }) {
  const [open, setOpen] = useState(false);
  const history = cultivations.filter((c) => c.status === "completed" || c.status === "aborted");

  if (history.length === 0) return null;

  return (
    <section className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm font-bold text-text-bright uppercase tracking-wide flex items-center gap-2"
      >
        <span>{open ? "▼" : "▶"}</span>
        <span>📜 Histórico ({history.length})</span>
      </button>
      {open && (
        <div className="grid gap-2 mt-2">
          {history.map((c) => (
            <HistoryCard key={c.id} cultivation={c} />
          ))}
        </div>
      )}
    </section>
  );
}

function HistoryCard({ cultivation }: { cultivation: Cultivation }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const onReactivate = async () => {
    if (!cultivation.id) return;
    if (!confirm(`Reactivar "${cultivation.name}"?`)) return;
    const { reactivateCultivation } = await import("../lib/cultivationActions");
    await reactivateCultivation(cultivation.id);
    setMenuOpen(false);
  };

  const onDelete = async () => {
    if (!cultivation.id) return;
    if (!confirm(`⚠️ BORRAR PERMANENTEMENTE "${cultivation.name}"?\n\nElimina TODOS los datos: eventos, journal, fotos, cosechas, sesiones. Irreversible.`)) return;
    if (!confirm("¿Seguro? Esta acción no se puede deshacer.")) return;
    const { deleteCultivationFully } = await import("../lib/cultivationActions");
    await deleteCultivationFully(cultivation.id);
    setMenuOpen(false);
  };

  return (
    <div className="p-3 border border-border rounded opacity-70 flex justify-between items-start gap-2">
      <div className="flex-1 min-w-0">
        <div className="font-bold text-text-bright text-sm">{cultivation.name}</div>
        <div className="text-xs text-text-muted">
          {cultivation.status === "completed" ? "✅ Completado" : "⚠️ Abortado"}
          {cultivation.endedAt && ` · ${format(cultivation.endedAt, "PP", { locale: es })}`}
        </div>
      </div>
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-text-muted hover:text-accent text-lg px-2"
        >
          ⋮
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 bg-bg-2 border border-border rounded shadow-lg min-w-[180px]">
              <button
                onClick={onReactivate}
                className="block w-full text-left px-3 py-2 text-sm text-success hover:bg-bg-3"
              >
                🔄 Reactivar
              </button>
              <button
                onClick={onDelete}
                className="block w-full text-left px-3 py-2 text-sm text-error hover:bg-bg-3"
              >
                🗑️ Borrar permanente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PlanningWidget() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [suggestion, setSuggestion] = useState<{ templateId: string; reason: string } | null>(null);
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];
  const reservations = useLiveQuery(() => db.stockReservations.toArray(), []) ?? [];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await detectConflicts();
      const s = await suggestNextCultivo();
      if (!cancelled) {
        setConflicts(c);
        setSuggestion(s);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cultivations, reservations]);

  return (
    <div className="grid gap-2">
      {conflicts.length === 0 ? (
        <div className="p-3 border border-success/40 rounded text-sm text-success">
          ✅ Sin conflictos detectados
        </div>
      ) : (
        conflicts.map((c, i) => (
          <div
            key={i}
            className={`p-3 border rounded text-sm ${
              c.severity === "critical"
                ? "border-error text-error"
                : c.severity === "warn"
                  ? "border-warn text-warn"
                  : "border-border text-text-muted"
            }`}
          >
            <div className="font-bold">
              {c.severity === "critical" ? "❌" : c.severity === "warn" ? "⚠️" : "ℹ️"} {c.message}
            </div>
            {c.date && (
              <div className="text-xs mt-1">
                {format(c.date, "PPPP", { locale: es })}
              </div>
            )}
          </div>
        ))
      )}

      {suggestion && (() => {
        const t = getTemplate(suggestion.templateId);
        if (!t) return null;
        return (
          <Link
            to="/new"
            className="p-3 border border-accent/40 bg-accent/5 rounded text-sm hover:border-accent transition"
          >
            <div className="font-bold text-accent">
              💡 Sugerencia: {t.emoji} {t.name}
            </div>
            <div className="text-xs text-text-muted mt-1">{suggestion.reason}</div>
          </Link>
        );
      })()}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">🌱</div>
      <h1 className="text-2xl font-bold text-text-bright mb-2">Bienvenido a Guía Cultivo</h1>
      <p className="text-text-muted mb-6 max-w-md mx-auto">
        Gestor de cultivos caseros. Calendario, stock, journal, sesiones. Todo en tu dispositivo, sin tracking.
      </p>
      <Link
        to="/new"
        className="inline-block px-6 py-3 bg-accent text-bg rounded-lg font-bold text-base"
      >
        🚀 Empezar primer cultivo
      </Link>

      <div className="mt-10 max-w-2xl mx-auto text-left">
        <h2 className="text-base font-bold text-text-bright mb-3 text-center">📖 Cómo usar la app</h2>
        <div className="grid gap-3">
          <Step n="1" title="Crea cultivo" desc="➕ Nuevo → elige tipo (setas, cannabis, hidromiel...) → fecha inicio. App genera calendario completo + lista compras + stock reservado." />
          <Step n="2" title="Compra lo que falte" desc="🛒 Compras → marca como comprado lo que adquieras → entra a tu stock automáticamente." />
          <Step n="3" title="Sigue el calendario" desc="📅 Calendario → cada día tienes eventos: regar, fertilizar, monitorizar. Click → modal con instrucciones detalladas. Marca '✅ Hecho' cuando completes." />
          <Step n="4" title="Documenta progreso" desc="📔 Journal → foto + nota diaria opcional para ver evolución. 📸 Timelapse compara fotos." />
          <Step n="5" title="Cosecha" desc="✂️ Cosechas → registra peso + calidad. Auto-crea entrada en 🫙 Inventario." />
          <Step n="6" title="Si algo va mal" desc="🔍 Diagnóstico → flowchart con preguntas → causas + acciones. Si quieres parar el cultivo: menú ⋮ en Dashboard → '⚠️ Abortar'." />
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="p-3 border border-border rounded flex gap-3">
      <div className="text-2xl font-bold text-accent shrink-0">{n}</div>
      <div>
        <div className="font-bold text-text-bright text-sm">{title}</div>
        <div className="text-xs text-text-muted">{desc}</div>
      </div>
    </div>
  );
}

function CultivoCard({
  cultivation,
  events,
  prepItems,
  shopItems,
}: {
  cultivation: Cultivation;
  events: AppEvent[];
  prepItems: { blocking: boolean; status: string }[];
  shopItems: { status: string }[];
}) {
  const done = events.filter((e) => e.status === "done").length;
  const total = events.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const blockingPending = prepItems.filter((p) => p.blocking && p.status !== "done").length;
  const shopPending = shopItems.filter((s) => s.status === "pending").length;

  // Días desde inicio
  const daysInto = differenceInDays(new Date(), cultivation.startDate);

  // Próximo evento pendiente
  const nextEvent = events
    .filter((e) => e.status === "pending" && !isPast(e.scheduledDate))
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())[0];

  // Atrasados
  const overdueCount = events.filter(
    (e) => e.status === "pending" && isPast(e.scheduledDate) && !isToday(e.scheduledDate)
  ).length;

  // Next action contextual segun status
  let nextAction: { label: string; to: string; emphasized?: boolean } | null = null;
  if (cultivation.status === "planning") {
    if (blockingPending > 0) {
      nextAction = { label: `✅ Completar ${blockingPending} tarea(s) preparación`, to: "/prep", emphasized: true };
    } else if (shopPending > 0) {
      nextAction = { label: `🛒 ${shopPending} compras pendientes`, to: "/shopping" };
    } else {
      nextAction = { label: "🚀 Iniciar cultivo", to: "/prep", emphasized: true };
    }
  } else if (cultivation.status === "active") {
    if (overdueCount > 0) {
      nextAction = { label: `⚠️ ${overdueCount} evento(s) atrasado(s)`, to: "/calendar", emphasized: true };
    } else if (nextEvent) {
      nextAction = {
        label: `📅 ${nextEvent.emoji} ${nextEvent.title}`,
        to: `/calendar?event=${nextEvent.id}`,
      };
    }
  }

  const [menuOpen, setMenuOpen] = useState(false);

  const onAbort = async () => {
    if (!cultivation.id) return;
    if (!confirm(`¿Abortar cultivo "${cultivation.name}"?\n\nLibera reservas de stock pendientes. Datos se conservan (puedes ver en histórico).`)) return;
    await abortCultivation(cultivation.id);
    setMenuOpen(false);
  };

  const onComplete = async () => {
    if (!cultivation.id) return;
    if (!confirm(`¿Marcar "${cultivation.name}" como completado?\n\nLibera reservas pendientes. Útil cuando ya cosechaste y todo OK.`)) return;
    await completeCultivation(cultivation.id);
    setMenuOpen(false);
  };

  return (
    <div className="p-4 border border-border rounded">
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-text-bright">{cultivation.name}</div>
          <div className="text-xs text-text-muted">
            {cultivation.status === "planning" ? "📋 planeado" : "🌿 activo"}
            {cultivation.status === "active" && ` · día ${daysInto + 1}`}
            {" · "}
            {done}/{total} eventos
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-text-muted hover:text-accent text-lg px-2"
            aria-label="Menú cultivo"
          >
            ⋮
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 bg-bg-2 border border-border rounded shadow-lg min-w-[180px]">
                <Link
                  to={`/calendar?cult=${cultivation.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm hover:bg-bg-3"
                >
                  📅 Ver eventos
                </Link>
                <Link
                  to="/journal"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm hover:bg-bg-3"
                >
                  📔 Journal
                </Link>
                <Link
                  to="/harvests"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm hover:bg-bg-3"
                >
                  ✂️ Cosechar
                </Link>
                <hr className="border-border my-1" />
                {cultivation.status === "active" && (
                  <button
                    onClick={onComplete}
                    className="block w-full text-left px-3 py-2 text-sm text-success hover:bg-bg-3"
                  >
                    ✅ Marcar completado
                  </button>
                )}
                <button
                  onClick={onAbort}
                  className="block w-full text-left px-3 py-2 text-sm text-warn hover:bg-bg-3"
                >
                  ⚠️ Abortar cultivo
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-2 h-1.5 bg-bg-3 rounded overflow-hidden mb-3">
        <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>

      {nextAction && (
        <Link
          to={nextAction.to}
          className={`block text-sm p-2 rounded transition ${
            nextAction.emphasized
              ? "bg-accent/15 border border-accent text-accent font-bold hover:bg-accent/25"
              : "bg-bg-3 border border-border text-text-bright hover:border-accent"
          }`}
        >
          {nextAction.label} →
        </Link>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div
      className={`p-3 border rounded ${
        highlight ? "border-error" : "border-border"
      }`}
    >
      <div className={`text-2xl font-bold ${highlight ? "text-error" : "text-text-bright"}`}>{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-sm font-bold text-text-bright mb-2 uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function EventList({
  events,
  cultivations,
  limit,
}: {
  events: AppEvent[];
  cultivations: Cultivation[];
  limit?: number;
}) {
  const list = limit ? events.slice(0, limit) : events;
  return (
    <div className="grid gap-2">
      {list.map((e) => {
        const c = cultivations.find((c) => c.id === e.cultivationId);
        return (
          <Link
            key={e.id}
            to={`/calendar?event=${e.id}`}
            className="block p-3 border border-border rounded hover:border-accent text-sm"
          >
            <div className="flex justify-between gap-2">
              <span className="font-bold text-text-bright">
                {e.emoji} {e.title}
              </span>
              <span className="text-xs text-text-muted whitespace-nowrap">
                {format(e.scheduledDate, "d MMM", { locale: es })}
              </span>
            </div>
            <div className="text-xs text-text-muted">{c?.name}</div>
          </Link>
        );
      })}
    </div>
  );
}

function CapacityWidget() {
  const [data, setData] = useState<{ template: ReturnType<typeof listAvailableTemplates>[number]; result: CapacityResult }[]>([]);
  const stocks = useLiveQuery(() => db.stock.toArray(), []) ?? [];
  const reservations = useLiveQuery(() => db.stockReservations.toArray(), []) ?? [];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const templates = listAvailableTemplates();
      const results = await Promise.all(
        templates.map(async (t) => ({ template: t, result: await calculateCapacity(t) }))
      );
      if (!cancelled) setData(results);
    })();
    return () => {
      cancelled = true;
    };
  }, [stocks, reservations]);

  if (data.length === 0) return <p className="text-text-muted">Cargando...</p>;

  return (
    <div className="grid gap-2">
      {data.map(({ template, result }) => (
        <div key={template.id} className="p-3 border border-border rounded">
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="font-bold text-text-bright">
                {template.emoji} {template.name}
              </div>
              {result.bottleneck && (
                <div className="text-xs text-text-muted">
                  Limitante: <code className="text-warn">{result.bottleneck.key}</code> tienes {result.bottleneck.have}{result.bottleneck.unit} de {result.bottleneck.need}{result.bottleneck.unit}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-accent">
                {result.capacity === Infinity ? "∞" : result.capacity}
              </div>
              <div className="text-xs text-text-muted">cultivos</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
