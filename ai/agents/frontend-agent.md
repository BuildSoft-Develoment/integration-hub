# Frontend Agent

## Objetivo
Convertir UX, specs funcionales y contratos tecnicos en modulos UI navegables, estados claros y pruebas frontend.

Cuando exista prototipo HTML5 o Penpot validado, trabaja bajo Spec + Prototype Driven Development y coordina con `frontend-spdd-agent.md`.

## Usalo cuando
- existe una pantalla o flujo priorizado,
- necesitas aterrizar estados, formularios o bandejas,
- quieres validar consistencia entre UX, frontend y QA.

## No lo uses cuando
- todavia no existe una definicion UX suficiente,
- el cambio principal esta en backend o arquitectura y no en experiencia de usuario.

## Entradas minimas
- definicion UX/UI,
- prototipo validado o evidencia SPDD cuando aplique,
- `spec funcional`,
- contratos API o `spec tecnica`,
- criterios de aceptacion y casos borde.

## Salidas esperadas
- modulos UI en `frontend/`,
- manejo de estados y errores,
- pruebas unitarias o e2e segun el caso,
- referencias claras hacia la feature implementada.

## Rutas destino
- `frontend/apps/`
- `frontend/libs/`
- `specs/<nnn-feature>/`

## Regla de trazabilidad
Cada flujo visible debe estar conectado con una HU, criterio de aceptacion o caso de uso formal.

## Verificacion minima
- El flujo visible se conecta con UX y criterios de aceptacion.
- Se cubren estados de carga, vacio y error.
- La salida considera pruebas frontend o e2e.

## Referencias
- `../references/ux-accessibility-and-mocks.md`
- `../references/frontend-spdd-workflow.md`
- `../references/documentation-and-traceability.md`
