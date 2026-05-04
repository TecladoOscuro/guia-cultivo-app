# UX Flow — guia-cultivo-app

Documento canónico del flujo de usuario. Si tienes duda sobre cómo debe comportarse algo, consulta este file.

## Principios

1. **Mostrar el siguiente paso, siempre**. Usuario nunca debería preguntarse "¿y ahora qué?".
2. **No bloquear sin opción de salida**. Items críticos (blocking) avisan, no impiden.
3. **Feedback visible en cada acción**. Hover, active, transitions, confirms.
4. **Recuperabilidad**. Toda acción destructiva debe poder revertirse o tiene confirm.
5. **Datos contextuales**. Eventos, listas, todo amarrado al cultivo concreto.
6. **Sin tracking, sin sorpresas**. Datos del usuario solo en su dispositivo.

---

## Flujo principal: primer cultivo

```
Pantalla inicio (sin cultivos)
    │
    ▼
Empty state con CTA "🚀 Empezar primer cultivo"
    │
    ▼
[/new] Wizard 3 pasos
    1. Elegir tipo (lista templates)
    2. Datos: alias + fecha inicio + notas
    3. Preflight stock check
       - ✅ Tienes todo → Confirmar
       - ⚠️ Falta stock → opciones:
         a) Añadir falta a shopping list
         b) Confirmar igualmente (genera shopping list automática)
    │
    ▼
Cultivo creado en estado "planning"
    - Eventos generados automáticamente
    - Shopping list automática
    - Prep checklist generada
    - Stock reservado
    │
    ▼
Redirect [/calendar] con evento highlighted
```

## Flujo: planning → activo

```
[/dashboard] CultivoCard muestra:
    "📋 planeado · X eventos"
    Botón contextual: "✅ Completar N tarea(s) preparación" → /prep
    │
    ▼
[/prep] Prep checklist por cultivo planning
    - Items blocking marcados 🔒
    - Click cualquiera → toggle done
    - Botón "🚀 Iniciar" si todos blocking done
    - Botón "⚠️ Iniciar igualmente" si quedan blocking pendientes
      → confirm modal con lista pendientes
    │
    ▼
startCultivation() → status: "active"
    │
    ▼
Redirect [/calendar]
```

## Flujo: día a día (cultivo activo)

```
[/dashboard] CultivoCard muestra:
    "🌿 activo · día N · X/Y eventos"
    Progress bar
    Next-action contextual:
    - Si overdue: "⚠️ N evento(s) atrasado(s)" → /calendar
    - Si pending hoy o futuro: "📅 emoji título" → /calendar?event=ID
    │
    ▼
[/calendar] Vista mes/semana/día/agenda (Schedule-X)
    Click evento → modal con:
    - Emoji + título + fecha
    - Descripción rica (qué significa)
    - Pasos a seguir (checklist inline)
    - Señales esperadas (qué buscar)
    - ⚠️ Warnings (qué evitar)
    - Botón "📖 Saber más en wiki" → deep link wiki
    - Botones: ✅ Hecho · ✏️ Editar · 🗑️ Borrar
    │
    ▼
Marcar hecho:
    - status: done
    - Si tiene consumibles: decrementa stock real
    - History log entry
    │
    ▼
Drag-drop evento → reschedule + persiste originalDate
```

## Flujo: cosecha

```
Cultivo activo, evento type=harvest llega
    │
    ▼
Click evento → modal → "Marcar hecho"
    OR ir directo [/harvests] → ➕ Registrar cosecha
    │
    ▼
Form cosecha:
    - Cultivo (selecciona)
    - Tipo (flush_1, main_cut, etc)
    - Peso fresco (opcional)
    - Peso seco (opcional, actualizable después)
    - Calidad ⭐⭐⭐⭐⭐
    - Notas catador
    - ☑️ "Crear entrada inventario" (default)
    │
    ▼
Auto-crea entrada en [/product] con kind del template (ej: seta_psilocybe_seca)
    │
    ▼
[/product] Inventario muestra producto cosechado
    Botones: "Abrir" · "Borrar"
```

