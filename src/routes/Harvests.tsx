import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "../lib/db";
import { getTemplate } from "../templates";
import type { Harvest, ProductEntry } from "../types";

export default function Harvests() {
  const [showForm, setShowForm] = useState(false);
  const harvests = useLiveQuery(async () => {
    const all = await db.harvests.toArray();
    return all.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, []) ?? [];
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-text-bright">✂️ Cosechas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-2 bg-accent text-bg rounded font-bold text-sm"
        >
          ➕ Registrar cosecha
        </button>
      </div>

      {harvests.length === 0 ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">Sin cosechas aún. Registra la primera con ➕.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {harvests.map((h) => {
            const c = cultivations.find((c) => c.id === h.cultivationId);
            return (
              <div key={h.id} className="p-3 border border-border rounded">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="font-bold text-text-bright">
                      {c?.name ?? "?"} · {h.type}
                    </div>
                    <div className="text-xs text-text-muted">
                      {format(h.date, "PP", { locale: es })}
                    </div>
                  </div>
                  {h.quality && (
                    <div className="text-xs text-accent">{"⭐".repeat(h.quality)}</div>
                  )}
                </div>
                <div className="text-xs text-text-muted">
                  {h.weightWet !== undefined && `Fresco: ${h.weightWet}g · `}
                  {h.weightDry !== undefined && `Seco: ${h.weightDry}g`}
                </div>
                {h.notes && <div className="text-xs mt-1">{h.notes}</div>}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <HarvestForm
          cultivations={cultivations}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function HarvestForm({ cultivations, onClose }: { cultivations: { id?: number; name: string; templateId: string }[]; onClose: () => void }) {
  const [cultivationId, setCultivationId] = useState<number | "">(cultivations[0]?.id ?? "");
  const [type, setType] = useState("flush_1");
  const [weightWet, setWeightWet] = useState("");
  const [weightDry, setWeightDry] = useState("");
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState("");
  const [createProduct, setCreateProduct] = useState(true);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    if (cultivationId === "") return;
    setBusy(true);
    try {
      const cult = cultivations.find((c) => c.id === cultivationId);
      const tmpl = cult ? getTemplate(cult.templateId) : null;

      const harvestId = (await db.harvests.add({
        cultivationId: cultivationId as number,
        date: new Date(),
        type,
        weightWet: weightWet ? parseFloat(weightWet) : undefined,
        weightDry: weightDry ? parseFloat(weightDry) : undefined,
        quality,
        notes,
      } as Harvest)) as number;

      if (createProduct && tmpl?.produces) {
        const productQty = weightDry ? parseFloat(weightDry) : weightWet ? parseFloat(weightWet) : 0;
        const productEntryId = (await db.product.add({
          harvestId,
          cultivationId: cultivationId as number,
          kind: tmpl.produces.kind,
          qty: productQty,
          unit: tmpl.produces.unit,
          notes,
        } as ProductEntry)) as number;
        await db.harvests.update(harvestId, { productEntryId });
      }

      await db.history.add({
        cultivationId: cultivationId as number,
        action: "harvest.create",
        payload: { type, weightWet, weightDry, quality },
        timestamp: new Date(),
      });

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
        <h2 className="text-lg font-bold text-text-bright mb-4">Registrar cosecha</h2>
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
            <span className="text-xs text-text-muted">Tipo (flush_1, main_cut, lateral, etc)</span>
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-xs text-text-muted">Peso fresco (g)</span>
              <input
                type="number"
                value={weightWet}
                onChange={(e) => setWeightWet(e.target.value)}
                className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-text-muted">Peso seco (g)</span>
              <input
                type="number"
                value={weightDry}
                onChange={(e) => setWeightDry(e.target.value)}
                className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
              />
            </label>
          </div>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Calidad</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setQuality(n)}
                  className={`px-3 py-1 ${n <= quality ? "text-accent" : "text-text-muted"}`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Notas catador</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={createProduct} onChange={(e) => setCreateProduct(e.target.checked)} />
            <span className="text-text-muted">Crear entrada en inventario producto</span>
          </label>
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="px-3 py-2 border border-border rounded">Cancelar</button>
          <button
            onClick={onSave}
            disabled={busy || cultivationId === ""}
            className="px-3 py-2 bg-accent text-bg rounded font-bold disabled:opacity-50"
          >
            {busy ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
