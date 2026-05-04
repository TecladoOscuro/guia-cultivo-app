import { db } from "./db";

const VERSION = 1;

interface ExportPayload {
  app: "guia-cultivo-app";
  version: number;
  exportedAt: string;
  data: {
    cultivations: unknown[];
    events: unknown[];
    stock: unknown[];
    stockReservations: unknown[];
    shoppingList: unknown[];
    prepChecklists: unknown[];
    journal: unknown[];
    harvests: unknown[];
    product: unknown[];
    sessions: unknown[];
    genetics: unknown[];
    history: unknown[];
    settings: unknown[];
  };
}

export async function exportAll(): Promise<ExportPayload> {
  return {
    app: "guia-cultivo-app",
    version: VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      cultivations: await db.cultivations.toArray(),
      events: await db.events.toArray(),
      stock: await db.stock.toArray(),
      stockReservations: await db.stockReservations.toArray(),
      shoppingList: await db.shoppingList.toArray(),
      prepChecklists: await db.prepChecklists.toArray(),
      journal: await sanitizeJournal(),
      harvests: await db.harvests.toArray(),
      product: await db.product.toArray(),
      sessions: await db.sessions.toArray(),
      genetics: await db.genetics.toArray(),
      history: await db.history.toArray(),
      settings: await db.settings.toArray(),
    },
  };
}

// Convertir Blobs (fotos journal) a base64 strings serializables
async function sanitizeJournal() {
  const entries = await db.journal.toArray();
  return Promise.all(
    entries.map(async (e) => {
      if (!e.photoBlob) return { ...e, photoBlob: null };
      const arr = new Uint8Array(await e.photoBlob.arrayBuffer());
      let binary = "";
      for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
      return { ...e, photoBlob: btoa(binary), _photoMime: e.photoBlob.type };
    })
  );
}

export function downloadJSON(payload: ExportPayload, filename?: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `guia-cultivo-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importAll(payload: ExportPayload, mode: "replace" | "merge"): Promise<{ ok: boolean; reason?: string }> {
  if (payload.app !== "guia-cultivo-app") {
    return { ok: false, reason: "Archivo no es backup guia-cultivo-app" };
  }
  if (payload.version > VERSION) {
    return { ok: false, reason: `Versión backup ${payload.version} mayor que app ${VERSION}. Actualiza app primero.` };
  }

  if (mode === "replace") {
    await Promise.all([
      db.cultivations.clear(),
      db.events.clear(),
      db.stock.clear(),
      db.stockReservations.clear(),
      db.shoppingList.clear(),
      db.prepChecklists.clear(),
      db.journal.clear(),
      db.harvests.clear(),
      db.product.clear(),
      db.sessions.clear(),
      db.genetics.clear(),
      db.history.clear(),
      db.settings.clear(),
    ]);
  }

  const d = payload.data;
  const journal = await Promise.all(
    (d.journal as Array<Record<string, unknown>>).map(async (e) => {
      if (typeof e.photoBlob === "string") {
        const bin = atob(e.photoBlob);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        const mime = (e._photoMime as string) ?? "image/jpeg";
        return { ...e, photoBlob: new Blob([arr], { type: mime }), _photoMime: undefined };
      }
      return { ...e, photoBlob: undefined };
    })
  );

  await Promise.all([
    db.cultivations.bulkPut(d.cultivations as never),
    db.events.bulkPut(d.events as never),
    db.stock.bulkPut(d.stock as never),
    db.stockReservations.bulkPut(d.stockReservations as never),
    db.shoppingList.bulkPut(d.shoppingList as never),
    db.prepChecklists.bulkPut(d.prepChecklists as never),
    db.journal.bulkPut(journal as never),
    db.harvests.bulkPut(d.harvests as never),
    db.product.bulkPut(d.product as never),
    db.sessions.bulkPut(d.sessions as never),
    db.genetics.bulkPut(d.genetics as never),
    db.history.bulkPut(d.history as never),
    db.settings.bulkPut(d.settings as never),
  ]);

  return { ok: true };
}

export async function factoryReset() {
  await Promise.all([
    db.cultivations.clear(),
    db.events.clear(),
    db.stock.clear(),
    db.stockReservations.clear(),
    db.shoppingList.clear(),
    db.prepChecklists.clear(),
    db.journal.clear(),
    db.harvests.clear(),
    db.product.clear(),
    db.sessions.clear(),
    db.genetics.clear(),
    db.history.clear(),
    db.settings.clear(),
  ]);
}
