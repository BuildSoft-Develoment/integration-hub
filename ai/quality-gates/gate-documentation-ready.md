# Gate Documentation Ready

## Objetivo
Validar que un entregable documental esta listo para avanzar o ser usado por agentes IA.

Este gate es transversal. Complementa los gates por bloque de fases y se usa cuando una salida documental necesita readiness antes de alimentar `/plan`, `/spec`, `/build`, `/test`, `/review` o `/ship`.

## Evidencia minima
- fase asociada,
- ruta canonica,
- objetivo claro,
- entradas usadas,
- supuestos declarados,
- preguntas abiertas registradas,
- trazabilidad con artefactos previos,
- siguiente paso recomendado.

## Bloqueantes tipicos
- documento sin fase,
- documento sin objetivo,
- requerimiento sin actor,
- decision tecnica sin ADR,
- feature sin criterio de aceptacion,
- salida de IA sin ruta canonica,
- intake plano usado como entregable final.

## Resultado esperado
- `Aprobado`
- `Aprobado con observaciones`
- `Bloqueado`

## Rutas relacionadas
- `docs/transversal/90.10-entregables-minimos-por-fase.md`
- `docs/transversal/90.11-checklist-entregables.md`
- `ai/commands/document-command.md`
- `ai/skills/documentation-orchestration.skill.md`
- `ai/references/documentation-orchestration.md`
