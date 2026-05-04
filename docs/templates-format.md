# Templates Format

Schema completo para `src/templates/<cultivo>.json`. Source of truth de cómo se generan eventos, shopping list y checklists para cada tipo cultivo.

## Schema completo

```jsonc
{
  "id": "mushroom-kit",
  "name": "Setas Psilocybe — Kit",
  "emoji": "🍄",
  "version": 1,
  "totalDuration": { "days": 55 },
  "wikiBase": "https://tecladooscuro.github.io/guia-cultivo/?guide=mushroom&mode=kit",
  "theme": {
    "primary": "#8a6240",
    "bg": "#0f0c08"
  },

  "phases": [
    {
      "id": "compra_kit",
      "name": "Compra",
      "emoji": "🛒",
      "startDayOffset": 0,
      "endDayOffset": 0,
      "wikiPhase": "compra_kit"
    },
    {
      "id": "incubacion_kit",
      "name": "Incubación",
      "emoji": "🔮",
      "startDayOffset": 1,
      "endDayOffset": 14,
      "wikiPhase": "incubacion_kit"
    }
  ],

  "events": [
    {
      "id": "kit_inoculation",
      "title": "Iniciar incubación: colocar pan en cámara",
      "emoji": "🔮",
      "type": "milestone",
      "offsetDays": 0,
      "durationMin": 15,
      "description": "Coloca el pan de micelio en la cámara SGFC con perlita húmeda. Temperatura 24-26°C, humedad 90%+.",
      "checklistInline": [
        "Lavar manos + esterilizar cámara con alcohol 70%",
        "Hidratar perlita hasta húmeda no encharcada",
        "Colocar pan sin tocar la base"
      ],
      "expectedSignals": [
        "Sin contaminación visible (verde, negro, peludo) en el pan",
        "Olor neutro/champiñón (no a podrido)"
      ],
      "warningIf": [
        "Manchas verdes/azules → Trichoderma → desechar lote"
      ],
      "wikiPhase": "setup_kit",
      "notify": true
    }
  ],

  "recurringTasks": [
    {
      "id": "kit_nebulizar",
      "title": "Nebulizar cámara",
      "emoji": "💧",
      "type": "watering",
      "startDayOffset": 1,
      "endDayOffset": 25,
      "cadence": { "everyDays": 1, "notes": "2-3 sprays en paredes, no en pan" },
      "description": "Nebulizar paredes de la cámara para mantener humedad 90%+. NO mojar el pan directamente.",
      "wikiPhase": "fructificacion_kit",
      "notify": false
    }
  ],

  "shoppingList": [
    {
      "key": "kit_setas_completo",
      "name": "Kit cultivo Psilocybe (pan + cámara + perlita)",
      "qty": 1,
      "unit": "ud",
      "category": "esencial",
      "approxPrice": "30-50€",
      "source": "internet",
      "notes": "Vendedores etnobotánicos UE: Avalon, ethnopharm. Variedades: Golden Teacher fácil, Mazatapec resistente.",
      "wikiPhase": "compra_kit"
    },
    {
      "key": "spray_botella",
      "name": "Pulverizador agua spray fina",
      "qty": 1,
      "unit": "ud",
      "category": "esencial",
      "approxPrice": "3-5€",
      "source": "tienda_fisica"
    }
  ],

  "prepChecklist": [
    {
      "id": "esterilizar_camara",
      "title": "Esterilizar cámara con alcohol 70%",
      "description": "Limpia cámara + manos + zona trabajo antes de abrir kit",
      "blocking": true,
      "estimatedMinutes": 10
    },
    {
      "id": "espacio_listo",
      "title": "Reservar espacio 24-26°C oscuro",
      "description": "Armario sin luz directa, temperatura constante. NO baño (humedad excesiva externa).",
      "blocking": true,
      "estimatedMinutes": 5
    }
  ],

  "consumables": [
    {
      "stockKey": "kit_setas_completo",
      "qty": 1,
      "unit": "ud",
      "trigger": "once",
      "description": "1 kit completo por cultivo"
    },
    {
      "stockKey": "agua_destilada",
      "qty": 500,
      "unit": "ml",
      "trigger": "per_event",
      "refEventId": "kit_nebulizar",
      "description": "~20ml por nebulización × ~25 días"
    }
  ],

  "harvestable": true,
  "harvestType": "flushes",
  "expectedYield": {
    "flushes": [
      { "n": 1, "weightDryRangeG": [10, 25] },
      { "n": 2, "weightDryRangeG": [8, 20] },
      { "n": 3, "weightDryRangeG": [5, 15] }
    ]
  },

  "produces": {
    "kind": "seta_psilocybe_seca",
    "unit": "g"
  }
}
```

## Campos obligatorios

- `id` — único, kebab-case
- `name` — human readable
- `emoji`
- `totalDuration.days`
- `phases[]` con al menos 1 fase
- `events[]` o `recurringTasks[]` (al menos uno)
- `shoppingList[]` — vacío permitido pero declárate

## Campos opcionales

- `theme` — colores específicos (default: usa CANNABIS_COLORS)
- `wikiBase` — URL base wiki para deep links
- `harvestable`, `harvestType`, `expectedYield`, `produces` — para flujo cosecha→inventario

## Validación

- Phase IDs únicos dentro del template
- Event IDs únicos
- `consumables.stockKey` debe existir en stock canonical OR pre-añadirse
- `wikiPhase` debe existir en wiki actual (verificar en sync)
- `offsetDays` ≤ `totalDuration.days`

## Re-extraction lock

Si campo editado a mano y no debe sobrescribirse en re-extracción, añadir `"_lock": true` al objeto:

```jsonc
{
  "id": "custom_event",
  "_lock": true,
  "title": "Mi evento custom no auto-sync",
  ...
}
```

## Ejemplos completos

Ver `src/templates/`:
- `mushroom-kit.json` — ejemplo simple
- `cannabis-interior.json` — ejemplo complejo con muchos recurringTasks
- `ferment-hidromiel.json` — ejemplo fermentación con maturación
