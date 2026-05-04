import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "../lib/db";
import type { JournalEntry } from "../types";

export default function Timelapse() {
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];
  const [selectedCult, setSelectedCult] = useState<number | null>(null);

  const entries = useLiveQuery(async () => {
    if (selectedCult === null) return [];
    const all = await db.journal
      .where("cultivationId")
      .equals(selectedCult)
      .and((e) => Boolean(e.photoBlob))
      .toArray();
    return all.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [selectedCult]) ?? [];

  // Auto-select primer cultivo con journal
  useEffect(() => {
    if (selectedCult === null && cultivations.length > 0) {
      (async () => {
        for (const c of cultivations) {
          if (c.id === undefined) continue;
          const count = await db.journal
            .where("cultivationId")
            .equals(c.id)
            .and((e) => Boolean(e.photoBlob))
            .count();
          if (count > 0) {
            setSelectedCult(c.id);
            break;
          }
        }
      })();
    }
  }, [cultivations, selectedCult]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">📸 Timelapse fotos</h1>

      <p className="text-text-muted text-sm mb-4">
        Compara la evolución de tu cultivo con todas las fotos del journal en orden cronológico.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {cultivations.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCult(c.id!)}
            className={`px-3 py-1 text-xs rounded border ${
              selectedCult === c.id
                ? "bg-accent text-bg border-accent font-bold"
                : "border-border hover:border-accent"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {!selectedCult ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">Selecciona un cultivo. Necesitas entradas con foto en 📔 Journal.</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">Este cultivo no tiene fotos en journal aún.</p>
        </div>
      ) : (
        <TimelapseView entries={entries} startDate={cultivations.find((c) => c.id === selectedCult)?.startDate ?? entries[0].date} />
      )}
    </div>
  );
}

function TimelapseView({ entries, startDate }: { entries: JournalEntry[]; startDate: Date }) {
  const [current, setCurrent] = useState(0);
  const [compareIdx, setCompareIdx] = useState<number | null>(null);

  const e = entries[current];

  return (
    <div>
      {/* Slider */}
      <div className="mb-3">
        <input
          type="range"
          min={0}
          max={entries.length - 1}
          value={current}
          onChange={(ev) => setCurrent(Number(ev.target.value))}
          className="w-full"
        />
        <div className="text-xs text-text-muted text-center mt-1">
          {current + 1}/{entries.length} · día {differenceInDays(e.date, startDate)} · {format(e.date, "PPp", { locale: es })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <PhotoCard entry={e} startDate={startDate} title="Actual" />
        {compareIdx !== null && entries[compareIdx] && (
          <PhotoCard entry={entries[compareIdx]} startDate={startDate} title="Comparar con" />
        )}
      </div>

      <div className="flex gap-2 mt-4 flex-wrap">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="px-3 py-2 border border-border rounded text-sm disabled:opacity-50"
        >
          ← Anterior
        </button>
        <button
          onClick={() => setCurrent(Math.min(entries.length - 1, current + 1))}
          disabled={current === entries.length - 1}
          className="px-3 py-2 border border-border rounded text-sm disabled:opacity-50"
        >
          Siguiente →
        </button>
        <button
          onClick={() => setCompareIdx(compareIdx === null ? 0 : null)}
          className="px-3 py-2 border border-border rounded text-sm"
        >
          {compareIdx !== null ? "✕ Cerrar comparación" : "🔀 Comparar con otra"}
        </button>
        <button
          onClick={() => setCurrent(0)}
          className="px-3 py-2 border border-border rounded text-sm ml-auto"
        >
          ⏮ Inicio
        </button>
        <button
          onClick={() => setCurrent(entries.length - 1)}
          className="px-3 py-2 border border-border rounded text-sm"
        >
          Final ⏭
        </button>
      </div>

      {compareIdx !== null && (
        <div className="mt-3">
          <input
            type="range"
            min={0}
            max={entries.length - 1}
            value={compareIdx}
            onChange={(ev) => setCompareIdx(Number(ev.target.value))}
            className="w-full"
          />
          <div className="text-xs text-text-muted text-center mt-1">
            Comparación: día {differenceInDays(entries[compareIdx].date, startDate)} ·{" "}
            {format(entries[compareIdx].date, "PP", { locale: es })}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoCard({ entry, startDate, title }: { entry: JournalEntry; startDate: Date; title: string }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!entry.photoBlob) return;
    const url = URL.createObjectURL(entry.photoBlob);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [entry.photoBlob]);

  return (
    <div className="border border-border rounded overflow-hidden">
      <div className="bg-bg-2 p-2 text-xs text-text-muted border-b border-border">
        <span className="text-accent font-bold">{title}</span> · día {differenceInDays(entry.date, startDate)} ·{" "}
        {format(entry.date, "PP", { locale: es })}
      </div>
      {imgUrl && <img src={imgUrl} alt="" className="w-full max-h-[60vh] object-contain bg-black" />}
      {entry.note && <div className="p-2 text-xs whitespace-pre-line">{entry.note}</div>}
    </div>
  );
}
