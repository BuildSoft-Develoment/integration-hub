# Análisis — P5/P6: no persistir secretos resueltos en el offload async (y plugins remotos)

Fecha: 2026-07-06
Tipo: **análisis** (validación contra código real; sin implementar). Segundo pendiente del
[análisis de homologación mejorado](2026-07-06-analisis-revision-homologacion-v56-mejorado.md), tras P2. Fuera del
money-path del PAY correctivo (ya blindado a nivel ledger).

> **NOTA (doble-check, ver sección final):** el mecanismo descrito abajo es real, pero **la fuga NO es activa hoy** — el
> único task offloadable (MT101_STATUS) usa `connectionRef`, no `${secret}` en su config, y los secretos se resuelven en el
> consumer vía la conexión. P5 queda como **guardrail (defense-in-depth)**, no como fuga activa. Severidad corregida 🔴→🔵.

## Problema (mecanismo, confirmado en código)

El offload async serializa la **configuración ya resuelta** (con `${secret:...}` expandidos si los hubiera) al envelope. La resolución
ocurre en el dispatch y el envelope viaja por `task_dispatch_outbox` → Kafka → `task_inbox`; un secreto (creds REST/SFTP,
token de banco) puede quedar en la BD, el broker, logs de error y la DLQ. Afecta a **MT101_STATUS** (`AsyncOffloadSupport.SUPPORTED`)
y a cualquier task offloadable.

### Flujo verificado
- **Origen**: `ProcessTaskRuntimeService` línea 71 → `configuration = fileReadRuntimeSupport.configuration(taskPlan.configurationJson())`
  = `JsonConfigurationMapper.toMap(...)` = **RESUELVE** los `${secret:...}` (vía `SecretResolver`).
- Ese `configuration` resuelto alimenta las **tres** rutas de offload:
  - **per-task**: `AsyncTaskDispatchService.dispatchAsync(..., configuration)` → `serialize(configuration)` en el envelope
    ([AsyncTaskDispatchService.java:93](platform-app/src/main/java/com/integrationhub/platform/service/execution/async/AsyncTaskDispatchService.java)).
  - **slices materializadas**: `ScatterDispatch.materialized(..., configuration, slices, ...)` → cada `AsyncSliceWorkItem`
    lleva la config ([ProcessTaskRuntimeService.java:128](platform-app/src/main/java/com/integrationhub/platform/service/execution/ProcessTaskRuntimeService.java)).
  - **page-chain (table-streaming)**: la config viaja en cada `AsyncPageWorkItem` (línea 106).
- **Consumer**: `AsyncTaskConsumer` **NO resuelve nada** — ejecuta el provider con la config tal cual del envelope
  (`provider.execute(context, decodeConfiguration(envelope.payload()))`,
  [línea 172](platform-app/src/main/java/com/integrationhub/platform/service/execution/async/AsyncTaskConsumer.java);
  slices `executeRecords(..., item.configuration(), ...)` línea 238; pages línea 297). Su javadoc lo documenta: *"payload
  es el JSON de la configuration RESUELTA"*. → el diseño hoy **transporta secretos resueltos** a propósito.
- **DLQ**: `AsyncTaskDlqService` línea 132 usa `configurationMapper.toMap(...)` (resuelve) para re-despachar → misma fuga.
- **Ya existe la pieza para el fix**: `JsonConfigurationMapper` tiene `toMapUnresolved(json)` (deja los `${secret:...}`
  intactos, v27 P0.2) y `resolveSecretsIn(Map)` (re-resuelve un mapa ya parseado). El **PAY correctivo ya** reclama antes
  de re-resolver (v38). La ruta de offload async genérica es la que no lo aplica.

## Solución propuesta (SOLID, sin fallback)

**El envelope async persiste solo REFERENCIAS; el consumer resuelve localmente tras ganar el claim.** El consumer corre
**in-process** (`AsyncTaskBrokerConsumer` `@Incoming("tasks-in")` en platform-app), así que tiene el mismo `SecretResolver`
/Vault — resolver ahí es viable y **preserva el comportamiento** (misma resolución, más tarde y sin persistir).

1. **Dispatch (ProcessTaskRuntimeService)**: computar `unresolvedConfiguration = jsonConfigurationMapper.toMapUnresolved(
   taskPlan.configurationJson())` y usar **ese** (refs intactas) en lo que entra a un envelope/work-item async
   (`dispatchAsync`, `ScatterDispatch.materialized`, page-chain). El path **síncrono** sigue usando la config resuelta.
   Los campos no-secretos (`continueOnFailure`, `batchSize`, `targetTable`, input) son idénticos resueltos o no.
2. **Consumer (AsyncTaskConsumer)**: inyectar `JsonConfigurationMapper`; llamar `resolveSecretsIn(configuration)` **justo
   antes** de `provider.execute` (per-task) y `resolveSecretsIn(item.configuration())` antes de `executeRecords` (slice y
   page). La resolución ocurre **después** del claim, en memoria, nunca persistida.
3. **DLQ (AsyncTaskDlqService)**: usar `toMapUnresolved(...)` para el envelope de re-despacho (el consumer resolverá).

