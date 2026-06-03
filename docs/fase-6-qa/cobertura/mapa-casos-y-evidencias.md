# Mapa de casos y evidencias

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Plan de pruebas](../06.00-plan-pruebas.md)
- Siguiente: [Criterios de salida y defectos](../salida/criterios-salida-y-defectos.md)
<!-- nav-guided:end -->

## Objetivo

Hacer visible la cobertura actual de QA sobre las features formalizadas en `specs/`.

## Cobertura vigente

| Feature | Casos | Evidencias |
| --- | --- | --- |
| `001-catalogo-fuentes` | `qa/fase-6-qa/casos/001-catalogo-fuentes.md` | `qa/fase-6-qa/evidencias/001-catalogo-fuentes.md` |
| `002-catalogo-readers` | `qa/fase-6-qa/casos/002-catalogo-readers.md` | `qa/fase-6-qa/evidencias/002-catalogo-readers.md` |
| `003-diseno-y-ejecucion-procesos` | `qa/fase-6-qa/casos/003-diseno-y-ejecucion-procesos.md` | `qa/fase-6-qa/evidencias/003-diseno-y-ejecucion-procesos.md` |
| `004-observabilidad-y-auditoria` | `qa/fase-6-qa/casos/004-observabilidad-y-auditoria.md` | `qa/fase-6-qa/evidencias/004-observabilidad-y-auditoria.md` |
| `005-catalogo-conexiones` | `qa/fase-6-qa/casos/005-catalogo-conexiones.md` (plantilla) | `qa/fase-6-qa/evidencias/005-catalogo-conexiones.md` (pendiente) |
| `006-programacion-procesos` | `qa/fase-6-qa/casos/006-programacion-procesos.md` (plantilla) | `qa/fase-6-qa/evidencias/006-programacion-procesos.md` (pendiente) |
| `007-tema-del-sistema` | `qa/fase-6-qa/casos/007-tema-del-sistema.md` (plantilla) | `qa/fase-6-qa/evidencias/007-tema-del-sistema.md` (pendiente) |

> Estado: `001`–`004` formalizados (evidencias pendientes de capturas/salidas reales);
> `005`–`007` con plantilla pendiente. Fase 6 esta **parcial** hasta cerrar evidencias y
> firmar `gate-qa-passed` (ver `docs/transversal/90.11-checklist-entregables.md`).

## Regla de mantenimiento

- toda nueva feature relevante debe evaluar si necesita caso y evidencia propios
- la nomenclatura de QA debe seguir la numeracion de `specs/`
- los resultados de QA no deben quedarse unicamente en comentarios o tickets externos
