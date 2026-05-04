---
description: Añadir feature nueva a la app (route + components + db migration si aplica)
---

Invoca skill `add-feature`.

Pide al user:
1. Nombre feature
2. Descripción goal
3. ¿Necesita persistencia? (sí/no, qué datos)
4. ¿Donde encaja en nav? (sección dashboard / settings / standalone route)

Después sigue pipeline del skill: spec → DB → route → components → build → commit.
