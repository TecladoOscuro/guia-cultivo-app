import { useState } from "react";

export default function Calculators() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">🧮 Calculadoras</h1>
      <div className="grid gap-4">
        <FreshDryCalc />
        <DoseByWeightCalc />
        <ABVCalc />
        <DecarbCalc />
      </div>
    </div>
  );
}

function CalcCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="p-4 border border-border rounded">
      <h2 className="text-base font-bold text-text-bright mb-1">{title}</h2>
      {desc && <p className="text-xs text-text-muted mb-3">{desc}</p>}
      {children}
    </div>
  );
}

function NumInput({ label, value, onChange, unit }: { label: string; value: string; onChange: (v: string) => void; unit?: string }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-text-muted">{label}{unit && ` (${unit})`}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
      />
    </label>
  );
}

function FreshDryCalc() {
  const [fresh, setFresh] = useState("10");
  const [factor, setFactor] = useState("5");
  const f = parseFloat(fresh) || 0;
  const fact = parseFloat(factor) || 5;
  const dry = f / fact;
  return (
    <CalcCard title="🍄 Fresco → Seco" desc="Setas/trufas suelen perder ~80% peso al secar (factor 5x). Cannabis 4-5x.">
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Peso fresco" value={fresh} onChange={setFresh} unit="g" />
        <NumInput label="Factor" value={factor} onChange={setFactor} />
      </div>
      <div className="mt-3 text-sm">
        Peso seco esperado: <span className="text-accent font-bold">{dry.toFixed(2)}g</span>
      </div>
    </CalcCard>
  );
}

function DoseByWeightCalc() {
  const [weight, setWeight] = useState("70");
  const [doseLvl, setDoseLvl] = useState<"micro" | "low" | "medium" | "strong" | "heroic">("medium");
  const w = parseFloat(weight) || 0;
  const factors = { micro: 0.003, low: 0.015, medium: 0.025, strong: 0.05, heroic: 0.075 };
  const grams = w * factors[doseLvl];
  return (
    <CalcCard title="💊 Dosis por peso (setas secas)" desc="Aproximación. Cada persona varía. Empieza siempre en rango bajo.">
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Peso corporal" value={weight} onChange={setWeight} unit="kg" />
        <label className="grid gap-1">
          <span className="text-xs text-text-muted">Nivel</span>
          <select
            value={doseLvl}
            onChange={(e) => setDoseLvl(e.target.value as typeof doseLvl)}
            className="w-full bg-bg-3 border border-border rounded px-3 py-2 text-text-bright"
          >
            <option value="micro">Microdosis (0.1-0.3g)</option>
            <option value="low">Baja (0.5-1g)</option>
            <option value="medium">Media (1-2.5g)</option>
            <option value="strong">Fuerte (2.5-5g)</option>
            <option value="heroic">Heroica (5g+)</option>
          </select>
        </label>
      </div>
      <div className="mt-3 text-sm">
        Estimación seta seca: <span className="text-accent font-bold">{grams.toFixed(2)}g</span>
      </div>
    </CalcCard>
  );
}

function ABVCalc() {
  const [og, setOg] = useState("1.060");
  const [fg, setFg] = useState("1.005");
  const ogN = parseFloat(og) || 0;
  const fgN = parseFloat(fg) || 0;
  const abv = (ogN - fgN) * 131.25;
  return (
    <CalcCard title="🍺 ABV (alcohol homebrew)" desc="(DI − DF) × 131.25. Ejemplo 1.060 → 1.005 = 7.2% ABV.">
      <div className="grid grid-cols-2 gap-3">
        <NumInput label="Densidad inicial (OG)" value={og} onChange={setOg} />
        <NumInput label="Densidad final (FG)" value={fg} onChange={setFg} />
      </div>
      <div className="mt-3 text-sm">
        ABV: <span className="text-accent font-bold">{abv.toFixed(2)}%</span>
      </div>
    </CalcCard>
  );
}

function DecarbCalc() {
  const [grams, setGrams] = useState("1");
  const [thcPercent, setThcPercent] = useState("18");
  const [efficiency, setEfficiency] = useState("85");
  const g = parseFloat(grams) || 0;
  const thc = parseFloat(thcPercent) || 0;
  const eff = parseFloat(efficiency) || 0;
  const thcMg = (g * 1000 * (thc / 100) * (eff / 100));
  return (
    <CalcCard title="🌿 Decarboxilación cannabis" desc="Calcula mg de THC tras decarbox (110°C × 45min ≈ 85% eficiencia).">
      <div className="grid grid-cols-3 gap-3">
        <NumInput label="Peso flor" value={grams} onChange={setGrams} unit="g" />
        <NumInput label="THC %" value={thcPercent} onChange={setThcPercent} />
        <NumInput label="Eficiencia %" value={efficiency} onChange={setEfficiency} />
      </div>
      <div className="mt-3 text-sm">
        THC activado: <span className="text-accent font-bold">{thcMg.toFixed(0)}mg</span>
      </div>
    </CalcCard>
  );
}
