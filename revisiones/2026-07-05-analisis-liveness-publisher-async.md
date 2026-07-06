# Análisis — liveness del publisher/relay async (#4 opción b)

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar).
Naturaleza: operabilidad; **no** money-path. Completa el lado **publisher** del health async que #4a (consumer) y el
consumo de `state` en la UI dejaron pendiente.

## Corrección del framing (verificado en código)

El doble-check de #4 asumió que la liveness del publisher requería **extender el SPI en los 4 brokers**. El código lo
refina:

- **KAFKA** (broker configurado por defecto: `audit.broker.type=KAFKA`, `TaskDispatchPlanner.DEFAULT_TRANSPORT=KAFKA`)
  **NO usa un cliente crudo**: publica vía `@Channel("audit-out") MutinyEmitter` de smallrye-reactive-messaging
  (`KafkaMessageBrokerProvider`). El relay de tasks pasa por ese mismo publisher
  (`TaskDispatchPublisher → broker.publisher().publish(...)`). → su readiness **YA es observable** por el mismo
  `HealthCenter` de #4a: en el diagnóstico de #4a el canal aparecía como `audit-out=[OK]`. **Sin tocar el SPI.**
- **JMS / RabbitMQ / Redis** SÍ usan **clientes crudos** con conexión lazy (Artemis `Connection`, RabbitMQ `Connection`,
  Jedis `JedisPool`) → **no** son canales de reactive-messaging → su liveness **no** está en `HealthCenter`; para
  sondearlos habría que extender el SPI (`MessageBrokerProvider.health()`).

**Conclusión del framing**: para el broker real (Kafka) es la técnica de #4a (readiness de canal); la extensión del SPI
solo hace falta para los brokers no-default.

## Valor marginal (honesto)

#4a ya hace `READY` exigir que el canal **consumer** `tasks-in` (Kafka) esté conectado. Como `tasks-in` (consumer) y
`audit-out` (producer) son **ambos canales Kafka**, si el broker Kafka cae, `tasks-in` deja de estar ready →
`consumerLive=false` → DEGRADED. Es decir, **#4a ya detecta el caso dominante (Kafka caído)**.

Lo que añade la liveness del publisher (`audit-out`):
- Distingue "relay habilitado pero **producer** desconectado" de "relay habilitado y producer conectado" — un fallo
  específico del lado productor que `consumerLive` no cubre si el consumer está sano/deshabilitado.
- Cubre el caso `consumer deshabilitado` (donde no hay señal de consumer) pero se quiere saber si el producer está vivo.

→ **Valor marginal MODESTO**: el modo de fallo dominante (broker caído) ya lo capta #4a.

## Diseño (opciones)

### (b1) Bounded — readiness del canal `audit-out` (reusa #4a)
Añadir `dispatchLive = channelHealth.ready("audit-out")` y exigirlo en `READY` (junto a los gates + `consumerLive`).
Reusa `ConsumerChannelHealth`/`HealthCenter` de #4a (renombrando la abstracción a algo neutro tipo `ChannelHealth`).
Cero cambios de SPI.
- **Limitación honesta**: `"audit-out"` es el canal Kafka; hardcodearlo acopla el estado async al broker Kafka (válido
  para el despliegue configurado con Kafka, que es el caso real). Para un broker no-Kafka configurado no habría canal →
  caería en (b2). Además `audit-out` es un nombre del dominio de auditoría reusado para dispatch (smell menor, refleja
  que comparten el producer Kafka).

### (b2) Completa — `MessageBrokerProvider.health()` en el SPI (diferida)
Extender el SPI con una sonda de liveness que cada impl implementa: Kafka (readiness del canal o metadata del cluster),
JMS (`Connection` válida), RabbitMQ (`connection.isOpen()`), Redis (`PING`). `AsyncAvailabilityService` consultaría la
salud del broker **del tipo configurado**. Es el diseño idiomático y cubre cualquier broker, pero toca 4 providers +
define semántica de sonda por tecnología → **mayor**; solo aporta si se usan brokers no-Kafka en producción.

## Validación / pruebas (plan, si se procede con b1)
- Unit de `derive(...)` extendido con `dispatchLive` (DEGRADED si producer no vivo).
- E2E Kafka real (como #4a `AsyncTaskKafkaConsumerE2EIT`): con el producer conectado, `audit-out` ready → el nuevo
  `dispatchLive=true`. (El E2E ya arranca Kafka real; costo marginal bajo.)
- El test de contrato REST del enum ya existe (ciclo anterior).

## Veredicto

**Bounded para Kafka (b1), reusando #4a; SIN el refactor de SPI que el framing previo suponía.** Pero el **valor marginal
es modesto**: #4a ya detecta el modo de fallo dominante (broker Kafka caído, vía `tasks-in`). La liveness del producer
solo añade el matiz "producer-específico / consumer deshabilitado".

Recomendación: **es defendible diferir #4-b** — el health async ya es sustancialmente honesto con #4a + la UI. Si se
quiere cerrarlo del todo con bajo costo, **(b1)** es la vía (readiness de `audit-out`, reusa la infra), asumiendo el
acoplamiento a Kafka y el valor modesto. **(b2)** (SPI para brokers crudos) queda para cuando haya un broker no-Kafka en
producción. No es money-path ni correctitud.
