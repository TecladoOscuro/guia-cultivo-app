# Stock System & Capacity Calculator

Núcleo de la app: stock + calendario + shopping list + planning trabajan como sistema único.

## Pipeline reservas

### 1. Crear cultivo

```ts
// User confirma wizard
const template = templates[templateId];
const checks = checkAvailability(template);  // → { ok, missing, conflicts }

if (!checks.ok) {
  showModal({
    missing: checks.missing,  // [{stockKey, qty, unit, available}]
    options: ['Añadir falta a shopping list', 'Confirmar igualmente', 'Cancelar']
  });
}
```

### 2. Confirmar cultivo (con o sin stock suficiente)

```ts
const cultivationId = await db.cultivations.add(cultivation);
const events = generateEvents(template, startDate, cultivationId);
await db.events.bulkAdd(events);

// Reservas blandas
for (const c of template.consumables) {
  const totalQty = computeTotalQty(c, events);
  await db.stockReservations.add({
    stockKey: c.stockKey,
    cultivationId,
    qty: totalQty,
    unit: c.unit,
    status: 'reserved'
  });
}
```

### 3. Marcar evento done con consumo

```ts
const event = await db.events.get(eventId);
await db.events.update(eventId, { status: 'done', completedAt: new Date() });

if (event.consumesReservationIds?.length) {
  for (const rid of event.consumesReservationIds) {
    const r = await db.stockReservations.get(rid);
    // Decrementa stock real
    const stock = await db.stock.where('key').equals(r.stockKey).first();
    if (stock) {
      await db.stock.update(stock.id, { qty: stock.qty - r.qty });
    }
    // Marca reserva como consumida
    await db.stockReservations.update(rid, { status: 'consumed', consumedAt: new Date() });
  }
}
```

### 4. Abortar/eliminar cultivo

```ts
await db.cultivations.update(cultivationId, { status: 'aborted', endedAt: new Date() });

// Liberar reservas pendientes
const reservations = await db.stockReservations
  .where({ cultivationId, status: 'reserved' })
  .toArray();
for (const r of reservations) {
  await db.stockReservations.update(r.id, { status: 'released' });
}
```

## Capacidad calculator

Para cada template, ¿cuántos cultivos puedes hacer ahora?

```ts
async function capacity(templateId: string): Promise<CapacityResult> {
  const template = templates[templateId];
  if (!template.consumables.length) return { capacity: Infinity, bottleneck: null };

  const stockMap = await getStockAvailable();  // { stockKey: qty_disponible }
  let minN = Infinity;
  let bottleneck: { key: string; have: number; need: number } | null = null;

  for (const c of template.consumables) {
    const totalNeeded = computeTotalForOne(c, template);
    const available = stockMap[c.stockKey] ?? 0;
    const n = Math.floor(available / totalNeeded);
    if (n < minN) {
      minN = n;
      bottleneck = { key: c.stockKey, have: available, need: totalNeeded };
    }
  }

  return { capacity: minN, bottleneck };
}
```

`stockAvailable` = `stock.qty - sum(reservations.status == 'reserved')`. NO incluye consumed (ya restado del stock real).

## Dashboard widget

```jsx
function CapacityWidget() {
  const data = useCapacityForAllTemplates();  // hook
  return (
    <div>
      <h3>Con tu stock actual:</h3>
      {data.map(t => (
        <div key={t.id}>
          {t.emoji} {t.name} → {t.capacity === Infinity ? '∞' : t.capacity} cultivos
          {t.bottleneck && (
            <small>(limitante: {t.bottleneck.key}, tienes {t.bottleneck.have})</small>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Smart suggestions

Algoritmo "compra X y haces N cultivos más":

```ts
function suggestPurchase(targetCultivos: { templateId: string; n: number }[]) {
  const totalNeeded: Record<string, number> = {};
  for (const tc of targetCultivos) {
    const t = templates[tc.templateId];
    for (const c of t.consumables) {
      const oneNeed = computeTotalForOne(c, t);
      totalNeeded[c.stockKey] = (totalNeeded[c.stockKey] ?? 0) + oneNeed * tc.n;
    }
  }
  // Resta stock disponible
  const stockMap = await getStockAvailable();
  const missing: ShoppingItem[] = [];
  for (const [key, need] of Object.entries(totalNeeded)) {
    const have = stockMap[key] ?? 0;
    if (need > have) {
      missing.push({ key, qty: need - have, ... });
    }
  }
  return missing;  // → mostrar en shopping list
}
```

## Conexión calendario

Cada evento del calendario que consuma stock muestra inline:
- qty consumido en este evento
- qty restante post-evento
- Warning si pasa por debajo de threshold
- Warning rojo si stock NO alcanza → botón "Añadir falta a shopping list"

```jsx
function EventModal({ event }) {
  const consumption = useEventConsumption(event.id);
  return (
    <div>
      ...
      {consumption.map(c => (
        <div className={c.willBeShort ? 'text-warn' : 'text-text'}>
          🛒 {c.qty}{c.unit} de {c.name}
          (después: {c.remainingAfter}{c.unit})
        </div>
      ))}
    </div>
  );
}
```

## Edge cases

- **Stock 0 + reserva pendiente**: no impide marcar done. Stock va a negativo. Warning "saldo negativo, registra compra retroactiva".
- **Reserva > stock real al consumir**: capa pesimista — solo decrementa lo que hay, registra discrepancia en history.
- **Stock añadido después de reserva**: re-evaluar capacidad automáticamente. Reservas pendientes intactas.
- **Cultivo abortado pero reserva ya consumed**: NO devuelve stock (lo gastaste). Solo libera "reserved" remanente.

## Performance

Para dashboards con muchos templates × muchas consumables, cachear `stockAvailable` con `useLiveQuery` (dexie-react-hooks). Re-calc solo en cambios stock o reservations.
