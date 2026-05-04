import { useEffect, useMemo, useState } from "react";
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
import { completeEvent } from "../lib/cultivationActions";
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

  const sxEvents = useMemo(() => {
    return events.map((e) => {
      const date = toPlainDate(e.scheduledDate);
      return {
        id: String(e.id),
        title: `${e.emoji} ${e.title}`,
        start: date,
        end: date,
        calendarId: `cult-${e.cultivationId}`,
        description: e.description,
      };
    });
  }, [events]);

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
        const ev = events.find((x) => x.id === id);
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

      {events.length === 0 ? (
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
            if (!confirm(`Borrar evento "${selectedEvent.title}"?`)) return;
            await deleteEvent(selectedEvent.id);
            setSelectedEvent(null);
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
}: {
  event: AppEvent;
  cultivation?: Cultivation;
  onClose: () => void;
  onDone: () => void;
  onEdit: () => void;
  onDelete: () => void;
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
              {event.status === "done" && " · ✅ hecho"}
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

        <div className="flex gap-2 flex-wrap">
          {event.status !== "done" && (
            <button onClick={onDone} className="px-4 py-2 bg-success text-bg rounded font-bold">
              ✅ Hecho
            </button>
          )}
          <button onClick={onEdit} className="px-4 py-2 border border-border rounded hover:border-accent">
            ✏️ Editar
          </button>
          <button onClick={onDelete} className="px-4 py-2 border border-error text-error rounded hover:bg-error/10">
            🗑️ Borrar
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-border rounded ml-auto">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
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
              className="bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
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
              className="bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
            />
          </label>
          <div className="flex gap-3">
            <label className="flex flex-col gap-1 w-20 shrink-0">
              <span className="text-xs text-text-muted">Emoji</span>
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
                className="bg-bg-3 border border-border rounded px-3 py-2 text-text-bright text-center w-full"
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
                className="bg-bg-3 border border-border rounded px-3 py-2 text-text-bright w-full"
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
              className="bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
              placeholder="Ej: Chequear humedad cámara"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Descripción</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
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
