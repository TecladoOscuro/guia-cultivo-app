import { Link } from "react-router-dom";

export default function Help() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-text-bright mb-2">📖 Cómo usar la app</h1>
      <p className="text-text-muted text-sm mb-6">
        Guía rápida del flujo de uso. Si tienes dudas concretas: 🔍 Diagnóstico tiene troubleshoot por cultivo.
      </p>

      <Section title="🌱 Flujo básico">
        <Step n="1" title="Crea cultivo" linkTo="/new" linkLabel="➕ Nuevo">
          Elige tipo (19 disponibles: setas, cannabis, cactus, hidromiel, etc) → fecha inicio → alias.
          App auto-genera: <strong>calendario completo</strong> + <strong>lista compras</strong> + <strong>checklist prep</strong> + <strong>reservas stock</strong>.
        </Step>
        <Step n="2" title="Compra lo que falte" linkTo="/shopping" linkLabel="🛒 Compras">
          Lista auto. Click "🛒 Marcar comprado" → entra a tu stock automático. Si compraste por error: "↩️ Revertir".
        </Step>
        <Step n="3" title="Sigue calendario diario" linkTo="/calendar" linkLabel="📅 Calendario">
          Vista mes/semana/día. Click cada evento → modal con descripción + pasos + warnings + link wiki educativa. Marca "✅ Hecho" cuando completes. Eventos atrasados aparecen rojos.
        </Step>
        <Step n="4" title="Documenta progreso (opcional)" linkTo="/journal" linkLabel="📔 Journal">
          Foto + nota por cultivo. Mediciones (pH, temp). Mood 1-5 estrellas. Compresión cliente, sin subir a cloud.
        </Step>
        <Step n="5" title="Cosecha" linkTo="/harvests" linkLabel="✂️ Cosechas">
          Form: peso fresco/seco + calidad + notas. Auto-crea entrada en 🫙 Inventario.
        </Step>
        <Step n="6" title="Sesiones (psicodélicos)" linkTo="/sessions" linkLabel="🌌 Sesiones">
          Tracker dosis/método/setting. Calcula <strong>ventana tolerancia</strong> automática (14d setas, 42d mescalina, 28d aya, 1d DMT, 7d amanita).
        </Step>
      </Section>

      <Section title="🧠 Conceptos clave">
        <Concept icon="📦" title="Stock vs Reservado vs Consumido">
          <strong>Stock</strong>: lo que tienes físicamente. <strong>Reservado</strong>: comprometido a cultivos activos (no consumido aún). <strong>Libre</strong> = stock − reservado.
          Stock real <strong>solo decrementa</strong> cuando marcas "✅ Hecho" un evento que tiene consumibles.
        </Concept>
        <Concept icon="📊" title="Capacity calculator">
          Dashboard widget: cuántos cultivos puedes hacer ahora con tu stock libre. Te dice cuál es el limitante (ej: "limitado por: perlita 3L de 8L").
        </Concept>
        <Concept icon="🎯" title="Planning automático">
          Detecta conflictos (eventos críticos solapados, stock competition). Sugiere próximo cultivo según último activo.
        </Concept>
        <Concept icon="✅ ⬜" title="Prep checklist">
          Tareas RECOMENDADAS antes de empezar (esterilizar, hidratar grano). NO bloquean — son recordatorios.
        </Concept>
        <Concept icon="⚠️" title="Abortar cultivo">
          Si un cultivo sale mal o cambias de idea: Dashboard → menú ⋮ del cultivo → "⚠️ Abortar". Libera reservas, conserva datos en histórico.
        </Concept>
      </Section>

      <Section title="🛠️ Herramientas extra">
        <Tool icon="🔍" title="Diagnóstico" to="/diagnostic" desc="Flowchart interactivo ~70 escenarios: cannabis, setas, cactus, fermentación, amanita, ayahuasca, DMT, plantas suaves. Causas + fixes + prevención." />
        <Tool icon="🧮" title="Calculadoras" to="/calculators" desc="Fresco→seco · Dosis por peso · ABV homebrew · Decarboxilación cannabis." />
        <Tool icon="📊" title="Estadísticas" to="/stats" desc="Gráficos cosechas, tasa éxito, eventos por tipo, sesiones por método." />
        <Tool icon="📸" title="Timelapse" to="/timelapse" desc="Slider cronológico fotos journal + comparación side-by-side dos fechas." />
        <Tool icon="🧬" title="Genética" to="/genetics" desc="Library de semillas/esquejes/esporadas con vendor/lineage/caducidad." />
      </Section>

      <Section title="💾 Backup">
        <p className="text-sm text-text-muted">
          Datos solo en este dispositivo (IndexedDB). Recomendado backup manual periódico:
        </p>
        <ul className="text-sm text-text-muted mt-2 space-y-1">
          <li>• <Link to="/settings" className="text-accent">Ajustes</Link> → ⬇️ Exportar JSON (incluye fotos como base64)</li>
          <li>• Opción <strong>🔒 Exportar encriptado</strong> con password (AES-256)</li>
          <li>• Importar: auto-detecta encriptado, pide password si necesario</li>
          <li>• 🗑️ Factory reset: borra TODO con doble confirmación</li>
        </ul>
      </Section>

      <Section title="🔔 Notificaciones — estado actual">
        <div className="p-3 border border-warn rounded bg-warn/5">
          <div className="font-bold text-warn text-sm mb-1">⏳ Funcionalidad PARCIAL</div>
          <p className="text-xs text-text-muted">
            <strong>Funciona</strong>: notif locales con app abierta + badge counter persistente cuando app cerrada (iOS 16.4+).
            <br /><br />
            <strong>NO funciona aún</strong>: notif background fiables iPhone con PWA cerrada.
            <br /><br />
            <strong>Para habilitar</strong>: deploy CF Worker (~10 min, gratis).{" "}
            <a
              href="https://github.com/TecladoOscuro/guia-cultivo-app/tree/main/worker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              Instrucciones aquí
            </a>
            . Mientras tanto: badge counter te muestra eventos atrasados al abrir app.
          </p>
        </div>
      </Section>

      <Section title="📚 Wiki educativa">
        <p className="text-sm text-text-muted mb-2">
          Cada evento del calendario tiene un botón <strong>"📖 Saber más en wiki"</strong> que abre la wiki del cultivo en la fase concreta.
        </p>
        <a
          href="https://tecladooscuro.github.io/guia-cultivo/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-3 py-2 border border-border rounded text-sm hover:border-accent"
        >
          📖 Abrir wiki Guía Cultivo ↗
        </a>
      </Section>

      <Section title="🔒 Privacidad">
        <ul className="text-sm text-text-muted space-y-1">
          <li>• Datos solo en tu dispositivo (IndexedDB)</li>
          <li>• Sin tracking, sin analytics, sin cookies de terceros</li>
          <li>• Repo público pero <strong>cero secretos</strong> commiteados</li>
          <li>• Fotos comprimidas + EXIF stripped antes de guardar (sin metadata GPS)</li>
          <li>• HTTPS forzado · CSP estricta</li>
        </ul>
      </Section>

      <Section title="⚠️ Disclaimer">
        <p className="text-xs text-text-muted">
          Esta app NO da consejo médico. Uso personal/educativo. Verifica legalidad en tu país antes de usar info psicoactiva.
          NO mezcles sustancias sin investigar contraindicaciones.
          <br /><br />
          🆘 Emergencias: <strong>112</strong> · Anti-tóxicos España: <strong>915 620 420</strong> (24h)
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-base font-bold text-text-bright mb-3 uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function Step({
  n,
  title,
  linkTo,
  linkLabel,
  children,
}: {
  n: string;
  title: string;
  linkTo?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 border border-border rounded mb-2 flex gap-3">
      <div className="text-2xl font-bold text-accent shrink-0">{n}</div>
      <div className="flex-1">
        <div className="flex justify-between items-baseline gap-2 mb-1 flex-wrap">
          <div className="font-bold text-text-bright">{title}</div>
          {linkTo && linkLabel && (
            <Link
              to={linkTo}
              className="text-xs text-accent hover:underline whitespace-nowrap"
            >
              {linkLabel} →
            </Link>
          )}
        </div>
        <div className="text-sm text-text-muted">{children}</div>
      </div>
    </div>
  );
}

function Concept({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-3 border border-border rounded mb-2">
      <div className="font-bold text-text-bright mb-1">
        {icon} {title}
      </div>
      <div className="text-sm text-text-muted">{children}</div>
    </div>
  );
}

function Tool({
  icon,
  title,
  to,
  desc,
}: {
  icon: string;
  title: string;
  to: string;
  desc: string;
}) {
  return (
    <Link to={to} className="block p-3 border border-border rounded hover:border-accent mb-2 transition">
      <div className="font-bold text-text-bright">
        {icon} {title} →
      </div>
      <div className="text-sm text-text-muted">{desc}</div>
    </Link>
  );
}
