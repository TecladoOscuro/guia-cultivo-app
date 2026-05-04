import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { format, isToday, isPast, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "../lib/db";
import { completeEvent } from "../lib/cultivationActions";
import type { AppEvent, Cultivation } from "../types";

export default function Calendar() {
  const [filterCultivo, setFilterCultivo] = useState<number | "all">("all");
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);

  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];
  const events = useLiveQuery(async () => {
    const all = await db.events.toArray();
    return all.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  }, []) ?? [];

  const filtered = events.filter(
    (e) => filterCultivo === "all" || e.cultivationId === filterCultivo
  );

  const grouped = groupByDay(filtered);

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">📅 Calendario</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setFilterCultivo("all")}
          className={`px-3 py-1 text-xs rounded border ${
            filterCultivo === "all"
              ? "bg-accent text-bg border-accent font-bold"
              : "border-border hover:border-accent"
          }`}
        >
          Todos ({events.length})
        </button>
        {cultivations.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterCultivo(c.id!)}
            className={`px-3 py-1 text-xs rounded border ${
              filterCultivo === c.id
                ? "bg-accent text-bg border-accent font-bold"
                : "border-border hover:border-accent"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">Sin eventos. Crea un cultivo en ➕ Nuevo.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {grouped.map(({ date, dayEvents }) => (
            <div key={date.toISOString()}>
              <div
                className={`text-xs font-bold mb-2 ${
                  isToday(date)
                    ? "text-accent"
                    : isPast(date) && !isToday(date)
                      ? "text-text-muted"
                      : "text-text-bright"
                }`}
              >
                {isToday(date) ? "HOY · " : ""}
                {format(date, "EEEE d MMMM yyyy", { locale: es })}
              </div>
              <div className="grid gap-2">
                {dayEvents.map((e) => (
                  <EventRow
                    key={e.id}
                    event={e}
                    cultivation={cultivations.find((c) => c.id === e.cultivationId)}
                    onClick={() => setSelectedEvent(e)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          cultivation={cultivations.find((c) => c.id === selectedEvent.cultivationId)}
          onClose={() => setSelectedEvent(null)}
          onDone={async () => {
            if (selectedEvent.id) await completeEvent(selectedEvent.id);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}

function EventRow({
  event,
  cultivation,
  onClick,
}: {
  event: AppEvent;
  cultivation?: Cultivation;
  onClick: () => void;
}) {
  const isOverdue =
    isPast(event.scheduledDate) && !isToday(event.scheduledDate) && event.status === "pending";
  const isDone = event.status === "done";
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 border rounded transition flex items-center gap-3 w-full ${
        isDone
          ? "border-border opacity-50"
          : isOverdue
            ? "border-error hover:border-error"
            : "border-border hover:border-accent"
      }`}
    >
      <span className="text-2xl">{event.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-bold ${isDone ? "line-through" : "text-text-bright"}`}>
          {event.title}
        </div>
        <div className="text-xs text-text-muted truncate">
          {cultivation?.name ?? "?"} · {event.type}
          {isOverdue && " · ⚠️ atrasado"}
          {isDone && " · ✅ hecho"}
        </div>
      </div>
    </button>
  );
}

function EventModal({
  event,
  cultivation,
  onClose,
  onDone,
}: {
  event: AppEvent;
  cultivation?: Cultivation;
  onClose: () => void;
  onDone: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-bg-2 border border-border rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-3xl mb-1">{event.emoji}</div>
            <h2 className="text-lg font-bold text-text-bright">{event.title}</h2>
            <div className="text-xs text-text-muted">
              {cultivation?.name} · {format(event.scheduledDate, "PP", { locale: es })}
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-bright text-xl">
            ✕
          </button>
        </div>

        <div className="text-sm whitespace-pre-line mb-4">{event.description}</div>

        {event.wikiUrl && (
          <a
            href={event.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-3 py-2 border border-border rounded text-xs hover:border-accent mb-4"
          >
            📖 Saber más en wiki ↗
          </a>
        )}

        <div className="flex gap-2">
          {event.status !== "done" && (
            <button onClick={onDone} className="px-4 py-2 bg-success text-bg rounded font-bold">
              ✅ Marcar como hecho
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded hover:border-accent"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function groupByDay(events: AppEvent[]) {
  const map = new Map<string, AppEvent[]>();
  for (const e of events) {
    const key = startOfDay(e.scheduledDate).toISOString();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).map(([iso, dayEvents]) => ({
    date: new Date(iso),
    dayEvents,
  }));
}
