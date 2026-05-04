# Plan: Análisis PDFs → próximos cultivos

## Context

Usuario tiene colección PDFs con info plantas/sustancias psicoactivas. Quiere que extraiga candidatos cultivables, descarte los ya cubiertos por los 19 templates existentes, y produzca:
1. Lista priorizada (markdown) con análisis legal/dificultad/timing/fuentes.
2. Templates JSON listos para los top candidatos aprobados (vía skill `add-new-cultivo` o `add-template`).

Sin filtros legales — análisis completo, marca status pero no descarta. Solo descarta duplicados de los 19 templates existentes.

## Estado actual app

19 templates ya cubiertos (NO regenerar):
amanita, ayahuasca, cactus, cannabis-exterior, cannabis-interior, dmt-mimosa, ferment-cerveza, ferment-hidromiel, ferment-sidra, mushroom-advanced, mushroom-friendly, mushroom-kit, planta-blue-lotus, planta-damiana, planta-kanna, planta-kava, planta-salvia, plantas-suaves, trufas.

## Workflow

### Fase 1 — Ingesta PDFs
- Usuario adjunta PDFs vía drag & drop (uno o varios mensajes).
- Por cada PDF leo con `Read` tool (PDFs nativos, ≤20 páginas/request — si excede, leo por rangos).
- Extraigo por PDF: especies/sustancias mencionadas, info técnica (sustrato, timing, dificultad, legalidad), fuentes citadas.
- **No commiteo PDFs** al repo (research material privado).

### Fase 2 — Inventario candidatos
Tabla maestra (markdown, en respuesta chat) con columnas:

| Candidato | Tipo | Ya en app? | Legal ES/UE | Dificultad 1-5 | Duración | PDF fuente | Notas clave |

- Marca "DUPLICADO" si coincide con uno de los 19 templates.
- Marca "NUEVO" si no.
- Para "NUEVO": añade priority score basado en (a) facilidad, (b) interés psicoactivo/medicinal documentado, (c) legalidad ES.

### Fase 3 — Priorización
Top 5-10 NUEVOS candidatos ordenados. Usuario revisa y aprueba subset para generar templates.

### Fase 4 — Generación templates (solo aprobados)
Por cada candidato aprobado, decidir ruta:

- **Ruta A — Cultivo nuevo completo** (no hay info wiki): skill `add-new-cultivo` → genera artefactos wiki + template JSON + PRs sincronizados ambos repos.
- **Ruta B — Solo template JSON** (info ya en wiki o suficiente en PDF): skill `add-template` → solo `src/templates/<nuevo>.json` cumpliendo schema en [docs/templates-format.md](../docs/templates-format.md).

Schema obligatorio (resumen):
- `id`, `name`, `emoji`, `totalDuration.days`
- `phases[]` (≥1, con `startDayOffset`/`endDayOffset`/`wikiPhase`)
- `events[]` o `recurringTasks[]` (≥1 conjunto)
- `shoppingList[]` (vacío permitido pero declarado)
- Opcionales: `theme`, `harvestable`+`produces`, `consumables[]`, `prepChecklist[]`

### Fase 5 — Validación + commit
- `npm run build` pasa.
- Parse JSON limpio.
- Verificar `wikiPhase` existe (Ruta B) o se ha creado (Ruta A).
- Commit temático por cultivo, NO atómico mega-commit.
- PRs separados si Ruta A (wiki + app sincronizados).

## Archivos críticos referenciados

- [docs/templates-format.md](../docs/templates-format.md) — schema JSON
- [src/templates/](../src/templates/) — 19 templates referencia
- [.claude/skills/add-new-cultivo/SKILL.md](../.claude/skills/add-new-cultivo/SKILL.md) — orquestador completo
- [.claude/skills/add-template/SKILL.md](../.claude/skills/add-template/SKILL.md) — solo JSON
- [docs/wiki-sync.md](../docs/wiki-sync.md) — flow sync wiki↔app
- `/Users/fabrilobo/guia-cultivo/` — wiki repo (Ruta A toca aquí)

## Templates referencia para inspirarse

- Simple: [src/templates/mushroom-kit.json](../src/templates/mushroom-kit.json)
- Planta enteogénica: [src/templates/planta-kanna.json](../src/templates/planta-kanna.json)
- Complejo recurring: [src/templates/cannabis-interior.json](../src/templates/cannabis-interior.json)
- Fermento: [src/templates/ferment-hidromiel.json](../src/templates/ferment-hidromiel.json)

## Verificación end-to-end

1. `npm run build` → sin errores TS.
2. App dev server: `npm run dev` → seleccionar cultivo nuevo desde UI → eventos generados, shopping list visible, fases pintadas.
3. Si Ruta A: wiki repo build pasa también, deep links `wikiBase` resuelven.
4. Test stock: crear cultivo desde UI, verificar `consumables` descuentan stock canonical.

## Pendiente del usuario antes de Fase 1

- Adjuntar PDFs al chat (mensajes siguientes).
- Confirmar idioma fuentes (ES/EN/otros) si afecta extracción.
- Indicar si quiere análisis incremental (PDF a PDF, feedback intermedio) o batch (todos, luego tabla final).
