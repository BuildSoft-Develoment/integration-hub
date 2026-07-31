# SLO / SLI del Integration Hub

Objetivos de nivel de servicio (fase 8).

**De donde salen los numeros.** La plataforma tiene OpenTelemetry activo, pero configurado **solo
para trazas** (`quarkus.otel.exporter.otlp.traces.endpoint`): no hay exportador de metricas. Las
metricas las publica **Micrometer en `/q/metrics`** en formato Prometheus. Un SLI que no diga de
donde se lee acaba en un panel vacio, asi que cada fila de abajo declara su fuente.

## Los cuatro SLO

| SLO | Objetivo | SLI | Fuente |
|---|---|---|---|
| Disponibilidad de la API | 99.5% mensual | Ratio de respuestas no-5xx | `http_server_requests_seconds_count` por `status` (binder HTTP de Quarkus) |
| Latencia de la API | p95 < 500 ms | Histograma de latencia HTTP | `http_server_requests_seconds` (mismo binder) |
| Ejecuciones sin fallo | 99% diario | Ejecuciones **no** `FAILED` / total resueltas | **Consulta a la API**, no hay serie (ver abajo) |
| Frescura de procesamiento | < 5 min de retraso | Edad del ultimo lote procesado | Consulta a la API |

### Por que el SLI de ejecuciones NO es "COMPLETED / total"

Es la formulacion intuitiva y es la incorrecta. `ExecutionStatus` tiene siete valores, y tres de los
que **no** son `COMPLETED` tampoco son fallos:

- **`NEEDS_RECONCILIATION`** es la salvaguarda del camino del dinero *funcionando*: un pago que se
  intento despachar y del que no se pudo demostrar que el banco no lo recibio. El motor se niega a
  cerrarlo solo, a proposito.
- **`SUSPENDED`** es el estado normal de un proceso que espera un callback bancario o un scheduler.
  Por diseno una ejecucion puede pasar horas ahi.
- **`COMPLETED_WITH_ERRORS`** es un resultado parcial real, no una ejecucion perdida.

Contarlos contra un objetivo del 99% diario tiene una consecuencia concreta y mala: **conciliar
correctamente consumiria presupuesto de error**. La presion operativa apuntaria a cerrar
`NEEDS_RECONCILIATION` rapido —es decir, a darlo por bueno sin la prueba del banco—, que es
exactamente lo que el runbook del money-path prohibe. Un SLO no debe premiar el atajo que el
procedimiento prohibe.

Por eso el ratio se mide sobre **ejecuciones resueltas** (`COMPLETED`, `COMPLETED_WITH_ERRORS`,
`FAILED`) y solo `FAILED` cuenta en contra. Las no terminales se vigilan por antiguedad, no por
ratio.

### Vigilancia del camino del dinero (no es un ratio)

Un pago pendiente de conciliar no es un fallo, pero **envejecer sin resolverse si lo es**. Se mide
la edad del mas antiguo, no el porcentaje:

| Senal | Umbral | Por que |
|---|---|---|
| Antiguedad de la ejecucion `NEEDS_RECONCILIATION` mas antigua | alerta > 24 h | Pasado ese punto deja de ser "en curso" y es trabajo del dinero olvidado. |
| Antiguedad del fragmento `UNCERTAIN` mas antiguo | alerta > 4 h | Tiene salida automatica via `MT101_STATUS`; si no sale, el resolver no esta corriendo. |
| Conflictos `pay_conflict` abiertos | alerta > 0 durante > 48 h | Requieren acknowledge maker-checker; ninguno se cierra solo. |

Ninguna de las tres es una serie instrumentada hoy: se consultan por la API (ver
`ops/runbooks/008-mensajeria-pagos-runbook.md`). Instrumentarlas es trabajo pendiente, y hasta
entonces la vigilancia es por consulta, no por dashboard.

### Las metricas que SI existen como serie

Ocho de trabajo asincrono (`AsyncTaskMetrics`) mas las del spool de auditoria. Cinco de ellas alertan
con **cualquier valor mayor que cero** —son evidencia perdida o trabajo del dinero muerto, no
tendencia—: `audit_spool_dead`, `audit_dead_letter_total`, `tasks_outbox_dead`, `tasks_inbox_dead`,
`tasks_inbox_poison`. El detalle esta en el runbook del money-path.

## Presupuesto de error
- El presupuesto de error mensual se consume con cada incidente.
- Al agotarse, se congelan cambios no criticos hasta recuperar el SLO.
- **El presupuesto no se consume por ejecuciones en `NEEDS_RECONCILIATION` ni `SUSPENDED`**, por la
  razon de arriba: si lo hiciera, agotarlo empujaria a cerrar conciliaciones sin prueba.
