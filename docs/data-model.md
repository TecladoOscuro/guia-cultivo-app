# Data Model (Dexie / IndexedDB)

## Tablas

### cultivations
Una cultivación concreta del usuario. Instancia de un template.

```ts
{
  id: number;               // auto-increment
  templateId: string;       // ej "cannabis-interior", "mushroom-kit"
  name: string;             // alias user: "Cannabis verano #1"
  startDate: Date;          // fecha inicio
  status: "planning" | "active" | "completed" | "aborted";
  notes?: string;
  customParams?: Record<string, unknown>;  // ej { strain: "Northern Lights" }
  createdAt: Date;
  endedAt?: Date;
}
```

### events
Eventos generados desde template + manualmente añadidos.

```ts
{
  id: number;
  cultivationId: number;
  templateEventId?: string;  // null si manual
  scheduledDate: Date;
  originalDate?: Date;       // si reagendado, original
  title: string;
  description: string;
  emoji: string;
  type: "milestone" | "watering" | "feeding" | "monitoring" | "harvest" | "preparation" | "session";
  status: "pending" | "done" | "skipped" | "missed" | "in_progress";
  notes?: string;
  completedAt?: Date;
  consumesReservationIds?: number[];  // links a stockReservations
  wikiUrl?: string;
  notify: boolean;
}
```

### stock
Items que el user tiene físicamente.

```ts
{
  id: number;
  key: string;          // canonical: "perlita", "biobizz_grow", "esporada_tampanensis"
  name: string;         // human readable
  category: "semilla" | "esqueje" | "equipo" | "fungible" | "nutriente" | "producto_final";
  qty: number;
  unit: string;         // "L", "ml", "g", "ud"
  expiresAt?: Date;
  costPaid?: number;
  vendor?: string;
  addedAt: Date;
  notes?: string;
}
```

### stockReservations
Reservas blandas: stock comprometido a cultivos pendientes.

```ts
{
  id: number;
  stockKey: string;
  cultivationId: number;
  eventId?: number;     // si reserva por evento específico
  qty: number;
  unit: string;
  status: "reserved" | "consumed" | "released";
  createdAt: Date;
  consumedAt?: Date;
}
```

**Stock disponible real** = `stock.qty - sum(reservations donde status == 'reserved' || 'consumed')`. Para cálculo capacidad usar solo "reserved" (consumed ya está fuera del stock real).

### shoppingList
Items pendientes de comprar (auto-generados desde templates + manuales).

```ts
{
  id: number;
  cultivationId?: number;  // null si manual / global
  itemKey: string;
  name: string;
  qty: number;
  unit: string;
  category: "esencial" | "importante" | "util";
  approxPrice?: string;
  source?: "internet" | "tienda_fisica";
  notes?: string;
  status: "pending" | "purchased" | "skipped";
  purchasedAt?: Date;
  costPaid?: number;
  addedAt: Date;
  wikiUrl?: string;
}
```

### prepChecklists
Tareas pre-cultivo para ejecutar antes de iniciar.

```ts
{
  id: number;
  cultivationId: number;
  templateChecklistId: string;
  title: string;
  description?: string;
  blocking: boolean;
  estimatedMinutes?: number;
  status: "pending" | "done" | "skipped";
  completedAt?: Date;
}
```

### journal
Entradas diarias por cultivo: foto + nota.

```ts
{
  id: number;
  cultivationId: number;
  date: Date;
  photoBlob?: Blob;     // comprimido ~200KB
  note: string;
  observations?: { key: string; value: string }[];  // ej {ph: 6.5, temp: 23}
  mood?: number;        // 1-5 estado planta
}
```

### harvests
Registros de cosecha.

```ts
{
  id: number;
  cultivationId: number;
  date: Date;
  type: string;          // "flush_1", "main_cut", etc según cultivo
  weightWet?: number;    // gramos
  weightDry?: number;
  quality?: number;      // 1-5
  photos?: Blob[];
  notes?: string;
  productEntryId?: number;  // link a tabla product creada
}
```

### product
Inventario producto final (post-cosecha y curado).

```ts
{
  id: number;
  harvestId: number;
  kind: string;          // "flor_cannabis", "seta_seca", "polvo_cactus", "hidromiel"
  qty: number;
  unit: string;
  peakUntil?: Date;      // pico potencia
  openedAt?: Date;
  depletedAt?: Date;
  notes?: string;
}
```

### sessions
Sesiones de consumo (psicodélicos especialmente).

```ts
{
  id: number;
  productId: number;
  date: Date;
  dose: number;
  doseUnit: string;
  method: string;        // "oral", "lemon_tek", "vape", "té"
  durationMin?: number;
  setting?: string;
  notesPre?: string;
  notesPost?: string;
  rating?: number;
  toleranceWindowDays: number;  // copiado del compuesto al registrar
}
```

### genetics
Library cepas/semillas/clones tuyas.

```ts
{
  id: number;
  kind: "semilla" | "esqueje" | "esporada" | "scoby" | "levadura";
  name: string;
  vendor?: string;
  lineage?: string;
  acquiredAt: Date;
  expiresAt?: Date;
  history?: { cultivationId: number; outcome: string }[];
  photo?: Blob;
  notes?: string;
}
```

### history
Audit log para deshacer + estadísticas.

```ts
{
  id: number;
  cultivationId?: number;
  eventId?: number;
  action: string;       // "event.done", "stock.consume", "cultivo.create", etc
  payload: unknown;
  timestamp: Date;
}
```

### settings
Key-value de preferencias.

```ts
{
  key: string;          // "notif.dailyDigestHour", "tolerance.psilocybin", etc
  value: unknown;
}
```

## Migraciones

Dexie versions explícitas en `src/lib/db.ts`. Cada cambio de schema = nueva version + migración upgrade. NO romper compatibilidad: si añades campo, opcional; si cambias type, escribe upgrader.

## Relaciones

```
cultivations
  ├── events (1:many)
  │     └── stockReservations (1:many)
  ├── shoppingList (1:many)
  ├── prepChecklists (1:many)
  ├── journal (1:many)
  ├── harvests (1:many)
  │     └── product (1:1)
  │            └── sessions (1:many)
  └── history (1:many)

stock
  └── stockReservations (1:many)

genetics ← cultivations (linked via customParams.geneticsId)
```

## Guía edición

- Añadir tabla: bumpear version + add `db.version(N).stores({newTable: 'pk, idx1'})`
- Añadir campo: type-only change si optional. Sin migración necesaria
- Renombrar campo: migrate via upgrade callback
- Borrar tabla: muy raro, hacer .delete() en upgrade
