# Criterios de salida y defectos

> **Aviso sobre el control de defectos.** Este documento evalua contra `qa/fase-6-qa/defectos.md`,
> que tiene catalogo desde el 2026-06-12 pero **estuvo siete semanas sin actualizarse** mientras el
> money-path cambiaba. Un criterio de salida que mira un registro desactualizado da un verde que no
> significa nada.
>
> Al aplicar el criterio, comprobar primero la fecha del ultimo registro. Si no cubre el periodo de
> los cambios que se van a promover, el criterio por defectos **no es concluyente**: apoyarse en la
> ejecucion de los casos del eje por modulo funcional y en los carriles del
> [plan de pruebas](../06.00-plan-pruebas.md).

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Mapa de casos y evidencias](../cobertura/mapa-casos-y-evidencias.md)
- Siguiente: [Fase 7 - Deploy](../../fase-7-deploy/README.md)
<!-- nav-guided:end -->

## Objetivo

Explicitar cuando una validacion esta lista para avanzar a deploy y donde se controlan los defectos abiertos.

## Criterios de salida

- plan de pruebas actualizado
- casos criticos ejecutados
- evidencias registradas
- defectos criticos resueltos o aceptados explicitamente
- humo tecnico listo para `PRE` y `PRO`

## Control de defectos

- el consolidado actual vive en `qa/fase-6-qa/defectos.md`
- todo defecto debe poder asociarse a una feature, flujo o riesgo operativo
- si un defecto impacta salida a produccion, deploy y operacion deben verlo reflejado

## Regla de traspaso a fase 7

La fase 6 no termina solo porque existan pruebas. Termina cuando QA deja una conclusion trazable que habilita o condiciona la salida a ambientes.
