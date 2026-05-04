import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { format, differenceInDays, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "../lib/db";
import { confirmDialog } from "../lib/confirmDialog";
import type { Session } from "../types";

// Ventanas tolerancia mínimas por tipo producto (días)
const TOLERANCE: Record<string, number> = {
  seta_psilocybe_seca: 14,
  trufa_seca: 14,
  trufa_fresca: 14,
  polvo_cactus: 42,
  brebaje_ayahuasca: 28,
  dmt_freebase: 1,
  amanita_seca: 7,
  default: 14,
};

export default function Sessions() {
  const [showForm, setShowForm] = useState(false);
  const sessions = useLiveQuery(async () => {
    const all = await db.sessions.toArray();
    return all.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, []) ?? [];
  const products = useLiveQuery(() => db.product.toArray(), []) ?? [];

  const lastByKind = new Map<string, Session>();
  for (const s of sessions) {
    const p = products.find((p) => p.id === s.productId);
    if (!p) continue;
    if (!lastByKind.has(p.kind) || lastByKind.get(p.kind)!.date < s.date) {
      lastByKind.set(p.kind, s);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-text-bright">🌌 Sesiones</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-2 bg-accent text-bg rounded font-bold text-sm"
        >
          ➕ Registrar sesión
        </button>
      </div>

      {lastByKind.size > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-text-bright mb-2 uppercase tracking-wide">⏳ Ventanas tolerancia</h2>
          <div className="grid gap-2">
            {Array.from(lastByKind.entries()).map(([kind, last]) => {
              const window = TOLERANCE[kind] ?? TOLERANCE.default;
              const daysSince = differenceInDays(new Date(), last.date);
              const remaining = window - daysSince;
              const ready = remaining <= 0;
              const nextDate = addDays(last.date, window);
              return (
                <div
                  key={kind}
                  className={`p-3 border rounded ${ready ? "border-success" : "border-warn"}`}
                >
                  <div className="flex justify-between items-baseline">
                    <div className="font-bold text-text-bright text-sm">{kind}</div>
                    <span className={`text-xs ${ready ? "text-success" : "text-warn"}`}>
                      {ready ? "✅ Ventana abierta" : `⏳ ${remaining} días restantes`}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted">
                    Última: {format(last.date, "PP", { locale: es })} · Próxima sin pérdida potencia: {format(nextDate, "PP", { locale: es })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {sessions.length === 0 ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">Sin sesiones registradas.</p>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-bold text-text-bright mb-2 uppercase tracking-wide">📜 Histórico</h2>
          <div className="grid gap-2">
            {sessions.map((s) => {
              const p = products.find((p) => p.id === s.productId);
              return (
                <div key={s.id} className="p-3 border border-border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-text-bright text-sm">
                        {p?.kind ?? "?"} · {s.dose}{s.doseUnit}
                      </div>
                      <div className="text-xs text-text-muted">
                        {format(s.date, "PPp", { locale: es })} · {s.method}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.rating && <div className="text-xs text-accent">{"⭐".repeat(s.rating)}</div>}
                      <button
                        onClick={async () => {
                          if (!s.id) return;
                          const ok = await confirmDialog({
                            title: "Borrar sesión",
                            message: "Eliminar este registro de sesión?",
                            confirmLabel: "Borrar",
                            danger: true,
                          });
                          if (!ok) return;
                          await db.sessions.delete(s.id);
                        }}
                        aria-label="Borrar sesión"
                        className="text-text-muted hover:text-error text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {s.setting && <div className="text-xs mt-1 text-text-muted">Setting: {s.setting}</div>}
                  {s.notesPost && <div className="text-xs mt-1">{s.notesPost}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <SessionForm products={products} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function SessionForm({ products, onClose }: { products: { id?: number; kind: string; qty: number; unit: string }[]; onClose: () => void }) {
  const [productId, setProductId] = useState<number | "">(products[0]?.id ?? "");
  const [dose, setDose] = useState("");
  const [doseUnit, setDoseUnit] = useState("g");
  const [method, setMethod] = useState("oral");
  const [setting, setSetting] = useState("");
  const [notesPre, setNotesPre] = useState("");
  const [notesPost, setNotesPost] = useState("");
  const [rating, setRating] = useState(3);
  const [busy, setBusy] = useState(false);

  const product = products.find((p) => p.id === productId);
  const tolerance = product ? TOLERANCE[product.kind] ?? TOLERANCE.default : TOLERANCE.default;

  const onSave = async () => {
    if (productId === "") return;
    setBusy(true);
    try {
      await db.sessions.add({
        productId: productId as number,
        date: new Date(),
        dose: parseFloat(dose),
        doseUnit,
        method,
        setting,
        notesPre,
        notesPost,
        rating,
        toleranceWindowDays: tolerance,
      } as Session);
      // Decrementar producto
      if (product?.id !== undefined) {
        await db.product.update(product.id, { qty: Math.max(0, product.qty - parseFloat(dose)) });
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
        <h2 className="text-lg font-bold text-text-bright mb-4">Registrar sesión</h2>
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Producto</span>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
            >
              <option value="">— elige —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.kind} · {p.qty}{p.unit} disponible</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-xs text-text-muted">Dosis</span>
              <input
                type="number"
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-text-muted">Unidad</span>
              <select
                value={doseUnit}
                onChange={(e) => setDoseUnit(e.target.value)}
                className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
              >
                <option value="g">g</option>
                <option value="mg">mg</option>
                <option value="ml">ml</option>
              </select>
            </label>
          </div>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Método</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
            >
              <option>oral</option>
              <option>lemon_tek</option>
              <option>te</option>
              <option>vape</option>
              <option>fumado</option>
              <option>capsula</option>
              <option>chocolate</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Set/Setting</span>
            <input
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              placeholder="Casa, solo, música ambient..."
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Notas pre</span>
            <textarea
              value={notesPre}
              onChange={(e) => setNotesPre(e.target.value)}
              rows={2}
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Notas post</span>
            <textarea
              value={notesPost}
              onChange={(e) => setNotesPost(e.target.value)}
              rows={3}
              className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Rating</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  aria-label={`Rating ${n} de 5`}
                  aria-pressed={n <= rating}
                  className={`px-3 py-1 ${n <= rating ? "text-accent" : "text-text-muted"}`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </label>
          <div className="text-xs text-warn">
            ⚠️ Ventana tolerancia: {tolerance} días tras esta sesión
          </div>
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={onClose} className="px-3 py-2 border border-border rounded">Cancelar</button>
          <button
            onClick={onSave}
            disabled={busy || productId === "" || !dose}
            className="px-3 py-2 bg-accent text-bg rounded font-bold disabled:opacity-50"
          >
            {busy ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
