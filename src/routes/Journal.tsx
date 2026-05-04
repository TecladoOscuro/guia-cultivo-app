import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "../lib/db";
import { compressPhoto } from "../lib/photo";
import type { JournalEntry } from "../types";

export default function Journal() {
  const [selectedCult, setSelectedCult] = useState<number | "all">("all");
  const [showForm, setShowForm] = useState(false);

  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];
  const entries = useLiveQuery(async () => {
    const all = await db.journal.toArray();
    return all.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, []) ?? [];

  const filtered = entries.filter((e) => selectedCult === "all" || e.cultivationId === selectedCult);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-text-bright">📔 Journal</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-2 bg-accent text-bg rounded font-bold text-sm"
        >
          ➕ Nueva entrada
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedCult("all")}
          className={`px-3 py-1 text-xs rounded border ${
            selectedCult === "all"
              ? "bg-accent text-bg border-accent font-bold"
              : "border-border hover:border-accent"
          }`}
        >
          Todos ({entries.length})
        </button>
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

      {filtered.length === 0 ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">Sin entradas aún. Crea la primera con ➕.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((e) => (
            <JournalCard
              key={e.id}
              entry={e}
              cultivation={cultivations.find((c) => c.id === e.cultivationId)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <JournalForm
          cultivations={cultivations}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function JournalCard({ entry, cultivation }: { entry: JournalEntry; cultivation?: { name: string } }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!entry.photoBlob) return;
    const url = URL.createObjectURL(entry.photoBlob);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [entry.photoBlob]);

  const onDelete = async () => {
    if (!entry.id) return;
    if (!confirm("Borrar entrada?")) return;
    await db.journal.delete(entry.id);
  };

  return (
    <div className="p-3 border border-border rounded">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-xs text-text-muted">
            {format(entry.date, "PPp", { locale: es })} · {cultivation?.name ?? "?"}
          </div>
        </div>
        <button onClick={onDelete} className="text-text-muted hover:text-error text-xs">✕</button>
      </div>
      {imgUrl && (
        <img src={imgUrl} alt="" className="w-full max-h-96 object-cover rounded mb-2" />
      )}
      <div className="text-sm whitespace-pre-line">{entry.note}</div>
      {entry.observations && entry.observations.length > 0 && (
        <div className="mt-2 flex gap-2 flex-wrap">
          {entry.observations.map((o, i) => (
            <span key={i} className="text-xs bg-bg-3 px-2 py-1 rounded">
              {o.key}: {o.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function JournalForm({ cultivations, onClose }: { cultivations: { id?: number; name: string }[]; onClose: () => void }) {
  const [cultivationId, setCultivationId] = useState<number | "">(cultivations[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [observations, setObservations] = useState<{ key: string; value: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const onPhotoChange = async (file: File | null) => {
    if (!file) {
      setPhotoBlob(null);
      setPhotoUrl(null);
      return;
    }
    const blob = await compressPhoto(file);
    setPhotoBlob(blob);
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(URL.createObjectURL(blob));
  };

  const onSave = async () => {
    if (cultivationId === "" || !note.trim()) return;
    setBusy(true);
    try {
      await db.journal.add({
        cultivationId: cultivationId as number,
        date: new Date(),
        photoBlob: photoBlob ?? undefined,
        note,
        observations: observations.filter((o) => o.key.trim() && o.value.trim()),
      } as JournalEntry);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-bg-2 border border-border rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-text-bright mb-4">Nueva entrada</h2>
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

          <div className="grid gap-1">
            <span className="text-xs text-text-muted">Foto (opcional)</span>
            <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-3 py-2 border border-border rounded text-sm hover:border-accent">
              <span>📷</span>
              <span>{photoBlob ? "Cambiar foto" : "Elegir foto"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            {photoUrl && (
              <div className="relative mt-2">
                <img src={photoUrl} alt="preview" className="w-full max-h-48 object-cover rounded" />
                <button
                  type="button"
                  onClick={() => onPhotoChange(null)}
                  className="absolute top-1 right-1 bg-bg/80 border border-border rounded-full w-7 h-7 text-xs"
                  aria-label="Quitar foto"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Nota</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
              placeholder="Cómo va el cultivo, observaciones, problemas..."
            />
          </label>

          <div>
            <div className="text-xs text-text-muted mb-1">Mediciones (pH, temp, etc)</div>
            {observations.map((o, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <input
                  value={o.key}
                  onChange={(e) => {
                    const next = [...observations];
                    next[i] = { ...next[i], key: e.target.value };
                    setObservations(next);
                  }}
                  placeholder="pH"
                  className="bg-bg-3 border border-border rounded px-2 py-1 text-xs flex-1"
                />
                <input
                  value={o.value}
                  onChange={(e) => {
                    const next = [...observations];
                    next[i] = { ...next[i], value: e.target.value };
                    setObservations(next);
                  }}
                  placeholder="6.5"
                  className="bg-bg-3 border border-border rounded px-2 py-1 text-xs flex-1"
                />
              </div>
            ))}
            <button
              onClick={() => setObservations([...observations, { key: "", value: "" }])}
              className="text-xs text-accent"
            >
              + medición
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="px-3 py-2 border border-border rounded">
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={busy || cultivationId === "" || !note.trim()}
            className="px-3 py-2 bg-accent text-bg rounded font-bold disabled:opacity-50"
          >
            {busy ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
