# Implementación — health async EN VIVO del consumer (#4 opción a, SOLID)

Fecha: 2026-07-05
Alcance: implementa la **opción (a)** del [análisis de pendientes 3-4-5](2026-07-05-analisis-pendientes-3-4-5.md):
`GET /api/messaging/async-status` deja de reportar `READY` a **nivel-config**; ahora exige que el canal consumer
`tasks-in` esté **conectado EN VIVO**. Operabilidad; no money-path. Diseño SOLID.

## Problema (del análisis + doble-check)

`AsyncAvailabilityService` derivaba `READY` con 3 gates de config + `brokersRegistered`. El doble-check confirmó que
`READY` **puede mentir**: `consumerEnabled=true` no garantiza que el consumer esté consumiendo, y `brokersRegistered`
(= `!availableTypes().isEmpty()`) es **casi vacuo** (los 4 `MessageBrokerProvider` son `@ApplicationScoped`
incondicionales → siempre presentes, sin importar conectividad).

## Cambios (SOLID)

- **`ConsumerChannelHealth`** (NUEVO, interfaz): abstracción de "¿el canal consumer X está listo EN VIVO?". **DIP**:
  `AsyncAvailabilityService` depende de esta interfaz, no de SmallRye → testeable con un fake sin levantar el broker.
- **`SmallRyeConsumerChannelHealth`** (NUEVO, `@ApplicationScoped`): impl productiva. Inyecta
  `Instance<HealthCenter>` de smallrye-reactive-messaging y lee `getReadiness().getChannels()`, devolviendo el `isOk`
  del canal pedido. **SRP** (solo traduce readiness→boolean). **Falla CERRADA**: si el componente no está, el canal no
  aparece, o la lectura lanza → `false` (coherente con "tratar != READY como no operativo").
  - **Corrección del doble-check (crítica)**: la primera versión inyectaba `Instance<HealthReporter>` (la **interfaz**),
    que **NO está registrada como bean** en Quarkus → el `Instance` quedaba *unsatisfied* → `ready()` devolvía **siempre
    false** → `READY` **inalcanzable**. El bean correcto es el concreto `HealthCenter` (`@ApplicationScoped`), que
    computa el mismo readiness de `/q/health/ready`. Lo atrapó el E2E Kafka (ver Pruebas).
- **`AsyncAvailabilityService`**:
  - Inyecta `ConsumerChannelHealth`; constante `TASKS_IN_CHANNEL = "tasks-in"`.
  - `availability()` computa `consumerLive = consumerEnabled && channelHealth.ready("tasks-in")` (solo se sondea si el
    consumer está habilitado: si no, no hay canal que sondear).
  - `derive(execution, dispatch, consumer, consumerLive, brokersRegistered)` — **función pura** extendida: `READY`
    exige además `consumerLive`. `OCP`: añadir un gate = un parámetro más; la derivación sigue pura.
  - El record `AsyncAvailability` gana `consumerLive` (backward-compatible: conserva los campos previos).
- **Frontend** (`messaging-transports.service.ts`): el type `AsyncStatus` se actualiza para **reflejar el response
  real** (añade `state`, `dispatchEnabled`, `consumerEnabled`, `consumerLive`, `brokersRegistered` como opcionales). Sin
  cambio de lógica de UI.

### Alcance honesto / lo diferido
- **La liveness del lado PUBLISHER/relay NO se cubre**: el despacho usa `MessageBrokerProvider.publisher()` (SPI), **no**
  un canal reactive-messaging, así que su conexión no es observable por el `HealthReporter`. Cubrirla requiere extender
  el SPI con `MessageBrokerProvider.health()` (opción b, mayor) → **diferido**.
- **`brokersRegistered` sigue siendo nivel-config**: como los 4 providers son beans incondicionales, el registro no se
  puede des-vacuar; el fix real (liveness) se entrega para el **consumer** (`consumerLive`) y se difiere para el
  publisher (opción b). No se hizo un "tightening" cosmético del registro.
- **La UI aún no consume `state`**: hoy `AsyncStatus` solo se leía como `{executionEnabled}`; el estado compuesto
  (incl. `consumerLive`) se computa en backend pero **surfacearlo en la UI es una mejora frontend pendiente**.

## Pruebas (evidenciadas)

- **`AsyncAvailabilityServiceTest`** (6, +2): la derivación pura con el nuevo gate — DEGRADED cuando el consumer está
  habilitado pero **NO vivo** (el caso que antes mentía READY); READY solo con todos los gates + broker + `consumerLive`;
  `availability()` marca `consumerLive=false` cuando la readiness del canal está caída; y **no sondea** el canal cuando
  el consumer está deshabilitado. El health entra por el fake de `ConsumerChannelHealth` (sin CDI/broker).
- **`MessagingTransportsResourceTest`** (2): el endpoint sigue delegando el estado compuesto (con el fake de health).
- **E2E CDI real** `AsyncTaskExecutionE2EIT` (3): **bootea el app completo** → valida que `SmallRyeConsumerChannelHealth`
  y `AsyncAvailabilityService(ConsumerChannelHealth)` **CDI-wirean** sin `UnsatisfiedResolutionException`, y ejercita el
  path async real.
- **E2E Kafka real `AsyncTaskKafkaConsumerE2EIT`** (con `tasks-in.enabled=true` + Kafka Testcontainers): tras consumir
  un mensaje real (proceso COMPLETED → consumer indudablemente conectado), asevera **`consumerLive=true`**. Este test
  **atrapó el bug del bean** (con `HealthReporter` daba `consumerLive=false` permanente → `assertTrue` fallaba); con
  `HealthCenter` pasa. Es la prueba de que `READY` es alcanzable con el consumer vivo y el nombre de canal `tasks-in`
  coincide en el readiness.
- **Total backend: 8 unit + E2E (async + Kafka) verdes** (BUILD SUCCESS). **Frontend**: `nx build web` OK.

## Validación en runtime (app arrancada, localhost:8080)

Con la app dev arriba (`/q/health/ready` → 200 tras ~55 s, sin `UnsatisfiedResolution`), el **HealthReporter real** que
mi bean lee reporta:

```json
"SmallRye Reactive Messaging - readiness check": { "status": "UP", "data": { "audit-out": "[OK]" } }
```

El canal `audit-out` (habilitado) aparece OK y `tasks-in` no aparece (deshabilitado por defecto) → `consumerLive=false`.
`GET /api/messaging/async-status` sin token → **401** (endpoint protegido, wired); la página de login → **200**.

> **Nota honesta (corregida por el doble-check):** con el bean **inicial** (`HealthReporter`, sin bean → unsatisfied),
> este `consumerLive=false` era un **falso positivo** — daba false por unsatisfied, no por detectar el canal caído. El
> E2E Kafka (consumer ENCENDIDO) reveló que `consumerLive` seguía false → feature rota. Corregido a `HealthCenter`, el
> E2E confirma `consumerLive=true` con el consumer vivo. La lección: validar el estado **positivo** (consumer arriba →
> live), no solo el negativo, porque fail-closed enmascara un bean mal inyectado.

## Conclusión

`READY` deja de mentir para el consumer: exige el canal `tasks-in` **conectado en vivo** (readiness real de SmallRye),
no solo habilitado por config. Diseño SOLID (abstracción `ConsumerChannelHealth` por DIP; impl SRP que falla cerrada;
derivación pura extendida por OCP). La liveness del publisher (SPI) y el consumo de `state` en la UI quedan como mejoras
**explícitamente diferidas**.
