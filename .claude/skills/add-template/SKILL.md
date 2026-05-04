---
name: add-template
description: Añade un template JSON nuevo para un cultivo en src/templates/. Sigue schema en docs/templates-format.md. Usar cuando hay info de cultivo extraíble desde wiki o conocida.
allowed-tools: Read, Write, Edit, Bash
---

# add-template

## Cuándo usar

Para añadir definición JSON de un cultivo nuevo a la app, asumiendo que la wiki YA tiene info del cultivo (o tienes la info a mano).

Para cultivos completamente nuevos (sin info en wiki) usa `add-new-cultivo` que orquesta wiki + app.

## Pasos

1. **Lee** `docs/templates-format.md` para schema completo
2. **Identifica** el ID y data desde la wiki:
   - Phase IDs: `~/guia-cultivo/src/app/phases.js` array correspondiente
   - Timing: `TimelineList nodes` en `~/guia-cultivo/src/components/<cultivo>/general.js`
   - Materiales: `COMPRA_<X>` items
3. **Crea** `src/templates/<cultivo>.json`:
   - id, name, emoji, totalDuration
   - phases[] con offsetDays
   - events[] (milestones)
   - recurringTasks[] (riego, fertilización)
   - shoppingList[] desde COMPRA_X
   - prepChecklist[] de instrucciones pre-inicio
   - consumables[] con cantidades exactas
4. **Validar**:
   - JSON parse OK: `node -e "JSON.parse(require('fs').readFileSync('src/templates/X.json'))"`
   - Phase IDs únicos
   - Todos `wikiPhase` referenciados existen en wiki
5. **Test en dev**:
   - `npm run dev`
   - Wizard nuevo cultivo → seleccionar este template
   - Verificar eventos generados son sensatos
6. **Commit**:
   - `git add src/templates/<cultivo>.json`
   - Mensaje: `feat(templates): add <cultivo> template`

## Errores comunes

- Olvidar `consumables[]` → app no calcula capacity, no decrementa stock
- IDs de phase mal escritos → deep links wiki rotos
- offsetDays mayor que totalDuration → events fuera de rango

## Ejemplos

Ver templates existentes en `src/templates/` para patrones.
