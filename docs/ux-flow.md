# UX Flow — guia-cultivo-app

Flujo de usuario canónico. Navegación simplificada: 5 tabs fijos abajo.

## Navegación

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  🏠 Hoy  │ 📅 Cal  │ 🌱 Cult. │ 📦 Stock │ 🔧 Más  │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

- **Hoy**: qué hacer ahora — eventos de hoy, atrasados, próximos 7 días
- **Calendario**: vista mes/semana/día, click evento → modal con pasos + señales + warnings
- **Cultivos**: lista + click → vista unificada de todo el cultivo
- **Stock**: Mi Stock (inventario) + Compras (lista auto-generada)
- **Más**: calculadoras, diagnóstico, timelapse, stats, genética, ajustes, ayuda

---

## Flujo principal: primer cultivo

```
Pantalla inicio (sin cultivos) → empty state con CTA "🚀 Empezar primer cultivo"
  │
  ▼
[/new] Wizard 3 pasos
  1. Elegir tipo (19 templates, búsqueda + filtro categoría)
  2. Datos: alias + fecha inicio + notas
     💡 La fecha de inicio = cuando tengas todo listo. Si necesitas comprar, pon fecha futura.
  3. Preflight stock check
     - ✅ Ya lo tienes (verde) → stock reservado
     - ⚠️ Falta (amarillo) → va a lista de compras automáticamente
     - Solo lo que NO tienes aparece en la lista de compras
  │
  ▼
Cultivo creado (estado "active")
  - Eventos generados con reservas per-evento vinculadas
  - Solo items faltantes en lista de compras
  - Prep checklist generada (recordatorio, no bloquea)
  - Redirect [/calendar] con eventos highlighted
```

## Flujo: día a día

```
🏠 Hoy → ve eventos de hoy de todos los cultivos
  │ Click evento → modal con:
  │   📝 Descripción del evento
  │   ☑️ Pasos a seguir (con checkboxes visuales)
  │   ✅ Señales esperadas (recuadro verde)
  │   ⚠️ Warnings (recuadro rojo)
  │   📖 Link a wiki para saber más
  │   Botones: ✅ Hecho · ✏️ Editar · 🗑️ Borrar
  │
  ▼ Marcar "✅ Hecho":
     - Status: done
     - **Descuenta stock real** (fertilizante, agua, etc.)
     - Si es un evento recurrente (nebulizar), descuenta cada vez
```

## Flujo: vista unificada del cultivo

```
🌱 Cultivos → click en un cultivo → [/cultivations/:id]
  │
  ├─ Cabecera: nombre, estado, progreso, días transcurridos
  ├─ ✅ Preparación (tareas recomendadas, clic para marcar)
  ├─ 🛒 Compras de este cultivo (marcar comprado → entra a stock)
  ├─ 🔥 Eventos de hoy (con link a calendario)
  ├─ ⚠️ Atrasados
  ├─ 📅 Próximos eventos
  ├─ 📔 Últimas entradas del journal
  ├─ ✂️ Cosechas registradas
  └─ ⋮ Acciones: completar, abortar, reactivar, borrar
```

## Flujo: stock y compras

```
📦 Stock → dos pestañas:

  [Mi Stock]
    - Lista de todo tu inventario con cantidad + unidad
    - Reservado = comprometido a cultivos activos
    - Libre = disponible para nuevos cultivos
    - Click → editar (cambiar cantidad, unidad, categoría)
    - Identificador técnico visible: debe coincidir con lo que esperan los cultivos

  [Compras]
    - Lista auto-generada al crear cultivos
    - Solo incluye lo que NO tienes ya en stock
    - Filtrar: Pendientes / Comprados / Todos
    - 🛒 Marcar comprado → entra a Mi Stock con el identificador correcto
    - ↩️ Revertir → devuelve a pendiente, descuenta del stock
```

## Estados de Cultivation

```
planning ──→ active ──→ completed
    │           │
    └──→ aborted ←──┘
```

## Estados de AppEvent

```
pending ──┬── markDone ──▶ done (descuenta stock)
           ├── markSkipped ──▶ skipped
           └── delete ──▶ (removed)
```

## Sistema de stock: cómo se conecta todo

```
Crear cultivo
  │
  ├─ "once" (kit, semillas) → una reserva al crear
  ├─ "per_event" (agua, fertilizante) → reserva por cada evento
  │
  ▼
Marcar "✅ Hecho" en evento → consume() → descuenta stock real

Marcar "🛒 Comprado" → añade qty al stock con key correcta

Completar/Abortar cultivo → releasePending() → libera reservas no consumidas
```

**Identificador (`key`)**: es el campo que conecta tu stock con los cultivos. Si añades stock manualmente, asegúrate de que el identificador coincida con el que espera el template. El formulario de stock lo muestra siempre. La lista de compras lo genera automáticamente al marcar "Comprado".

## Principios

1. **Siguiente paso siempre visible**. Usuario nunca se pregunta "¿y ahora qué?"
2. **No bloquear sin salida**. Items críticos avisan, no impiden.
3. **Sistema inteligente por debajo, simple para el usuario**. Stock se descuenta solo, compras se filtran, reservas se gestionan.
4. **Datos contextuales**. Todo amarrado al cultivo concreto en la vista unificada.
5. **Sin tracking, sin sorpresas**. Datos solo en dispositivo.

## Errores conocidos / patrones

- **Stale closure en Schedule-X callbacks**: usar `useRef` para arrays de eventos
- **Temporal en Safari iOS**: `@js-temporal/polyfill` importado side-effect
- **Identificador de stock**: el campo `key` es visible en el formulario. Si no coincide con el template, el sistema no detecta el stock. Usa la lista de compras para generar stock con la key correcta.
