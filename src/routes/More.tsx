import { Link } from "react-router-dom";

const ITEMS = [
  { emoji: "🧮", label: "Calculadoras", to: "/calculators", desc: "Fresco↔seco, dosis, ABV, decarbox" },
  { emoji: "🔍", label: "Diagnóstico", to: "/diagnostic", desc: "¿Qué le pasa al cultivo?" },
  { emoji: "📸", label: "Timelapse", to: "/timelapse", desc: "Compara fotos del cultivo" },
  { emoji: "📊", label: "Estadísticas", to: "/stats", desc: "Gráficos y resumen" },
  { emoji: "🧬", label: "Genética", to: "/genetics", desc: "Semillas, esporas, scobys" },
  { emoji: "⚙️", label: "Ajustes", to: "/settings", desc: "Notificaciones, export/import, reset" },
  { emoji: "📖", label: "Cómo usar", to: "/help", desc: "Guía flujo y conceptos" },
];

export default function More() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">🔧 Herramientas</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="p-4 border border-border rounded hover:border-accent transition text-center"
          >
            <div className="text-2xl mb-1">{item.emoji}</div>
            <div className="text-sm font-bold text-text-bright">{item.label}</div>
            <div className="text-xs text-text-muted mt-1">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
