---
name: add-new-cultivo
description: Skill flagship — orquesta TODO lo necesario para añadir un cultivo nuevo a wiki + app sincronizadas. Research, generación contenido wiki, generación template JSON app, build, commit, PRs en ambos repos.
allowed-tools: Bash, Read, Write, Edit, Agent, WebSearch, WebFetch
---

# add-new-cultivo

## Cuándo usar

User quiere añadir cultivo COMPLETAMENTE NUEVO (no existe ni en wiki). Ejemplos:
- "Añade café como cultivo"
- "Quiero meter Kratom"
- "Añade matcha green tea"

Para cultivos que YA están en wiki y solo falta template JSON: usa `add-template`.

## Inputs

**Mínimo**: nombre cultivo.

**Opcional**:
- categoría: `planta` | `hongo` | `fermento` | `etnobotánica`
- modos: ej. `["interior", "exterior"]` o `["kit", "manual"]`
- paleta color: hex hint o keyword
- referencias extra: URLs/libros que el user quiere considerar

Si user solo da nombre, pregunta cosas mínimas para clarificar antes de research.

## Pipeline (8 fases)

### Fase 1 — Research (parallel agents, 3 max)

Spawn 3 Agent calls en paralelo:

1. **Agent fuentes canónicas** (Explore + WebSearch):
   - Libros de referencia
   - Papers científicos
   - Foros activos
   - Vendedores reputados

2. **Agent legalidad** (WebSearch):
   - España + UE 2025-2026
   - Estado USA si relevante
   - Restricciones específicas

3. **Agent timing/protocolo** (WebSearch):
   - Días por fase
   - Riego/condiciones cuantitativas
   - Cosecha y conservación

Output unificado: brief estructurado.

### Fase 2 — Validar viabilidad

- ¿Legal en ES? Si no → warning user, ofrecer continuar/abortar
- ¿Suficiente literatura? Si poca → ofrecer parcial vs abortar
- ¿Encaja con paletas existentes? Sugerir colores

### Fase 3 — Generar artefactos wiki

En `~/guia-cultivo/`:

1. `src/app/colors.js`: añadir `<CULTIVO>_COLORS` con 5+ acentos
2. `src/app/phases.js`: array `<cultivo>Phases` con phase IDs:
   - Convención: `intro_X, compra_X, ..., faq_X, biblio_X`
3. `src/components/<cultivo>/general.js`:
   - `INTRO_<X>` con TimelineList
   - `COMPRA_<X>` con filterable items
   - Fases específicas
   - `FAQ_<X>` con buscador
   - `BIBLIO_<X>` con BibliografiaBlock
   - `LegalHealthBox` al final
4. `src/app/gui-cultivo.js`:
   - State `active<X>` con default
   - Cases en `renderContent()` switch
   - Botón guide toggle (categoría correcta: planta/hongo/fermento)
5. Build + parse-check:
   - `cd ~/guia-cultivo && node build.js`
   - `node -e "const fs=require('fs');const html=fs.readFileSync('index.html','utf8');const m=html.match(/<script type=\"text\/babel\">([\\s\\S]*?)<\/script>/);require('fs').writeFileSync('/tmp/code_test.jsx',m[1]);" && npx esbuild /tmp/code_test.jsx --loader:.jsx=jsx > /dev/null`

### Fase 4 — Generar template app

En `~/guia-cultivo-app/`:

1. `src/templates/<cultivo>.json`: schema completo (ver `docs/templates-format.md`)
2. Si introduce categoría/recurso nuevo: actualizar TS enums + `docs/data-model.md`
3. Tema color: derivar de wiki colors.js o sugerir nueva
4. Build + lint:
   - `npm run build` pasa
   - JSON parse OK

### Fase 5 — Sync verification

- Cross-check phase IDs wiki ↔ template app coinciden
- Verificar `wikiUrl` resuelven
- Lint JSON contra `docs/templates-format.md` schema
- Verificar `consumables.stockKey` existen en stock canonical

### Fase 6 — Docs

- Update `feature-specs/cultivos.md` (lista de cultivos soportados)
- Update README app con nuevo cultivo soportado
- Si introduce categoría nueva: ADR en `docs/decisions/`

### Fase 7 — Build + test + commit

Para cada repo:

```bash
# Wiki
cd ~/guia-cultivo
git checkout -b add-cultivo-<x>
git add -A
git commit -m "feat(<cultivo>): añadir cultivo X con guía completa..."
git push -u origin add-cultivo-<x>
gh pr create --title "Add cultivo: X" --body "..."

# App
cd ~/guia-cultivo-app
git checkout -b add-cultivo-<x>
git add -A
git commit -m "feat(<cultivo>): template + integration"
git push -u origin add-cultivo-<x>
gh pr create --title "Add cultivo template: X" --body "Sister PR: link al PR de wiki"
```

### Fase 8 — User review

- Resumen visual: archivos cambiados + diff stats
- Si dev server up: screenshot wiki + app con cultivo nuevo
- Esperar aprobación user
- Si OK: merge wiki primero, luego app → deploy

## Edge cases

- **Cultivo ilegal en ES**: warning explícito, no apologético, ofrecer abortar
- **Cultivo ya existe**: ofrecer "expandir" en lugar de duplicar (skill `add-feature`)
- **Sin literatura suficiente**: generar versión mínima + Issue para completar manualmente
- **Categoría nueva**: requiere ADR + actualizar tipos TS + UI guide toggle (más trabajo)

## Templates de generación

Plantillas JSX para componentes wiki en `docs/component-templates/` (cuando existan). Mientras: copiar de cultivo similar y adaptar.

## Caso real test

Test añadiendo:
- "Café arábica" (planta legal, abundante info, encaja categoría planta)
- "Lúpulo solo" (planta legal, ya en plantas-suaves pero podría tener guía dedicada si user quiere expansión)

Si funciona end-to-end → skill production-ready.

## Rollback

Si después de generar todo, user no aprueba: 
- Borrar branches en ambos repos: `git branch -D add-cultivo-<x>` (local) + `git push origin --delete add-cultivo-<x>` (remoto)
- Cerrar PRs sin merge
