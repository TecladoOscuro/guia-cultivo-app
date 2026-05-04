import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import {
  exportAll,
  downloadJSON,
  importAll,
  factoryReset,
  encryptPayload,
  decryptPayload,
  downloadEncrypted,
  isEncryptedPayload,
} from "../lib/exportImport";
import { confirmDialog, chooseDialog } from "../lib/confirmDialog";
import {
  getNotifEnabled,
  setNotifEnabled,
  getRemindHoursBefore,
  setRemindHoursBefore,
  getWorkerUrl,
  setWorkerUrl,
  refreshAllNotifications,
} from "../lib/notifSync";
import {
  getPermission,
  requestPermission,
  subscribePush,
  unsubscribePush,
  pushTest,
  getPushSubscription,
  type NotifPermission,
} from "../lib/notifications";

export default function Settings() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [notifPerm, setNotifPerm] = useState<NotifPermission>("default");
  const [notifOn, setNotifOn] = useState(false);
  const [remindHours, setRemindHours] = useState(1);
  const [workerUrl, setWorkerUrlState] = useState("");
  const [pushSubscribed, setPushSubscribed] = useState(false);

  useEffect(() => {
    setNotifPerm(getPermission());
    getNotifEnabled().then(setNotifOn);
    getRemindHoursBefore().then(setRemindHours);
    getWorkerUrl().then((u) => setWorkerUrlState(u ?? ""));
    getPushSubscription().then((s) => setPushSubscribed(Boolean(s)));
  }, []);

  const onToggleNotif = async () => {
    if (!notifOn && notifPerm !== "granted") {
      const r = await requestPermission();
      setNotifPerm(r);
      if (r !== "granted") {
        setMsg({ type: "err", text: "Permisos de notificación denegados por el navegador" });
        return;
      }
    }
    const next = !notifOn;
    await setNotifEnabled(next);
    setNotifOn(next);
    await refreshAllNotifications();
    setMsg({ type: "ok", text: next ? "Notificaciones activadas" : "Notificaciones desactivadas" });
  };

  const onChangeRemindHours = async (h: number) => {
    setRemindHours(h);
    await setRemindHoursBefore(h);
    await refreshAllNotifications();
  };

  const onSavePushConfig = async () => {
    const url = workerUrl.trim().replace(/\/$/, "");
    if (!url) {
      setMsg({ type: "err", text: "Worker URL vacía" });
      return;
    }
    if (!url.startsWith("https://")) {
      setMsg({ type: "err", text: "URL debe empezar con https://" });
      return;
    }
    setBusy(true);
    try {
      // Verificar Worker accesible
      const test = await fetch(`${url}/vapid-public`);
      if (!test.ok) throw new Error(`Worker respondió ${test.status}`);
      await setWorkerUrl(url);
      // Subscribe push
      if (notifPerm !== "granted") {
        const r = await requestPermission();
        setNotifPerm(r);
        if (r !== "granted") {
          setMsg({ type: "err", text: "Permisos denegados" });
          setBusy(false);
          return;
        }
      }
      const sub = await subscribePush(url);
      if (sub) {
        setPushSubscribed(true);
        await refreshAllNotifications();
        setMsg({ type: "ok", text: "Push remoto activado. Eventos llegarán al iPhone aunque app cerrada." });
      }
    } catch (e) {
      setMsg({ type: "err", text: `Error: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const onUnsubscribePush = async () => {
    const url = await getWorkerUrl();
    if (!url) return;
    setBusy(true);
    try {
      await unsubscribePush(url);
      await setWorkerUrl(null);
      setWorkerUrlState("");
      setPushSubscribed(false);
      setMsg({ type: "ok", text: "Push remoto desactivado" });
    } catch (e) {
      setMsg({ type: "err", text: `Error: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const onTestPush = async () => {
    const url = await getWorkerUrl();
    if (!url) return;
    setBusy(true);
    try {
      await pushTest(url);
      setMsg({ type: "ok", text: "Push test enviado. Debe llegar en ~5s." });
    } catch (e) {
      setMsg({ type: "err", text: `Error test: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  // Counts para resumen
  const counts = useLiveQuery(async () => ({
    cultivations: await db.cultivations.count(),
    events: await db.events.count(),
    stock: await db.stock.count(),
    journal: await db.journal.count(),
    harvests: await db.harvests.count(),
    sessions: await db.sessions.count(),
  }), []);

  const onExport = async () => {
    setBusy(true);
    try {
      const payload = await exportAll();
      downloadJSON(payload);
      setMsg({ type: "ok", text: "Backup descargado correctamente" });
    } catch (e) {
      setMsg({ type: "err", text: `Error: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const onExportEncrypted = async () => {
    const password = prompt("Password para encriptar (mínimo 8 caracteres):");
    if (!password || password.length < 8) {
      setMsg({ type: "err", text: "Password debe tener al menos 8 caracteres" });
      return;
    }
    const confirm2 = prompt("Repite el password para confirmar:");
    if (password !== confirm2) {
      setMsg({ type: "err", text: "Los passwords no coinciden" });
      return;
    }
    setBusy(true);
    try {
      const payload = await exportAll();
      const encrypted = await encryptPayload(payload, password);
      downloadEncrypted(encrypted);
      setMsg({ type: "ok", text: "Backup encriptado descargado. Guarda el password — sin él no podrás recuperar." });
    } catch (e) {
      setMsg({ type: "err", text: `Error: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const onImportClick = () => fileRef.current?.click();

  const onImportFile = async (file: File, mode: "replace" | "merge") => {
    setBusy(true);
    try {
      const text = await file.text();
      let payload = JSON.parse(text);
      if (isEncryptedPayload(payload)) {
        const pwd = prompt("Backup encriptado. Introduce el password:");
        if (!pwd) {
          setBusy(false);
          return;
        }
        try {
          payload = await decryptPayload(payload, pwd);
        } catch (e) {
          setMsg({ type: "err", text: e instanceof Error ? e.message : String(e) });
          setBusy(false);
          return;
        }
      }
      const result = await importAll(payload, mode);
      if (result.ok) {
        setMsg({ type: "ok", text: `Datos importados (${mode}). Recarga si no ves cambios.` });
      } else {
        setMsg({ type: "err", text: result.reason ?? "Error desconocido" });
      }
    } catch (e) {
      setMsg({ type: "err", text: `Error parseando JSON: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const onFactoryReset = async () => {
    const ok = await confirmDialog({
      title: "⚠️ Factory reset",
      message:
        "Borra TODOS los datos (cultivos, eventos, stock, journal, sesiones, fotos).\n\nEsta acción es irreversible. Recomendado exportar backup antes.",
      confirmLabel: "Borrar todo",
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await factoryReset();
      setMsg({ type: "ok", text: "Datos eliminados. Recarga la página." });
    } catch (e) {
      setMsg({ type: "err", text: `Error: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">⚙️ Ajustes</h1>

      {msg && (
        <div
          className={`p-3 mb-4 rounded border ${
            msg.type === "ok" ? "border-success bg-success/10 text-success" : "border-error bg-error/10 text-error"
          }`}
        >
          {msg.text}
          <button
            onClick={() => setMsg(null)}
            className="float-right text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      <Section title="📊 Resumen datos">
        {!counts ? (
          <p className="text-text-muted text-sm">Cargando...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            <div className="p-2 border border-border rounded">
              <div className="font-bold text-text-bright">{counts.cultivations}</div>
              <div className="text-xs text-text-muted">cultivos</div>
            </div>
            <div className="p-2 border border-border rounded">
              <div className="font-bold text-text-bright">{counts.events}</div>
              <div className="text-xs text-text-muted">eventos</div>
            </div>
            <div className="p-2 border border-border rounded">
              <div className="font-bold text-text-bright">{counts.stock}</div>
              <div className="text-xs text-text-muted">items stock</div>
            </div>
            <div className="p-2 border border-border rounded">
              <div className="font-bold text-text-bright">{counts.journal}</div>
              <div className="text-xs text-text-muted">journal</div>
            </div>
            <div className="p-2 border border-border rounded">
              <div className="font-bold text-text-bright">{counts.harvests}</div>
              <div className="text-xs text-text-muted">cosechas</div>
            </div>
            <div className="p-2 border border-border rounded">
              <div className="font-bold text-text-bright">{counts.sessions}</div>
              <div className="text-xs text-text-muted">sesiones</div>
            </div>
          </div>
        )}
      </Section>

      <Section title="💾 Backup / Restore">
        <p className="text-xs text-text-muted mb-3">
          Exporta todos tus datos (incluyendo fotos) a un archivo JSON. Guárdalo seguro. Para restaurar: importa el archivo.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExport}
            disabled={busy}
            className="px-4 py-2 bg-accent text-bg rounded font-bold text-sm disabled:opacity-50"
          >
            ⬇️ Exportar JSON
          </button>
          <button
            onClick={onExportEncrypted}
            disabled={busy}
            className="px-4 py-2 border border-accent text-accent rounded text-sm hover:bg-accent/10 disabled:opacity-50"
          >
            🔒 Exportar encriptado
          </button>
          <button
            onClick={onImportClick}
            disabled={busy}
            className="px-4 py-2 border border-border rounded text-sm hover:border-accent disabled:opacity-50"
          >
            ⬆️ Importar (auto-detecta)
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const mode = await chooseDialog<"replace" | "merge">({
                title: "Importar backup",
                message: `Cómo aplicar "${file.name}"?`,
                options: [
                  { value: "replace", label: "Reemplazar (borra datos actuales)", danger: true },
                  { value: "merge", label: "Merge (añadir sin borrar)" },
                ],
              });
              if (!mode) {
                e.target.value = "";
                return;
              }
              await onImportFile(file, mode);
              e.target.value = "";
            }}
          />
        </div>
      </Section>

      <Section title="🔔 Notificaciones">
        <div className="p-3 border border-warn rounded mb-3 bg-warn/5">
          <div className="text-sm font-bold text-warn mb-1">⏳ Funcionalidad PARCIAL</div>
          <div className="text-xs text-text-muted">
            <strong>Funciona</strong>: notif locales con app abierta + badge counter persistente cuando app cerrada.
            <br />
            <strong>NO funciona</strong>: notif background fiables iPhone con app cerrada (iOS suspende SW).
            <br />
            Para notif background reliable iPhone: deploy CF Worker (~10 min, gratis).{" "}
            <a
              href="https://github.com/TecladoOscuro/guia-cultivo-app/tree/main/worker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              Instrucciones aquí
            </a>
            . Pendiente acción manual.
          </div>
        </div>
        <div className="grid gap-3">
          <div className="p-3 border border-border rounded">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="font-bold text-text-bright text-sm">Notif locales (foreground + badge)</div>
                <div className="text-xs text-text-muted">
                  {notifPerm === "granted"
                    ? "✅ permiso concedido"
                    : notifPerm === "denied"
                      ? "❌ permiso denegado en navegador"
                      : notifPerm === "unsupported"
                        ? "⚠️ no soportado en este navegador"
                        : "permiso no solicitado aún"}
                </div>
              </div>
              <button
                onClick={onToggleNotif}
                disabled={notifPerm === "denied" || notifPerm === "unsupported"}
                className={`px-4 py-2 rounded font-bold text-sm disabled:opacity-50 ${
                  notifOn ? "bg-success text-bg" : "border border-border hover:border-accent"
                }`}
              >
                {notifOn ? "✅ Activadas" : "Activar"}
              </button>
            </div>
            {notifOn && (
              <label className="flex items-center gap-2 text-xs">
                <span className="text-text-muted">Avisar antes:</span>
                <select
                  value={remindHours}
                  onChange={(e) => onChangeRemindHours(Number(e.target.value))}
                  className="bg-bg-3 border border-border rounded px-2 py-1 text-text-bright"
                >
                  <option value={0.25}>15 min</option>
                  <option value={0.5}>30 min</option>
                  <option value={1}>1 hora</option>
                  <option value={2}>2 horas</option>
                  <option value={4}>4 horas</option>
                  <option value={12}>12 horas</option>
                  <option value={24}>24 horas</option>
                </select>
              </label>
            )}
            <p className="text-xs text-text-muted mt-2">
              Notif locales sin servidor. Background limitado en iOS — badge counter persiste.
            </p>
          </div>

          <div className="p-3 border border-border rounded">
            <div className="font-bold text-text-bright text-sm mb-1">📱 Push remoto (background iOS)</div>
            <div className="text-xs text-text-muted mb-3">
              Notif background reliable iOS. Requiere CF Worker. Setup: deploy{" "}
              <a
                href="https://github.com/TecladoOscuro/guia-cultivo-app/tree/main/worker"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                worker/
              </a>{" "}
              en tu cuenta CF (10 min, gratis), pega URL aquí.
            </div>
            <input
              type="url"
              value={workerUrl}
              onChange={(e) => setWorkerUrlState(e.target.value)}
              placeholder="https://guia-cultivo-push.tu-usuario.workers.dev"
              className="w-full bg-bg-3 border border-border rounded px-3 text-text-bright mb-2"
            />
            <div className="flex flex-wrap gap-2">
              {pushSubscribed ? (
                <>
                  <button
                    onClick={onTestPush}
                    disabled={busy}
                    className="px-3 py-2 border border-accent text-accent rounded text-sm disabled:opacity-50"
                  >
                    🧪 Push test
                  </button>
                  <button
                    onClick={onUnsubscribePush}
                    disabled={busy}
                    className="px-3 py-2 border border-error text-error rounded text-sm disabled:opacity-50"
                  >
                    ✕ Desactivar push
                  </button>
                </>
              ) : (
                <button
                  onClick={onSavePushConfig}
                  disabled={busy || !workerUrl}
                  className="px-3 py-2 bg-accent text-bg rounded font-bold text-sm disabled:opacity-50"
                >
                  ✅ Activar push remoto
                </button>
              )}
            </div>
            {pushSubscribed && (
              <div className="text-xs text-success mt-2">
                ✅ Suscrito · Worker: {workerUrl.replace(/^https?:\/\//, "")}
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section title="🔄 Auto-update PWA">
        <p className="text-xs text-text-muted">
          App comprueba nueva versión cada 60s. Banner inferior "🔄 Recargar" cuando hay update. Si no aparece: cierra PWA del switcher iOS + reabre.
        </p>
      </Section>

      <Section title="🆘 Información app">
        <div className="text-xs text-text-muted space-y-1">
          <div>Datos solo en este dispositivo (IndexedDB)</div>
          <div>Sin tracking · sin analytics · sin cookies de terceros</div>
          <div>Repo: <a href="https://github.com/TecladoOscuro/guia-cultivo-app" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">github.com/TecladoOscuro/guia-cultivo-app</a></div>
          <div>Wiki: <a href="https://tecladooscuro.github.io/guia-cultivo/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">tecladooscuro.github.io/guia-cultivo</a></div>
        </div>
      </Section>

      <Section title="⚠️ Zona peligrosa">
        <button
          onClick={onFactoryReset}
          disabled={busy}
          className="px-4 py-2 border border-error text-error rounded text-sm hover:bg-error/10 disabled:opacity-50"
        >
          🗑️ Factory reset (borrar todo)
        </button>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-sm font-bold text-text-bright mb-2 uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}
