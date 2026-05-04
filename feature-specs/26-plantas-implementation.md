# Plan: 26 plantas psicoactivas — wiki + app sincronizados

## Context

Tras análisis 9 PDFs etnobotánica (`/Users/fabrilobo/guia-cultivo/infoPDF/`),
filtrado a Barcelona/clima mediterráneo + psicoactivas reales + dificultad ≤3,
quedan **24 candidatos**. Verificación cruzada con wiki actual revela:

- 5 plantas tienen **wiki existente pero falta template app**:
  Wild lettuce, Sinicuichi, Lúpulo, Calea zacatechichi, Mucuna pruriens.
  (Calea + Mucuna no estaban en mi lista 24 pero existen en wiki sin
  template app — completar para alinear.)
- 21 plantas son **truly nuevas** (wiki + template app).

**Total: 26 templates app a crear, 21 funciones wiki nuevas.**

Disclaimers educativos donde la planta lo requiera (toxicidad, dosis estrecha,
solanáceas tropano, precursores fiscalizados). NO se restringe info — todas las
guías van completas. Educación > paternalismo.

## Las 26 plantas

### Wiki ya existe → solo template app (5)
Wild lettuce (Lactuca virosa), Sinicuichi (Heimia salicifolia), Lúpulo
(Humulus lupulus), Calea zacatechichi, Mucuna pruriens.

### Nuevas wiki + app (21)

**Grupo A — Solanáceas tropano (clásicas brujería europea, disclaimer fuerte)** (5):
Beleño negro (Hyoscyamus niger), Belladona (Atropa belladonna), Mandrágora
(Mandragora officinarum), Datura inoxia, Estramonio (Datura stramonium).

**Grupo B — Trepadoras LSA (semillas ergolínicas)** (2):
Hawaiian baby woodrose (Argyreia nervosa), Morning glory (Ipomoea tricolor).

**Grupo C — Sedantes / ansiolíticos legales fáciles** (5):
Pasiflora (Passiflora incarnata), Adormidera California (Eschscholzia
californica), Catnip (Nepeta cataria), Valeriana (Valeriana officinalis),
Wild dagga (Leonotis leonurus).

**Grupo D — Estimulantes / nicotínicos** (3):
Tabaco rústico (Nicotiana rustica), Mormon tea (Ephedra nevadensis), Lobelia
inflata.

**Grupo E — Enteógenos vegetales** (4):
Ruda siria (Peganum harmala — IMAO ayahuasca analog), Cálamo (Acorus calamus),
Coleus (Coleus blumei), Sasafrás (Sassafras albidum).

**Grupo F — Otros** (2):
Escoba canaria (Cytisus canariensis), Chicalote (Argemone mexicana).

## Estructura wiki

Cada planta = una `function NOMBRE() { ... }` en
[src/components/plantas/general.js](/Users/fabrilobo/guia-cultivo/src/components/plantas/general.js)
siguiendo el shape de [DAMIANA](/Users/fabrilobo/guia-cultivo/src/components/plantas/general.js):

```jsx
function PASIFLORA() {
  const c = PLANTAS_COLORS;
  return (
    <div>
      <InfoBoxX c={c}>...intro científico + efecto + nivel dificultad</InfoBoxX>
      <SectionTitleX c={c}>CONDICIONES IDEALES</SectionTitleX>
      <div grid 2x2><StatBoxX label="Temp"/> <StatBoxX label="Humedad"/> ...</div>
      <SectionTitleX c={c}>PRECIOS ORIENTATIVOS</SectionTitleX>
      <SectionTitleX c={c}>CULTIVO</SectionTitleX>
      <StepX num={1..6} text="..." />
      <SectionTitleX c={c}>COSECHA</SectionTitleX>
      <SectionTitleX c={c}>USOS</SectionTitleX>
      <SectionTitleX c={c}>EFECTOS</SectionTitleX>
      <SectionTitleX c={c}>CONSERVACIÓN</SectionTitleX>
      <SectionTitleX c={c}>HARM REDUCTION</SectionTitleX>
    </div>
  );
}
```

Reusa `PLANTAS_COLORS` de [colors.js](/Users/fabrilobo/guia-cultivo/src/app/colors.js)
(púrpura-malva botánico) — sin paleta nueva.

### Registro en wiki

1. Añadir función a [src/components/plantas/general.js](/Users/fabrilobo/guia-cultivo/src/components/plantas/general.js)
   (al final, antes de `FAQ_PLANTAS`).
2. Añadir entry a `plantasPhases[]` en
   [src/app/phases.js](/Users/fabrilobo/guia-cultivo/src/app/phases.js)
   (entre `lupulo` y `faq_plantas`).
3. Añadir `case` en switch de
   [src/app/gui-cultivo.js](/Users/fabrilobo/guia-cultivo/src/app/gui-cultivo.js)
   (block `guide === "plantas"`).

## Estructura app templates

