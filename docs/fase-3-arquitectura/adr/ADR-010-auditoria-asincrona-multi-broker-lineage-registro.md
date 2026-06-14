# ADR-010 Auditoria asincrona multi-broker y lineage por registro

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

## Estado

Propuesto.

## Contexto

La plataforma ya registra auditoria operacional por proceso/tarea y la vertical
de pagos agrega trazabilidad SWIFT/MT101. Para operar archivos masivos
(`csv`, `txt`, `xls`, `xlsx`, XML/JSON y SWIFT MT/FIN) se requiere visibilidad
E2E por registro, no solo por archivo o ejecucion.

Tambien se requiere desacoplar la escritura de auditoria del hot-path del motor:
un proceso de pagos no debe escribir directamente `audit_event` ni
`audit_record_event`. La auditoria debe viajar por un backbone asincrono y ser
persistida por un componente consumidor independiente.

## Decision

La auditoria se modela como un contrato de eventos compartido (`AuditEnvelope`)
publicado por `platform-app` y consumido por `audit-consumer`.

- `platform-app` es productor. Orquesta procesos y tareas, emite eventos a un
  puerto de mensajeria y no escribe el read-model final de auditoria.
- `audit-consumer` es un deployable Quarkus independiente. Consume el broker,
  normaliza eventos y persiste:
  - `PROCESS` en `audit_event`.
  - `RECORD` en `audit_record_event` o store frio columnar.
  - poison messages en `audit_dead_letter_event`.
- Kafka es el backbone default en Docker/local.
- JMS/Artemis, RabbitMQ y Redis Streams son conectores enchufables por SPI.
- No hay fallback silencioso: si el relay esta habilitado, el broker configurado
  debe existir. En runtime real no se degrada a DB directa ni in-memory.

## Identidad de trazabilidad

Cada evento de registro debe transportar, cuando aplique:

- `traceId`: correlacion de ejecucion (`exec-<processExecutionId>`).
- `recordId`: identidad estable del registro o mensaje.
- archivo/fila: `sourceFileName`, `sourceFileHash`, `recordNumber`.
- negocio seguro: `businessKeyHash` para DNI/cuenta u otros datos sensibles.
- pago/SWIFT: `standard`, `messageType`, `paymentReference` (`:20:`),
  `transactionReference` (`:21:`), `uetr`, `archiveId`, `gatewayReference`.

Los datos sensibles no se deben poner en claro salvo que el perfil de auditoria
lo autorice; por defecto se usan hashes o referencias operativas.

## Ubicacion de componentes

```text
frontend Angular
    |
    v
platform-app (API de consulta + motor + productores)
    |
    v
Broker SPI: Kafka / JMS / RabbitMQ / Redis
    |
    v
audit-consumer (Quarkus independiente)
    |
    +--> audit_event
    +--> audit_record_event / ClickHouse
    +--> audit_dead_letter_event
```

El frontend nunca se conecta directo al broker; consulta read-models via
`platform-app`.

## Consecuencias

### Positivas

- Escala independiente del consumer de auditoria.
- Se mantiene DIP/OCP: agregar un broker no cambia los productores ni el handler
  de persistencia.
- La UI puede buscar por claves reales de operacion bancaria sin parsear JSON.
- La entrega del broker se trata como at-least-once con idempotencia por
  `eventId`.

### Costos

- Se agregan columnas e indices al store de auditoria por registro.
- El consumer necesita configuracion explicita cuando se cambia de Kafka a otro
  broker.
- Para volumen muy alto, ClickHouse u otro store columnar pasa a ser recomendado.

### Riesgos

- Emitir un evento por registro por etapa multiplica volumen. La mitigacion es
  batch, compresion, indices por clave operacional y store frio columnar.
- El orden exacto E2E es por `traceId`/particion y timestamp; no se promete
  exactly-once global, sino at-least-once + idempotencia.

## Alternativas consideradas

1. Mantener escritura sincronica en `audit_event`. Rechazada: acopla auditoria al
   hot-path y no escala a millones de registros.
2. Dejar solo Kafka sin SPI. Rechazada: el requerimiento exige enchufar distintos
   MQ por ambiente/cliente.
3. Guardar todo en `payload_json`. Rechazada: la UI y soporte operativo necesitan
   filtros indexados por archivo, fila, `:20:`, `:21:`, UETR y gateway.

## Referencias

- [ADR-004 Motor de tareas con inputs y outputs tipados](ADR-004-motor-input-output-tareas.md)
- [ADR-009 Vertical de mensajeria de pagos](ADR-009-vertical-mensajeria-pagos.md)
- [spec 004 observabilidad y auditoria](../../../specs/004-observabilidad-y-auditoria/spec-tecnica.md)
- [spec 008 mensajeria de pagos](../../../specs/008-mensajeria-pagos/spec-tecnica.md)
