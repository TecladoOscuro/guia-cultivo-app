import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { exportAll, downloadJSON, importAll, factoryReset } from "../lib/exportImport";

export default function Settings() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

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
