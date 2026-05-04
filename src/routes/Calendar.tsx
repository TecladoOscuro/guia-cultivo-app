import { useEffect, useMemo, useState } from "react";
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
import "@schedule-x/theme-default/dist/index.css";
import { db } from "../lib/db";
import { completeEvent } from "../lib/cultivationActions";
import type { AppEvent, Cultivation } from "../types";

const PALETTE = [
  { id: "p1", colorName: "p1", lightColors: { main: "#52b788", container: "#1a3322", onContainer: "#d8e0e6" }, darkColors: { main: "#52b788", container: "#1a3322", onContainer: "#d8e0e6" } },
  { id: "p2", colorName: "p2", lightColors: { main: "#8a6240", container: "#3d2810", onContainer: "#f5e6d0" }, darkColors: { main: "#8a6240", container: "#3d2810", onContainer: "#f5e6d0" } },
  { id: "p3", colorName: "p3", lightColors: { main: "#9070b8", container: "#2e1f3d", onContainer: "#e8d8ee" }, darkColors: { main: "#9070b8", container: "#2e1f3d", onContainer: "#e8d8ee" } },
  { id: "p4", colorName: "p4", lightColors: { main: "#e88a6a", container: "#3d1f10", onContainer: "#fde8d8" }, darkColors: { main: "#e88a6a", container: "#3d1f10", onContainer: "#fde8d8" } },
  { id: "p5", colorName: "p5", lightColors: { main: "#74a8d8", container: "#1a2a3d", onContainer: "#d8e8f5" }, darkColors: { main: "#74a8d8", container: "#1a2a3d", onContainer: "#d8e8f5" } },
];

function toPlainDate(d: Date): Temporal.PlainDate {
  return Temporal.PlainDate.from({
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
  });
}

export default function Calendar() {
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];
  const events = useLiveQuery(() => db.events.toArray(), []) ?? [];

  const eventsService = useMemo(() => createEventsServicePlugin(), []);

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
    plugins: [eventsService, createCurrentTimePlugin()],
    callbacks: {
      onEventClick(e) {
        const id = Number(e.id);
        const ev = events.find((x) => x.id === id);
        if (ev) setSelectedEvent(ev);
      },
    },
  });

  // Update events on change
  useEffect(() => {
    if (!eventsService) return;
    eventsService.set(sxEvents as never);
  }, [sxEvents, eventsService]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">📅 Calendario</h1>

      {events.length === 0 ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">Sin eventos. Crea un cultivo en ➕ Nuevo.</p>
        </div>
      ) : (
        <div className="sx-wrapper" style={{ height: "calc(100vh - 200px)", minHeight: 500 }}>
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
          <button onClick={onClose} className="px-4 py-2 border border-border rounded hover:border-accent">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
