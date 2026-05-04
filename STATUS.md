# STATUS — guia-cultivo-app

Estado actual del proyecto. Update este archivo cuando cierras una feature, descubres bug, o tomas decisión nueva.

**URL prod**: https://tecladooscuro.github.io/guia-cultivo-app/dashboard
**Repo**: https://github.com/TecladoOscuro/guia-cultivo-app

---

## ✅ Done

### Infraestructura
- [x] Vite + React 19 + TypeScript + Tailwind v4
- [x] PWA instalable (manifest + Workbox SW)
- [x] Auto-update (polling 60s + banner Recargar + skipWaiting + clientsClaim)
- [x] Safe-area-inset iPhone (status bar + home indicator)
- [x] Deploy GH Pages via Actions (`deploy.yml` + `enablement: true`)
- [x] Sync workflow wiki ↔ app esqueleto (`sync-from-wiki.yml`)
- [x] CSP estricta + .gitignore secrets blacklist
- [x] @js-temporal/polyfill (Safari iOS no tiene Temporal nativo)

### Datos + lógica
- [x] Schema Dexie 13 tablas
- [x] Types compartidos en `src/types.ts`
- [x] eventGenerator (template → AppEvent[])
- [x] stockPipeline (reservas/consumo/capacidad)
- [x] cultivationActions (create, start, abort, completeEvent)
- [x] eventActions (createManual, update, delete, reschedule)
- [x] Photo compression con canvas + EXIF strip

### Templates (19 total — 100% + sub-templates plantas)
- [x] Schema completo `CultivoTemplate` con phases, events, recurringTasks, shoppingList, prepChecklist, consumables
- [x] mushroom-kit (60d)
- [x] mushroom-friendly (95d, cultura líquida + bulk monotub)
- [x] mushroom-advanced (115d, lab desde cero + olla a presión)
- [x] cannabis-interior (90d)
- [x] cannabis-exterior (200d, mediterráneo)
- [x] trufas (110d, esclerocios)
- [x] cactus (3 años, San Pedro / Bolivian)
- [x] amanita (14d, forrajeo + decarbox)
- [x] ayahuasca (3 años, Caapi + Chacruna)
- [x] dmt-mimosa (5 años hasta cosecha raíz)
- [x] plantas-suaves (Damiana/Kava/Kanna/Salvia/etc — genérico)
- [x] planta-salvia (Salvia divinorum específico)
- [x] planta-damiana (Turnera diffusa específico)
- [x] planta-kava (Piper methysticum específico, 3 años)
- [x] planta-kanna (Sceletium tortuosum específico)
- [x] planta-blue-lotus (Nymphaea caerulea acuático)
- [x] ferment-hidromiel (60d)
- [x] ferment-cerveza (45d, Pale Ale/IPA)
- [x] ferment-sidra (90d)

### UI Routes (13)
- [x] Dashboard — empty state + cultivos cards con next-action contextual + stats + capacity widget
- [x] Calendar — Schedule-X (Google Calendar style) + drag-drop reagendar + click → modal CRUD
- [x] NewCultivation — wizard 3 pasos: tipo → datos → preflight stock
- [x] ShoppingList — auto-generada + cross-check stock + comprar/revertir
- [x] PrepChecklist — items blocking + start con override warning
- [x] Stock — CRUD + reservas + libre vs reservado
- [x] Journal — foto + nota + observaciones + mood
- [x] Harvests — peso fresco/seco + calidad + auto-crea producto
- [x] Product — inventario agrupado por kind + abrir/borrar
- [x] Sessions — dosis tracker + ventanas tolerancia automáticas
- [x] Calculators — fresco→seco, dosis por peso, ABV, decarbox
- [x] Genetics — CRUD library con caducidad
- [x] Settings (stub)

### Wiki integration
- [x] Wiki: parser URLSearchParams `?guide=X&mode=Y&phase=Z` (cambio invisible)
- [x] Deep links wiki desde eventos via `wikiUrl`
- [x] Templates JSON con `wikiBase` configurado

### Documentación
- [x] README.md completo con URL acceso
- [x] AGENTS.md (humanos + IAs)
- [x] CLAUDE.md (instrucciones específicas)
- [x] CONTRIBUTING.md
- [x] docs/architecture.md, data-model.md, templates-format.md, wiki-sync.md, stock-system.md, security.md
- [x] docs/decisions/ (ADRs 0001-0004)
- [x] docs/ux-flow.md — flujo intencional usuario
- [x] STATUS.md (este archivo)
- [x] .claude/skills/ (add-template, add-feature, add-calculator, sync-wiki, debug-stock-state, **add-new-cultivo**)
- [x] .claude/commands/ (new-cultivo, sync-wiki, add-feature)

---

## 🚧 Pendiente

### Templates restantes — DONE 100% ✅
Los 14 templates están implementados. Sub-templates por planta dentro de plantas-suaves: 1 template genérico (no individual por planta), pero cubre flujo común.

