import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createCultivation, listAvailableTemplates } from "../lib/cultivationActions";
import type { CultivoTemplate } from "../types";

type CategoryFilter = CultivoTemplate["category"] | "all";

const CATEGORY_LABELS: Record<CultivoTemplate["category"] | "all", string> = {
  all: "Todos",
  planta: "🌿 Planta",
  hongo: "🍄 Hongo",
  fermento: "🍯 Fermento",
  etnobotanica: "🪷 Etnobotánica",
  toxicas: "☠️ Tóxicas",
};

export default function NewCultivation() {
  const navigate = useNavigate();
  const [template, setTemplate] = useState<CultivoTemplate | null>(null);
  const [name, setName] = useState("");
  const [scale, setScale] = useState(1);
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const allTemplates = listAvailableTemplates();

  const availableCategories = useMemo(() => {
    const cats = new Set(allTemplates.map((t) => t.category));
    return ["all", ...Array.from(cats)] as CategoryFilter[];
  }, [allTemplates]);

  const templates = useMemo(() => {
    const q = search.toLowerCase();
    return allTemplates.filter((t) => {
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
      const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.emoji.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [allTemplates, search, categoryFilter]);

  const onChooseTemplate = (t: CultivoTemplate) => {
    setTemplate(t);
    setName(t.name);
  };

  const onConfirm = async () => {
    if (!template) return;
    setCreating(true);
    setErrMsg(null);
    try {
      const result = await createCultivation({
        templateId: template.id,
        name: name.trim() || template.name,
        scale,
        notes: notes.trim() || undefined,
      });
      navigate(`/cultivations/${result.cultivationId}`);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : `No se pudo crear: ${String(e)}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-1">➕ Nuevo cultivo</h1>
      <p className="text-xs text-text-muted mb-4">
        El cultivo se crea en estado <strong>planeado</strong>. Cuando tengas todo listo, podrás iniciarlo desde Mis Cultivos.
      </p>

      {errMsg && (
        <div className="mt-3 p-3 border border-error rounded text-xs text-error bg-error/10">{errMsg}</div>
      )}

      {!template ? (
        <section className="grid gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar cultivo..."
            className="w-full bg-bg-2 border border-border rounded px-3 py-2 text-text-bright placeholder:text-text-muted"
            aria-label="Buscar cultivo"
          />

          <div className="flex flex-wrap gap-2">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 text-xs rounded border transition ${
                  categoryFilter === cat
                    ? "border-accent bg-accent/10 text-accent font-bold"
                    : "border-border text-text-muted hover:border-accent/50"
                }`}
                aria-pressed={categoryFilter === cat}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <p className="text-xs text-text-muted">
            {templates.length} de {allTemplates.length} tipos
            {search && ` · "${search}"`}
            {categoryFilter !== "all" && ` · ${CATEGORY_LABELS[categoryFilter]}`}
          </p>

          {templates.length === 0 ? (
            <div className="p-4 border border-border rounded text-text-muted text-sm">
              Sin resultados. Prueba otra búsqueda o categoría.
            </div>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                onClick={() => onChooseTemplate(t)}
                className="text-left p-4 border border-border rounded hover:border-accent transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-lg font-bold text-text-bright">
                    {t.emoji} {t.name}
                  </div>
                  <span className="text-xs px-2 py-0.5 border border-border rounded text-text-muted shrink-0 mt-0.5">
                    {CATEGORY_LABELS[t.category] ?? t.category}
                  </span>
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {t.totalDuration.days} días · {t.events.length} eventos · {t.recurringTasks.length} tareas
                </div>
              </button>
            ))
          )}
        </section>
      ) : (
        <section className="grid gap-3 mt-4 max-w-md">
          <div className="p-3 border border-accent/30 bg-accent/5 rounded text-sm">
            <span className="text-lg mr-2">{template.emoji}</span>
            <span className="font-bold text-text-bright">{template.name}</span>
            <div className="text-xs text-text-muted mt-1">
              {template.totalDuration.days} días · {template.events.length + template.recurringTasks.length} eventos totales
            </div>
          </div>

          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Nombre del cultivo</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-2 border border-border rounded px-3 py-2 text-text-bright"
              placeholder={template.name}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Escala — ¿cuántas plantas/kits/unidades?</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={scale}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, "");
                  if (v === "") { setScale(1); return; }
                  const n = parseInt(v, 10);
                  if (!isNaN(n)) setScale(Math.max(1, Math.min(99, n)));
                }}
                className="w-20 bg-bg-2 border border-border rounded px-3 py-2 text-text-bright text-center"
              />
              <span className="text-xs text-text-muted">
                {scale > 1 ? `×${scale} — todas las cantidades se multiplican` : "×1 — cantidades del template"}
              </span>
            </div>
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Notas (opcional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-bg-2 border border-border rounded px-3 py-2 text-text-bright"
              placeholder="Variedad, origen, observaciones..."
            />
          </label>

          <div className="p-3 border border-border bg-bg-2 rounded text-xs text-text-muted">
            💡 Al crearlo, verás la lista de compras y preparación. Cuando tengas todo, pulsa <strong>Iniciar</strong> para generar el calendario.
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setTemplate(null)}
              className="px-4 py-2 border border-border rounded hover:border-accent"
            >
              ← Atrás
            </button>
            <button
              onClick={onConfirm}
              disabled={creating || !name.trim()}
              className="px-4 py-2 bg-accent text-bg rounded font-bold disabled:opacity-50"
            >
              {creating ? "Creando..." : "📋 Crear cultivo"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
