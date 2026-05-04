import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createCultivation,
  listAvailableTemplates,
} from "../lib/cultivationActions";
import { checkAvailability } from "../lib/stockPipeline";
import type { CultivoTemplate } from "../types";
import type { StockCheck } from "../lib/stockPipeline";

type Step = "template" | "details" | "preflight";

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

  const templates = listAvailableTemplates();

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
    try {
      const result = await createCultivation({
        templateId: template.id,
        name,
        startDate: new Date(startDate),
        notes,
      });
      navigate(`/calendar?highlight=${result.cultivationId}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-1">➕ Nuevo cultivo</h1>
      <Stepper current={step} />

      {step === "template" && (
        <section className="grid gap-3 mt-4">
          <p className="text-text-muted">Elige tipo de cultivo:</p>
          {templates.length === 0 ? (
            <div className="p-4 border border-border rounded">
              No hay templates registrados. Añade alguno en src/templates/.
            </div>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                onClick={() => onChooseTemplate(t)}
                className="text-left p-4 border border-border rounded hover:border-accent transition"
              >
                <div className="text-lg font-bold text-text-bright">
                  {t.emoji} {t.name}
                </div>
                <div className="text-xs text-text-muted">
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
              className="bg-bg-2 border border-border rounded px-3 py-2 text-text-bright"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Fecha de inicio</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-bg-2 border border-border rounded px-3 py-2 text-text-bright"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-text-muted">Notas (opcional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="bg-bg-2 border border-border rounded px-3 py-2 text-text-bright"
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
            <div className="p-4 border border-success rounded">
              ✅ Tienes todo el stock necesario.
            </div>
          ) : (
            <div className="p-4 border border-warn rounded">
              ⚠️ Falta stock. Puedes confirmar igualmente; la falta se añadirá a tu shopping list.
            </div>
          )}
          <div className="grid gap-2">
            <h3 className="text-sm font-bold text-text-bright">Consumo total estimado:</h3>
            {stockCheck.total.map((t) => {
              const m = stockCheck.missing.find((m) => m.stockKey === t.stockKey);
              return (
                <div
                  key={t.stockKey}
                  className={`flex justify-between p-3 border rounded ${
                    m ? "border-warn" : "border-border"
                  }`}
                >
                  <div>
                    <div className="font-bold">{t.stockKey}</div>
                    <div className="text-xs text-text-muted">
                      Necesitas: {t.need}{t.unit}
                    </div>
                  </div>
                  {m && (
                    <div className="text-right text-warn text-xs">
                      Tienes: {m.have}{m.unit}
                      <br />
                      Faltan: {(m.need - m.have).toFixed(1)}{m.unit}
                    </div>
                  )}
                </div>
              );
            })}
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
              {creating ? "Creando..." : "Confirmar y crear cultivo"}
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