Cada planta = un archivo `src/templates/planta-<id>.json` siguiendo schema en
[docs/templates-format.md](/Users/fabrilobo/guia-cultivo-app/docs/templates-format.md)
y patrón de [planta-damiana.json](/Users/fabrilobo/guia-cultivo-app/src/templates/planta-damiana.json):

- `id`: `planta-<kebab-case>` (ej. `planta-pasiflora`)
- `category`: `etnobotanica`
- `theme`: reusar el de damiana o ajustar por especie
- `wikiBase`: `https://tecladooscuro.github.io/guia-cultivo/?guide=plantas&phase=<id>`
- `phases`: 2 (compra + cultivo) — duración total típica 90-270 días
- `events`: 2 (plantar + primera cosecha)
- `recurringTasks`: 1 (riego, cadencia por especie)
- `shoppingList`: 4-6 items (esqueje/semilla, maceta, sustrato, agua, opcional invernadero/cobijo)
- `prepChecklist`: 1-2 (sol/sombra, espacio)
- `consumables`, `harvestable`, `harvestType`, `produces`

Registrar en [src/templates/index.ts](/Users/fabrilobo/guia-cultivo-app/src/templates/index.ts).

## Disclaimers (sección HARM REDUCTION wiki + `description` en eventos app)

### Tier rojo (toxicidad letal posible, dosis estrecha)

Beleño · Belladona · Mandrágora · Datura inoxia · Estramonio · Lobelia inflata.

Disclaimer: dosis-letal-cercana-a-activa, escopolamina/atropina = delirio
verdadero (no euforia), riesgo paro cardíaco, contraindicado en enfermedad
cardiovascular, glaucoma, hipertensión. Siempre acompañado, NO solo. Material
educativo histórico (uso shamánico/brujería).

### Tier ámbar (precursores fiscalizados, planta legal)

Sasafrás (safrol → MDMA fiscalizado), Mormon tea / Ephedra (efedrina
precursor anfetaminas).

Disclaimer: planta y té tradicional 100% legales, extracción/concentración del
compuesto activo regulada. Uso fines decorativos / culinarios / té tradicional
sin problema.

### Tier verde (uso tradicional seguro)

Pasiflora · Adormidera California · Catnip · Valeriana · Wild lettuce ·
Lúpulo · Sinicuichi · Calea · Mucuna · Tabaco rústico (warning nicotina).

Disclaimer estándar: contraindicaciones embarazo/lactancia, interacción con
fármacos psicoactivos.

### Tier especial — Peganum harmala (IMAO)

Disclaimer crítico **interacciones IMAO**: NUNCA con tiramina (queso curado,
vino tinto, embutido, soja fermentada, plátano), ISRS, MDMA, dextrometorfano.
Reposo dietético 24h antes/después.

## Workflow ejecución

1. **Plan file** (este doc) → commit + push como referencia. ✅
2. **Wiki**: añadir 21 funciones en `general.js` + 21 entries en
   `plantasPhases` + 21 cases en switch. Build, verify rendering en
   `npm run dev` o equivalente. **Commit + push wiki**.
3. **App**: crear 26 templates JSON. Registrar en `index.ts`. `npm run build`.
   Test loading desde UI dev. **Commit + push app**.
4. **PRs**: si user prefiere PRs en lugar de push directo a main, parar antes
   de push y abrir PR. (Convención actual: auto-commit + push main por
   memoria `feedback_auto_commit`.)

## Verificación end-to-end

1. Wiki: navegar a https://tecladooscuro.github.io/guia-cultivo/?guide=plantas
   (tras deploy) → 21 nuevas tabs visibles, contenido renderiza.
2. App: `npm run dev` → ➕ Nuevo cultivo → buscar "Pasiflora" / "Beleño" /
   etc. → ver shopping list, eventos generados, fases.
3. Stock: crear cultivo de prueba → verificar `consumables` reservan stock.
4. Harvest: completar evento `primera_cosecha` → verificar producto generado
   en inventory.

## Archivos críticos

### Wiki
- [src/components/plantas/general.js](/Users/fabrilobo/guia-cultivo/src/components/plantas/general.js) — añadir 21 funciones
- [src/app/phases.js](/Users/fabrilobo/guia-cultivo/src/app/phases.js) — `plantasPhases[]`
- [src/app/gui-cultivo.js](/Users/fabrilobo/guia-cultivo/src/app/gui-cultivo.js) — switch `guide === "plantas"`
- [src/app/colors.js](/Users/fabrilobo/guia-cultivo/src/app/colors.js) — reusa `PLANTAS_COLORS`

### App
- [src/templates/](/Users/fabrilobo/guia-cultivo-app/src/templates/) — 26 archivos `planta-<id>.json`
- [src/templates/index.ts](/Users/fabrilobo/guia-cultivo-app/src/templates/index.ts) — registry

## Estimación

- Plan: 1 commit
- Wiki: 1-2 commits (functions + phases/switch)
- App: 1-2 commits (JSON files + index)
- Total: ~5 commits sincronizados.
