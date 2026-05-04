# ADR 0004: Stock reservation pipeline

## Status
Accepted (2026-05-04)

## Context
Stock interconectado con calendario, shopping list, capacity calculator. Necesitamos pipeline robusto.

## Decision

**Reservas blandas + decremento al consumir**.

3 estados de reserva:
- `reserved`: comprometido, reduce capacity, NO decrementa stock real
- `consumed`: ejecutado, ya restado del stock real
- `released`: cultivo abortado, devuelve capacity sin tocar stock real

## Rationale

- Permite ver capacity = stock_real - reserved sin esperar al consumo
- Preserva stock real hasta que evento done dispara consumo
- Rollback simple si cultivo abortado: liberar reservas pendientes

## Alternatives considered

- Decrementar stock al crear cultivo (rígido, no rollback)
- Sin reservas, solo decremento al consumo (capacity ignora cultivos en curso)

## Consequences

- Capacity calc = stock - sum(reserved). Más complejo que stock simple
- Necesita UI clara para mostrar diferencia "tienes 100ml" vs "tienes 100ml - 30ml comprometidos = 70ml libres"
- Edge cases: stock añadido después de reserva, reserva > stock real al consumir, etc. Documentados en `docs/stock-system.md`
