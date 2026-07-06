# Análisis — pendientes #3 (streaming remoto), #4 (health async en vivo), #5 (unificar disparo de ejecución)

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar).
Nota transversal: **ninguno es money-path** (cerrado en v50/v55). Son madurez de plataforma / operabilidad / deuda de
diseño.

---

## #3 — Streaming real de readers/sources remotos

### Estado real (verificado en código)
- **Protocolo unary sin campo binario**: `remote_plugin.proto` → `rpc Execute (GrpcRemoteTaskRequest) returns
  (GrpcRemoteTaskResult)`. El request **no tiene campo de bytes**; el archivo viaja como Base64 **embebido dentro de
  `configuration_json`** (string JSON). La respuesta lleva el archivo dentro de `outputs_json`.
- **`RemoteReaderProvider` materializa TODO dos veces**:
  1. Entrada: `bytes(payload)=stream.readAllBytes()` → archivo completo a memoria → Base64 → request.
  2. Salida: `readInBatches` toma `result.outputs().get("records")` — **la lista COMPLETA de records** — y luego la
     **rebana en memoria** (`records.subList(...)`). El "batching" es **cosmético**: no hay paginación real; la
     plataforma tiene O(respuesta completa) en memoria.
- **Guard v58 ya presente**: pre-chequea el tamaño Base64 estimado (`len*4/3`) contra `maxContentBytes` (default ~4 MB,
  configurable) y rechaza con mensaje **accionable** antes de invocar. Solo capa la **entrada** del reader; la salida
  (source) la capa implícitamente el `maxInboundMessageSize` gRPC de la plataforma (~16 MB).
- **Seguridad**: los plugins remotos **no** deben usarse en flujos financieros ni recibir secretos; los flujos
  SWIFT/PAY masivos usan readers **locales**. → **fuera del money-path**.

### Diseño (rediseño del contrato de datos remoto — grande)
1. **gRPC streaming RPC** (client-streaming para empujar chunks del reader; server-streaming para el source; o bidi):
   proto + regenerar stubs + transporte con streaming + providers que consuman/produzcan por chunks + **SDK del
   plugin**. El `BrokerRemotePluginTransport` (Kafka/JMS) **no tiene semántica de streaming** → quedaría solo-gRPC o
   requeriría su propio chunking.
2. **Artefacto por referencia (recomendado a futuro)**: la plataforma pasa una **URI** (MinIO/S3/SFTP + credencial
   efímera); el plugin hace stream desde/hacia ese store; el mensaje gRPC solo lleva la referencia. Desacopla datos de
   control. Requiere object store + contrato de referencia + retención/limpieza.
3. **Paginación/cursor + checkpoint** en el reader (como ya hace el reader local de alto volumen) — imprescindible en
   cualquiera de los dos, para acotar la memoria de la plataforma (hoy es O(respuesta)).

### Veredicto #3
Gap **REAL de escalabilidad, NO de correctitud** (el guard v58 impide el mal comportamiento silencioso; falla duro y
claro). Es un **proyecto** (protocolo + SDK + posible infra MinIO), **fuera del money-path**. **Recomiendo diferir**
salvo requisito concreto de plugins remotos a escala. Matiz nuevo del código: aunque se hiciera streaming en el
transporte, habría que rehacer también la **acumulación de records** (hoy cosmética) — el rediseño es de punta a punta,
no solo del canal.

---

## #4 — Health async EN VIVO (que `READY` no mienta)

### Estado real (verificado en código)
- `AsyncAvailabilityService.derive(execution, dispatch, consumer, brokersRegistered)` es **nivel-config**:
  `READY` sii los 3 gates on + `brokersRegistered`.
- **`brokersRegistered` es casi vacuo**: = `!brokers.availableTypes().isEmpty()`, y `availableTypes()` lista los
  **beans registrados** del SPI. Hay **4 impls siempre presentes** como beans (`KafkaMessageBrokerProvider`,
  `JmsMessageBrokerProvider`, `RabbitMqMessageBrokerProvider`, `RedisMessageBrokerProvider`) → la lista **casi nunca**
  está vacía, **independientemente de si el broker está realmente arriba/conectado**. En la práctica DEGRADED solo se
  dispara por los flags de config, no por presencia real de broker. **`READY` puede mentir**: config on + broker caído.
- **El SPI no tiene liveness**: `MessageBrokerProvider` expone solo `type()` y `publisher()`. No hay `health()`/`ping()`.
- **Hay infra de health disponible**: `quarkus-smallrye-health` está en el pom; los conectores de
  smallrye-reactive-messaging contribuyen checks de **readiness** (canal conectado/consumiendo) a `/q/health/ready`. El
  consumer `@Incoming("tasks-in")` es un canal de reactive-messaging.

