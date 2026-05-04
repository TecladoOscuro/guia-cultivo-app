# AGENTS.md — guía cultivo app

Documento principal para humanos + IAs trabajando en este repo. Lee esto antes de modificar nada.

**🚨 Lee también:**
- [STATUS.md](STATUS.md) — qué está hecho y qué falta (mantener actualizado)
- [docs/ux-flow.md](docs/ux-flow.md) — comportamiento UX intencional

## Propósito

App PWA companion de la wiki [guia-cultivo](https://github.com/TecladoOscuro/guia-cultivo). Convierte la wiki educativa en gestor activo: calendario, stock, planning, journal, sesiones.

## Arquitectura

```
[Wiki (SPA estática, source of truth contenido)]
         │
         │ extract-templates.js (parser scheduled vía repo dispatch)
         ▼
[Templates JSON (src/templates/*.json)]
         │
         │ eventGenerator.ts
         ▼
[Cultivation creado por user] → [Events en IndexedDB]
         │                              │
         ├─→ Calendario                 │
         ├─→ Dashboard                  │
         ├─→ Stock pipeline (reservar/consumir)
         ├─→ Shopping list
         ├─→ Prep checklist
         └─→ Notificaciones (Web Push API)
```

## Flujo de datos

1. **Templates JSON** definen estructura de cada tipo cultivo (timing, eventos, consumibles, shopping list)
2. **User crea cultivo** en wizard → eventos generados desde template + reserva stock
3. **Events** persistidos en IndexedDB → calendario los renderiza
4. **User marca eventos done** → stock decrementa, dashboard refleja, journal opcional

## Stack y razones

| Tech | Razón |
|------|-------|
| React 19 + Vite | DX rápido, ecosistema |
| TypeScript | Type safety, sobre todo en templates JSON |
| Tailwind v4 | Sin design system pesado |
| Dexie | Wrapper ergonómico IndexedDB |
| react-big-calendar | Calendario robusto, drag-drop |
| recharts | Gráficos dashboard |
| vite-plugin-pwa | Workbox SW + manifest |
| GH Pages | Free, HTTPS auto, ya familiar al user |

## Comandos

```bash
npm run dev               # localhost:5173
npm run build             # tsc + vite build → dist/
npm run preview           # preview build
npm run extract-templates # extrae datos wiki → JSON (cuando exista)
```

## Estructura

```
src/
├── main.tsx              # entry, BrowserRouter
├── App.tsx               # layout + routes
├── routes/               # 1 file por página
├── components/           # UI compartido
├── lib/                  # db.ts, eventGenerator.ts, notifications.ts
├── templates/            # *.json por cultivo (source of truth para eventos)
├── hooks/                # custom hooks (useDb, etc)
└── types/                # tipos TS compartidos
```

## Convenciones código

- **Edit > Write**: prefiere editar archivo existente
- **Cero comments inútiles**: código autoexplicativo, comentar solo el "por qué" no obvio
- **No abstracciones prematuras**: 3 líneas duplicadas mejor que abstracción especulativa
- **Boundaries claras**: validar input usuario, confiar en código interno
- **No mocks sin avisar**: si data no existe, dilo
- **Caveman tone OK**: comunicación con user en español, técnica concisa, fragmentos OK

## Cómo añadir cosas

### Nuevo template (cultivo)
Ver `.claude/skills/add-template/SKILL.md`. Resumen:
1. Crear `src/templates/<cultivo>.json` siguiendo schema en `docs/templates-format.md`
2. Validar con `eventGenerator` que produce eventos correctos
3. Añadir entry en lista cultivos del wizard
4. Test crear cultivo en dev → verificar calendario

### Nueva feature
Ver `.claude/skills/add-feature/SKILL.md`. Resumen:
1. Crear route en `src/routes/`
2. Añadir nav entry en `App.tsx`
3. Si necesita persistencia: añadir tabla en `src/lib/db.ts` + migración
4. Spec en `feature-specs/<feature>.md`
5. Test build + dev

### Sync con wiki
Ver `.claude/skills/sync-wiki/SKILL.md`. Trigger: workflow `sync-from-wiki.yml` (cron o manual).

### Cultivo nuevo end-to-end (wiki + app sincronizadas)
Ver `.claude/skills/add-new-cultivo/SKILL.md`. Skill flagship que orquesta:
- Research (web search)
- Generate wiki content (componentes JSX)
- Generate app template (JSON)
- Build + test ambos repos
- Open PRs sincronizados

## Repo hermano (wiki)

Path absoluto local: `~/guia-cultivo/` o (mover) `~/proyectos-cultivo/guia-cultivo/`.

Wiki = source of truth para CONTENIDO EDUCATIVO. App = gestor funcional.

**Restricción crítica**: NO modificar UI/CSS/copy de la wiki. Única modificación permitida: añadir parser `URLSearchParams` en `src/app/gui-cultivo.js` para deep linking (invisible al usuario).

## Seguridad

Repo público. Cero secretos. Ver [docs/security.md](docs/security.md).

- `.env*` en .gitignore
- Tokens (PAT) solo en GitHub Actions secrets
- VAPID private key NUNCA en cliente
- CSP estricta en index.html
- Sin analytics

## Verificación antes de commit

1. `npm run build` pasa
2. Dev server arranca sin errores
3. Si tocaste UI: prueba en browser real
4. Si tocaste IndexedDB schema: verifica migración funciona
5. Sin secretos commiteados (gitleaks recomendado pre-commit)

## Para otras IAs

- **Lee este archivo PRIMERO**
- Lee `STATUS.md` para saber qué está done/pending — actualízalo cuando cierres feature
- Lee `docs/ux-flow.md` para entender el comportamiento intencional
- Lee `CLAUDE.md` para instrucciones de tono/estilo si eres Claude
- Para tareas comunes: skills en `.claude/skills/`
- Para slash commands: `.claude/commands/`
- Para clarificar: pregunta al user, no asumas

## Workflow estándar

1. Lee feature spec o ticket
2. Comprueba STATUS.md si feature ya hecha
3. Comprueba ux-flow.md para encajar en flujo
4. Implementa
5. Build + verifica parse OK
6. Commit con conventional commit
7. **ACTUALIZA STATUS.md**: tachar checkbox done, añadir nuevo pending si aplica
8. Push
