# Mapa de casos y evidencias

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Plan de pruebas](../06.00-plan-pruebas.md)
- Siguiente: [Criterios de salida y defectos](../salida/criterios-salida-y-defectos.md)
<!-- nav-guided:end -->

## Objetivo

Hacer visible la cobertura actual de QA.

> **Hay DOS ejes de cobertura y este documento solo mostraba uno.** El eje por feature de `specs/`
> -la tabla de abajo- es en buena parte plantillas. El que de verdad se ejecuta es el **eje por
> modulo funcional** de `qa/fase-6-qa/casos-prueba-qa-2026-07-16.md`, organizado en modulos F0-F8 y
> con ejecutor declarado (Tecnico/Dev o Manual-QA). Mirar solo el primero da una impresion de
> cobertura mucho peor que la real.

### Eje 1 — por modulo funcional (el que se ejecuta)

`qa/fase-6-qa/casos-prueba-qa-2026-07-16.md`. Casos con ID estable (MP-xx money-path, PAY-xx,
STAT-xx, E2E-xx...), resultado por ronda de ejecucion (v1, v2...) y enlace a su evidencia. Es el
que se corre contra el ambiente de integracion on-premise, con datos sembrados en las cuatro fuentes.

Los casos del money-path son los criticos: MP-01 (camino feliz), MP-13 (enrutado por canal), PAY-21
(mapeo de la respuesta del gateway) y STAT-02 (NACK del banco).

### Eje 2 — por feature de `specs/`

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
| `008-mensajeria-pagos` | `qa/fase-6-qa/casos/008-mensajeria-pagos.md` | `qa/fase-6-qa/evidencias/008-mensajeria-pagos.md` |

> Estado: `001`-`004` formalizados (evidencias pendientes de capturas/salidas reales);
> `005`-`007` con plantilla pendiente; `008` cuenta con evidencia web, backend y
> frontend, pero mantiene brechas de certificacion bancaria, transporte real y
> reproceso selectivo. Fase 6 esta **parcial** hasta cerrar evidencias, brechas
> y firmar `gate-qa-passed` (ver `docs/transversal/90.11-checklist-entregables.md`).

## Regla de mantenimiento

- toda nueva feature relevante debe evaluar si necesita caso y evidencia propios
- la nomenclatura de QA debe seguir la numeracion de `specs/`
- los resultados de QA no deben quedarse unicamente en comentarios o tickets externos