### Diseño (opciones)
- **(a) Tap a SmallRye messaging health (recomendado, más bounded)**: leer la readiness del **canal consumer**
  (`tasks-in`) que reactive-messaging ya publica, y reflejarla en `/api/messaging/async-status` → `READY` exigiría
  consumer **realmente conectado**, no solo `consumerEnabled=true`. Reutiliza infra existente; no reinventa probes.
- **(b) Extender el SPI con `health()` por broker**: cada impl (Kafka: metadata del cluster; JMS: conexión; etc.)
  implementa una sonda; `brokersRegistered` pasa a `brokerHealthy(type)`. Más completo (cubre el lado **publisher**),
  pero **invasivo** (4 impls) y añade latencia/complejidad a cada probe.
- **Corrección barata inmediata (sub-slice)**: `brokersRegistered` hoy es engañoso — como mínimo debería medir el
  broker **del tipo configurado para el relay**, no "hay algún bean". Es un ajuste acotado que reduce el falso READY
  aunque no llegue a liveness plena.

### Veredicto #4
Gap **REAL de operabilidad**: `READY` es nivel-config y `brokersRegistered` es casi vacuo (4 beans siempre presentes).
**Bounded si** se hace la opción (a) — reflejar la readiness del canal consumer que SmallRye ya expone. La liveness del
**publisher/relay** es más difícil (no hay conexión persistente por-tipo evidente) y encaja en la opción (b), mayor.
**Prioridad media**; recomiendo empezar por (a) + la corrección barata de `brokersRegistered`.

---

## #5 — Unificar el disparo de ejecución de proceso

### Estado real (verificado en código) — corrige mi conclusión previa
- **El backend YA está unificado**: existe **un** endpoint `POST /api/process-executions/{id}`
  (`ProcessExecutionResource`) con **body OPCIONAL** `ProcessExecutionRequest` (`request == null` → vars/files vacíos) y
  **una** respuesta `ProcessExecutionStartResponse` (`id, status, startedAt, finishedAt, sourceExecutionId,
  triggerSource, details`).
- **El frontend tiene TRES representaciones de esa única operación**:
  - `processes` `ProcessApiService.execute(id)` → post `{}`, respuesta tipada `ProcessExecutionStartResponse` (wide).
  - `executions` `ExecutionApiService.execute(id, request)` → post `request`, respuesta `ExecuteProcessResponse` =
    **`{ id }`** (subset del anterior).
  - `schedules` → post `{}` inline, respuesta `unknown`.
  - El **request type** está duplicado (`ExecuteProcessRequest` idéntico en dos sitios); el **response type** existe en
    dos formas (wide vs subset) del **mismo** payload backend.
- **Los DTOs de `execute` son solo primitivos** (`id, status, startedAt...` y `executionVariables/selectedFiles/
  sourceExecutionId`) → **no arrastran modelos de dominio de processes**. Esto **corrige** mi doble-check anterior: yo
  analicé mover *el servicio entero* (que sí arrastra `process.models`); pero **la operación `execute` + sus 2 DTOs son
  extraíbles a `core` limpiamente** (feature→core permitido).

### Diseño (bounded-medio, SOLID)
- **`ProcessExecutionApiService` en `core/services`**: `execute(id, request?: ExecuteProcessRequest):
  Observable<ProcessExecutionStartResponse>` — con `request` **opcional** modela fielmente el único endpoint (body
  opcional). Mover a `core` los 2 DTOs primitivos (`ExecuteProcessRequest`, `ProcessExecutionStartResponse`).
- **`processes`** y **`executions`**: sus `ProcessApiService.execute`/`ExecutionApiService.execute` **delegan** en el
  servicio de core (o se reemplaza el consumo directo). El subset `ExecuteProcessResponse={id}` se sustituye por el
  wide (superset seguro). **`schedules`** inyecta el servicio de core.
- **DIP**: el data-access compartido baja a `core`; las 3 features dependen de él, no entre sí. **DRY**: 1 endpoint, 1
  request type, 1 response type (hoy: 3 call-representations, 2 request defs, 2 response defs).

### Veredicto #5
**Coherente y más viable de lo que concluí antes**: como el backend es un solo endpoint con body opcional y los DTOs son
primitivos, la extracción a `core` es limpia (no como mover el servicio entero). Es **deuda de diseño**, no
correctitud; el guard de fronteras ya está limpio, así que **no es urgente**. **Prioridad baja-media** como
consolidación DRY/DIP. Efecto secundario valioso: deja un único punto para el contrato de "ejecutar proceso".

