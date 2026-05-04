import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { exportAll, downloadJSON, importAll, factoryReset } from "../lib/exportImport";
import {
  getNotifEnabled,
  setNotifEnabled,
  getRemindHoursBefore,
  setRemindHoursBefore,
  refreshAllNotifications,
} from "../lib/notifSync";
import {
  getPermission,
  requestPermission,
  type NotifPermission,
} from "../lib/notifications";

export default function Settings() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [notifPerm, setNotifPerm] = useState<NotifPermission>("default");
  const [notifOn, setNotifOn] = useState(false);
  const [remindHours, setRemindHours] = useState(1);

  useEffect(() => {
    setNotifPerm(getPermission());
    getNotifEnabled().then(setNotifOn);
    getRemindHoursBefore().then(setRemindHours);
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

  const onImportClick = () => fileRef.current?.click();

  const onImportFile = async (file: File, mode: "replace" | "merge") => {
    setBusy(true);
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
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
    if (!confirm("⚠️ FACTORY RESET\n\nBorra TODOS los datos (cultivos, eventos, stock, journal, etc).\nEsta acción es irreversible.\n\n¿Continuar?")) return;
    if (!confirm("¿SEGURO? Recomendado exportar backup antes.")) return;
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
            ⬇️ Exportar backup JSON
          </button>
          <button
            onClick={onImportClick}
            disabled={busy}
            className="px-4 py-2 border border-border rounded text-sm hover:border-accent disabled:opacity-50"
          >
            ⬆️ Importar backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const mode = confirm(
                `Importar "${file.name}"\n\n[OK] Reemplazar (borra datos actuales)\n[Cancelar] Merge (añadir sin borrar — puede dar conflictos de IDs)`
              )
                ? "replace"
                : "merge";
              await onImportFile(file, mode);
              e.target.value = "";
            }}
          />
        </div>
      </Section>

      <Section title="🔔 Notificaciones">
        <div className="grid gap-3">
          <div className="p-3 border border-border rounded">
            <div className="flex justify-between items-center mb-2">
              <div>
                <div className="font-bold text-text-bright text-sm">Notificaciones de eventos</div>
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
