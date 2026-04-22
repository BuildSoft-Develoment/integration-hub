# Controles y salidas de IA

[README principal](../README.md) | [Indice docs](../docs/README.md) | [Volver a IA](README.md)

## Objetivo

Definir los controles minimos que deben cumplirse cuando la IA participa en una tarea del proyecto.

## Entradas minimas

Antes de producir una salida relevante, revisar segun corresponda:

- `docs/fase-0-iniciacion/`
- `docs/fase-1-analisis-requerimientos/`
- `docs/fase-3-arquitectura/`
- `docs/fase-4-sdd/`
- `specs/`
- `qa/`
- `ops/`

## Controles obligatorios

- la salida debe reflejar el estado real del proyecto
- cualquier cambio de tecnologia o arquitectura debe reflejarse en `ADR`
- una salida de IA no sustituye validacion funcional ni tecnica
- si el resultado queda con tono de borrador, no esta listo para integrarse
- si el trabajo afecta despliegue, seguridad o datos, debe quedar trazabilidad documental

## Salidas esperadas por area

- analisis: modulos, casos de uso, backlog, reglas
- arquitectura: decisiones, diagramas, despliegue, riesgos
- `SDD`: `spec-funcional`, `spec-tecnica`, `spec-tareas`
- construccion: codigo, pruebas y referencias a `specs/`
- QA: casos, matrices, evidencias
- operacion: runbook, rollback, metricas, backlog operativo
