import { useLiveQuery } from "dexie-react-hooks";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "../lib/db";
import { confirmDialog } from "../lib/confirmDialog";

export default function Product() {
  const products = useLiveQuery(() => db.product.toArray(), []) ?? [];
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];

  const byKind = new Map<string, typeof products>();
  for (const p of products) {
    if (!byKind.has(p.kind)) byKind.set(p.kind, []);
    byKind.get(p.kind)!.push(p);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">🫙 Inventario producto</h1>

      {products.length === 0 ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">Sin producto. Registra cosechas en ✂️ Cosechas para llenar inventario.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {Array.from(byKind.entries()).map(([kind, items]) => {
            const total = items.reduce((s, x) => s + x.qty, 0);
            return (
              <div key={kind}>
                <div className="flex justify-between items-baseline mb-2">
                  <h2 className="text-sm font-bold text-text-bright uppercase tracking-wide">{kind}</h2>
                  <span className="text-xs text-accent">Total: {total.toFixed(1)}{items[0].unit}</span>
                </div>
                <div className="grid gap-2">
                  {items.map((p) => {
                    const c = cultivations.find((c) => c.id === p.cultivationId);
                    return (
                      <div key={p.id} className="p-3 border border-border rounded flex justify-between items-center">
                        <div>
                          <div className="font-bold text-text-bright text-sm">
                            {p.qty}{p.unit}
                          </div>
                          <div className="text-xs text-text-muted">
                            {c?.name ?? "?"}
                            {p.peakUntil && ` · peak hasta ${format(p.peakUntil, "PP", { locale: es })}`}
                            {p.openedAt && ` · abierto ${format(p.openedAt, "PP", { locale: es })}`}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!p.openedAt && (
                            <button
                              onClick={() => db.product.update(p.id!, { openedAt: new Date() })}
                              className="text-xs px-2 py-1 border border-border rounded hover:border-accent"
                            >
                              Abrir
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              if (!p.id) return;
                              const ok = await confirmDialog({
                                title: "Borrar producto",
                                message: `Eliminar "${p.kind}" del inventario?`,
                                confirmLabel: "Borrar",
                                danger: true,
                              });
                              if (!ok) return;
                              await db.product.delete(p.id);
                            }}
                            aria-label="Borrar producto"
                            className="text-xs px-2 py-1 text-text-muted hover:text-error"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