---

## Recomendación consolidada

| # | Naturaleza | Money-path | Esfuerzo | Recomendación |
|---|-----------|:---:|---|---|
| **#4** | Operabilidad (READY miente) | No | Medio (opción a) | **Hacer primero** el sub-slice: reflejar readiness del consumer + arreglar `brokersRegistered` casi-vacuo |
| **#5** | Deuda de diseño (DRY/DIP) | No | Medio | Consolidación bounded a `core` — viable y limpia; no urgente |
| **#3** | Escalabilidad plataforma | No (usa local) | Muy grande (proyecto) | **Diferir**; el guard v58 ya evita el mal comportamiento silencioso |

Sugiero, si se quiere avanzar valor real con bajo riesgo: **#4 opción (a) + corrección de `brokersRegistered`** (mejora
operabilidad tangible), luego **#5** (consolidación limpia). **#3** queda como proyecto agendable aparte.

---

## Doble-check — verificación contra código (self-review)

Reté cada afirmación contra el código. **#3 y #5 quedaron confirmados sin errores; #4 tenía dos errores factuales
míos** (la recomendación se sostiene, incluso más fuerte):

### Confirmados
- **#3 — contenido dentro de `configuration_json`**: `RemotePluginInvoker.invoke(..., Map<String,Object> configuration)`
  recibe el `request` map del reader (que incluye `contentBase64`); `GrpcRemotePluginTransport.request(...)` hace
  `.setConfigurationJson(json(configuration))`. No hay campo binario en el proto. **Confirmado.** Y `toTaskResult`
  parsea `outputs_json` → `records` (batching cosmético). **Confirmado.**
- **#4 — `brokersRegistered` casi vacuo**: los 4 providers (`Kafka/Jms/RabbitMq/Redis MessageBrokerProvider`) son
  `@ApplicationScoped` **incondicionales** (los `@ConfigProperty` son params del constructor con default, no gates de
  activación) → `availableTypes()` devuelve siempre los 4, sin importar conectividad. **Confirmado.**
- **#5 — un endpoint / DTOs primitivos**: `ProcessExecutionResource` = un `POST /{id}` con body opcional;
  `ProcessExecutionStartResponse` y `ExecuteProcessRequest` son primitivos; `ExecuteProcessResponse={id}` es subset.
  **Confirmado.**

### Errores corregidos en #4
1. **"El pom solo tiene el conector in-memory, no el de Kafka" → FALSO.** `platform-app/pom.xml:77` incluye
   `quarkus-messaging-kafka`; `application.properties:91` usa `mp.messaging.incoming.tasks-in.connector=smallrye-kafka`.
   → **el conector Kafka SÍ está presente**, así que la readiness del canal que SmallRye/Quarkus expone (vía
   `HealthReporter` / `/q/health/ready`) **está disponible in-process**. Esto **refuerza** la opción (a), no la debilita.
2. **"El consumer real vive en el deployable `audit-consumer` (otro proceso)" → MISREAD.** `audit-consumer` es el
   stream de **auditoría** (`audit-out`), un canal distinto. El consumer de tareas `@Incoming("tasks-in")`
   (`AsyncTaskBrokerConsumer`) corre **dentro de platform-app**. → la opción (a) es **in-process y viable**; se
   inyecta el `HealthReporter` de smallrye-reactive-messaging y se lee la readiness del canal `tasks-in`.

### Matiz preciso (para la implementación de #4)
- `tasks-in.enabled=false` por default: cuando está **deshabilitado**, SmallRye **no crea el canal** → no hay health de
  ese canal (y el estado ya sería DISABLED/DEGRADED por el gate `consumerEnabled`). La señal **en vivo** de la opción
  (a) aparece **solo cuando el consumer está habilitado** — lo cual es coherente: `READY` solo puede exigir "consumer
  realmente conectado" cuando el consumer está encendido.
- Mecanismo concreto: inyectar `io.smallrye.reactive.messaging.health.HealthReporter`, leer la readiness del canal
  `tasks-in`, y plegarla en el estado (`consumerEnabled && consumerLive`). El lado **publisher/relay** sigue sin
  liveness barata (encaja en la opción b, mayor).

**Neto del doble-check**: la priorización (#4 → #5 → #3) **no cambia**; #4 es incluso **más bounded** de lo que escribí
(conector presente + consumer in-process). Corregidos dos supuestos de infraestructura que había afirmado mal.
