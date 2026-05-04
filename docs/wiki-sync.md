# Wiki Sync Protocol

Cómo se sincronizan templates de la app con cambios en la wiki.

## Estrategia

Build-time scheduled extraction. Cero runtime dependencies.

## Flujo

```
┌──────────────┐    repository_dispatch    ┌────────────────┐
│   Wiki repo  │ ─────────────────────────▶│   App repo     │
│ (push main)  │                           │ workflow runs  │
└──────────────┘                           └────────────────┘
                                                   │
                                                   ▼
                                  ┌─────────────────────────────┐
                                  │ extract-templates.js        │
                                  │ - clone wiki                │
                                  │ - parse src/components/     │
                                  │ - generate JSON diff        │
                                  └─────────────────────────────┘
                                                   │
                                          ¿hay cambios?
                                          /          \
                                       sí             no
                                       /                \
                            ¿phase nueva?         exit clean
                            /        \
                          sí          no
                          ▼            ▼
                      Issue           PR auto
                      manual          revisar
                      template        + merge
```

## Setup workflow wiki → app

En `~/proyectos-cultivo/guia-cultivo/.github/workflows/notify-app.yml`:

```yaml
name: Notify app of wiki update
on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'index.html'

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: peter-evans/repository-dispatch@v3
        with:
          token: ${{ secrets.APP_DISPATCH_TOKEN }}
          repository: TecladoOscuro/guia-cultivo-app
          event-type: wiki-updated
          client-payload: '{"sha": "${{ github.sha }}"}'
```

`APP_DISPATCH_TOKEN`: PAT con scope `repo` sobre el repo app, en wiki Settings → Secrets.

## Setup workflow app

Ya creado en `.github/workflows/sync-from-wiki.yml`.

## Extract script (`scripts/extract-templates.js`)

Pseudocódigo:

```js
// Para cada componente *.js en wiki/src/components/<cultivo>/general.js:
//   - Parsear AST (acorn-jsx o regex pragmatic)
//   - Buscar TimelineList nodes → extraer offsetDays
//   - Buscar tablas riego (RIEGO_X, CUIDADOS_X) → recurringTasks
//   - Buscar COMPRA_X items → shoppingList
//   - Buscar prep instructions → prepChecklist
//
// Construir templates/<cultivo>.json
// Comparar con existente
// Si phase ID nueva sin template → output a issues.txt
// Si cambio en phase existente → write JSON
```

## Lock fields

Si user editó manualmente algún campo en template y NO quiere que se sobrescriba:

```jsonc
{
  "id": "my_event",
  "_lock": true,
  "title": "Mi título custom — no auto-update",
  ...
}
```

Extract script preserva campos con `_lock: true`.

## Trigger manual

GitHub UI → Actions → "Sync templates from wiki" → "Run workflow".

Útil cuando:
- Token PAT caduca y no se ha renovado
- Quieres re-extraer todo desde cero
- Debug del extractor

## Verificación post-sync

1. Workflow corre sin errores
2. Si hay PR: review manual del diff
3. Tests templates (cuando existan): `npm run test:templates`
4. Build app: `npm run build` pasa
5. Test crear cultivo en dev con template actualizado

## Casos edge

| Caso | Resultado |
|------|-----------|
| Cambias texto narrativo wiki sin tocar timing | No diff estructural → no PR |
| Cambias números timeline (incubación 14 → 17 días) | PR auto detectado |
| Añades cultivo nuevo (tab nuevo en header) | Issue automático "phase nueva sin template" |
| Añades fase nueva a cultivo existente | Issue + PR parcial |
| Borras una fase | PR con removal |
| Wiki cambia drásticamente (refactor mayor) | Extract puede fallar → Issue de error con stacktrace |

## Manual: añadir cultivo NUEVO

Para cultivos completamente nuevos (no extraíbles de wiki existente), usar skill `add-new-cultivo` que orquesta:

1. Research en web
2. Generar contenido wiki (JSX)
3. Generar template app (JSON)
4. Build + commit ambos repos
5. PRs sincronizados

Ver `.claude/skills/add-new-cultivo/SKILL.md`.
