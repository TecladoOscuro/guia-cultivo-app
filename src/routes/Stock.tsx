import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { getStockAvailable, calculateCapacity } from "../lib/stockPipeline";
import { confirmDialog } from "../lib/confirmDialog";
import { listAvailableTemplates } from "../lib/cultivationActions";
import type { Stock as StockType, StockCategory, ShoppingItem } from "../types";
import type { CapacityResult } from "../lib/stockPipeline";

const UNITS = ["ml", "L", "g", "kg", "ud", "sobres", "gotas", "cucharaditas"];

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

type Tab = "stock" | "shopping";

export default function Stock() {
  const [tab, setTab] = useState<Tab>("stock");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StockType | null>(null);

  const stocks = useLiveQuery(() => db.stock.toArray(), []) ?? [];
  const reservations = useLiveQuery(
    () => db.stockReservations.where("status").equals("reserved").toArray(),
    []
  ) ?? [];
  const available = useLiveQuery(() => getStockAvailable(), []) ?? {};
  const shopItems = useLiveQuery(() => db.shoppingList.toArray(), []) ?? [];
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];

  const reservedByKey: Record<string, number> = {};
  reservations.forEach((r) => {
    reservedByKey[r.stockKey] = (reservedByKey[r.stockKey] ?? 0) + r.qty;
  });

  const shopPending = shopItems.filter((i) => i.status === "pending").length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">📦 Stock</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        <TabBtn active={tab === "stock"} onClick={() => setTab("stock")} label="📦 Mi Stock" count={stocks.length} />
        <TabBtn active={tab === "shopping"} onClick={() => setTab("shopping")} label="🛒 Compras" count={shopPending > 0 ? shopPending : undefined} />
      </div>

      {tab === "stock" && (
        <>
          <div className="p-3 border border-border bg-bg-2 rounded text-xs text-text-muted mb-3">
            ℹ️ <strong>Reservado</strong> = comprometido a cultivos activos. <strong>Libre</strong> = disponible para nuevos cultivos. El stock solo decrementa al marcar "✅ Hecho" en el calendario.
          </div>

          {stocks.length === 0 ? (
            <div className="p-6 text-center border border-border rounded">
              <p className="text-text-muted mb-2">Sin stock todavía.</p>
              <button
                onClick={() => { setEditing(null); setShowForm(true); }}
                className="px-3 py-2 bg-accent text-bg rounded font-bold text-sm"
              >
                ➕ Añadir al stock
              </button>
            </div>
          ) : (
            <div className="grid gap-2">
              {stocks.map((s) => {
                const reserved = reservedByKey[s.key] ?? 0;
                const free = available[s.key] ?? s.qty;
                return (
                  <button
                    key={s.id}
                    onClick={() => { setEditing(s); setShowForm(true); }}
                    className="text-left p-3 border border-border rounded hover:border-accent transition flex justify-between items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-text-bright">{s.name}</div>
                      <div className="text-xs text-text-muted">{s.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-text-bright">{s.qty}{s.unit}</div>
                      {reserved > 0 && (
                        <div className="text-xs text-warn">{reserved}{s.unit} reservado · libre: {free}{s.unit}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-3">
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="w-full p-2 border border-border rounded text-sm text-text-muted hover:border-accent transition"
            >
              ➕ Añadir al stock
            </button>
          </div>

          <CapacityInfo />
        </>
      )}

      {tab === "shopping" && <ShoppingTab items={shopItems} stocks={stocks} cultivations={cultivations} />}

      {showForm && <StockForm initial={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function TabBtn({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm rounded-t transition border-b-2 ${
        active ? "border-accent text-accent font-bold" : "border-transparent text-text-muted hover:text-text-bright"
      }`}
    >
      {label}
      {(count !== undefined && count > 0) && (
        <span className="ml-1 px-1.5 py-0.5 text-xs bg-accent text-bg rounded-full">{count}</span>
      )}
    </button>
  );
}

function ShoppingTab({ items, stocks, cultivations }: { items: ShoppingItem[]; stocks: StockType[]; cultivations: { id?: number; name: string }[] }) {
  const [filter, setFilter] = useState<"pending" | "purchased" | "all">("pending");

  const filtered = items.filter((i) => filter === "all" || i.status === filter);
  const grouped = groupByCategory(filtered);

  const markPurchased = async (item: ShoppingItem) => {
    if (item.id === undefined) return;
    await db.shoppingList.update(item.id, { status: "purchased", purchasedAt: new Date() });
    const fresh = await db.stock.toArray();
    const existing = fresh.find((s) => s.key === item.itemKey);
    if (existing?.id !== undefined) {
      await db.stock.update(existing.id, { qty: existing.qty + item.qty });
    } else {
      await db.stock.add({ key: item.itemKey, name: item.name, category: "fungible", qty: item.qty, unit: item.unit, addedAt: new Date() } as StockType);
    }
  };

  const revertPurchased = async (item: ShoppingItem) => {
    if (item.id === undefined) return;
    const ok = await confirmDialog({ title: "Revertir", message: `Volver "${item.name}" a pendiente. Se descontará del stock.`, confirmLabel: "Revertir", danger: true });
    if (!ok) return;
    await db.shoppingList.update(item.id, { status: "pending", purchasedAt: undefined });
    const fresh = await db.stock.toArray();
    const existing = fresh.find((s) => s.key === item.itemKey);
    if (existing?.id !== undefined) {
      const newQty = Math.max(0, existing.qty - item.qty);
      if (newQty === 0) await db.stock.delete(existing.id);
      else await db.stock.update(existing.id, { qty: newQty });
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(["pending", "purchased", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 text-xs rounded border transition ${
              filter === s ? "bg-accent text-bg border-accent font-bold" : "border-border hover:border-accent"
            }`}
          >
            {s === "pending" ? "Pendientes" : s === "purchased" ? "Comprados" : "Todos"}
            {" "}({items.filter((i) => s === "all" || i.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-6 text-center border border-border rounded text-text-muted text-sm">
          Sin items. Crea un cultivo y la lista se generará automáticamente.
        </div>
      ) : (
        <div className="grid gap-4">
          {grouped.map(({ category, items: catItems }) => (
            <div key={category}>
              <h3 className="text-sm font-bold text-text-bright mb-2 uppercase tracking-wide">{category}</h3>
              <div className="grid gap-2">
                {catItems.map((it) => {
                  const cult = cultivations.find((c) => c.id === it.cultivationId);
                  const haveStock = stocks.find((s) => s.key === it.itemKey);
                  const isPurchased = it.status === "purchased";
                  return (
                    <div
                      key={it.id}
                      className={`p-3 border rounded transition ${isPurchased ? "border-success/40 bg-success/5" : "border-border"}`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-bold ${isPurchased ? "line-through text-text-muted" : "text-text-bright"}`}>
                            {it.name}
                          </div>
                          <div className="text-xs text-text-muted">
                            {it.qty}{it.unit} · {it.approxPrice ?? "?"} · {cult?.name ?? "manual"}
                            {haveStock && ` · 📦 tienes ${haveStock.qty}${haveStock.unit}`}
                          </div>
                          {it.notes && <div className="text-xs text-text-muted mt-1">{it.notes}</div>}
                          {isPurchased && it.purchasedAt && (
                            <div className="text-xs text-success mt-1">✅ Comprado {new Date(it.purchasedAt).toLocaleDateString("es-ES")}</div>
                          )}
                        </div>
                        {isPurchased ? (
                          <button onClick={() => revertPurchased(it)} className="px-2 py-1 border border-border rounded text-xs hover:border-warn hover:text-warn whitespace-nowrap">
                            ↩️ Revertir
                          </button>
                        ) : (
                          <button onClick={() => markPurchased(it)} className="px-2 py-1 bg-success text-bg rounded text-xs font-bold whitespace-nowrap">
                            🛒 Comprado
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByCategory(items: ShoppingItem[]) {
  const order: ShoppingItem["category"][] = ["esencial", "importante", "util"];
  return order
    .map((cat) => ({ category: cat, items: items.filter((i) => i.category === cat) }))
    .filter((g) => g.items.length > 0);
}

function StockForm({ initial, onClose }: { initial: StockType | null; onClose: () => void }) {
  const isEditing = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [key, setKey] = useState(initial?.key ?? "");
  const [keyOverridden, setKeyOverridden] = useState(false);
  const [category, setCategory] = useState<StockCategory>(initial?.category ?? "fungible");
  const [qty, setQty] = useState(String(initial?.qty ?? 0));
  const [unit, setUnit] = useState(initial?.unit ?? "ud");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const effectiveKey = isEditing ? initial!.key : keyOverridden ? key : slugify(name);

  const onNameChange = (v: string) => {
    setName(v);
    if (!isEditing && !keyOverridden) setKey(slugify(v));
  };

  const onSave = async () => {
    if (!name.trim() || !effectiveKey) return;
    setBusy(true);
    setErrMsg(null);
    try {
      const data: Omit<StockType, "id"> = { key: effectiveKey, name, category, qty: parseFloat(qty), unit, notes, addedAt: initial?.addedAt ?? new Date() };
      if (initial?.id) await db.stock.update(initial.id, data);
      else await db.stock.add(data as StockType);
      onClose();
    } catch (e) {
      setErrMsg(e instanceof Error ? (e.message.includes("ConstraintError") ? "Ya existe stock con ese identificador." : e.message) : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!initial?.id) return;
    const ok = await confirmDialog({ title: "Borrar stock", message: `¿Eliminar "${initial.name}"?`, confirmLabel: "Borrar", danger: true });
    if (!ok) return;
    await db.stock.delete(initial.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-bg-2 border border-border rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-text-bright mb-4">{initial ? "Editar" : "Añadir"} stock</h2>
        {errMsg && <div className="p-2 mb-3 border border-error rounded text-xs text-error bg-error/10">{errMsg}</div>}
        <div className="grid gap-3">
          <Field label="Nombre" value={name} onChange={onNameChange} placeholder="Ej: Perlita 5L" />
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Categoría</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as StockCategory)} className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright">
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cantidad" value={qty} onChange={setQty} type="number" />
            <UnitSelect value={unit} onChange={setUnit} />
          </div>
          <Field label="Notas (opcional)" value={notes} onChange={setNotes} />
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">
              Identificador técnico
              {!isEditing && <span className="text-accent"> — debe coincidir con el que esperan los cultivos</span>}
            </span>
            <input
              value={effectiveKey}
              onChange={(e) => { setKeyOverridden(true); setKey(slugify(e.target.value)); }}
              disabled={isEditing}
              placeholder="Se genera desde el nombre"
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright text-sm disabled:opacity-60 font-mono"
            />
            <span className="text-xs text-text-muted">
              {isEditing
                ? "No editable. Si necesitas cambiar el identificador, borra y crea uno nuevo."
                : "Edítalo si el auto-generado no coincide con lo que espera la plantilla del cultivo."}
            </span>
          </label>
        </div>
        <div className="flex justify-between gap-2 mt-4">
          <div>{initial && <button onClick={onDelete} className="px-3 py-2 border border-error text-error rounded text-sm">Borrar</button>}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-2 border border-border rounded">Cancelar</button>
            <button onClick={onSave} disabled={busy || !name.trim() || !effectiveKey} className="px-3 py-2 bg-accent text-bg rounded font-bold disabled:opacity-50">
              {busy ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright" />
    </label>
  );
}

function UnitSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [custom, setCustom] = useState(!UNITS.includes(value) && value !== "");
  const predefined = UNITS.includes(value) ? value : custom ? "__custom__" : UNITS[0];

  return (
    <label className="grid gap-1">
      <span className="text-xs text-text-muted">Unidad</span>
      <div className="flex gap-1">
        <select
          value={predefined}
          onChange={(e) => {
            if (e.target.value === "__custom__") {
              setCustom(true);
            } else {
              setCustom(false);
              onChange(e.target.value);
            }
          }}
          className="flex-1 bg-bg-3 border border-border rounded px-2 py-2 text-text-bright text-sm"
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
          <option value="__custom__">otro...</option>
        </select>
        {custom && (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="ej: ml, g..."
            className="w-24 bg-bg-3 border border-border rounded px-2 py-2 text-text-bright text-sm"
          />
        )}
      </div>
    </label>
  );
}

function CapacityInfo() {
  const stocks = useLiveQuery(() => db.stock.toArray(), []) ?? [];
  const reservations = useLiveQuery(() => db.stockReservations.where("status").equals("reserved").toArray(), []) ?? [];
  const [data, setData] = useState<{ template: ReturnType<typeof listAvailableTemplates>[number]; result: CapacityResult }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const templates = listAvailableTemplates();
      const results = await Promise.all(
        templates.map(async (t) => ({ template: t, result: await calculateCapacity(t) }))
      );
      if (!cancelled) setData(results);
    })();
    return () => { cancelled = true; };
  }, [stocks, reservations]);

  if (stocks.length === 0 || data.length === 0) return null;

  const canDo = data.filter((d) => d.result.capacity > 0);
  if (canDo.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="text-sm font-bold text-text-bright mb-2 uppercase tracking-wide">🎯 ¿Qué puedes cultivar?</h3>
      <div className="grid gap-2">
        {canDo.map(({ template, result }) => (
          <div key={template.id} className="p-3 border border-border rounded flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-text-bright text-sm">{template.emoji} {template.name}</div>
              {result.bottleneck && (
                <div className="text-xs text-text-muted">
                  Limitante: <span className="text-warn">{result.bottleneck.key}</span> ({result.bottleneck.have}{result.bottleneck.unit} de {result.bottleneck.need}{result.bottleneck.unit})
                </div>
              )}
            </div>
            <div className="text-lg font-bold text-accent shrink-0">
              ×{result.capacity === Infinity ? "∞" : result.capacity}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
