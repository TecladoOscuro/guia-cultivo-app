import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { confirmDialog } from "../lib/confirmDialog";
import type { ShoppingItem, Stock } from "../types";

export default function ShoppingList() {
  const [filterStatus, setFilterStatus] = useState<"pending" | "purchased" | "all">("pending");
  const items = useLiveQuery(() => db.shoppingList.toArray(), []) ?? [];
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];
  const stocks = useLiveQuery(() => db.stock.toArray(), []) ?? [];

  const filtered = items.filter(
    (i) => filterStatus === "all" || i.status === filterStatus
  );

  const grouped = groupByCategory(filtered);

  const markPurchased = async (item: ShoppingItem) => {
    if (item.id === undefined) return;
    await db.shoppingList.update(item.id, {
      status: "purchased",
      purchasedAt: new Date(),
    });
    const existing = stocks.find((s) => s.key === item.itemKey);
    if (existing?.id !== undefined) {
      await db.stock.update(existing.id, { qty: existing.qty + item.qty });
    } else {
      await db.stock.add({
        key: item.itemKey,
        name: item.name,
        category: "fungible",
        qty: item.qty,
        unit: item.unit,
        addedAt: new Date(),
        notes: item.notes,
      } as Stock);
    }
  };

  const revertPurchased = async (item: ShoppingItem) => {
    if (item.id === undefined) return;
    const ok = await confirmDialog({
      title: "Revertir compra",
      message: `Volver "${item.name}" a pendiente.\n\nEl stock añadido se descontará.`,
      confirmLabel: "Revertir",
      danger: true,
    });
    if (!ok) return;
    await db.shoppingList.update(item.id, {
      status: "pending",
      purchasedAt: undefined,
    });
    const existing = stocks.find((s) => s.key === item.itemKey);
    if (existing?.id !== undefined) {
      const newQty = Math.max(0, existing.qty - item.qty);
      if (newQty === 0) {
        await db.stock.delete(existing.id);
      } else {
        await db.stock.update(existing.id, { qty: newQty });
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">🛒 Lista de compras</h1>

      <div className="flex gap-2 mb-4">
        {(["pending", "purchased", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 text-xs rounded border ${
              filterStatus === s
                ? "bg-accent text-bg border-accent font-bold"
                : "border-border hover:border-accent"
            }`}
          >
            {s === "pending" ? "Pendientes" : s === "purchased" ? "Comprados" : "Todos"} ({items.filter((i) => s === "all" || i.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">Sin items. Crea un cultivo y se generará la lista automáticamente.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {grouped.map(({ category, items }) => (
            <div key={category}>
              <h2 className="text-sm font-bold text-text-bright mb-2 uppercase tracking-wide">
                {category}
              </h2>
              <div className="grid gap-2">
                {items.map((it) => {
                  const cult = cultivations.find((c) => c.id === it.cultivationId);
                  const haveStock = stocks.find((s) => s.key === it.itemKey);
                  const isPurchased = it.status === "purchased";
                  return (
                    <div
                      key={it.id}
                      className={`p-3 border rounded transition ${
                        isPurchased ? "border-success/40 bg-success/5" : "border-border"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm font-bold ${
                              isPurchased ? "line-through text-text-muted" : "text-text-bright"
                            }`}
                          >
                            {it.name}
                          </div>
                          <div className="text-xs text-text-muted">
                            {it.qty}{it.unit} · {it.approxPrice ?? "?"} · {cult?.name ?? "manual"}
                            {haveStock && ` · 📦 tienes ${haveStock.qty}${haveStock.unit}`}
                          </div>
                          {it.notes && (
                            <div className="text-xs text-text-muted mt-1">{it.notes}</div>
                          )}
                          {isPurchased && it.purchasedAt && (
                            <div className="text-xs text-success mt-1">
                              ✅ Comprado {new Date(it.purchasedAt).toLocaleDateString("es-ES")}
                            </div>
                          )}
                        </div>
                        {isPurchased ? (
                          <button
                            onClick={() => revertPurchased(it)}
                            className="px-3 py-2 border border-border rounded text-xs whitespace-nowrap hover:border-warn hover:text-warn transition"
                            title="Revertir compra (desmarcar y descontar stock)"
                          >
                            ↩️ Revertir
                          </button>
                        ) : (
                          <button
                            onClick={() => markPurchased(it)}
                            className="px-3 py-2 bg-success text-bg rounded text-xs font-bold whitespace-nowrap hover:brightness-110 transition active:scale-95"
                            title="Marcar como comprado (añade al stock)"
                          >
                            🛒 Marcar comprado
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
    .map((cat) => ({
      category: cat,
      items: items.filter((i) => i.category === cat),
    }))
    .filter((g) => g.items.length > 0);
}
