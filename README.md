# Guía Cultivo App 🌱

Companion PWA para la [wiki Guía Cultivo](https://tecladooscuro.github.io/guia-cultivo/). Gestor activo de cultivos caseros: calendario, dashboard, stock, planning, journal y sesiones.

## 🌐 Acceso

**URL app**: https://tecladooscuro.github.io/guia-cultivo-app/dashboard

**URL wiki (fuente educativa)**: https://tecladooscuro.github.io/guia-cultivo/

## 📱 Instalar en iPhone

1. Abre [la URL](https://tecladooscuro.github.io/guia-cultivo-app/dashboard) en Safari
2. Compartir → Añadir a pantalla de inicio
3. Abre desde icono home (modo standalone)
4. Concede permiso de notificaciones (requiere iOS 16.4+)

Mismo flujo en Android (Chrome → menú → Instalar app).

## ✨ Funcionalidades actuales

| Sección | Qué hace |
|---------|----------|
| 🏠 **Dashboard** | Stats cultivos activos · eventos hoy/atrasados/próximos · capacity widget (cuántos cultivos puedes hacer con tu stock) |
| 📅 **Calendario** | Vista mes/semana/día/agenda (Schedule-X). Eventos coloreados por cultivo. Click → modal con descripción + deep link wiki + marcar hecho |
| ➕ **Nuevo cultivo** | Wizard 3 pasos: tipo → datos → preflight stock check. Genera eventos + shopping + checklist |
| 🛒 **Compras** | Lista auto-generada por cultivo. Cross-check stock. Marcar comprado → entra a stock |
| ✅ **Preparación** | Checklist pre-cultivo con items blocking. Botón "Iniciar cultivo" cuando ready |
| 📦 **Stock** | CRUD materiales. Reservas blandas por cultivo. Stock libre vs reservado |
| 📔 **Journal** | Foto + nota + observaciones (pH, temp). Compresión cliente. EXIF stripped |
| ✂️ **Cosechas** | Form peso fresco/seco, calidad, notas catador. Auto-crea entrada inventario |
| 🫙 **Inventario** | Producto cosechado agrupado por kind. Decrementa al consumir en sesión |
| 🌌 **Sesiones** | Tracker dosis/método/setting. Ventanas tolerancia automáticas (14d setas, 42d mescalina, 28d aya, 1d DMT, 7d amanita) |
| 🧮 **Calculadoras** | Fresco→seco · Dosis por peso · ABV homebrew · Decarbox cannabis |
| 🧬 **Genética** | Library semillas/esquejes/esporadas. Vendor, lineage, caducidad |
| ⚙️ **Ajustes** | (placeholder — próxima fase) |

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

## 📋 Próximas fases

- Templates restantes (cannabis, cactus, trufas, amanita, ayahuasca, dmt, plantas suaves, ferment×3) — actualmente solo mushroom-kit
- Notificaciones push (Web Push API + foreground SW)
- Estadísticas dashboard (recharts gráficos)
- Export/import JSON encrypted
- Skill `add-new-cultivo` integration test (caso real café/lúpulo)
- Settings route real (preferencias notif + threshold + factory reset)

## ⚖️ Licencia

Uso personal/educativo. **No constituye consejo médico**. Verifica legalidad en tu país antes de usar info psicoactiva. Sin afiliación comercial.
