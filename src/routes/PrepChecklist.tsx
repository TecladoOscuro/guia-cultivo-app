import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/db";
import { startCultivation } from "../lib/cultivationActions";

export default function PrepChecklist() {
  const navigate = useNavigate();
  const items = useLiveQuery(() => db.prepChecklists.toArray(), []) ?? [];
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];

  const planning = cultivations.filter((c) => c.status === "planning");

  const toggle = async (id: number, currentDone: boolean) => {
    await db.prepChecklists.update(id, {
      status: currentDone ? "pending" : "done",
      completedAt: currentDone ? undefined : new Date(),
    });
  };

  const blockingPending = (cultivationId: number) => {
    return items.filter(
      (i) => i.cultivationId === cultivationId && i.blocking && i.status !== "done"
    );
  };

  const onStart = async (cultivationId: number) => {
    const blocking = blockingPending(cultivationId);
    if (blocking.length > 0) {
      const confirmMsg = `⚠️ ${blocking.length} tarea(s) crítica(s) sin completar:\n\n${blocking
        .map((b) => `• ${b.title}`)
        .join("\n")}\n\n¿Iniciar cultivo igualmente?`;
      if (!confirm(confirmMsg)) return;
    }
    await startCultivation(cultivationId);
    navigate("/calendar");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">✅ Preparación pre-cultivo</h1>

      {planning.length === 0 ? (
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">No hay cultivos en fase planning. Crea uno en ➕ Nuevo.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {planning.map((c) => {
            const cultItems = items.filter((i) => i.cultivationId === c.id);
            const done = cultItems.filter((i) => i.status === "done").length;
            const blocking = blockingPending(c.id!);
            const allDone = blocking.length === 0;
            return (
              <div key={c.id} className="p-4 border border-border rounded">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-text-bright">{c.name}</h2>
                    <div className="text-xs text-text-muted">
                      {done}/{cultItems.length} tareas
                      {allDone ? " · ✅ todas críticas completadas" : ` · ⚠️ ${blocking.length} crítica(s) pendiente(s)`}
                    </div>
                  </div>
                  <button
                    onClick={() => onStart(c.id!)}
                    className={`px-4 py-2 rounded font-bold text-sm whitespace-nowrap ${
                      allDone
                        ? "bg-accent text-bg"
                        : "bg-warn text-bg hover:brightness-110"
                    }`}
                    title={
                      allDone
                        ? "Iniciar cultivo"
                        : "Iniciar igualmente (saltar tareas pendientes)"
                    }
                  >
                    {allDone ? "🚀 Iniciar" : "⚠️ Iniciar igualmente"}
                  </button>
                </div>
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
                            : it.blocking
                              ? "border-warn/40 hover:border-warn"
                              : "border-border hover:border-accent"
                        }`}
                      >
                        <span className="text-lg">
                          {isDone ? "✅" : it.blocking ? "🔒" : "⬜"}
                        </span>
                        <div className="flex-1">
                          <div className={`text-sm font-bold ${isDone ? "line-through" : "text-text-bright"}`}>
                            {it.title}
                            {it.blocking && !isDone && (
                              <span className="ml-2 text-xs text-warn">crítico</span>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
