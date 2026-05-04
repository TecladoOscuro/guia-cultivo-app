import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../lib/db";
import { startCultivation } from "../lib/cultivationActions";

export default function PrepChecklist() {
  const items = useLiveQuery(() => db.prepChecklists.toArray(), []) ?? [];
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];

  const planning = cultivations.filter((c) => c.status === "planning");

  const toggle = async (id: number, currentDone: boolean) => {
    await db.prepChecklists.update(id, {
      status: currentDone ? "pending" : "done",
      completedAt: currentDone ? undefined : new Date(),
    });
  };

  const canStart = (cultivationId: number) => {
    const cultItems = items.filter((i) => i.cultivationId === cultivationId);
    const blocking = cultItems.filter((i) => i.blocking);
    return blocking.every((i) => i.status === "done");
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
            const ready = canStart(c.id!);
            return (
              <div key={c.id} className="p-4 border border-border rounded">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h2 className="text-lg font-bold text-text-bright">{c.name}</h2>
                    <div className="text-xs text-text-muted">
                      {done}/{cultItems.length} tareas · {ready ? "✅ listo para iniciar" : "⏳ pendiente preparación"}
                    </div>
                  </div>
                  {ready && (
                    <button
                      onClick={() => startCultivation(c.id!)}
                      className="px-4 py-2 bg-accent text-bg rounded font-bold text-sm"
                    >
                      🚀 Iniciar cultivo
                    </button>
                  )}
                </div>
                <div className="grid gap-2">
                  {cultItems.map((it) => {
                    const isDone = it.status === "done";
                    return (
                      <button
                        key={it.id}
                        onClick={() => toggle(it.id!, isDone)}
                        className={`text-left p-3 border rounded flex items-start gap-3 transition ${
                          isDone ? "border-success/50 opacity-70" : "border-border hover:border-accent"
                        }`}
                      >
                        <span className="text-lg">{isDone ? "✅" : it.blocking ? "🔒" : "⬜"}</span>
                        <div className="flex-1">
                          <div className={`text-sm font-bold ${isDone ? "line-through" : "text-text-bright"}`}>
                            {it.title}
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
