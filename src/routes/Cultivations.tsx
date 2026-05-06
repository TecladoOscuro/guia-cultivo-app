import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { differenceInDays } from "date-fns";
import { db } from "../lib/db";
import { getTemplate } from "../templates";
import type { Cultivation, AppEvent } from "../types";

export default function Cultivations() {
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];
  const events = useLiveQuery(() => db.events.toArray(), []) ?? [];
  const [showHistory, setShowHistory] = useState(false);

  const active = cultivations.filter((c) => c.status === "active");
  const planning = cultivations.filter((c) => c.status === "planning");
  const history = cultivations.filter((c) => c.status === "completed" || c.status === "aborted");

  const getEventsForCult = (cultId: number | undefined) =>
    events.filter((e) => e.cultivationId === cultId);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-text-bright">🌱 Cultivos y elaboraciones</h1>
        <Link
          to="/new"
          className="px-3 py-2 bg-accent text-bg rounded-lg font-bold text-sm shrink-0"
        >
          ➕ Nuevo
        </Link>
      </div>

      {cultivations.length === 0 && <CultivationsEmpty />}

      {planning.length > 0 && (
        <Section title="📋 Planeados">
          {planning.map((c) => (
            <CultivationCard key={c.id} cultivation={c} events={getEventsForCult(c.id)} />
          ))}
        </Section>
      )}

      {active.length > 0 && (
        <Section title="🌿 En curso">
          {active.map((c) => (
            <CultivationCard key={c.id} cultivation={c} events={getEventsForCult(c.id)} />
          ))}
        </Section>
      )}

      {history.length > 0 && (
        <Section title={`📜 Histórico (${history.length})`} collapsible open={showHistory} onToggle={() => setShowHistory(!showHistory)}>
          {showHistory && history.map((c) => (
            <CultivationCard key={c.id} cultivation={c} events={getEventsForCult(c.id)} />
          ))}
        </Section>
      )}
    </div>
  );
}

function CultivationsEmpty() {
  return (
    <div className="text-center py-8 border border-border rounded">
      <div className="text-4xl mb-2">🌱</div>
      <p className="text-text-muted mb-3">No tienes cultivos todavía.</p>
      <Link
        to="/new"
        className="inline-block px-4 py-2 bg-accent text-bg rounded font-bold text-sm"
      >
        🚀 Empezar primer cultivo
      </Link>
    </div>
  );
}

function CultivationCard({ cultivation, events }: { cultivation: Cultivation; events: AppEvent[] }) {
  const done = events.filter((e) => e.status === "done").length;
  const total = events.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const daysInto = cultivation.status === "active" ? differenceInDays(new Date(), cultivation.startDate) + 1 : 0;
  const template = getTemplate(cultivation.templateId);
  const isFerment = template?.category === "fermento";
  const typeLabel = isFerment ? "elaboración" : "cultivo";

  const statusColors: Record<string, string> = {
    active: "border-l-accent",
    planning: "border-l-warn",
    completed: "border-l-success",
    aborted: "border-l-error",
  };

  return (
    <Link
      to={`/cultivations/${cultivation.id}`}
      className={`block p-4 border border-border rounded hover:border-accent transition border-l-4 ${statusColors[cultivation.status] ?? ""}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-text-bright text-sm">{template?.emoji} {cultivation.name}</div>
          <div className="text-xs text-text-muted">
            {cultivation.status === "planning" && `📋 Planeado · ${typeLabel}`}
            {cultivation.status === "active" && `🌿 Activo · ${typeLabel} · día ${daysInto}`}
            {cultivation.status === "completed" && "✅ Completado"}
            {cultivation.status === "aborted" && "⚠️ Abortado"}
            {total > 0 && ` · ${done}/${total} eventos`}
          </div>
        </div>
        <span className="text-text-muted text-xs">→</span>
      </div>
      {total > 0 && (
        <div className="mt-2 h-1 bg-bg-3 rounded overflow-hidden">
          <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </Link>
  );
}

function Section({
  title,
  children,
  collapsible,
  open,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  return (
    <section className="mb-6">
      <h2
        className={`text-sm font-bold text-text-bright mb-2 uppercase tracking-wide ${collapsible ? "cursor-pointer select-none flex items-center gap-2" : ""}`}
        onClick={collapsible ? onToggle : undefined}
      >
        {collapsible && <span>{open ? "▼" : "▶"}</span>}
        {title}
      </h2>
      <div className="grid gap-2">
        {children}
      </div>
    </section>
  );
}
