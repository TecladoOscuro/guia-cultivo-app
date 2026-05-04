import { useState } from "react";

interface Question {
  id: string;
  text: string;
  options: { label: string; next: string | null; result?: Diagnosis }[];
}

interface Diagnosis {
  problem: string;
  causes: string[];
  fixes: string[];
  wikiUrl?: string;
}

const questions: Record<string, Question> = {
  start: {
    id: "start",
    text: "¿Qué tipo de cultivo tienes?",
    options: [
      { label: "🌿 Cannabis (planta)", next: "cannabis_q1" },
      { label: "🍄 Setas / Trufas", next: "setas_q1" },
      { label: "🌵 Cactus / etnobotánicas", next: "cactus_q1" },
      { label: "🍯 Fermentación", next: "ferment_q1" },
    ],
  },
  cannabis_q1: {
    id: "cannabis_q1",
    text: "¿Qué síntoma observas?",
    options: [
      { label: "Hojas amarillas", next: "cannabis_amarillo" },
      { label: "Hojas marrones / quemadas en puntas", next: null, result: { problem: "Quemadura por exceso fertilizante", causes: ["Demasiado nutriente concentrado", "EC muy alta", "pH desequilibrado bloqueando absorción"], fixes: ["Lavado raíces solo agua 3-5 días", "Reducir dosis fertilizante 50%", "Verificar pH 6.0-6.5"] } },
      { label: "Plantas alargadas y débiles", next: null, result: { problem: "Etiolación (poca luz)", causes: ["Distancia LED demasiado lejos", "Pocas horas de luz", "Espectro insuficiente"], fixes: ["Acercar lámpara (ojo calor)", "18h luz vegetativa, 12/12 floración", "LED full spectrum 100W+ por planta"] } },
      { label: "Manchas blancas polvorientas", next: null, result: { problem: "Oídio (hongo)", causes: ["Humedad alta + poca ventilación", "Hojas tocándose densas"], fixes: ["Aumentar ventilación", "Bajar humedad <60%", "Tratamiento bicarbonato sódico (1 cdita/L) o azufre. Eliminar hojas afectadas"] } },
      { label: "Bichitos pequeños bajo hojas", next: "cannabis_plagas" },
    ],
  },
  cannabis_amarillo: {
    id: "cannabis_amarillo",
    text: "¿Dónde están las hojas amarillas?",
    options: [
      { label: "Hojas viejas (abajo)", next: null, result: { problem: "Falta de Nitrógeno (N)", causes: ["Sustrato agotado", "Riego sin nutrientes último mes", "Drenaje excesivo"], fixes: ["Fertilizar con NPK alto N (Bio·Bizz Grow 2-3ml/L)", "Verificar pH 6.0-6.5", "En floración es normal cierto amarilleo viejo"] } },
      { label: "Hojas nuevas (arriba)", next: null, result: { problem: "Falta de Azufre o Hierro", causes: ["pH descompensado bloqueando absorción", "Sustrato pobre en micronutrientes"], fixes: ["Verificar y corregir pH 6.0-6.5", "Aplicar quelato de hierro", "Bajar nivel nutrientes principales para no bloquear más"] } },
      { label: "Punto medio uniforme", next: null, result: { problem: "Posible bloqueo nutrientes pH", causes: ["pH fuera rango (<5.5 o >7.0)", "Acumulación sales en sustrato"], fixes: ["Lavado raíces", "Verificar pH agua y sustrato", "Recalibrar dosis NPK"] } },
    ],
  },
  cannabis_plagas: {
    id: "cannabis_plagas",
    text: "¿Cómo son los bichos?",
    options: [
      { label: "Pequeños rojos/marrones (telarañas finas)", next: null, result: { problem: "Araña roja", causes: ["Ambiente seco + caliente", "Plantas estresadas"], fixes: ["Aceite de neem (5ml/L) cada 3 días", "Aumentar humedad >50%", "Fitoseiulus persimilis (depredador biológico)"] } },
      { label: "Verdes pequeños racimos (pulgones)", next: null, result: { problem: "Pulgón", causes: ["Plantas débiles", "Sin depredadores naturales"], fixes: ["Jabón potásico 5g/L cada 5 días", "Mariquitas (control biológico)", "Eliminar zonas más afectadas"] } },
      { label: "Mosquitas blancas pequeñas", next: null, result: { problem: "Mosca blanca", causes: ["Humedad alta + temp media", "Plantas hacinadas"], fixes: ["Trampas amarillas adhesivas", "Aceite neem", "Encarsia formosa (parasitoide)"] } },
    ],
  },
  setas_q1: {
    id: "setas_q1",
    text: "¿Qué pasa con las setas?",
    options: [
      { label: "Manchas verdes/azules en pan o sustrato", next: null, result: { problem: "Trichoderma (contaminación común)", causes: ["Contaminación durante inoculación", "Esterilización insuficiente", "Humedad excesiva en sustrato"], fixes: ["DESECHAR lote (no salvable)", "Próxima vez: SAB + esterilización 90 min completa", "Mejorar protocolo inoculación: aguja flameada, manos limpias, ambiente sin corriente"] } },
      { label: "No aparecen primordios día 18-21", next: null, result: { problem: "Fructificación atascada", causes: ["Humedad insuficiente", "Sin FAE (intercambio aire)", "Sin luz indirecta"], fixes: ["Subir humedad 90%+ con nebulización", "Abanicar cámara 30s 2-3x/día", "Luz indirecta 6-12h/día (NO directa)"] } },
      { label: "Setas alargadas, débiles, sombrero pequeño", next: null, result: { problem: "CO₂ excesivo (sin FAE)", causes: ["Cámara muy cerrada", "Sin intercambio aire"], fixes: ["FAE más frecuente: 3-4x/día", "Aumentar agujeros monotub", "Setas afectadas siguen siendo válidas pero menos potentes"] } },
      { label: "Líquido amarillo en pan / olor podrido", next: null, result: { problem: "Contaminación bacteriana", causes: ["Esterilización incompleta", "Humedad excesiva", "Bacterias del aire"], fixes: ["DESECHAR lote (peligroso consumir)", "Lavar cámara con lejía + alcohol", "Próxima vez: técnica aséptica estricta"] } },
    ],
  },
  cactus_q1: {
    id: "cactus_q1",
    text: "¿Qué problema?",
    options: [
      { label: "Base se ablanda/podrida", next: null, result: { problem: "Pudrición por exceso agua", causes: ["Riego excesivo", "Mal drenaje maceta", "Sustrato no apropiado para cactus"], fixes: ["URGENTE: parar riego inmediato", "Sacar planta, limpiar raíces, dejar secar 1 semana", "Si parte sana arriba: cortar + callusing 2-3 sem + replantar", "Sustrato cactus + 30% perlita + maceta con agujeros"] } },
      { label: "Color amarillento general", next: null, result: { problem: "Estrés (sol o riego)", causes: ["Aclimatación brusca al sol", "Exceso o falta agua", "Trasplante reciente"], fixes: ["Sombra parcial 2-3 semanas", "Dejar secar bien sustrato", "Esperar — se recupera lento"] } },
      { label: "No crece en años", next: null, result: { problem: "Falta nutrientes / luz", causes: ["Sustrato agotado", "Sol insuficiente", "Maceta pequeña"], fixes: ["Fertilizante cactus mar-sep media dosis mensual", "Mover a sol 4-6h directo", "Trasplante a maceta más grande"] } },
    ],
  },
  ferment_q1: {
    id: "ferment_q1",
    text: "¿Qué síntoma?",
    options: [
      { label: "No burbujea airlock 48h", next: null, result: { problem: "Levadura inactiva", causes: ["Levadura muerta (mosto >30°C al inocular)", "Tapón mal sellado (CO₂ se escapa por fuera)", "Levadura caducada"], fixes: ["Verificar sellado airlock", "Re-inocular con levadura nueva rehidratada", "Verificar densidad: si bajó SÍ está fermentando aunque no burbujee visible"] } },
      { label: "Sabor a vinagre", next: null, result: { problem: "Acetobacter (bacteria acética)", causes: ["Contacto con oxígeno excesivo", "Sanitización deficiente"], fixes: ["Lote perdido como bebida — útil como vinagre", "Próxima vez: airlock siempre con agua, sanitizar TODO con Star San"] } },
      { label: "Capa peluda blanca/verde superficie", next: null, result: { problem: "Moho (lote contaminado)", causes: ["Exposición aire", "Sanitización fallada"], fixes: ["TIRAR lote completo", "Lavar fermentador + sanitizar Star San antes próximo", "Verificar airlock siempre con agua + sin fugas"] } },
    ],
  },
};

