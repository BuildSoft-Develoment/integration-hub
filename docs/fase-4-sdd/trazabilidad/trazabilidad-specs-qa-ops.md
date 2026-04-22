# Trazabilidad de specs a QA y Ops

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Mapa de features SDD](../features/mapa-features-sdd.md)
- Siguiente: [Checklist SDD](../04.01-checklist-spec-driven-development.md)
<!-- nav-guided:end -->

## Objetivo

Explicar como una feature bajo `SDD` debe reflejarse en construccion, calidad y operacion.

## Flujo de trazabilidad

```text
docs/fase-1 -> docs/fase-3 -> specs/<feature> -> codigo/pruebas -> qa/ -> ops/ -> releases/
```

## Reglas aplicadas

- `spec-funcional.md` define comportamiento y alcance.
- `spec-tecnica.md` aterriza implementacion, contratos y riesgos.
- `spec-tareas.md` divide el trabajo ejecutable.
- `qa/fase-6-qa/` debe tener casos y evidencias alineadas a la misma feature cuando aplique.
- `ops/fase-7-deploy/` y `ops/fase-8-operacion/` deben reflejar impacto de deploy u operacion por feature si existe.

## Ejemplos reales del repositorio

- `001-catalogo-fuentes` se refleja en `qa/fase-6-qa/casos/001-catalogo-fuentes.md` y `ops/fase-7-deploy/features/001-catalogo-fuentes.md`
- `003-diseno-y-ejecucion-procesos` se refleja en `qa/fase-6-qa/evidencias/003-diseno-y-ejecucion-procesos.md` y `ops/fase-8-operacion/features/003-diseno-y-ejecucion-procesos.md`

## Criterio de calidad documental

Una feature no esta bien consolidada si solo existe en `specs/` pero no deja rastro verificable en calidad u operacion cuando el cambio lo requiere.
