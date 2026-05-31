# Gate 4-6

## Objetivo
Validar que specs, construccion y QA tienen evidencia suficiente para liberar.

## Evidencia minima
- specs completas,
- si la feature es visual, gate-spdd-approved aprobado antes de cerrar SDD/construccion,
- plan de tareas pequeno y verificable,
- rama o worktree trazable si hubo codigo,
- evidencia red-green-refactor o justificacion,
- build y pruebas ejecutadas,
- revision de codigo en cambios criticos,
- si hay frontend, gate-frontend-spdd-ready aprobado o con observaciones aceptadas,
- evidencias QA,
- defectos gestionados.

## Bloqueantes tipicos
- falta `spec tecnica`,
- no hay prueba minima,
- no hay plan ejecutable por tarea,
- no hay evidencia TDD en cambios de comportamiento,
- frontend sin consistencia demostrada con UX, prototipo validado y criterios UI,
- no hay revision en cambios de contrato, seguridad, datos o UX critica,
- QA sin evidencia verificable,
- cambio de contrato sin trazabilidad.

## Rutas relacionadas
- `docs/transversal/90.11-checklist-entregables.md`
- `specs/`
- `src/`
- `tests/`
- `qa/fase-6-qa/`
- `ai/references/feature-delivery-workflow.md`
- `ai/references/frontend-spdd-workflow.md`
