import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Temporal } from "@js-temporal/polyfill";
import { ScheduleXCalendar, useCalendarApp } from "@schedule-x/react";
import {
  createViewMonthGrid,
  createViewWeek,
  createViewDay,
  createViewMonthAgenda,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import { createCurrentTimePlugin } from "@schedule-x/current-time";
import { createDragAndDropPlugin } from "@schedule-x/drag-and-drop";
import "@schedule-x/theme-default/dist/index.css";
import { db } from "../lib/db";
import { completeEvent, markSkipped } from "../lib/cultivationActions";
import { confirmDialog } from "../lib/confirmDialog";
import {
  createManualEvent,
  updateEvent,
  deleteEvent,
  rescheduleEvent,
} from "../lib/eventActions";
import type { AppEvent, Cultivation, EventType } from "../types";

const PALETTE = [
  { id: "p1", colorName: "p1", lightColors: { main: "#52b788", container: "#1a3322", onContainer: "#d8e0e6" }, darkColors: { main: "#52b788", container: "#1a3322", onContainer: "#d8e0e6" } },
  { id: "p2", colorName: "p2", lightColors: { main: "#8a6240", container: "#3d2810", onContainer: "#f5e6d0" }, darkColors: { main: "#8a6240", container: "#3d2810", onContainer: "#f5e6d0" } },
  { id: "p3", colorName: "p3", lightColors: { main: "#9070b8", container: "#2e1f3d", onContainer: "#e8d8ee" }, darkColors: { main: "#9070b8", container: "#2e1f3d", onContainer: "#e8d8ee" } },
  { id: "p4", colorName: "p4", lightColors: { main: "#e88a6a", container: "#3d1f10", onContainer: "#fde8d8" }, darkColors: { main: "#e88a6a", container: "#3d1f10", onContainer: "#fde8d8" } },
  { id: "p5", colorName: "p5", lightColors: { main: "#74a8d8", container: "#1a2a3d", onContainer: "#d8e8f5" }, darkColors: { main: "#74a8d8", container: "#1a2a3d", onContainer: "#d8e8f5" } },
];

const EVENT_TYPES: { id: EventType; label: string; emoji: string }[] = [
  { id: "milestone", label: "Hito", emoji: "🎯" },
  { id: "watering", label: "Riego", emoji: "💧" },
  { id: "feeding", label: "Fertilización", emoji: "🌿" },
  { id: "monitoring", label: "Monitoreo", emoji: "🔍" },
  { id: "harvest", label: "Cosecha", emoji: "✂️" },
  { id: "preparation", label: "Preparación", emoji: "📦" },
  { id: "session", label: "Sesión", emoji: "🌌" },
];

function toPlainDate(d: Date): Temporal.PlainDate {
  return Temporal.PlainDate.from({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  });
}

function plainDateStrToDate(s: string | Temporal.PlainDate): Date {
  if (typeof s === "string") {
    // Parser "YYYY-MM-DD" o "YYYY-MM-DD HH:mm"
    const [d] = s.split(" ");
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day);
  }
  return new Date(s.year, s.month - 1, s.day);
}

