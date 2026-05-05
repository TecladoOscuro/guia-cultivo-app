import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  createCultivation,
  listAvailableTemplates,
} from "../lib/cultivationActions";
import { checkAvailability } from "../lib/stockPipeline";
import type { CultivoTemplate } from "../types";
import type { StockCheck } from "../lib/stockPipeline";

type Step = "template" | "details" | "preflight";
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
  const [step, setStep] = useState<Step>("template");
  const [template, setTemplate] = useState<CultivoTemplate | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [stockCheck, setStockCheck] = useState<StockCheck | null>(null);
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
    setName(`${t.name} #${Date.now().toString().slice(-4)}`);
    setStep("details");
  };

  const onCheckStock = async () => {
    if (!template) return;
    const check = await checkAvailability(template);
    setStockCheck(check);
    setStep("preflight");
  };

  const onConfirm = async () => {
    if (!template) return;
    setCreating(true);
    setErrMsg(null);
    try {
      const result = await createCultivation({
        templateId: template.id,
        name,
        startDate: new Date(startDate),
        notes,
      });
      navigate(`/calendar?highlight=${result.cultivationId}`);
    } catch (e) {
      setErrMsg(
        e instanceof Error
          ? e.message
          : `No se pudo crear el cultivo: ${String(e)}`,
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-1">➕ Nuevo cultivo</h1>
      <Stepper current={step} />
      {errMsg && (
        <div className="mt-3 p-3 border border-error rounded text-xs text-error bg-error/10">
          {errMsg}
        </div>
      )}

      {step === "template" && (
        <section className="grid gap-3 mt-4">
          {/* Search */}
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar cultivo..."
            className="w-full bg-bg-2 border border-border rounded px-3 py-2 text-text-bright placeholder:text-text-muted"
            aria-label="Buscar cultivo"
          />

          {/* Category filters */}
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

          {/* Results count */}
          <p className="text-xs text-text-muted">
            {templates.length} de {allTemplates.length} cultivolos
            {search && ` · "${search}"`}
            {categoryFilter !== "all" && ` · ${CATEGORY_LABELS[categoryFilter]}`}
          </p>

          {templates.length === 0 ? (
            <div className="p-4 border border-border rounded text-text-muted text-sm">
              Sin resultados. Prueba con otra búsqueda o categoría.
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
                  {t.totalDuration.days} días · {t.events.length} eventos · {t.recurringTasks.length} tareas recurrentes · {t.consumables.length} consumibles
                </div>
              </button>
            ))
          )}
        </section>
      )}

      {step === "details" && template && (
        <section className="grid gap-3 mt-4 max-w-md">
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Alias del cultivo</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-2 border border-border rounded px-3 py-2 text-text-bright"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Fecha de inicio</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-bg-2 border border-border rounded px-3 py-2 text-text-bright"
            />
            <span className="text-xs text-text-muted">Ponla para cuando tengas todo listo. Si te faltan compras, pon una fecha futura para no ir a contrarreloj.</span>
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Notas (opcional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-bg-2 border border-border rounded px-3 py-2 text-text-bright"
            />
          </label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setStep("template")}
              className="px-4 py-2 border border-border rounded hover:border-accent"
            >
              Atrás
            </button>
            <button
              onClick={onCheckStock}
              disabled={!name.trim()}
              className="px-4 py-2 bg-accent text-bg rounded font-bold disabled:opacity-50"
            >
              Continuar
            </button>
          </div>
        </section>
      )}

      {step === "preflight" && template && stockCheck && (
        <section className="grid gap-3 mt-4">
          <h2 className="text-lg font-bold text-text-bright">
            Pre-flight check de stock
          </h2>
          {stockCheck.ok ? (
            <div className="p-3 border border-success rounded text-sm">
              ✅ Tienes todo. La lista de compras quedará vacía.
            </div>
          ) : (
            <div className="p-3 border border-warn rounded text-sm">
              ⚠️ Te falta algo. Solo lo que no tengas en stock irá a la lista de compras.
            </div>
          )}
          <div className="grid gap-2">
            {stockCheck.total.map((t) => {
              const m = stockCheck.missing.find((m) => m.stockKey === t.stockKey);
              const hasStock = !m;
              return (
                <div
                  key={t.stockKey}
                  className={`flex justify-between p-3 border rounded ${
                    m ? "border-warn" : "border-success/40 bg-success/5"
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm">{t.stockKey}</div>
                    <div className="text-xs text-text-muted">
                      Necesitas: {t.need}{t.unit}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    {hasStock ? (
                      <span className="text-success">✅ Ya lo tienes</span>
                    ) : (
                      <span className="text-warn">
                        Tienes: {m!.have}{m!.unit}
                        <br />
                        Faltan: {(m!.need - m!.have).toFixed(1)}{m!.unit}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-3 border border-accent/40 bg-accent/5 rounded text-xs">
            ℹ️ <strong>Lo que ya tienes:</strong> se reserva del stock (no se descuenta hasta marcar "✅ Hecho").<br />
            <strong>Lo que falte:</strong> irá a la lista de compras. Al marcarlo comprado, entrará al stock automáticamente.
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setStep("details")}
              className="px-4 py-2 border border-border rounded hover:border-accent"
            >
              Atrás
            </button>
            <button
              onClick={onConfirm}
              disabled={creating}
              className="px-4 py-2 bg-accent text-bg rounded font-bold disabled:opacity-50"
            >
              {creating ? "Creando..." : "🚀 Crear y empezar"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Stepper({ current }: { current: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "template", label: "Tipo" },
    { id: "details", label: "Datos" },
    { id: "preflight", label: "Stock" },
  ];
  const currentIdx = steps.findIndex((s) => s.id === current);
  return (
    <div className="flex gap-2 text-xs text-text-muted mt-2">
      {steps.map((s, i) => (
        <span
          key={s.id}
          className={i <= currentIdx ? "text-accent font-bold" : ""}
        >
          {i + 1}. {s.label}
          {i < steps.length - 1 ? " →" : ""}
        </span>
      ))}
    </div>
  );
}