## Flujo: sesión consumo

```
Producto cosechado en inventario
    │
    ▼
[/sessions] → ➕ Registrar sesión
    │
    ▼
Form sesión:
    - Producto (de tu inventario)
    - Dosis + unidad
    - Método (oral/lemon_tek/té/vape/...)
    - Set/setting
    - Notas pre/post
    - Rating
    │
    ▼
Auto-decrementa producto en inventario
Tolerance window calculada según kind:
    - Setas/trufas: 14d
    - Mescalina: 42d
    - Ayahuasca: 28d
    - DMT vape: 1d
    - Amanita: 7d
    │
    ▼
[/sessions] muestra ventana abierta o días restantes
```

## Flujo: shopping list

```
[/shopping] auto-generada por cada cultivo nuevo
Filtros: Pendientes / Comprados / Todos
    │
    ▼
Click "🛒 Marcar comprado":
    - status: purchased + purchasedAt
    - Auto-añade al stock (suma a existente o crea entrada)
    │
    ▼
Item ahora con borde verde + fecha compra visible
Botón "↩️ Revertir":
    - Confirm
    - Descuenta del stock (delete si llega 0)
    - Vuelve a status pending
```

## Flujo: stock + capacity

```
[/stock] CRUD manual
    Add ítem: key canonical (ej "perlita") + nombre + qty + unit + categoría
Vista muestra:
    - qty real
    - reservado (si hay cultivos en planning/active con consumibles)
    - libre = real - reservado
    │
[/dashboard] Capacity widget:
    Por cada template muestra cuántos cultivos puedes hacer:
    "🌿 Cannabis interior → 2 cultivos (limitante: substrato 30L)"
    Algoritmo: floor(stock_libre / consumo_unitario) por consumible, min entre todos
```

## Flujo: journal

```
[/journal] foto + nota diaria por cultivo
    │
    ▼
➕ Nueva entrada:
    - Cultivo
    - Foto (se comprime cliente, EXIF strip)
    - Nota
    - Mood ⭐⭐⭐⭐⭐
    - Mediciones key/value (pH, temp, EC...)
    │
    ▼
Timeline cronológico inverso por cultivo
```

## Estados de Cultivation

```
┌──────────┐  startCultivation  ┌──────────┐  cosecha completa  ┌──────────────┐
│ planning │ ──────────────────▶│  active  │ ──────────────────▶│  completed   │
└──────────┘                    └──────────┘                    └──────────────┘
     │                                │
     │ abortCultivation               │ abortCultivation
     ▼                                ▼
┌──────────┐                    ┌──────────┐
│ aborted  │                    │ aborted  │
└──────────┘                    └──────────┘
     (libera reservas pendientes)
```

## Estados de AppEvent

```
pending ──┬── markDone ──▶ done
          │   (decrementa stock)
          │
          ├── markSkipped ──▶ skipped
          │
          ├── tiempo pasa sin marcar ──▶ missed (visual, no persisted state)
          │
          └── delete ──▶ (removed)
```

## Estados de StockReservation

```
reserved ──┬── consume (event done) ──▶ consumed (decrementa stock real)
           │
           └── releasePending (cultivo abortado) ──▶ released
```

## Errores conocidos / patrones

- **Stale closure en Schedule-X callbacks**: usar `useRef` para arrays de eventos. `useCalendarApp` captura callbacks UNA vez.
- **Temporal en Safari iOS**: `@js-temporal/polyfill` importado side-effect en `lib/polyfillTemporal.ts`, registrado antes de cualquier import Schedule-X.
- **Service Worker iOS suspende SW**: notif background no fiable. Usar catch-up al abrir + badge.

## Qué NO hacer

- ❌ Bloquear acción sin opción de saltar (excepto data corruption riesgo real)
- ❌ Tracking de ningún tipo
- ❌ Cambios visuales en wiki (solo func: URL params)
- ❌ Borrar datos sin confirm
- ❌ Sync remoto sin opt-in explícito
- ❌ Cargar fonts/scripts/imgs externos sin justificación CSP
