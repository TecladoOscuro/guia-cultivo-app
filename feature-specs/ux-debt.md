# Deuda UX pendiente

Auditoría 2026-05-04. Issues identificados pero no resueltos en el sweep
inicial (caen fuera del alcance "fix rápido"). Tracking para futuras
iteraciones.

## High priority

### 1. `confirm()` nativo → ConfirmModal custom

**Problema:** ~9 archivos usan `confirm()` del navegador para confirmar
acciones destructivas. En móvil corta el diálogo, no respeta el tema
oscuro y rompe el flow visual.

**Archivos afectados:**
- [src/routes/Dashboard.tsx](../src/routes/Dashboard.tsx) — 2 calls
- [src/routes/Settings.tsx](../src/routes/Settings.tsx) — 2 calls
- [src/routes/Stock.tsx](../src/routes/Stock.tsx)
- [src/routes/Sessions.tsx](../src/routes/Sessions.tsx)
- [src/routes/Calendar.tsx](../src/routes/Calendar.tsx)
- [src/routes/Journal.tsx](../src/routes/Journal.tsx)
- [src/routes/Genetics.tsx](../src/routes/Genetics.tsx)
- [src/routes/PrepChecklist.tsx](../src/routes/PrepChecklist.tsx)
- [src/routes/ShoppingList.tsx](../src/routes/ShoppingList.tsx)

**Fix:** Crear `src/components/ConfirmModal.tsx` reusable con
`{ open, title, body, danger?, onConfirm, onCancel }`. Reemplazar
todos los `confirm()`.

### 2. Loading states ausentes en forms

**Archivos sin `busy` state visible durante async:**
- [src/routes/Stock.tsx](../src/routes/Stock.tsx) — StockForm
- [src/routes/Calendar.tsx](../src/routes/Calendar.tsx) — algunos paths
- [src/routes/Genetics.tsx](../src/routes/Genetics.tsx)

**Patrón a copiar:** `Sessions.tsx` ya tiene `busy` state + texto
"Guardando..." en botón. Replicar.

### 3. Try/catch sin feedback de error al usuario

**Archivos:**
- [src/routes/NewCultivation.tsx:40-53](../src/routes/NewCultivation.tsx#L40-L53) — `createCultivation()` puede fallar silenciosamente
- [src/routes/Journal.tsx:154-169](../src/routes/Journal.tsx#L154-L169) — try/finally sin catch que muestre error

**Fix:** Añadir `setMsg({ type: "err", text: ... })` en catch y mostrar
banner inline.

## Medium priority

### 4. Botones "Cancelar" vs "Cerrar" inconsistentes

- NewCultivation usa "Atrás"
- Calendar usa "Cerrar"
- Journal/Stock/Sessions usan "Cancelar"

**Fix:** Estandarizar a "Cancelar" en formularios (descarta cambios)
y "Cerrar" solo en modales puramente informativos (sin estado a
descartar).

### 5. Empty states sin CTA

- [src/routes/NewCultivation.tsx:65-67](../src/routes/NewCultivation.tsx#L65-L67) — "No hay templates" sin link
- [src/routes/Stock.tsx](../src/routes/Stock.tsx) — empty sin link a ShoppingList
- [src/routes/Genetics.tsx](../src/routes/Genetics.tsx)

**Fix:** Añadir `<button>` o `<Link>` con acción primaria.

### 6. Botones emoji sin `aria-label`

- Estrellas calidad en `Harvests.tsx:178-186`
- Rating sesiones en `Sessions.tsx:259-267`
- Botón borrar `✕` en cards (`Journal.tsx:114`)

**Fix:** `aria-label="Calidad: 3"`, `aria-label="Borrar entrada"`,
etc.

## Low priority

### 7. Validación invisible pre-submit

Los botones disabled en gris no explican por qué. Añadir hint:
```tsx
{!name.trim() && <p className="text-xs text-warn">Nombre requerido</p>}
```

### 8. Sin breadcrumb en rutas profundas

NewCultivation tiene Stepper. Otros modales no tienen pista visual del
contexto al volver.
