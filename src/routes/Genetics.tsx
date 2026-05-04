import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "../lib/db";
import { confirmDialog } from "../lib/confirmDialog";
import type { Genetics } from "../types";

const KINDS: Genetics["kind"][] = ["semilla", "esqueje", "esporada", "scoby", "levadura"];

export default function GeneticsRoute() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Genetics | null>(null);
  const items = useLiveQuery(() => db.genetics.toArray(), []) ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-text-bright">🧬 Genética</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="px-3 py-2 bg-accent text-bg rounded font-bold text-sm"
        >
          ➕ Añadir
        </button>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">Sin entradas. Registra semillas, esquejes, esporadas, etc.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {items.map((g) => {
            const expired = g.expiresAt && isPast(g.expiresAt);
            return (
              <button
                key={g.id}
                onClick={() => {
                  setEditing(g);
                  setShowForm(true);
                }}
                className={`text-left p-3 border rounded hover:border-accent transition ${
                  expired ? "border-error" : "border-border"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-text-bright">
                      {g.kind} · {g.name}
                    </div>
                    <div className="text-xs text-text-muted">
                      {g.vendor && `${g.vendor} · `}
                      {g.lineage && `${g.lineage} · `}
                      adquirida {format(g.acquiredAt, "PP", { locale: es })}
                    </div>
                  </div>
                  {expired && <span className="text-xs text-error">⚠️ caducada</span>}
                </div>
                {g.notes && <div className="text-xs mt-1 text-text-muted">{g.notes}</div>}
              </button>
            );
          })}
        </div>
      )}

      {showForm && (
        <GeneticsForm initial={editing} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function GeneticsForm({ initial, onClose }: { initial: Genetics | null; onClose: () => void }) {
  const [kind, setKind] = useState<Genetics["kind"]>(initial?.kind ?? "semilla");
  const [name, setName] = useState(initial?.name ?? "");
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [lineage, setLineage] = useState(initial?.lineage ?? "");
  const [acquiredAt, setAcquiredAt] = useState(
    initial?.acquiredAt
      ? new Date(initial.acquiredAt).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [expiresAt, setExpiresAt] = useState(
    initial?.expiresAt ? new Date(initial.expiresAt).toISOString().slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const onSave = async () => {
    const data: Omit<Genetics, "id"> = {
      kind,
      name,
      vendor: vendor || undefined,
      lineage: lineage || undefined,
      acquiredAt: new Date(acquiredAt),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      notes: notes || undefined,
    };
    if (initial?.id) {
      await db.genetics.update(initial.id, data);
    } else {
      await db.genetics.add(data as Genetics);
    }
    onClose();
  };

  const onDelete = async () => {
    if (!initial?.id) return;
    const ok = await confirmDialog({
      title: "Borrar entrada",
      message: `Borrar "${initial.name}"?`,
      confirmLabel: "Borrar",
      danger: true,
    });
    if (!ok) return;
    await db.genetics.delete(initial.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-bg-2 border border-border rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-text-bright mb-4">
          {initial ? "Editar" : "Añadir"} entrada genética
        </h2>
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Tipo</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as Genetics["kind"])}
              className="bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </label>
          <Field label="Nombre / cepa" value={name} onChange={setName} />
          <Field label="Vendor (opcional)" value={vendor} onChange={setVendor} />
          <Field label="Lineage (opcional)" value={lineage} onChange={setLineage} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha adquisición" value={acquiredAt} onChange={setAcquiredAt} type="date" />
            <Field label="Caducidad (opcional)" value={expiresAt} onChange={setExpiresAt} type="date" />
          </div>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Notas</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
            />
          </label>
        </div>
        <div className="flex justify-between gap-2 mt-4">
          <div>
            {initial && (
              <button onClick={onDelete} className="px-3 py-2 border border-error text-error rounded text-sm">
                Borrar
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-2 border border-border rounded">Cancelar</button>
            <button
              onClick={onSave}
              disabled={!name.trim()}
              className="px-3 py-2 bg-accent text-bg rounded font-bold disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
      />
    </label>
  );
}