## P6 — plugins remotos (parcialmente hecho + política)

- **Source/reader remotos: YA mitigado.** Con el proyecto #3 (artefacto-por-referencia) reciben una **URL presignada
  efímera** (un objeto, un método, TTL corto), **no** secretos de Vault
  ([RemoteSourceProvider.java:66-71](platform-app/src/main/java/com/integrationhub/platform/provider/source/RemoteSourceProvider.java)).
- **Task remoto (`BrokerRemotePluginTransport`)**: `body.put("configuration", configuration)` (línea 122) serializa la
  config al envelope del broker. Como el plugin es **out-of-process**, no puede resolver `${secret:...}` contra el Vault de
  la plataforma → el enfoque de "solo refs" del P5 **no aplica igual** (el plugin necesitaría el valor). El control correcto
  es **política + mínimo privilegio**, no refs: (a) **no habilitar plugins remotos en MT101/PAYMENT/SWIFT/REGULATED**
  (guard por task-type), (b) minimización por capacidad. Es un trabajo **separable y menor** que P5; recomiendo el guard de
  task-type regulado como pieza concreta, aparte.

## Alcance / no-objetivos

- **P5 es el fix accionable de este incremento**: envelope con refs + resolución en el consumer. Cubre las 3 rutas async
  (per-task, slice, page) + DLQ.
- **P6** queda como: source/reader ya hecho (#3); task remoto = guard de política (separado).
- **No** cambia la semántica de resolución (mismos providers de secreto, mismo resultado) — solo **cuándo y dónde** se
  resuelve (consume-time, in-memory).

## Doble-check — verificación empírica (self-review) — CORRIGE la severidad

Reté la afirmación más fuerte ("el offload transporta secretos resueltos"). **La fuga NO es activa hoy**; era un supuesto
heredado del review sin verificar que los tasks offloadables realmente lleven secretos en su config.

- **Único task SUPPORTED = MT101_STATUS** (grep de `AsyncOffloadSupport.SUPPORTED` en `src/main` → solo él). Y su config
  usa **`connectionRef` (id, p.ej. "12")**, **no** `${secret:...}`
  ([Mt101StatusTaskProvider.java:63](platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101StatusTaskProvider.java)).
- **Los secretos NO viven en el `configuration_json` de las tasks**: viven en la config de **conexión** (resuelta por
  `ConnectionPoolManager.toMap(definition.configurationJson)` → password `${secret:...}`,
  [ConnectionPoolManager.java:76,83](platform-app/src/main/java/com/integrationhub/platform/service/connection/ConnectionPoolManager.java))
  y en las **dispatch specs de PAY** (ya ref-hasta-claim, v38). → el `connectionRef` viaja en el envelope como **id**, y las
  creds se resuelven **en el consumer**, al ejecutar, leyendo del connection-store — **nunca en el envelope**.
- **Otras superficies limpias**: el `payload` de auditoría del `TASK_SUSPENDED` es `Map.of(taskType, resumeToken,
  suspendedState)` — **no** incluye la config; `suspendedState` es el estado del provider; `continuation` son
  taskOutputs/executionVariables. Ninguno persiste la config resuelta. → el **envelope es la única superficie** posible.

### Severidad corregida: 🔴 → 🔵/🟠 (defense-in-depth, no fuga activa)

Hoy **ningún task offloadable en prod pone `${secret:...}` en su config** (MT101_STATUS usa connectionRef; los demás
providers con secretos son **UNSUPPORTED**). → el envelope async **no contiene** un secreto resuelto hoy. El invariante
"el outbox nunca lleva un secreto resuelto" se cumple **por accidente** (porque los offloadables usan connectionRef), no
**por construcción**.

**Valor del fix (se mantiene, como guardrail):** hacer que el invariante se cumpla **por construcción** —el envelope
SIEMPRE lleva refs, el consumer resuelve— **antes** de habilitar más tasks SUPPORTED. Si mañana un task con `${secret:...}`
en su config se marca SUPPORTED, hoy filtraría; con el fix, no. Es hardening barato y correcto, **no** un P0 de seguridad
activo como lo pintaba el review.

**Recomendación:** **degradar la prioridad** de P5 (de "🔴 hacer segundo" a "🔵 guardrail, hacer cuando se vaya a ampliar
el conjunto SUPPORTED"). El fix sigue siendo el mismo (envelope refs + resolución en consumer + DLQ `toMapUnresolved`), pero
**no es urgente**. Reordena el backlog: el siguiente P0/P1 real pasa a ser **P3** (PAY real solo desde fuente persistida) o
**P9** (backend fail-closed si async no READY), ambos con impacto tangible, por encima de este guardrail.

### Pendiente si se implementa (test empírico)
Añadir un task de prueba SUPPORTED con `${secret:...}` en su config y aseverar: (a) hoy el outbox contiene el **valor
resuelto** (reproduce la fuga latente), (b) con el fix el outbox contiene la **referencia** y el provider en el consumer
recibe el **valor**. Es la única forma de ejercer el guardrail (ningún task real lo dispara).
