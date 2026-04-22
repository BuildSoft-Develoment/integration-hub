# Fase 4 - Spec-Driven Development

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-001 Platform Architecture](../fase-3-arquitectura/adr/ADR-001-platform-architecture.md)
- Siguiente: [Spec-Driven Development](04.00-spec-driven-development.md)
<!-- nav-guided:end -->

## Objetivo

Traducir requerimientos y arquitectura aprobada en specs funcionales, tecnicas y tareas ejecutables.

## Nota de navegacion

La entrada guiada a esta fase llega desde `ADR-001` para cerrar el paso entre arquitectura aprobada y refinement implementable.

## Contenido

- [04.00-spec-driven-development](04.00-spec-driven-development.md)
- [features/mapa-features-sdd](features/mapa-features-sdd.md)
- [trazabilidad/trazabilidad-specs-qa-ops](trazabilidad/trazabilidad-specs-qa-ops.md)
- [04.01-checklist-spec-driven-development](04.01-checklist-spec-driven-development.md)

## Adopcion real de la fase

- Las features oficiales viven en `specs/` y no en esta carpeta.
- Esta fase documenta la forma de trabajo y la trazabilidad esperada para esas features.
- Cada nueva capacidad debe terminar con `spec-funcional.md`, `spec-tecnica.md` y `spec-tareas.md`.
- `qa/`, `ops/` y `releases/` deben poder referenciar la misma numeracion funcional.

## Referencias

- [../../specs/README.md](../../specs/README.md)
- [../transversal/90.09-trazabilidad-sdd-por-stack.md](../transversal/90.09-trazabilidad-sdd-por-stack.md)
- [../transversal/90.14-criterios-consolidacion-documental.md](../transversal/90.14-criterios-consolidacion-documental.md)