export default function Calendar() {
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editing, setEditing] = useState<AppEvent | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];
  const events = useLiveQuery(() => db.events.toArray(), []) ?? [];

  // Refs para que callbacks de Schedule-X (capturados 1 vez en useCalendarApp)
  // lean siempre la última lista de eventos, no closures stale.
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // Si URL trae ?event=ID, abrir modal automaticamente al cargar eventos
  useEffect(() => {
    const eid = searchParams.get("event");
    if (!eid || events.length === 0) return;
    const ev = events.find((x) => x.id === Number(eid));
    if (ev) {
      setSelectedEvent(ev);
      // Limpiar param para que recargas no reabran
      const next = new URLSearchParams(searchParams);
      next.delete("event");
      setSearchParams(next, { replace: true });
    }
  }, [events, searchParams, setSearchParams]);

  const eventsService = useMemo(() => createEventsServicePlugin(), []);
  const dragDrop = useMemo(() => createDragAndDropPlugin(), []);

  const calendars = useMemo(() => {
    const map: Record<string, typeof PALETTE[0]> = {};
    cultivations.forEach((c, idx) => {
      const palette = PALETTE[idx % PALETTE.length];
      if (c.id !== undefined) {
        map[`cult-${c.id}`] = { ...palette, id: `cult-${c.id}` };
      }
    });
    return map;
  }, [cultivations]);

  const visibleEvents = useMemo(() => {
    const visibleCultIds = new Set(
      cultivations
        .filter((c) => c.status === "active" || c.status === "planning")
        .map((c) => c.id),
    );
    return events.filter(
      (e) => e.cultivationId == null || visibleCultIds.has(e.cultivationId),
    );
  }, [events, cultivations]);

  const sxEvents = useMemo(() => {
    return visibleEvents.map((e) => {
      const date = toPlainDate(e.scheduledDate);
      const statusPrefix = e.status === "done" ? "✅ " : e.status === "skipped" ? "⏭️ " : "";
      return {
        id: String(e.id),
        title: `${statusPrefix}${e.emoji} ${e.title}`,
        start: date,
        end: date,
        calendarId: `cult-${e.cultivationId}`,
        description: e.description,
      };
    });
  }, [visibleEvents]);

  const calendar = useCalendarApp({
    views: [createViewMonthGrid(), createViewWeek(), createViewDay(), createViewMonthAgenda()],
    defaultView: "month-grid",
    locale: "es-ES",
    firstDayOfWeek: 1,
    isDark: true,
    events: sxEvents,
    calendars,
    plugins: [eventsService, createCurrentTimePlugin(), dragDrop],
    callbacks: {
      onEventClick(e) {
        const id = Number(e.id);
        const ev = eventsRef.current.find((x) => x.id === id);
        if (ev) setSelectedEvent(ev);
      },
      async onEventUpdate(updatedEvent) {
        // drag-drop reagendado
        const id = Number(updatedEvent.id);
        const newDate = plainDateStrToDate(updatedEvent.start);
        await rescheduleEvent(id, newDate);
      },
    },
  });

  useEffect(() => {
    if (!eventsService) return;
    eventsService.set(sxEvents as never);
  }, [sxEvents, eventsService]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-text-bright">📅 Calendario</h1>
        <button
          onClick={() => {
            if (cultivations.length === 0) {
              alert("Primero crea un cultivo en ➕ Nuevo");
              return;
            }
            setShowCreateForm(true);
          }}
          className="px-3 py-2 bg-accent text-bg rounded font-bold text-sm"
        >
          ➕ Evento
        </button>
      </div>

      {visibleEvents.length === 0 ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">Sin eventos. Crea un cultivo en ➕ Nuevo o un evento manual con el botón de arriba.</p>
        </div>
      ) : (
        <div className="sx-wrapper" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
          <ScheduleXCalendar calendarApp={calendar} />
        </div>
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          cultivation={cultivations.find((c) => c.id === selectedEvent.cultivationId)}
          onClose={() => setSelectedEvent(null)}
          onDone={async () => {
            if (selectedEvent.id) await completeEvent(selectedEvent.id);
            setSelectedEvent(null);
          }}
          onEdit={() => {
            setEditing(selectedEvent);
            setSelectedEvent(null);
          }}
          onDelete={async () => {
            if (!selectedEvent.id) return;
            const ok = await confirmDialog({
              title: "Borrar evento",
              message: `Eliminar "${selectedEvent.title}" del calendario?`,
              confirmLabel: "Borrar",
              danger: true,
            });
            if (!ok) return;
            await deleteEvent(selectedEvent.id);
            setSelectedEvent(null);
          }}
          onSkip={async () => {
            if (selectedEvent.id) {
              await markSkipped(selectedEvent.id);
              setSelectedEvent(null);
            }
          }}
        />
      )}

      {showCreateForm && (
        <EventForm
          cultivations={cultivations}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {editing && (
        <EventForm
          cultivations={cultivations}
          editing={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function EventDetailModal({
  event,
  cultivation,
  onClose,
  onDone,
  onEdit,
  onDelete,
  onSkip,
}: {
  event: AppEvent;
  cultivation?: Cultivation;
  onClose: () => void;
  onDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSkip: () => void;
}) {
  const sections = parseEventDescription(event.description);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-bg-2 border border-border rounded-lg p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-3xl mb-1">{event.emoji}</div>
            <h2 className="text-lg font-bold text-text-bright">{event.title}</h2>
            <div className="text-xs text-text-muted mt-1">
              {cultivation?.name} · {format(event.scheduledDate, "PP", { locale: es })}
              {event.status === "done" && " · ✅ hecho"}
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-bright text-xl shrink-0">
            ✕
          </button>
        </div>

        {sections.main && (
          <p className="text-sm text-text-bright mb-3">{sections.main}</p>
        )}

        {sections.steps.length > 0 && (
          <div className="mb-3">
            <h3 className="text-xs font-bold text-accent uppercase tracking-wide mb-1">Pasos</h3>
            <ul className="grid gap-1">
              {sections.steps.map((s, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <input type="checkbox" className="mt-1 accent-accent" readOnly tabIndex={-1} />
                  <span className="text-text-bright">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sections.signals.length > 0 && (
          <div className="mb-3 p-3 border border-success/30 bg-success/5 rounded">
            <h3 className="text-xs font-bold text-success uppercase tracking-wide mb-1">Señales esperadas</h3>
            <ul className="grid gap-1">
              {sections.signals.map((s, i) => (
                <li key={i} className="text-sm text-success">✅ {s}</li>
              ))}
            </ul>
          </div>
        )}

        {sections.warnings.length > 0 && (
          <div className="mb-3 p-3 border border-error/30 bg-error/5 rounded">
            <h3 className="text-xs font-bold text-error uppercase tracking-wide mb-1">⚠️ Atención</h3>
            <ul className="grid gap-1">
              {sections.warnings.map((s, i) => (
                <li key={i} className="text-sm text-error">⚠ {s}</li>
              ))}
            </ul>
          </div>
        )}

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

        <div className="flex gap-2 flex-wrap mt-2">
          {event.status !== "done" && (
            <>
              <button onClick={onDone} className="px-4 py-2 bg-success text-bg rounded font-bold text-sm">
                ✅ Hecho
              </button>
              <button onClick={onSkip} className="px-3 py-2 border border-border rounded hover:border-accent text-sm">
                ⏭️ Saltar
              </button>
            </>
          )}
          <button onClick={onEdit} className="px-3 py-2 border border-border rounded hover:border-accent text-sm">
            ✏️ Editar
          </button>
          <button onClick={onDelete} className="px-3 py-2 border border-error text-error rounded hover:bg-error/10 text-sm">
            🗑️ Borrar
          </button>
          <button onClick={onClose} className="px-3 py-2 border border-border rounded ml-auto text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function parseEventDescription(desc: string) {
  const sections: { main: string; steps: string[]; signals: string[]; warnings: string[] } = {
    main: "",
    steps: [],
    signals: [],
    warnings: [],
  };

  const lines = desc.split("\n");
  let currentSection: "main" | "steps" | "signals" | "warnings" = "main";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("**Pasos:**")) {
      currentSection = "steps";
      continue;
    }
    if (trimmed.startsWith("**Señales esperadas:**")) {
      currentSection = "signals";
      continue;
    }
    if (trimmed.startsWith("**⚠️ Atención si:**")) {
      currentSection = "warnings";
      continue;
    }

    const clean = trimmed
      .replace(/^- /, "")
      .replace(/^- ✅ /, "")
      .replace(/^\*\*/, "")
      .replace(/\*\*$/, "");

    if (currentSection === "main") {
      sections.main = sections.main ? `${sections.main}\n${clean}` : clean;
    } else {
      sections[currentSection].push(clean);
    }
  }

  return sections;
}

function EventForm({
  cultivations,
  editing,
  onClose,
}: {
  cultivations: Cultivation[];
  editing?: AppEvent;
  onClose: () => void;
}) {
  const [cultivationId, setCultivationId] = useState<number | "">(
    editing?.cultivationId ?? cultivations[0]?.id ?? ""
  );
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [type, setType] = useState<EventType>(editing?.type ?? "milestone");
  const [emoji, setEmoji] = useState(editing?.emoji ?? "🎯");
  const [scheduledDate, setScheduledDate] = useState(
    editing?.scheduledDate
      ? new Date(editing.scheduledDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    if (cultivationId === "" || !title.trim()) return;
    setBusy(true);
    try {
      const date = new Date(scheduledDate);
      if (editing?.id) {
        await updateEvent(editing.id, {
          cultivationId: cultivationId as number,
          title,
          description,
          type,
          emoji,
          scheduledDate: date,
        });
      } else {
        await createManualEvent({
          cultivationId: cultivationId as number,
          title,
          description,
          type,
          emoji,
          scheduledDate: date,
        });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100]" onClick={onClose}>
      <div
        className="bg-bg-2 border border-border rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-text-bright mb-4">
          {editing ? "Editar" : "Nuevo"} evento
        </h2>
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Cultivo</span>
            <select
              value={cultivationId}
              onChange={(e) => setCultivationId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
            >
              <option value="">— elige —</option>
              {cultivations.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Fecha</span>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
            />
          </label>
          <div className="flex gap-3 items-end">
            <label className="flex flex-col gap-1 w-20 shrink-0">
              <span className="text-xs text-text-muted">Emoji</span>
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
                className="bg-bg-3 border border-border rounded px-2 text-text-bright text-center w-full h-10 text-base"
              />
            </label>
            <label className="flex flex-col gap-1 flex-1 min-w-0">
              <span className="text-xs text-text-muted">Tipo</span>
              <select
                value={type}
                onChange={(e) => {
                  const t = e.target.value as EventType;
                  setType(t);
                  const def = EVENT_TYPES.find((x) => x.id === t);
                  if (def && !editing) setEmoji(def.emoji);
                }}
                className="bg-bg-3 border border-border rounded px-3 text-text-bright w-full h-10"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Título</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
              placeholder="Ej: Chequear humedad cámara"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Descripción</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
              placeholder="Notas, pasos, cantidades..."
            />
          </label>
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="px-3 py-2 border border-border rounded">
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={busy || cultivationId === "" || !title.trim()}
            className="px-3 py-2 bg-accent text-bg rounded font-bold disabled:opacity-50"
          >
            {busy ? "Guardando..." : editing ? "Actualizar" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
