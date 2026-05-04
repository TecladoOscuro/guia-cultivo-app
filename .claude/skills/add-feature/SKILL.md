---
name: add-feature
description: Añade una feature nueva (route + componentes + db migration si aplica + docs). Usar cuando el user pide funcionalidad nueva (ej. "añadir tracker de pH", "añadir vista resumen mensual").
allowed-tools: Read, Write, Edit, Bash
---

# add-feature

## Pasos

1. **Lee** `AGENTS.md` y `docs/architecture.md`
2. **Crear feature spec**: `feature-specs/<feature>.md` con:
   - Goal
   - User story
   - Data model changes (si aplica)
   - UI sketch (texto bullet OK)
   - Verificación
3. **Si necesita persistencia**:
   - Edit `src/lib/db.ts`: bumpear version, añadir tabla
   - Doc cambio en `docs/data-model.md`
4. **Crear route**:
   - `src/routes/<Feature>.tsx`
   - Añadir entry en `src/App.tsx` `navItems` array
   - Añadir `<Route>` en switch
5. **Componentes** (si shared): `src/components/<feature>/`
6. **Hooks** (si data fetching): `src/hooks/use<Feature>.ts`
7. **Build + test**:
   - `npm run build` pasa
   - `npm run dev`, navegar a la nueva route, prueba manual
8. **Docs**:
   - Update `AGENTS.md` si cambio significativo
   - Feature spec quedó en `feature-specs/`
9. **Commit**:
   - Si tabla nueva: separar commit DB migration vs UI
   - Mensaje convencional: `feat(<feature>): description`

## Patterns reusables

- Live queries: `useLiveQuery` de `dexie-react-hooks`
- Modals: pattern en `src/components/Modal.tsx` (cuando exista)
- Forms: prefer controlled components con local state
- Error states: ErrorBoundary global en App.tsx (TODO)

## Antes de cerrar

- [ ] Build pasa
- [ ] Dev server arranca sin errores consola
- [ ] Feature spec en `feature-specs/`
- [ ] Si tabla DB: migración tested (factory reset + import → no se rompe)
- [ ] Sin secretos commiteados
