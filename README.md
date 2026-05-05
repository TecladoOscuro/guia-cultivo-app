# Guía Cultivo App 🌱

Companion PWA para la [wiki Guía Cultivo](https://tecladooscuro.github.io/guia-cultivo/). Gestor activo de cultivos caseros: calendario, dashboard, stock, planning, journal y sesiones.

## 🌐 Acceso

**URL app**: https://tecladooscuro.github.io/guia-cultivo-app/

**URL wiki (fuente educativa)**: https://tecladooscuro.github.io/guia-cultivo/

## 📱 Instalar en iPhone

1. Abre [la URL](https://tecladooscuro.github.io/guia-cultivo-app/) en Safari
2. Compartir → Añadir a pantalla de inicio
3. Abre desde icono home (modo standalone)
4. Concede permiso de notificaciones (requiere iOS 16.4+)

Mismo flujo en Android (Chrome → menú → Instalar app).

## ✨ Funcionalidades

**Navegación simplificada** — 5 pestañas fijas abajo:

| Tab | Qué hace |
|-----|----------|
| 🏠 **Hoy** | Vista rápida: eventos de hoy, atrasados, próximos 7 días, cultivos en curso con next-action |
| 📅 **Calendario** | Schedule-X mes/semana/día/agenda · drag-drop reagendar · modal evento con pasos, señales, warnings estructurados |
| 🌱 **Cultivos** | Todos tus cultivos con progreso · click → vista unificada con: prep, compras, eventos, journal, cosechas |
| 📦 **Stock** | Tabs: Mi Stock (CRUD + reservas) y Compras (lista auto-generada, marcar comprado añade a stock) |
| 🔧 **Más** | Herramientas: Calculadoras, Diagnóstico, Timelapse, Stats, Genética, Ajustes, Ayuda |

**Sistema de stock inteligente:**
- Crear cultivo → solo lo que NO tienes va a la lista de compras
- Marcar "✅ Hecho" en evento → descuenta automáticamente del stock (fertilizante, agua, etc.)
- Marcar "🛒 Comprado" → añade al stock con el identificador correcto
- Stock muestra: cantidad real + reservado + libre para nuevos cultivos
- Los identificadores (`key`) conectan tu stock con lo que esperan los cultivos

## 🔄 Auto-update

App detecta nueva versión cada 60s. Banner inferior "🔄 Recargar" cuando hay update. Service Worker con `skipWaiting` + `clientsClaim` para activación inmediata.

Si no aparece: cierra PWA del switcher iOS + reabre.

## 🔒 Privacidad y datos

- **Datos solo en tu dispositivo** (IndexedDB)
- Sin sync · sin cloud · sin cookies de terceros
- Sin analytics · sin telemetría
- Repo público pero **cero secretos** commiteados
- CSP estricta · HTTPS forzado

Backup: export JSON manual recomendado periódicamente (próxima fase).

## 🛠️ Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Dexie (IndexedDB)
- React Router DOM
- Schedule-X (calendario Google-style) + @js-temporal/polyfill (Safari iOS)
- date-fns + recharts
- vite-plugin-pwa (Workbox)

## 💻 Desarrollo local

```bash
npm install --legacy-peer-deps
npm run dev          # localhost:5173
npm run build        # output dist/
npm run preview      # preview build
```

## 🚀 Deploy

GitHub Actions despliega automático a GitHub Pages al push a `main`. Workflow en [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## 📚 Documentación

- [AGENTS.md](AGENTS.md) — arquitectura para humanos + IAs
- [CLAUDE.md](CLAUDE.md) — instrucciones específicas Claude
- [docs/architecture.md](docs/architecture.md) — capas + flujos
- [docs/data-model.md](docs/data-model.md) — schema Dexie completo
- [docs/templates-format.md](docs/templates-format.md) — JSON template por cultivo
- [docs/wiki-sync.md](docs/wiki-sync.md) — protocolo sync wiki ↔ app
- [docs/stock-system.md](docs/stock-system.md) — pipeline reservas/consumo/capacidad
- [docs/security.md](docs/security.md) — CSP, gitleaks, push notifications honest
- [docs/decisions/](docs/decisions/) — ADRs (PWA vs RN, IndexedDB, wiki hybrid, stock)

## 🔗 Repos hermanos

- [guia-cultivo](https://github.com/TecladoOscuro/guia-cultivo) — **wiki** (source of truth contenido educativo)
- [guia-cultivo-app](https://github.com/TecladoOscuro/guia-cultivo-app) — **app** (este repo)

Workspace VSCode: `guia-cultivo.code-workspace` (en directorio padre con ambos repos como hermanos).

## 🤖 Para otras IAs

- Lee [AGENTS.md](AGENTS.md) primero
- Skills proyecto en [.claude/skills/](.claude/skills/) — `add-template`, `add-feature`, `add-calculator`, `sync-wiki`, `debug-stock-state`, **`add-new-cultivo`** (flagship)
- Slash commands en [.claude/commands/](.claude/commands/) — `/new-cultivo`, `/sync-wiki`, `/add-feature`

## 📋 Estado funcional

✅ **TODO IMPLEMENTADO**: 19 templates · 16 routes · Calendar Schedule-X drag-drop · Stock + capacity + reservas · Shopping con revertir · Prep con override · Journal foto + EXIF strip · Cosechas → producto · Sesiones + tolerancia 5 sustancias · 4 calculadoras · Genética · 5 gráficos stats recharts · Diagnóstico flowchart 4 categorías · Timelapse slider + comparación · Notif locales + badge counter · Auto-update PWA polling 60s · Export JSON + AES-256 encrypted · Import auto-detect · Factory reset · Planning conflicts + sugerencias próximo cultivo · Form normalization · Safe-area iOS

⏳ **Pendiente acción manual user** (no bloqueante):
- **Deploy CF Worker para push iOS background**: código completo en [worker/](worker/), falta deploy en cuenta CF personal (~10 min, gratis). Beneficio: notif aunque PWA cerrada. Sin esto: notif solo foreground + badge counter persiste. Setup: [worker/README.md](worker/README.md)

## ⚖️ Licencia

Uso personal/educativo. **No constituye consejo médico**. Verifica legalidad en tu país antes de usar info psicoactiva. Sin afiliación comercial.
