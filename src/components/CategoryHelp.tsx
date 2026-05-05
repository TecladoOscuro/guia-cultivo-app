import { useState } from "react";
import type { StockCategory } from "../types";

const INFO: Record<StockCategory, { emoji: string; desc: string; examples: string }> = {
  semilla:   { emoji: "🌰", desc: "Material de partida para plantar", examples: "semillas, esporas, rizomas, tubérculos" },
  esqueje:   { emoji: "✂️", desc: "Corte de una planta para clonar", examples: "rama de Salvia, San Pedro, Damiana" },
  sustrato:  { emoji: "🪹", desc: "Tierra o medio donde crece", examples: "tierra, coco, perlita, compost, arroz para hongos" },
  equipo:    { emoji: "🔧", desc: "Herramientas y material reutilizable", examples: "macetas, luces, medidores, ollas, fermentadores" },
  nutriente: { emoji: "🧪", desc: "Fertilizantes y aditivos para plantas o fermentos", examples: "BioBizz, NPK, jabón potásico, nutriente levadura" },
  fungible:  { emoji: "💧", desc: "Consumible que se gasta en cada uso", examples: "agua, alcohol, miel, levadura, cinta, trampas adhesivas" },
  kit:       { emoji: "📦", desc: "Pack completo todo-en-uno", examples: "kit de setas, kit de cerveza, bloque pre-colonizado" },
};

export default function CategoryHelp() {
  const [open, setOpen] = useState(false);
  const cats = Object.entries(INFO) as [StockCategory, { emoji: string; desc: string; examples: string }][];

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-text-muted hover:text-accent flex items-center gap-1"
      >
        <span>{open ? "▼" : "▶"}</span> ¿Qué significa cada categoría?
      </button>
      {open && (
        <div className="mt-2 grid gap-1.5 text-xs">
          {cats.map(([key, info]) => (
            <div key={key} className="p-2 border border-border rounded flex gap-2">
              <span className="text-base shrink-0">{info.emoji}</span>
              <div>
                <span className="font-bold text-text-bright">{key}</span>
                <span className="text-text-muted"> — {info.desc}</span>
                <div className="text-text-muted opacity-70">Ej: {info.examples}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
