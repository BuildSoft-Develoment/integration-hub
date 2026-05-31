# Gate Frontend SPDD Ready

## Objetivo
Validar que una entrega frontend construida desde un SPDD aprobado mantiene trazabilidad, consistencia visual y evidencia suficiente para pasar a QA o integracion.

Este gate no reemplaza `gate-spdd-approved`: lo consume. `gate-spdd-approved` ocurre antes de SDD final y construccion; este gate revisa la implementacion frontend resultante.

## Evidencia minima
- spec funcional, spec tecnica y spec-tareas usados,
- `gate-spdd-approved` aprobado o con observaciones aceptadas,
- prototipo validado o excepcion documentada enlazada,
- criterios UI y sistema de componentes revisados,
- componentes reutilizables respetados,
- estados principales implementados o justificados,
- TDD red-green-refactor o evidencia equivalente,
- comandos frontend ejecutados,
- evidencia browser/manual cuando aplica,
- diferencias contra prototipo registradas,
- review de cambios criticos.

## Bloqueantes tipicos
- UI implementada sin origen en UX/spec,
- componente nuevo sin origen en prototipo, spec o sistema de componentes,
- estado de error, empty o unauthorized ausente,
- pruebas omitidas sin justificacion,
- API real conectada durante prototipado,
- divergencia del prototipo sin decision.

## Resultado esperado
- `Aprobado`
- `Aprobado con observaciones`
- `Bloqueado`

## Referencias
- `../references/frontend-spdd-workflow.md`
- `../skills/spec-prototype-driven-frontend.skill.md`
- `../quality-gates/gate-4-6.md`
