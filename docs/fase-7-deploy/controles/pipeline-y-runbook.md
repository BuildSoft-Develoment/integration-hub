# Pipeline y runbook

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Checklist de salida a produccion](../07.00-checklist-salida-produccion.md)
- Siguiente: [Rollback, release y evidencias](rollback-release-y-evidencias.md)
<!-- nav-guided:end -->

## Objetivo

Conectar el control de integracion y despliegue con la ejecucion operativa paso a paso.

## Baseline actual

- `ci/pipeline-baseline.md` describe el puente de pipeline mientras no todo viva en workflows reales
- `ops/fase-7-deploy/runbook.md` describe el flujo de despliegue por ambientes

## Flujo esperado

1. construir backend y frontend
2. validar pruebas minimas
3. desplegar a `DEV`
4. promover a `PRE`
5. ejecutar smoke tests
6. promover a `PRO`

## Regla operativa

El checklist de deploy no se considera suficiente si no existe una forma clara de ejecutar el despliegue y verificarlo paso a paso.