export default function Diagnostic() {
  const [currentId, setCurrentId] = useState("start");
  const [history, setHistory] = useState<string[]>([]);
  const [result, setResult] = useState<Diagnosis | null>(null);

  const current = questions[currentId];

  const onSelect = (option: { next: string | null; result?: Diagnosis }) => {
    if (option.result) {
      setResult(option.result);
    } else if (option.next) {
      setHistory([...history, currentId]);
      setCurrentId(option.next);
    }
  };

  const onBack = () => {
    if (history.length === 0) return;
    setResult(null);
    const prev = [...history];
    const last = prev.pop()!;
    setHistory(prev);
    setCurrentId(last);
  };

  const onReset = () => {
    setCurrentId("start");
    setHistory([]);
    setResult(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">🔍 Diagnóstico</h1>
      <p className="text-text-muted text-sm mb-4">
        Responde preguntas guiadas para diagnosticar problemas en tu cultivo.
      </p>

      {result ? (
        <div className="grid gap-3">
          <div className="p-4 border border-warn rounded">
            <div className="text-sm text-warn uppercase tracking-wide mb-1">Diagnóstico probable</div>
            <h2 className="text-lg font-bold text-text-bright">{result.problem}</h2>
          </div>
          <div className="p-4 border border-border rounded">
            <h3 className="text-sm font-bold text-text-bright mb-2">Causas probables</h3>
            <ul className="grid gap-1">
              {result.causes.map((c, i) => (
                <li key={i} className="text-sm text-text-muted">• {c}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 border border-success/40 bg-success/5 rounded">
            <h3 className="text-sm font-bold text-success mb-2">Acciones</h3>
            <ul className="grid gap-1">
              {result.fixes.map((f, i) => (
                <li key={i} className="text-sm">✅ {f}</li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2">
            <button onClick={onReset} className="px-4 py-2 bg-accent text-bg rounded font-bold text-sm">
              🔄 Nuevo diagnóstico
            </button>
            <button onClick={onBack} className="px-4 py-2 border border-border rounded text-sm">
              ← Atrás
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="p-4 border border-border rounded mb-3">
            <h2 className="text-base font-bold text-text-bright">{current.text}</h2>
          </div>
          <div className="grid gap-2">
            {current.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onSelect(opt)}
                className="text-left p-3 border border-border rounded hover:border-accent transition"
              >
                {opt.label}
              </button>
            ))}
          </div>
          {history.length > 0 && (
            <button onClick={onBack} className="mt-4 text-xs text-text-muted hover:text-accent">
              ← Atrás
            </button>
          )}
        </div>
      )}
    </div>
  );
}
