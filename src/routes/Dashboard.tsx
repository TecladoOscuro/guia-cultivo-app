import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { addDays, format, isToday, isPast, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "../lib/db";
import { calculateCapacity } from "../lib/stockPipeline";
import { listAvailableTemplates } from "../lib/cultivationActions";
import type { CapacityResult } from "../lib/stockPipeline";

export default function Dashboard() {
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];
  const events = useLiveQuery(() => db.events.toArray(), []) ?? [];
  const stocks = useLiveQuery(() => db.stock.toArray(), []) ?? [];

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

  const stats = {
    cultivosActivos: active.length,
    eventosHoy: today.length,
    eventosPendientes: events.filter((e) => e.status === "pending").length,
    eventosAtrasados: overdue.length,
    stockItems: stocks.length,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">🏠 Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Cultivos activos" value={stats.cultivosActivos} />
        <Stat label="Eventos hoy" value={stats.eventosHoy} />
        <Stat label="Atrasados" value={stats.eventosAtrasados} highlight={stats.eventosAtrasados > 0} />
        <Stat label="Items stock" value={stats.stockItems} />
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

      {upcoming.length > 0 && (
        <Section title="📅 Próximos 7 días">
          <EventList events={upcoming} cultivations={cultivations} limit={5} />
        </Section>
      )}

      <Section title="🌱 Cultivos activos">
        {active.length === 0 ? (
          <p className="text-text-muted">No tienes cultivos activos. <Link to="/new" className="text-accent">Empezar uno</Link></p>
        ) : (
          <div className="grid gap-2">
            {active.map((c) => {
              const cultEvents = events.filter((e) => e.cultivationId === c.id);
              const done = cultEvents.filter((e) => e.status === "done").length;
              const total = cultEvents.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              return (
                <Link
                  key={c.id}
                  to={`/calendar?highlight=${c.id}`}
                  className="block p-3 border border-border rounded hover:border-accent transition"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-text-bright">{c.name}</div>
                    <span className="text-xs text-text-muted">{c.status}</span>
                  </div>
                  <div className="text-xs text-text-muted">
                    Inicio {format(c.startDate, "PP", { locale: es })} · {done}/{total} eventos
                  </div>
                  <div className="mt-2 h-1.5 bg-bg-3 rounded overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="📊 Capacidad por template">
        <CapacityWidget />
      </Section>
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
  events: { id?: number; emoji: string; title: string; scheduledDate: Date; cultivationId: number }[];
  cultivations: { id?: number; name: string }[];
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
