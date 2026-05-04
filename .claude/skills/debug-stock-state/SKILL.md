---
name: debug-stock-state
description: Investigar estado IndexedDB en runtime — reservas zombie, stock negativo, inconsistencias. Usa cuando user reporta "el stock no cuadra" o capacity calc da números raros.
allowed-tools: Read, Bash
---

# debug-stock-state

## Cuándo usar

- "Marqué evento done pero stock no bajó"
- "Capacity dice 0 cultivos pero tengo stock de sobra"
- "Cultivo abortado pero reserva sigue ahí"
- Test factory reset y re-import → cosas mal

## Inspección dexie en browser

1. DevTools → Application → IndexedDB → `GuiaCultivoDB`
2. Inspeccionar tablas:
   - `cultivations` — verificar status
   - `events` — verificar status + completedAt
   - `stock` — verificar qty
   - `stockReservations` — verificar status (reserved/consumed/released)

## Queries debug útiles (para ejecutar en consola browser)

```js
// Reservas zombie (cultivo borrado pero reserva pendiente)
const reservs = await db.stockReservations.toArray();
const cults = await db.cultivations.toArray();
const cultIds = new Set(cults.map(c => c.id));
const zombies = reservs.filter(r => !cultIds.has(r.cultivationId));

// Stock real disponible por key
const stocks = await db.stock.toArray();
const reserved = await db.stockReservations.where('status').equals('reserved').toArray();
for (const s of stocks) {
  const r = reserved.filter(x => x.stockKey === s.key).reduce((a, b) => a + b.qty, 0);
  console.log(`${s.key}: ${s.qty}${s.unit} (reservado: ${r}) → libre: ${s.qty - r}`);
}

// Eventos done sin reserva consumed (debería matchearse)
const done = await db.events.where('status').equals('done').toArray();
for (const e of done.filter(e => e.consumesReservationIds?.length)) {
  for (const rid of e.consumesReservationIds) {
    const r = await db.stockReservations.get(rid);
    if (r?.status !== 'consumed') console.log(`DESYNC event ${e.id} → reserva ${rid} status ${r?.status}`);
  }
}
```

## Fixes comunes

| Síntoma | Fix |
|---------|-----|
| Reserva zombie | Marcar manualmente `released` o borrar |
| Stock < 0 | Añadir compra retroactiva en stock + ajustar |
| Capacity 0 falso | Verificar template.consumables.stockKey matches stock canonical keys (case sensitive) |
| Reserva consumed sin decremento | Bug en pipeline — añadir migration |

## Tests futuros

- E2E: crear cultivo + marcar 5 events done → verificar stock decrementa correctamente
- Edge: abortar cultivo después consumo parcial → verificar stock real intacto + reservas pending released
