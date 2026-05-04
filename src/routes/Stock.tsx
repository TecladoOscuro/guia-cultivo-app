import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { getStockAvailable } from "../lib/stockPipeline";
import type { Stock as StockType, StockCategory } from "../types";

const categories: StockCategory[] = [
  "semilla",
  "esqueje",
  "equipo",
  "fungible",
  "nutriente",
  "producto_final",
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function Stock() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StockType | null>(null);

  const stocks = useLiveQuery(() => db.stock.toArray(), []) ?? [];
  const reservations = useLiveQuery(
    () => db.stockReservations.where("status").equals("reserved").toArray(),
    []
  ) ?? [];
  const available = useLiveQuery(() => getStockAvailable(), []) ?? {};

  const reservedByKey: Record<string, number> = {};
  reservations.forEach((r) => {
    reservedByKey[r.stockKey] = (reservedByKey[r.stockKey] ?? 0) + r.qty;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-text-bright">📦 Stock</h1>
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
      <div className="p-3 border border-border bg-bg-2 rounded text-xs text-text-muted mb-4">
        ℹ️ <strong>Reservado</strong> = comprometido a un cultivo activo (aún no consumido). <strong>Libre</strong> = lo que puedes usar para nuevos cultivos.
        El stock real solo decrementa cuando marcas un evento como "✅ Hecho" en el calendario.
      </div>

      {stocks.length === 0 ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">Sin stock. Añade items manualmente o cómpralos desde shopping list.</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {stocks.map((s) => {
            const reserved = reservedByKey[s.key] ?? 0;
            const free = available[s.key] ?? s.qty;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setEditing(s);
                  setShowForm(true);
                }}
                className="text-left p-3 border border-border rounded hover:border-accent transition flex justify-between items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-text-bright">{s.name}</div>
                  <div className="text-xs text-text-muted">{s.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-text-bright">
                    {s.qty}{s.unit}
                  </div>
                  {reserved > 0 && (
                    <div className="text-xs text-warn">
                      {reserved}{s.unit} reservado · libre: {free}{s.unit}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showForm && (
        <StockForm
          initial={editing}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function StockForm({
  initial,
  onClose,
}: {
  initial: StockType | null;
  onClose: () => void;
}) {
  const isEditing = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [key, setKey] = useState(initial?.key ?? "");
  const [keyOverridden, setKeyOverridden] = useState(false);
  const [category, setCategory] = useState<StockCategory>(initial?.category ?? "fungible");
  const [qty, setQty] = useState(String(initial?.qty ?? 0));
  const [unit, setUnit] = useState(initial?.unit ?? "ud");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const effectiveKey = isEditing
    ? initial!.key
    : keyOverridden
      ? key
      : slugify(name);

  const onNameChange = (v: string) => {
    setName(v);
    if (!isEditing && !keyOverridden) setKey(slugify(v));
  };

  const onSave = async () => {
    if (!name.trim()) return;
    if (!effectiveKey) return;
    const data: Omit<StockType, "id"> = {
      key: effectiveKey,
      name,
      category,
      qty: parseFloat(qty),
      unit,
      notes,
      addedAt: initial?.addedAt ?? new Date(),
    };
    if (initial?.id) {
      await db.stock.update(initial.id, data);
    } else {
      await db.stock.add(data as StockType);
    }
    onClose();
  };

  const onDelete = async () => {
    if (!initial?.id) return;
    if (!confirm(`Borrar ${initial.name}?`)) return;
    await db.stock.delete(initial.id);
    onClose();
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
        <h2 className="text-lg font-bold text-text-bright mb-4">
          {initial ? "Editar" : "Añadir"} stock
        </h2>
        <div className="grid gap-3">
          <Field label="Nombre" value={name} onChange={onNameChange} placeholder="Ej: Perlita 5L" />
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Categoría</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as StockCategory)}
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cantidad" value={qty} onChange={setQty} type="number" />
            <Field label="Unidad" value={unit} onChange={setUnit} placeholder="ud, g, ml..." />
          </div>
          <Field label="Notas (opcional)" value={notes} onChange={setNotes} />
          <details className="text-xs text-text-muted">
            <summary className="cursor-pointer select-none">⚙️ Identificador técnico (avanzado)</summary>
            <div className="mt-2 grid gap-1">
              <p>
                Identificador interno usado por las plantillas de cultivo para
                consumir este stock. Se genera automáticamente desde el nombre.
                {isEditing && " No se puede editar tras crear (rompería plantillas)."}
              </p>
              <input
                value={effectiveKey}
                onChange={(e) => {
                  setKeyOverridden(true);
                  setKey(slugify(e.target.value));
                }}
                disabled={isEditing}
                className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright disabled:opacity-60"
              />
            </div>
          </details>
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
            <button onClick={onClose} className="px-3 py-2 border border-border rounded">
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={!name.trim() || !effectiveKey}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
      />
    </label>
  );
}
