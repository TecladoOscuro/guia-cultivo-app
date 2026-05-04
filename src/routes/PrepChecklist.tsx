import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { abortCultivation } from "../lib/cultivationActions";
import { confirmDialog } from "../lib/confirmDialog";

export default function PrepChecklist() {
  const items = useLiveQuery(() => db.prepChecklists.toArray(), []) ?? [];
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];

  const activos = cultivations.filter((c) => c.status === "active" || c.status === "planning");

  const toggle = async (id: number, currentDone: boolean) => {
    await db.prepChecklists.update(id, {
      status: currentDone ? "pending" : "done",
      completedAt: currentDone ? undefined : new Date(),
    });
  };

  const onAbort = async (cultId: number, name: string) => {
    const ok = await confirmDialog({
      title: "Abortar cultivo",
      message: `¿Abortar "${name}"?\n\nLibera reservas de stock. Los datos se conservan en histórico.`,
      confirmLabel: "Abortar",
      danger: true,
    });
    if (!ok) return;
    await abortCultivation(cultId);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-2">✅ Preparación</h1>
      <p className="text-text-muted text-sm mb-4">
        Lista de tareas recomendadas <strong>antes</strong> de empezar el cultivo (esterilizar equipo, hidratar grano, etc). No es bloqueante — son recordatorios. Si no quieres continuar el cultivo, puedes abortarlo desde aquí.
      </p>

      {activos.length === 0 ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">No hay cultivos activos.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {activos.map((c) => {
            const cultItems = items.filter((i) => i.cultivationId === c.id);
            const done = cultItems.filter((i) => i.status === "done").length;
            return (
              <div key={c.id} className="p-4 border border-border rounded">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-text-bright">{c.name}</h2>
                    <div className="text-xs text-text-muted">
                      {done}/{cultItems.length} tareas completadas
                    </div>
                  </div>
                  <button
                    onClick={() => onAbort(c.id!, c.name)}
                    className="px-3 py-2 border border-error text-error rounded text-sm hover:bg-error/10 whitespace-nowrap"
                  >
                    ⚠️ Abortar
                  </button>
                </div>
                {cultItems.length === 0 ? (
                  <div className="text-xs text-text-muted">
                    Este cultivo no tiene tareas de preparación definidas.
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {cultItems.map((it) => {
                      const isDone = it.status === "done";
                      return (
                        <button
                          key={it.id}
                          onClick={() => toggle(it.id!, isDone)}
                          className={`text-left p-3 border rounded flex items-start gap-3 transition ${
                            isDone
                              ? "border-success/50 opacity-70"
                              : "border-border hover:border-accent"
                          }`}
                        >
                          <span className="text-lg">{isDone ? "✅" : "⬜"}</span>
                          <div className="flex-1">
                            <div className={`text-sm font-bold ${isDone ? "line-through" : "text-text-bright"}`}>
                              {it.title}
                              {it.blocking && !isDone && (
                                <span className="ml-2 text-xs text-warn">recomendado</span>
                              )}
                            </div>
                            {it.description && (
                              <div className="text-xs text-text-muted mt-1">{it.description}</div>
                            )}
                            {it.estimatedMinutes && (
                              <div className="text-xs text-text-muted mt-1">~{it.estimatedMinutes} min</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
