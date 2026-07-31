# Runbook — money-path MT101 (spec 008)

Operacion del camino del dinero: que hacer cuando un pago no termina en un estado limpio.

> **Regla que gobierna todo este documento: un pago que pudo haber salido NUNCA se reenvia a ciegas.**
> Si no se puede DEMOSTRAR que el banco no recibio nada, la salida es conciliar, no reintentar. Un
> duplicado en el camino del dinero cuesta mas que un pago pendiente.

## Los tres estados que no son "fallido"

Una ejecucion `FAILED` es facil: se ve, se diagnostica, se reintenta. El problema son los estados **no
terminales** que no aparecen como fallo y que bloquean el cierre. Los tres tienen procedimientos
distintos y **no son intercambiables**.

### 1. `NEEDS_RECONCILIATION` (estado de la ejecucion)

**Que significa.** La ejecucion termino con al menos un fragmento en estado no resuelto. No es un
error: es la salvaguarda funcionando. Aparece tipicamente tras reiniciar nodos con trabajo en vuelo, o
cuando el PAY dejo algo incierto.

**Que NO hacer.** Relanzar el proceso. Volveria a construir y a pagar lo que quiza ya salio.

**Como se cierra.** Resolviendo primero los fragmentos no terminales (ver los dos puntos siguientes) y
despues cerrando la ejecucion. El cierre lo gobierna `Mt101ReconciliationCloseService`, que **se niega
a cerrar** mientras quede un fragmento no terminal: si el cierre falla, no insistas — quedan
fragmentos por resolver.

**Como encontrarlas.** Hoy **no son filtrables desde la consola** (limitacion conocida). Por base:

```sql
select id, process_definition_id, started_at
  from process_execution
 where status in ('NEEDS_RECONCILIATION', 'SUSPENDED')
 order by started_at desc;
```

### 2. `UNCERTAIN` (estado del fragmento)

**Que significa.** Se intento despachar y **no se pudo demostrar que el banco no lo recibio**: una
respuesta 2xx sin prueba de aceptacion legible, un fallo de red despues del envio, un timeout.

**Que NO hacer.** Reenviar. Es el escenario clasico de doble pago.

**Como se resuelve.** Consultando al banco, nunca reenviando: la tarea `MT101_STATUS` con
`resolveNormalPay`, o `Mt101PayUncertainResolutionService` desde el endpoint del operador. El resolver
pregunta por la referencia y transiciona a `SENT` o `REJECTED` segun lo que el banco conteste.

> **Ojo con lo que esto implica.** El cierre automatico de un `UNCERTAIN` correlaciona **solo por la
> referencia `:20:`** — `mt101_build_fragment` no persiste la referencia del gateway ni la clave de
> idempotencia. Si sospechas que bajo esa referencia hay otro payload (por ejemplo, el destino remoto
> ya estaba ocupado), **no dejes que el resolver automatico lo cierre**: el banco acusaria el mensaje
> equivocado. Marca el conflicto primero.

**Sin una tarea `MT101_STATUS` en la definicion del proceso, un `UNCERTAIN` no tiene salida
automatica.** Esa es la razon de existir de `mt101.pay.require-normal-pay-resolver`.

### 3. `pay_conflict` (bandera sobre el fragmento)

**Que significa.** Hay una **contradiccion terminal** que el sistema se niega a resolver solo. Los dos
casos que la producen:

- El worker resolvio `SENT` y despues el banco dijo `REJECTED` sobre esa referencia.
- Se iba a despachar y el destino remoto ya contenia **un payload que no es el nuestro**.

**Que NO hacer.** Sobrescribir el estado "para que quede limpio". La bandera es superpuesta: el estado
real se conserva a proposito.

**Como se cierra.** Por la consola de conflictos, con acknowledge gobernado (ver el flujo maker-checker
mas abajo). Un fragmento con `pay_conflict` queda **excluido del auto-cierre**, que es justo lo que se
busca: nadie lo resuelve por ti.

## Las consolas

> El frontend usa **hash routing** (`withHashLocation()`), asi que la URL completa lleva `#/`:
> por ejemplo `https://<host>/appih/#/swift-mt101/pay-conflicts`. Sin el `#`, el servidor no resuelve.

| Ruta | Para que |
|---|---|
| `/swift-mt101/pay-conflicts` | Inbox transversal de conflictos de pago. **El primero que hay que mirar.** |
| `/swift-mt101/pay-dispatch` | Estado del despacho por fragmento. |
| `/swift-mt101/quarantine` | Filas que no pasaron validacion, con correccion individual y masiva. |
| `/swift-mt101/fragments` | Consulta y lineage por fragmento. |
| `/audit/spool` | Cola de auditoria: pendientes, enviados y **dead letters**. |
| `/executions/async-dlq` | Trabajo asincrono muerto (outbox/inbox). |

## Endpoints de remediacion (L2)

Usar solo con diagnostico hecho. Ninguno reenvia un pago.

