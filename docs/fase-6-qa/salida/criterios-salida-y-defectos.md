# Criterios de salida y defectos

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
