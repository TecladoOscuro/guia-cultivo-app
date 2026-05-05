import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { db } from "../lib/db";

const COLORS = ["#52b788", "#a888c8", "#dba858", "#74a8d8", "#e88a6a"];

export default function Stats() {
  const cultivations = useLiveQuery(() => db.cultivations.toArray(), []) ?? [];
  const events = useLiveQuery(() => db.events.toArray(), []) ?? [];
  const harvests = useLiveQuery(() => db.harvests.toArray(), []) ?? [];
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];

  // === Datos para gráficos ===

  // Tasa éxito (completed) vs aborted vs activos
  const cultStatus = useMemo(() => {
    const counts = { active: 0, planning: 0, completed: 0, aborted: 0 };
    cultivations.forEach((c) => {
      counts[c.status as keyof typeof counts]++;
    });
    return [
      { name: "Activos", value: counts.active, color: "#52b788" },
      { name: "Planning", value: counts.planning, color: "#74a8d8" },
      { name: "Completos", value: counts.completed, color: "#a888c8" },
      { name: "Abortados", value: counts.aborted, color: "#e63946" },
    ].filter((d) => d.value > 0);
  }, [cultivations]);

  // Cosechas por kind (peso seco)
  const harvestsByKind = useMemo(() => {
    const map = new Map<string, number>();
    harvests.forEach((h) => {
      const cult = cultivations.find((c) => c.id === h.cultivationId);
      const kind = cult?.templateId ?? "?";
      const weight = h.weightDry ?? h.weightWet ?? 0;
      map.set(kind, (map.get(kind) ?? 0) + weight);
    });
    return Array.from(map.entries()).map(([kind, peso]) => ({ kind, peso }));
  }, [harvests, cultivations]);

  // Cosechas histórico cronológico
  const harvestTimeline = useMemo(() => {
    return [...harvests]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((h) => ({
        fecha: format(h.date, "MMM yy", { locale: es }),
        peso: h.weightDry ?? h.weightWet ?? 0,
        calidad: h.quality ?? 0,
      }));
  }, [harvests]);

  // Eventos por tipo
  const eventsByType = useMemo(() => {
    const map = new Map<string, number>();
    events.forEach((e) => {
      map.set(e.type, (map.get(e.type) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
  }, [events]);

  // Tiempo medio cultivo (active days hasta completed o ahora)
  const avgDuration = useMemo(() => {
    const completed = cultivations.filter((c) => c.status === "completed" && c.endedAt);
    if (completed.length === 0) return null;
    const total = completed.reduce(
      (s, c) => s + differenceInDays(c.endedAt!, c.startDate),
      0
    );
    return Math.round(total / completed.length);
  }, [cultivations]);

  // Peso total cosechado
  const totalHarvestWeight = useMemo(() => {
    return harvests.reduce((s, h) => s + (h.weightDry ?? h.weightWet ?? 0), 0);
  }, [harvests]);

  // Sesiones por método
  const sessionsByMethod = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => {
      map.set(s.method, (map.get(s.method) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([method, count]) => ({ method, count }));
  }, [sessions]);

  if (cultivations.length === 0 && harvests.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-text-bright mb-4">📊 Estadísticas</h1>
        <div className="p-8 text-center border border-border rounded">
          <p className="text-text-muted">
            Sin datos aún. Crea cultivos y registra cosechas para ver estadísticas.
          </p>
          <Link to="/new" className="inline-block mt-4 px-4 py-2 bg-accent text-bg rounded font-bold text-sm">
            ➕ Empezar primer cultivo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-bright mb-4">📊 Estadísticas</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Cultivos totales" value={cultivations.length} />
        <Stat
          label="Tasa éxito"
          value={
            cultivations.length > 0
              ? Math.round(
                  (cultivations.filter((c) => c.status === "completed").length /
                    cultivations.length) *
                    100
                ) + "%"
              : "—"
          }
        />
        <Stat
          label="Duración media"
          value={avgDuration !== null ? `${avgDuration}d` : "—"}
        />
        <Stat
          label="Peso cosechado"
          value={totalHarvestWeight > 0 ? `${totalHarvestWeight}g` : "—"}
        />
      </div>

      {cultStatus.length > 0 && (
        <Section title="🌱 Estado cultivos">
          <ChartBox>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={cultStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {cultStatus.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Section>
      )}

      {harvestsByKind.length > 0 && (
        <Section title="✂️ Cosechas por tipo (peso seco g)">
          <ChartBox>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={harvestsByKind}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3138" />
                <XAxis dataKey="kind" stroke="#8a949e" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8a949e" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="peso" fill="#52b788" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Section>
      )}

      {harvestTimeline.length > 1 && (
        <Section title="📈 Cosechas cronológico">
          <ChartBox>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={harvestTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3138" />
                <XAxis dataKey="fecha" stroke="#8a949e" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8a949e" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="peso" stroke="#52b788" strokeWidth={2} dot={{ r: 4 }} name="Peso (g)" />
                <Line type="monotone" dataKey="calidad" stroke="#dba858" strokeWidth={2} dot={{ r: 4 }} name="Calidad ⭐" />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </Section>
      )}

      {eventsByType.length > 0 && (
        <Section title="🎯 Eventos por tipo">
          <ChartBox>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={eventsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a3138" />
                <XAxis dataKey="type" stroke="#8a949e" tick={{ fontSize: 11 }} />
                <YAxis stroke="#8a949e" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#a888c8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Section>
      )}

      {sessionsByMethod.length > 0 && (
        <Section title="🌌 Sesiones por método">
          <ChartBox>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={sessionsByMethod} dataKey="count" nameKey="method" cx="50%" cy="50%" outerRadius={80} label>
                  {sessionsByMethod.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </Section>
      )}
    </div>
  );
}

const tooltipStyle = {
  background: "#11151a",
  border: "1px solid #2a3138",
  borderRadius: "6px",
  fontSize: "12px",
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3 border border-border rounded">
      <div className="text-2xl font-bold text-text-bright">{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-sm font-bold text-text-bright mb-2 uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function ChartBox({ children }: { children: React.ReactNode }) {
  return <div className="p-3 border border-border rounded bg-bg-2">{children}</div>;
}
