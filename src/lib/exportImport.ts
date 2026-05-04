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

// === Encriptación AES-256-GCM con Web Crypto API ===

interface EncryptedPayload {
  app: "guia-cultivo-app";
  encrypted: true;
  version: number;
  algorithm: "AES-256-GCM";
  iterations: number;
  salt: string; // base64
  iv: string; // base64
  ciphertext: string; // base64
}

const PBKDF2_ITER = 250_000;

async function deriveKey(password: string, salt: BufferSource): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password) as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITER, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return buf;
}

export async function encryptPayload(
  payload: ExportPayload,
  password: string
): Promise<EncryptedPayload> {
  const saltBuf = new ArrayBuffer(16);
  crypto.getRandomValues(new Uint8Array(saltBuf));
  const ivBuf = new ArrayBuffer(12);
  crypto.getRandomValues(new Uint8Array(ivBuf));
  const key = await deriveKey(password, saltBuf);
  const enc = new TextEncoder();
  const data = enc.encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBuf },
    key,
    data as BufferSource
  );
  return {
    app: "guia-cultivo-app",
    encrypted: true,
    version: VERSION,
    algorithm: "AES-256-GCM",
    iterations: PBKDF2_ITER,
    salt: bufToB64(saltBuf),
    iv: bufToB64(ivBuf),
    ciphertext: bufToB64(ciphertext),
  };
}

export async function decryptPayload(
  encrypted: EncryptedPayload,
  password: string
): Promise<ExportPayload> {
  if (!encrypted.encrypted || encrypted.algorithm !== "AES-256-GCM") {
    throw new Error("Formato no soportado o no encriptado");
  }
  const salt = b64ToBuf(encrypted.salt);
  const iv = b64ToBuf(encrypted.iv);
  const ct = b64ToBuf(encrypted.ciphertext);
  const key = await deriveKey(password, salt);
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    const text = new TextDecoder().decode(plain);
    return JSON.parse(text);
  } catch {
    throw new Error("Password incorrecto o archivo corrupto");
  }
}

export function downloadEncrypted(encrypted: EncryptedPayload, filename?: string) {
  const blob = new Blob([JSON.stringify(encrypted, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `guia-cultivo-backup-encrypted-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function isEncryptedPayload(obj: unknown): obj is EncryptedPayload {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (obj as { encrypted?: boolean }).encrypted === true
  );
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
