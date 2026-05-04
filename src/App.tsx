import { useEffect, useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { applyUpdate, subscribeUpdate, type UpdateState } from "./lib/pwaUpdate";
import Dashboard from "./routes/Dashboard";
import Calendar from "./routes/Calendar";
import Stock from "./routes/Stock";
import ShoppingList from "./routes/ShoppingList";
import PrepChecklist from "./routes/PrepChecklist";
import Journal from "./routes/Journal";
import Harvests from "./routes/Harvests";
import Product from "./routes/Product";
import Sessions from "./routes/Sessions";
import Calculators from "./routes/Calculators";
import Genetics from "./routes/Genetics";
import Stats from "./routes/Stats";
import Diagnostic from "./routes/Diagnostic";
import Timelapse from "./routes/Timelapse";
import NewCultivation from "./routes/NewCultivation";
import Settings from "./routes/Settings";

const navItems = [
  { to: "/dashboard", emoji: "🏠", label: "Dashboard" },
  { to: "/calendar", emoji: "📅", label: "Calendario" },
  { to: "/new", emoji: "➕", label: "Nuevo" },
  { to: "/stock", emoji: "📦", label: "Stock" },
  { to: "/shopping", emoji: "🛒", label: "Compras" },
  { to: "/prep", emoji: "✅", label: "Preparación" },
  { to: "/journal", emoji: "📔", label: "Journal" },
  { to: "/harvests", emoji: "✂️", label: "Cosechas" },
  { to: "/product", emoji: "🫙", label: "Inventario" },
  { to: "/sessions", emoji: "🌌", label: "Sesiones" },
  { to: "/calculators", emoji: "🧮", label: "Calc" },
  { to: "/genetics", emoji: "🧬", label: "Genética" },
  { to: "/stats", emoji: "📊", label: "Stats" },
  { to: "/diagnostic", emoji: "🔍", label: "Diagnóstico" },
  { to: "/timelapse", emoji: "📸", label: "Timelapse" },
  { to: "/settings", emoji: "⚙️", label: "Ajustes" },
];

function App() {
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  useEffect(() => {
    const unsub = subscribeUpdate(setUpdateState);
    return () => {
      unsub();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      {updateState === "available" && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-accent text-bg px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <span className="text-sm font-bold">🔄 Nueva versión disponible</span>
          <button
            onClick={applyUpdate}
            className="px-3 py-1 bg-bg text-text-bright rounded text-xs font-bold"
          >
            Recargar
          </button>
        </div>
      )}
      <header
        className="border-b border-border bg-bg-2 sticky top-0 z-10"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <span className="font-bold text-text-bright">Guía Cultivo</span>
          </div>
          <a
            href="https://tecladooscuro.github.io/guia-cultivo/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-muted hover:text-accent"
          >
            📖 Wiki ↗
          </a>
        </div>
        <nav className="max-w-6xl mx-auto px-2 pb-2 overflow-x-auto">
          <ul className="flex gap-1 text-xs">
            {navItems.map((it) => (
              <li key={it.to}>
                <NavLink
                  to={it.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap px-3 py-2 rounded-md inline-block transition ${
                      isActive
                        ? "bg-accent text-bg font-bold"
                        : "text-text-muted hover:bg-bg-3 hover:text-text-bright"
                    }`
                  }
                >
                  <span className="mr-1">{it.emoji}</span>
                  {it.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/new" element={<NewCultivation />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/shopping" element={<ShoppingList />} />
          <Route path="/prep" element={<PrepChecklist />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/harvests" element={<Harvests />} />
          <Route path="/product" element={<Product />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/calculators" element={<Calculators />} />
          <Route path="/genetics" element={<Genetics />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/diagnostic" element={<Diagnostic />} />
          <Route path="/timelapse" element={<Timelapse />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <footer
        className="border-t border-border bg-bg-2 mt-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 text-center text-xs text-text-muted">
          Guía Cultivo · Datos solo en tu dispositivo · Sin tracking
        </div>
      </footer>
    </div>
  );
}

export default App;
