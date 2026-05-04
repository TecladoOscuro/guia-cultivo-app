# CLAUDE.md — instrucciones específicas Claude

Lee primero [AGENTS.md](AGENTS.md). Este file añade lo específico al asistente Claude.

## Tono y estilo

- Caveman mode default activable en sesión user-level. Por defecto: español técnico conciso. Fragmentos OK.
- Sin pleasantries innecesarias ("Sure!", "Of course!", "Happy to help!")
- Sin hedging excesivo
- Code blocks: normales, NO caveman
- Commit messages, PR descriptions: prosa normal

## Convenciones código

- Sin comentarios obvios (código autoexplicativo)
- Sin docstrings largos
- Edit > Write para archivos existentes
- Sin abstracciones prematuras
- Solo validar input en boundaries (UI form, parsing JSON template, API externa)

## Ejecución

- Ejecuta inmediato si tarea clara
- Antes de operación destructiva: pregunta (rm -rf, force-push, drop tables)
- Antes de tocar UI: arranca dev server + abre browser
- Antes de commit: build pasa + parse limpio + sin secretos

## Trabajos complejos

- Usa TodoWrite si tarea tiene 3+ pasos
- Spawn agents (Explore/Plan/general-purpose) para research o exploración paralela
- Si trabajo muy grande: divide en commits temáticos

## Restricciones del proyecto

- **Wiki actual = NO TOCAR visualmente**. Solo cambio funcional invisible (URL params parsing)
- **Cero secretos commiteados**. Si hay tokens → GitHub Actions secrets
- **Datos usuario solo local**. Sin sync sin pedir
- **Sin analytics ni tracking** sin opt-in explícito

## Cómo encontrar contexto

- Arquitectura: `AGENTS.md`
- Data model: `docs/data-model.md`
- Schema templates: `docs/templates-format.md`
- Wiki sync: `docs/wiki-sync.md`
- Stock pipeline: `docs/stock-system.md`
- Decisiones técnicas: `docs/decisions/*.md`
- Feature specs: `feature-specs/*.md`
- Skills disponibles: `.claude/skills/*/SKILL.md`

## Patrones a reusar (NO duplicar)

- Helpers UI compartidos: `src/components/`
- DB queries: hooks `src/hooks/useDb.ts` (cuando exista)
- Generador eventos: `src/lib/eventGenerator.ts`
- Notificaciones: `src/lib/notifications.ts`

## Antes de cualquier cambio mayor

1. Lee AGENTS.md
2. Lee feature-spec relevante
3. Lee data-model si tocas DB
4. Verifica skill apropiada en `.claude/skills/`
