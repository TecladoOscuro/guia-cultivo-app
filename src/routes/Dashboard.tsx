import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { addDays, format, isToday, isPast, isWithinInterval, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "../lib/db";
import type { Cultivation, AppEvent } from "../types";

export default function Dashboard() {
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];
  const events = useLiveQuery(() => db.events.toArray(), []) ?? [];

  const active = cultivations.filter((c) => c.status === "active" || c.status === "planning");
  const today = events.filter((e) => isToday(e.scheduledDate) && e.status === "pending");
  const upcoming = events.filter(
    (e) =>
      isWithinInterval(e.scheduledDate, { start: addDays(new Date(), 1), end: addDays(new Date(), 7) }) &&
      e.status === "pending"
  );
  const overdue = events.filter(
    (e) => isPast(e.scheduledDate) && !isToday(e.scheduledDate) && e.status === "pending"
  );

  if (cultivations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-3">🌱</div>
        <h1 className="text-xl font-bold text-text-bright mb-2">Bienvenido a Guía Cultivo</h1>
        <p className="text-text-muted mb-4 max-w-sm mx-auto text-sm">
          Gestor de cultivos caseros. Calendario, stock, journal — todo en tu dispositivo.
        </p>
        <Link to="/new" className="inline-block px-5 py-2.5 bg-accent text-bg rounded-lg font-bold">
          🚀 Empezar primer cultivo
        </Link>

        <div className="mt-8 max-w-lg mx-auto text-left">
          <h2 className="text-sm font-bold text-text-bright mb-3 text-center">¿Cómo funciona?</h2>
          <div className="grid gap-2">
            <Step n="1" title="Crea un cultivo" desc="➕ Nuevo → elige tipo → fecha inicio. App genera calendario + lista compras + stock reservado." />
            <Step n="2" title="Compra lo que falte" desc="📦 Stock → pestaña Compras → marca comprado. Entra a tu stock automáticamente." />
            <Step n="3" title="Sigue el calendario" desc="📅 Cada día tienes eventos con instrucciones. Marca ✅ Hecho cuando completes." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-text-bright mb-3">🏠 Hoy</h1>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat label="Activos" value={active.length} />
        <Stat label="Hoy" value={today.length} highlight={today.length > 0} />
        <Stat label="Atrasados" value={overdue.length} highlight={overdue.length > 0} />
      </div>

      {overdue.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold text-error mb-2 uppercase tracking-wide">⚠️ Atrasados</h2>
          <EventList events={overdue} cultivations={cultivations} />
        </section>
      )}

      {today.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold text-accent mb-2 uppercase tracking-wide">🔥 Hoy</h2>
          <EventList events={today} cultivations={cultivations} />
        </section>
      )}

      <section className="mb-4">
        <h2 className="text-sm font-bold text-text-bright mb-2 uppercase tracking-wide">🌱 Cultivos en curso</h2>
        <div className="grid gap-2">
          {active.map((c) => (
            <CultivoCard
              key={c.id}
              cultivation={c}
              events={events.filter((e) => e.cultivationId === c.id)}
            />
          ))}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="mb-4">
          <h2 className="text-sm font-bold text-text-bright mb-2 uppercase tracking-wide">📅 Próximos 7 días</h2>
          <EventList events={upcoming.slice(0, 5)} cultivations={cultivations} />
        </section>
      )}

      <Link
        to="/new"
        className="block p-3 border border-border rounded text-center text-sm text-text-muted hover:border-accent transition"
      >
        ➕ Empezar otro cultivo
      </Link>
    </div>
  );
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <div className="p-2 border border-border rounded flex gap-2">
      <div className="text-xl font-bold text-accent shrink-0 leading-none">{n}</div>
      <div>
        <div className="font-bold text-text-bright text-xs">{title}</div>
        <div className="text-xs text-text-muted">{desc}</div>
      </div>
    </div>
  );
}

function CultivoCard({ cultivation, events }: { cultivation: Cultivation; events: AppEvent[] }) {
  const done = events.filter((e) => e.status === "done").length;
  const total = events.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const daysInto = cultivation.status === "active" ? differenceInDays(new Date(), cultivation.startDate) + 1 : 0;

  const overdueCount = events.filter(
    (e) => e.status === "pending" && isPast(e.scheduledDate) && !isToday(e.scheduledDate)
  ).length;

  const nextEvent = events
    .filter((e) => e.status === "pending" && !isPast(e.scheduledDate))
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())[0];

  let nextActionLabel: string | null = null;
  let nextActionEmoji: string | null = null;
  let linkTo: string | null = null;

  if (cultivation.status === "planning") {
    nextActionLabel = "Completar preparación";
    nextActionEmoji = "📋";
    linkTo = `/cultivations/${cultivation.id}`;
  } else if (cultivation.status === "active") {
    if (overdueCount > 0) {
      nextActionLabel = `${overdueCount} atrasados`;
      nextActionEmoji = "⚠️";
      linkTo = "/calendar";
    } else if (nextEvent) {
      nextActionLabel = nextEvent.title;
      nextActionEmoji = nextEvent.emoji;
      linkTo = `/calendar?event=${nextEvent.id}`;
    }
  }

  const statusColors: Record<string, string> = {
    active: "border-l-accent",
    planning: "border-l-warn",
  };

  return (
    <div className={`p-3 border border-border rounded border-l-4 ${statusColors[cultivation.status] ?? ""}`}>
      <div className="flex justify-between items-start gap-2 mb-1">
        <Link to={`/cultivations/${cultivation.id}`} className="font-bold text-text-bright text-sm hover:text-accent truncate">
          {cultivation.name}
        </Link>
        <span className="text-xs text-text-muted whitespace-nowrap">
          {cultivation.status === "planning" ? "📋 Planeado" : `🌿 Día ${daysInto}`}
        </span>
      </div>

      {total > 0 && (
        <div className="h-1.5 bg-bg-3 rounded overflow-hidden mb-2">
          <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      {linkTo && (
        <Link
          to={linkTo}
          className={`block text-xs p-1.5 rounded transition ${
            overdueCount > 0
              ? "bg-error/10 border border-error/40 text-error font-bold"
              : "bg-bg-3 border border-border text-text-bright hover:border-accent"
          }`}
        >
          {nextActionEmoji} {nextActionLabel} →
        </Link>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`p-2 border rounded text-center ${highlight ? "border-error" : "border-border"}`}>
      <div className={`text-lg font-bold ${highlight ? "text-error" : "text-text-bright"}`}>{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}

function EventList({ events, cultivations }: { events: AppEvent[]; cultivations: Cultivation[] }) {
  return (
    <div className="grid gap-1.5">
      {events.map((e) => {
        const c = cultivations.find((c) => c.id === e.cultivationId);
        return (
          <Link
            key={e.id}
            to={`/calendar?event=${e.id}`}
            className="block p-2 border border-border rounded hover:border-accent text-sm"
          >
            <div className="flex justify-between gap-2">
              <span className="font-bold text-text-bright">{e.emoji} {e.title}</span>
              <span className="text-xs text-text-muted whitespace-nowrap">
                {format(e.scheduledDate, "d MMM", { locale: es })}
              </span>
            </div>
            {c && <div className="text-xs text-text-muted">{c.name}</div>}
          </Link>
        );
      })}
    </div>
  );
}