Pista: usar `scripts/extract-templates.js` (a crear) para extraer TimelineList nodes + tablas riego desde wiki actual. Ver `docs/wiki-sync.md`.

### Notificaciones push (Fase 8) — DONE 100% ✅
- [x] Local notification scheduling con setTimeout (foreground fiable)
- [x] Badge counter (Application Badging API iOS 16.4+)
- [x] Auto-schedule al crear/iniciar/borrar/abortar cultivo
- [x] Cancel notif al completar/borrar evento
- [x] Settings: toggle notif + permission state + horas antes (15min - 24h)
- [x] Catch-up al abrir app (badge = overdue + today)
- [x] **Web Push con VAPID + CF Worker IMPLEMENTADO**:
  - `worker/` con CF Worker code (TS + wrangler config)
  - Custom Service Worker `src/sw.ts` con push event handler
  - Cliente: subscribePush, postScheduleToWorker, pushTest, unsubscribePush
  - Settings UI: input Worker URL + botón Activar/Desactivar push remoto + Push test
  - Auto-send schedule 14d vista al Worker en refreshAllNotifications
  - Cron Worker dispara push según schedule
  - User setup: deploy worker (10 min, gratis) + pegar URL en Settings
  - Doc completa: `worker/README.md` step-by-step

### Estadísticas dashboard (Fase 10) — DONE ✅
- [x] Recharts integration (bar/line/pie)
- [x] Pie estado cultivos (active/planning/completed/aborted)
- [x] Bar cosechas por kind con peso seco
- [x] Line cronológico cosechas (peso + calidad)
- [x] Bar eventos por tipo
- [x] Pie sesiones por método
- [x] Stats summary: total cultivos, tasa éxito, duración media, coste total

### Settings real (Fase 13) — PARCIAL
- [ ] Preferencias notificaciones
- [ ] Threshold stock crítico
- [ ] Tolerancia personalizada (override defaults)
- [x] Export JSON (incluye fotos como base64)
- [x] Import JSON (modo replace o merge)
- [x] Factory reset
- [x] Info versión + about
- [ ] Encriptación opcional export con password (AES-256 Web Crypto)

### Skill `add-new-cultivo` integration test (Fase 12)
- [ ] Templates de generación JSX en `docs/component-templates/`
- [ ] Test caso real: añadir "café" o "lúpulo" como cultivo
- [ ] Verificar pipeline 8 fases funciona end-to-end

### Polish post-MVP (Fase 13) — DONE 100% ✅
- [x] Planning automático con detección conflictos recursos (lib/planningConflicts.ts)
- [x] PlanningWidget en Dashboard: muestra conflicts + suggestion próximo cultivo
- [x] Compartir backup completo via export JSON (Settings)
- [x] Form normalization (input/select/textarea altura uniforme + chevron + dark color-scheme)
- [x] Diagnóstico flowchart "qué le pasa al cultivo" (route /diagnostic)
- [x] Foto-comparación timelapse interactiva (route /timelapse + slider + comparación side-by-side)
- [x] Sub-templates individuales por planta suave (Salvia, Damiana, Kava, Kanna, Blue Lotus)
- [x] Encriptación opcional export con password (AES-256-GCM Web Crypto + PBKDF2 250k iter)

---

## 🐛 Bugs conocidos

- (vacío)

---

## 🎯 Comportamiento esperado (guía rápida)

Ver [docs/ux-flow.md](docs/ux-flow.md) para flujo completo.

**Resumen UX**:
1. Empty state → CTA "Empezar primer cultivo" (no "vacío")
2. Wizard: tipo → datos → preflight stock check (warning si falta, opción confirmar igualmente)
3. Cultivo en planning → CultivoCard en dashboard con next-action ("completar prep" o "iniciar")
4. Prep checklist: blocking items se pueden saltar con confirm + warning
5. Cultivo activo → CultivoCard muestra próximo evento + atrasados
6. Click cualquier evento (en dashboard, calendario) → modal con desc + pasos + warnings + acciones
7. Marcar hecho → decrementa stock si aplica + persiste
8. Drag-drop evento en calendario → reagenda
9. Cosecha → form → auto-crea entrada en inventario producto
10. Sesión → form → decrementa producto + actualiza tolerancia

**Restricciones inmutables**:
- Datos solo en dispositivo (IndexedDB)
- Sin tracking, sin analytics, sin sync sin opt-in
- Wiki visualmente intacta
- Auto-update cada 60s
- Cero secretos en repo público

---

## 📋 Cómo actualizar este archivo

Cuando cierras feature: tachar checkbox en sección Done. Cuando descubres bug: añadir en Bugs. Cuando decisión arquitectural: ADR en `docs/decisions/`. Cuando flujo UX cambia: update `docs/ux-flow.md` Y aquí.

Mantenerlo current es responsabilidad de quien hace cambios.
