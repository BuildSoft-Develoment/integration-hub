# Fase 3 - Arquitectura

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Validacion UX con operacion](../fase-2-ux-ui/02.17-plan-implementacion-ux-ui.md)
- Siguiente: [Arquitectura](03.00-arquitectura.md)
<!-- nav-guided:end -->

## Objetivo

Definir la arquitectura real del producto, sus decisiones tecnologicas, la estrategia de despliegue y la relacion con operacion.

## Contenido

- [03.00-arquitectura](03.00-arquitectura.md)
- [03.01-decisiones-tecnologia](03.01-decisiones-tecnologia.md)
- [03.02-diagramas-c4-likec4](03.02-diagramas-c4-likec4.md)
- [03.03-plan-despliegue](03.03-plan-despliegue.md)
- [03.04-checklist-arquitectura](03.04-checklist-arquitectura.md)
- [despliegue/despliegue-onprem-detallado](despliegue/despliegue-onprem-detallado.md)
- [anexos/requisitos-no-funcionales-y-riesgos](anexos/requisitos-no-funcionales-y-riesgos.md)
- [anexos/trazabilidad-arquitectonica](anexos/trazabilidad-arquitectonica.md)
- [ADR](adr/README.md)

## Adopcion real de la fase

- `03.00`, `03.01` y `03.03` son entregables oficiales del proyecto, no notas genericas.
- `adr/` registra decisiones que cambian stack, seguridad, despliegue o extensibilidad.
- `likec4/` sigue siendo el artefacto tecnico vivo para arquitectura como codigo.
- Esta fase debe permanecer alineada con `frontend/`, `platform-app/`, `ops/` y `ci/`.

## Estructura actual de arquitectura

```text
docs/
  fase-3-arquitectura/
    README.md
    03.00-arquitectura.md
    03.01-decisiones-tecnologia.md
    03.02-diagramas-c4-likec4.md
    03.03-plan-despliegue.md
    03.04-checklist-arquitectura.md
    despliegue/
    anexos/
    adr/
```

## Referencias

- [../../likec4/README.md](../../likec4/README.md)
- [../transversal/90.14-criterios-consolidacion-documental.md](../transversal/90.14-criterios-consolidacion-documental.md)
