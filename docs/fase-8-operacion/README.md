# Fase 8 - Operacion

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Rollback, release y evidencias](../fase-7-deploy/controles/rollback-release-y-evidencias.md)
- Siguiente: [Operacion continua](08.00-operacion-continua.md)
<!-- nav-guided:end -->

## Objetivo

Operar, medir y evolucionar la solucion en produccion sobre una base trazable.

## Contenido

- [08.00-operacion-continua](08.00-operacion-continua.md)
- [operacion/monitoreo-y-respuesta](operacion/monitoreo-y-respuesta.md)
- [operacion/metricas-y-backlog-evolutivo](operacion/metricas-y-backlog-evolutivo.md)

## Adopcion real de la fase

- La operacion viva del proyecto esta en `ops/fase-8-operacion/`.
- Esta fase resume el baseline operativo y enlaza metricas, runbooks, features operativas y mejoras.
- No debe quedarse en frases genericas; debe reflejar rutina, incidentes y seguimiento reales.

## Referencias

- [../../ops/fase-8-operacion/README.md](../../ops/fase-8-operacion/README.md)
- [../../ops/observabilidad.md](../../ops/observabilidad.md)
- [../../releases/README.md](../../releases/README.md)

## Activos operativos vivos

Esta fase describe el marco; la operacion real vive en `ops/`. Enlaces que faltaban:

- **[Runbook del money-path MT101](../../ops/runbooks/008-mensajeria-pagos-runbook.md)** — que hacer
  con `NEEDS_RECONCILIATION`, `UNCERTAIN` y `pay_conflict`, las consolas, los endpoints de
  remediacion y el flujo maker-checker. **Es el documento a leer en un incidente de pagos.**
- [Guardia y escalamiento](../../ops/fase-8-operacion/oncall.md)
- [Objetivos de servicio (SLO)](../../ops/fase-8-operacion/slo.md)
- [Resto de runbooks](../../ops/runbooks/) — incluido el del backbone asincrono.
- [Rollback](../../ops/fase-7-deploy/rollback.md) — leer ANTES de revertir una release que toque
  esquema o pagos: esta no es reversible solo con el artefacto.