| Endpoint | Efecto |
|---|---|
| `POST /api/query/tasks-dlq/outbox/redrive` | Reencola trabajo del outbox que murio. |
| `POST /api/query/tasks-dlq/suspensions/{exec}/{task}/requeue` | Reencola una tarea suspendida concreta. |
| `POST /api/query/audit-spool/{id}/retry` | Reintenta el envio de una trama de auditoria. |
| `POST /api/query/mt101-pay-dispatch-intents/reconcile` | Alinea el ledger de intencion con el terminal real del archivo. **Solo copia** un terminal ya conocido; nunca inventa uno. |
| `POST /api/query/mt101-fragments/reprocess/...` | Reproceso acotado por estado, filas origen o reapertura de rechazados. |
| `POST /api/query/mt101-quarantine/process-executions/close-reconciled` | Cierra una ejecucion cuyos fragmentos ya estan todos resueltos. Exige `connectionRef`, `processExecutionId` y `reason`; sin `reason` responde 400. |

## Flujo maker-checker del acknowledge

Activo cuando `mt101.pay.conflict.acknowledge.maker-checker.enabled=true` (el valor deseado en
produccion). Con `false`, el acknowledge es de un solo actor.

1. **Maker** (rol `pay-conflict-maker`) solicita el acknowledge con su motivo y ticket. El conflicto
   pasa a `PENDING`: sigue abierto, pero ya tiene una solicitud asociada.
2. **Checker** (rol `pay-conflict-checker`) la aprueba. El backend **rechaza que el checker sea el
   mismo actor que el maker**: no es una convencion, es una validacion.
3. Si el maker vuelve a solicitar sobre un conflicto que ya tenia una solicitud `PENDING`, la anterior
   queda **`PAY_CONFLICT_ACK_SUPERSEDED`**: no se borra, se marca como reemplazada. El historial es
   append-only.

**Si el checker no esta disponible:** el conflicto se queda `PENDING`. No hay bypass, y no debe
haberlo: es segregacion de funciones sobre el dinero. La via correcta es tener mas de un checker
designado, no desactivar el control.

## Los seis interruptores bancarios

En `ops/fase-7-deploy/dist/config/application-prod.properties`. Moverlos cambia el comportamiento del
camino del dinero.

| Propiedad | Prod | Que pasa si se mueve |
|---|---|---|
| `mt101.pay.conflict.acknowledge.maker-checker.enabled` | `true` | A `false`, un solo actor cierra conflictos: se pierde la segregacion de funciones. |
| `mt101.pay.direct-list.enabled` | `false` | A `true` se habilita el camino de lista en memoria, sin `build_fragment` y por tanto **sin lineage ni conciliacion completa**. |
| `mt101.pay.route-sink.strict` | `true` | A `false` se admiten credenciales SFTP inline en la definicion del proceso, en vez de exigir `sinkRef`. |
| `mt101.pay.require-normal-pay-resolver` | `false` | A `true` se exige que el proceso lleve la tarea de conciliacion inline. Encenderlo evita `UNCERTAIN` sin salida. |
| `mt101.pay.require-gateway-proof` | `false` | A `true`, un `MT101_PAY` REST que no declare como se prueba la aceptacion **falla antes de enviar**. Migrar las definiciones ANTES de encenderlo. |
| `mt101.build.insert-batch-max-bytes` | `200000` | Subirlo puede provocar un deadlock del driver al persistir fragmentos grandes. No tocar sin medir. |

## Alertas: las nueve metricas que existen de verdad

Expuestas en `/q/metrics`. **Cualquier valor mayor que cero en las cinco de abajo es evidencia perdida
o trabajo del dinero muerto**, no una metrica de tendencia:

| Metrica | Umbral | Que significa |
|---|---|---|
| `audit_spool_dead` | **> 0** | Tramas de auditoria que no se pudieron entregar. Evidencia perdida. |
| `audit_dead_letter_total` | **> 0** | Idem, acumulado. |
| `tasks_outbox_dead` | **> 0** | Trabajo asincrono muerto en la salida. |
| `tasks_inbox_dead` | **> 0** | Idem en la entrada. |
| `tasks_inbox_poison` | **> 0** | Mensaje que envenena el consumidor: no se reintenta solo. |

De tendencia (no alertan por si solas): `audit_spool_pending`, `audit_spool_sent`,
`tasks_outbox_pending`, `tasks_outbox_sent`.

> Otras metricas citadas en la documentacion de fase 8 **no existen como serie instrumentada**: se
> obtienen consultando la API, no `/q/metrics`. Construir dashboards contra ellas da paneles vacios.

## Enlaces

- Guardia y escalamiento: `ops/fase-8-operacion/oncall.md`
- Objetivos de servicio: `ops/fase-8-operacion/slo.md`
- Resto de runbooks, incluido el del backbone asincrono: `ops/runbooks/`
- Rollback (**leer antes de revertir una release que toque esquema o pagos**):
  `ops/fase-7-deploy/rollback.md`
