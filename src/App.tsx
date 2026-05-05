import { useEffect, useState } from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
import { applyUpdate, subscribeUpdate, type UpdateState } from "./lib/pwaUpdate";
import Dashboard from "./routes/Dashboard";
import Calendar from "./routes/Calendar";
import Cultivations from "./routes/Cultivations";
import CultivoDetail from "./routes/CultivoDetail";
import Stock from "./routes/Stock";
import More from "./routes/More";
import NewCultivation from "./routes/NewCultivation";
import Calculators from "./routes/Calculators";
import Diagnostic from "./routes/Diagnostic";
import Timelapse from "./routes/Timelapse";
import Stats from "./routes/Stats";
import Settings from "./routes/Settings";
import Help from "./routes/Help";
import ShoppingList from "./routes/ShoppingList";
import PrepChecklist from "./routes/PrepChecklist";
import Journal from "./routes/Journal";
import Harvests from "./routes/Harvests";
import Product from "./routes/Product";
import Sessions from "./routes/Sessions";

const tabs = [
  { to: "/dashboard", emoji: "🏠", label: "Hoy" },
  { to: "/calendar", emoji: "📅", label: "Calendario" },
  { to: "/cultivations", emoji: "🌱", label: "Cultivos" },
  { to: "/stock", emoji: "📦", label: "Stock" },
  { to: "/more", emoji: "🔧", label: "Más" },
];

function App() {
  const [updateState, setUpdateState] = useState<UpdateState>("idle");
  useEffect(() => {
    const unsub = subscribeUpdate(setUpdateState);
    return () => { unsub(); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text pb-16">
      {updateState === "available" && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 bg-accent text-bg px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
          <span className="text-sm font-bold">🔄 Nueva versión</span>
          <button onClick={applyUpdate} className="px-3 py-1 bg-bg text-text-bright rounded text-xs font-bold">
            Recargar
          </button>
        </div>
      )}

      <header
        className="border-b border-border bg-bg-2 sticky top-0 z-10"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-2 no-underline">
            <span className="text-lg">🌱</span>
            <span className="text-sm font-bold text-text-bright">Guía Cultivo</span>
          </NavLink>
          <a
            href="https://tecladooscuro.github.io/guia-cultivo/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-muted hover:text-accent"
          >
            📖 Wiki ↗
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-4 w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/cultivations" element={<Cultivations />} />
          <Route path="/cultivations/:id" element={<CultivoDetail />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/more" element={<More />} />
          <Route path="/new" element={<NewCultivation />} />
          <Route path="/calculators" element={<Calculators />} />
          <Route path="/diagnostic" element={<Diagnostic />} />
          <Route path="/timelapse" element={<Timelapse />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/shopping" element={<ShoppingList />} />
          <Route path="/prep" element={<PrepChecklist />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/harvests" element={<Harvests />} />
          <Route path="/product" element={<Product />} />
          <Route path="/sessions" element={<Sessions />} />
        </Routes>
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-bg-2 border-t border-border z-20"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="max-w-4xl mx-auto flex">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-1.5 text-xs transition ${
                  isActive ? "text-accent" : "text-text-muted hover:text-text-bright"
                }`
              }
            >
              <span className="text-lg leading-none mb-0.5">{tab.emoji}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default App;
