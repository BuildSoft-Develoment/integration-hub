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

> `PRE` y `PRO` no existen como ambientes. La escalera real es: **dev local -> integracion
> on-premise (nativo bajo `/appih`) -> produccion, que todavia no existe**. Ver la seccion de
> ambientes del [checklist](../07.00-checklist-salida-produccion.md).

1. construir backend y frontend
2. validar catalogo frontend extensible con `web:test-plugins`
3. pasar los carriles de test: `-Pfast-tests verify` y, si el cambio toca la capa de datos,
   `-Pcompat-db-tests` (matriz multi-motor, en su propio workflow)
4. pasar la gobernanza: `npm run check:all`
5. **build NATIVO con el perfil del destino** (`-Pnative,appih` para integracion). El perfil es
   build-time e irreversible: ver [ADR-024](../../fase-3-arquitectura/adr/ADR-024-despliegue-nativo-bajo-subpath.md)
6. exportar la imagen y cargarla en el destino (`docker save` / `docker load`, sin rebuild alla)
7. pasar el [checklist de salida](../07.00-checklist-salida-produccion.md): base de datos,
   controles bancarios y build
8. desplegar y ejecutar smoke tests

## Regla operativa

El checklist de deploy no se considera suficiente si no existe una forma clara de ejecutar el despliegue y verificarlo paso a paso.
