# Architecture

## Capas

```
┌────────────────────────────────────────────────────┐
│  UI (React routes + components)                    │
│  Tailwind CSS + react-big-calendar + recharts      │
├────────────────────────────────────────────────────┤
│  Hooks (useDb, useCultivations, useEvents, ...)    │
├────────────────────────────────────────────────────┤
│  Lib                                                │
│  ├─ db.ts         (Dexie schema + migrations)      │
│  ├─ eventGenerator.ts (template → events)          │
│  ├─ stockPipeline.ts  (reservas/consumos)          │
│  ├─ notifications.ts  (Web Push + SW schedule)     │
│  └─ exportImport.ts                                 │
├────────────────────────────────────────────────────┤
│  Templates (src/templates/*.json)                  │
│  Source of truth para definición cultivos          │
├────────────────────────────────────────────────────┤
│  IndexedDB (Dexie)                                  │
│  cultivations, events, stock, journal, harvests,   │
│  product, sessions, genetics, history              │
└────────────────────────────────────────────────────┘
```

## Flujo principal: crear cultivo

1. User → wizard `/new` → selecciona template + fecha + alias
2. Pre-flight: `stockPipeline.checkAvailability(template)` → modal con disponibilidad
3. User confirma → `db.cultivations.add()` + `eventGenerator.generate()` + `db.events.bulkAdd()`
4. `stockPipeline.reserveAll(cultivationId, template.consumables)` → `stockReservations`
5. Notificaciones programadas para events futuros
6. User redirigido a `/calendar` con cultivo nuevo highlighted

## Flujo: marcar evento done

1. User en `/calendar` o `/dashboard` click evento → modal
2. Marca status: done
3. `db.events.update({status: 'done', completedAt})`
4. Si evento tiene `consumes`: `stockPipeline.consume(reservationId)` → decrementa stock
5. Si tipo = harvest: redirige a `/harvests` con form pre-rellenado
6. Si tipo = session: redirige a `/sessions`
7. Push notification cancelada si estaba programada

## Service Worker

Workbox-generated via vite-plugin-pwa. Funciones:
- Precache app shell (HTML, CSS, JS, manifest, icons)
- Runtime cache para fonts (si aplica)
- Navigation fallback a `/index.html`
- Background sync para notifications scheduling (limit: iOS lo soporta limitadamente)

## Wiki integration

App hace deep link a wiki via:
```
https://tecladooscuro.github.io/guia-cultivo/?guide=cannabis&mode=interior&phase=vegetativa
```

Wiki parsea URLSearchParams y setea estado inicial. Sin esto: app abre wiki en home.
