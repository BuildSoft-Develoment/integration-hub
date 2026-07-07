# Análisis mejorado — revisión de homologación (contra código real v64)

Fecha: 2026-07-06
Tipo: **análisis** (validación contra código real; sin implementar). Revisa la revisión externa recibida y la corrige
punto por punto contra el código. Regla del usuario: **sin fallback/legacy**; **si ya está implementado, se valida**.
El esquema real va por **V64** (la revisión hablaba de "v56"), así que varios puntos ya fueron resueltos después.

## Tabla ejecutiva (veredicto por punto)

| # | Afirmación de la revisión | Realidad verificada en código | Veredicto |
|---|---|---|---|
| **P1** | Resultado terminal tardío de PAY sobrescribe una resolución (SENT vs REJECTED). "El P0 más importante que queda" | **YA IMPLEMENTADO** (v33/v34/v35) | ✅ **HECHO — la revisión está desactualizada** |
| **P2** | El token del proceso no es fencing token completo; transiciones no lo validan | **CONFIRMADO**: transiciones sin guard de token/owner/RUNNING | 🔴 **ABIERTO — es el P0 real** |
| **P3** | PAY directo por lista en memoria no es durable | **CONFIRMADO**: `Mt101MessageInputResolver` acepta lista o fragmentSetId; la lista no deja ledger UNCERTAIN | 🟠 **ABIERTO (válido)** |
| **P4** | Async at-least-once; inbox deduplica tras ejecutar; MT101_PAY UNSUPPORTED | **PAY=UNSUPPORTED confirmado** (default). Pre-claim antes del provider: mejora válida | 🟠 **PARCIAL (PAY protegido)** |
| **P5** | Secretos resueltos se serializan a outbox/Kafka/inbox; MT101_STATUS SUPPORTED | **CONFIRMADO** en la ruta de offload async genérica | 🔴 **ABIERTO (válido)** |
| **P6** | Plugins remotos reciben config resuelta (mismo problema) | Mismo origen que P5; los providers remotos reciben config resuelta | 🟠 **ABIERTO (válido)** |
| **P7** | Reader remoto limitado a ~4 MB Base64, no escala a 1M | **OBSOLETO**: ya es **artefacto-por-referencia** (S3, spiVersion≥2, Base64 retirado) | ✅ **OBSOLETO — la revisión está desactualizada** |
| **P8** | `lint:boundaries` no está en CI | **HECHO** esta sesión (paso en el job `frontend`) | ✅ **HECHO** |
| **P9** | Front falla abierto; backend solo mira `enabled`, no READY | **Backend gate solo-enabled: CONFIRMADO**. Fail-open del front: por verificar | 🟠 **PARCIAL (backend válido)** |
| **P10** | Añadir `physical_line_number`/`sheet_*` para CSV multilínea | Columnas ausentes | 🔵 **MEJORA (no P0)** |
| **P11** | STATUS incierto usa sendersReference/route, no gatewayReference/idempotencyKey | `gateway_reference` sí se persiste en el fragmento; correlación por banco | 🔵 **VALIDACIÓN POR BANCO** |

---

## P1 — YA IMPLEMENTADO (validado, no tocar)

La revisión lo llama "el P0 más importante que queda". **No queda: está hecho** en `Mt101RebuildRepository`.

- **`updatePayFragmentResults(...)`** ([Mt101RebuildRepository.java:2309](platform-app/src/main/java/com/integrationhub/platform/repository/payments/swift/Mt101RebuildRepository.java)):
  un resultado **terminal** (SENT/REJECTED) solo transiciona desde `pay_status in ('DISPATCHING','UNCERTAIN')` —
  exactamente el UPDATE del ejemplo de la revisión. Si `rows==0` y el entrante es terminal y **contradice** el terminal
  actual (`isTerminalConflict`: ambos terminales y distintos), se acumula como conflicto.
- **`recordTerminalPayConflict(...)`**: **NO sobrescribe** el fragmento (conserva su `pay_status` real), marca
  `pay_conflict=true`, fuerza el run a `pay_status='UNCERTAIN'`, registra una acción **`PAY_CONFLICT` append-only** y exige
  **conciliación manual**. Es **simétrico** en ambos sentidos (SENT tardío sobre REJECTED, y REJECTED sobre SENT).
- La auto-resolución `UNCERTAIN→SENT` (v29) **nunca** cierra si hay `pay_conflict=true` ([línea 1731](platform-app/src/main/java/com/integrationhub/platform/repository/payments/swift/Mt101RebuildRepository.java)).

**Conclusión P1:** cumple literalmente lo que la revisión pedía (no sobrescribir, PAY_CONFLICT, UNCERTAIN, conciliación).
**Acción:** ninguna, salvo **añadir/verificar un test e2e** que ejercite el conflicto terminal tardío en ambos sentidos
si no existe (verificación, no código nuevo).

---

## P2 — 🔴 EL P0 REAL: el token no es fencing token en el runtime

`execution_token`/`executionToken` solo aparecen en `ProcessExecution.java` + `ProcessExecutionRepository.java` (claim
y recuperación). **No se propaga al runtime ni se valida en las transiciones**:

- `BackgroundProcessExecutionDispatcher` → `processExecutionRunner.run(processExecutionId)` — **sin token**
  ([línea 130](platform-app/src/main/java/com/integrationhub/platform/service/execution/async/BackgroundProcessExecutionDispatcher.java)).
- `ProcessExecutionStateService.completeTask/failTask/completeTaskWithErrors/completeProcess/failProcess` hacen
  `findById(...)` y **setean el estado sin ningún** `WHERE ... AND execution_token=? AND status='RUNNING'` — ni chequean
  el status previo ([línea 179+](platform-app/src/main/java/com/integrationhub/platform/service/execution/ProcessExecutionStateService.java)).

→ Un worker viejo (lease vencido, proceso recuperado por otro nodo) **todavía puede** completar/fallar tareas o el
proceso, o ejecutar efectos de tareas siguientes. El claim de fragmentos (P1) mitiga el doble-envío de PAY, pero **el
estado global del proceso y los efectos de otras tareas quedan sin fencing**.

**Solución propuesta (sin fallback):** propagar `executionToken` por todo el runtime
(`Dispatcher → Runner → ProcessExecutionService → ProcessExecutionStateService`) y que **cada transición** exija en el
UPDATE `WHERE process_execution_id=? AND execution_token=? AND status='RUNNING'`. Si el UPDATE afecta 0 filas → el worker
**perdió el token**: aborta (no inicia tareas nuevas, no completa/falla, no toca estado de otro dueño). Convierte el
lease en fencing real. **Es el trabajo de mayor prioridad.**

---

## P3 — 🟠 PAY directo por lista no persistida

`Mt101MessageInputResolver.readResolvedMessages(...)` acepta **dos** entradas: `List<Mt101Message>` en memoria
(de `MT101_BUILD`/`MT101_SPLIT`) **o** una fuente persistida `{fragmentSetId, connectionRef}` (de `MT101_BUILD_FROM_TABLE`)
([Mt101MessageInputResolver.java:45-66](platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101MessageInputResolver.java)).
La protección durable (claim→DISPATCHING→UNCERTAIN, ledger de fragmentos) solo existe para la fuente **persistida**. Con
lista directa, un `transport.send()` con resultado ambiguo **no deja fragmento que pueda quedar UNCERTAIN**.

**Solución propuesta (sin fallback):** para PAY con **efecto de pago real**, exigir **siempre** fuente persistida
(`fragmentSetId`). La lista directa queda restringida a **tests/demo/tools internas sin envío**, o se **materializa** como
fragmentos persistidos antes de llamar al transport. Sin camino legacy: el PAY real no debe poder ejecutarse sobre una
lista en memoria.

---

## P4 — 🟠 Async at-least-once; PAY ya protegido

- **Confirmado**: `TaskProvider.asyncOffloadSupport()` **default = UNSUPPORTED**
  ([TaskProvider.java:27](platform-app/src/main/java/com/integrationhub/platform/spi/task/TaskProvider.java)); `Mt101PayTaskProvider`
  **no** lo override → **MT101_PAY no es offloadable por broker**. Se mantiene (correcto).
- La revisión propone **pre-claim** (`NEW→CLAIMED→RUNNING→DONE/FAILED` con idempotency_key/owner/token/lease/attempt)
  **antes** de ejecutar el provider, para tareas async con efectos externos. Es una mejora válida de arquitectura async,
  pero de **prioridad menor** que P2/P5 mientras PAY siga UNSUPPORTED. (Pendiente: confirmar el orden claim/ejecución en
  `JpaTaskInboxStore` durante la implementación.)

---

## P5/P6 — 🔴/🟠 Secretos resueltos en el envelope async y en plugins remotos

- **Confirmado**: `ProcessTaskRuntimeService` resuelve la config con `toMap(...)` (que **resuelve** `${secret:...}` vía
  `SecretResolver`) y **con esa config resuelta** llama `dispatchAsync(..., configuration, ...)`
  ([ProcessTaskRuntimeService.java:71,128,194](platform-app/src/main/java/com/integrationhub/platform/service/execution/ProcessTaskRuntimeService.java)),
  que la serializa entera al envelope ([AsyncTaskDispatchService.serialize](platform-app/src/main/java/com/integrationhub/platform/service/execution/async/AsyncTaskDispatchService.java)).
  → secretos resueltos pueden acabar en `task_dispatch_outbox`, Kafka, `task_inbox`, logs/DLQ. Afecta a **MT101_STATUS**
  (declara `AsyncOffloadSupport.SUPPORTED`).
- **Existe la pieza para arreglarlo**: `JsonConfigurationMapper.toMapUnresolved(...)` (v27 P0.2) deja los `${secret:...}`
  **intactos**, y `resolveSecretsIn(...)` re-resuelve al ejecutar. La ruta de **PAY correctivo ya** reclama antes de
  re-resolver (v38). Pero la **ruta genérica de offload async no** usa `toMapUnresolved`.

**Solución propuesta (sin fallback):** el envelope async debe persistir **solo referencias** (`${secret:...}`,
identificadores, hashes, plan revision, connectionRef) — usar `toMapUnresolved` para lo que va al outbox — y el
**consumer re-resuelve localmente tras ganar el claim** (`resolveSecretsIn`). Igual para plugins remotos: recibir
referencias, no secretos resueltos. **No habilitar plugins remotos en MT101/PAYMENT/SWIFT/REGULATED** hasta permisos por
capacidad + minimización (fuera de alcance de este delta; se documenta como política).

---

## P7 — ✅ OBSOLETO: el reader remoto ya es artefacto-por-referencia

La revisión describe el reader remoto "limitado a ~4 MB, rechaza `readAllBytes()`/Base64/gRPC unary". **Ya no es así**:
`RemoteReaderProvider` migró a **artefacto-por-referencia** (proyecto #3, esta sesión): pasa un `ArtifactReference` (GET
presignado S3/MinIO), exige `spiVersion≥2`, y **retiró `contentBase64`/el guard de tamaño**
([RemoteReaderProvider.java:159-175](platform-app/src/main/java/com/integrationhub/platform/provider/reader/RemoteReaderProvider.java)).
→ La conclusión de la revisión ("un reader remoto no sirve para 1M registros") **ya no aplica**: el streaming remoto por
referencia + paginación con cursor/Range GET es justamente el camino escalable que pedía. **Acción: ninguna** (validado).

---

## P8 — ✅ HECHO esta sesión: `lint:boundaries` en CI

Gateado en el job `frontend` de `.github/workflows/ci.yml` (tras `Lint`, antes de `test`/`build`), verificado en positivo.
La alternativa de la revisión (`"lint:all"`) es equivalente; se optó por un paso dedicado (mejor atribución). **Los tags
Nx** que la revisión sugiere (`scope:payments`, `type:ui`, …) son el pendiente separado "idiomática Nx", **no** un
habilitador de plugins (analizado aparte). **Acción: ninguna.**

---

## P9 — 🟠 Backend gate solo-`enabled` (el fail-open del front es advisory por diseño)

- **Confirmado**: `AsyncTaskDispatchService` solo chequea `tasks.async.execution.enabled`
  ([línea 60](platform-app/src/main/java/com/integrationhub/platform/service/execution/async/AsyncTaskDispatchService.java));
  **no** exige que relay/consumer estén READY. Con async on + broker/consumer caído → tarea suspendida + outbox pendiente
  → proceso bloqueado.
- **Refinado en el doble-check**: el fail-open del frontend es **intencional y advisory**, no una barrera de seguridad. El
  `process-task-runtime-panel.component.ts` fija `asyncState = signal('READY')` y documenta *"Default READY (permisivo):
  ante error de lectura no se alarma — **el guard del backend es la barrera real**"*. → El front **delega a propósito** en
  el backend. Por tanto el problema NO es endurecer el front (sería ruido UX): es que **la barrera real del backend es
  débil** (solo `enabled`).

**Solución propuesta (sin fallback):** **fallar cerrada en el backend** — `dispatchAsync` debe exigir estado **READY**
(execution+relay+consumer+broker vivos, reutilizando `AsyncAvailabilityService`/health del #4), no solo `enabled`. Modo
degradado explícito requiere confirmación administrativa. El front se mantiene advisory (correcto), pero ahora la barrera
en la que delega sí es real.

---

## P10 / P11 — 🔵 Mejora y validación por banco (no bloqueantes)

- **P10**: `physical_line_number`/`sheet_name`/`sheet_row_number` **no existen** (la trazabilidad es por registro lógico:
  `source_record_number`, `staging_id`, `fragment_index`, `:20:/:21:`). Añadir línea física/hoja mejora el soporte exacto
  para CSV multilínea entre comillas. **Mejora, no P0.**
- **P11**: la resolución de STATUS incierto se apoya en sendersReference/route; `gateway_reference` **sí** se persiste por
  fragmento, pero la correlación de STATUS por `idempotencyKey`/gatewayReference depende del **perfil de cada banco**.
  **Validación banco-por-banco** (como dice la propia revisión), no un cambio de plataforma inmediato.

---

## Prioridad recomendada (solo lo ABIERTO y real)

| Orden | Item | Por qué |
|---|---|---|
| **1** | **P2 — fencing token en runtime** | Único P0 de correctitud abierto; sin él un worker zombi altera estado global |
| **2** | **P5/P6 — no serializar secretos resueltos** (async offload) | Seguridad; afecta MT101_STATUS (SUPPORTED); la pieza (`toMapUnresolved`) ya existe |
| **3** | **P3 — PAY real exige fuente persistida** | Durabilidad del PAY; cerrar la lista-directa para pago real |
| **4** | **P9 — fallar cerrada si async no READY** | Operabilidad; reutiliza health del #4 |
| 5 | P4 — pre-claim async (efectos externos) | Menor mientras PAY sea UNSUPPORTED |
| 6 | P10 / P11 | Mejora / validación por banco |

**Fuera de alcance / ya resuelto:** P1 (hecho), P7 (obsoleto), P8 (hecho).

## Veredicto del meta-análisis

La revisión externa es seria pero **parte de "v56" y el código va por V64**: sus dos afirmaciones más fuertes ya no se
sostienen — **P1 (su "P0 más importante") está implementado** y **P7 (reader remoto) es obsoleto**. El **P0 real que
queda es P2** (fencing token), seguido de **P5/P6** (secretos en el offload async) y **P3** (PAY sobre lista no
persistida). Ninguno es money-path del PAY correctivo (ya blindado); son madurez de clúster/seguridad/durabilidad del
resto del runtime.

---

## Doble-check — verificación del wiring real (self-review)

Reté mis tres afirmaciones más fuertes contra el **wiring**, no solo la existencia del código (lección #4). **Las tres se
sostienen; dos se refuerzan y una empeora**:

- **P1 (hecho) — cableado confirmado, no es código muerto.** `Mt101PayTaskProvider` construye el `pageLedger` con el
  resultado real de cada fragmento, llama `persistCorrectiveLedger(...)` (→ `updatePayFragmentResults`), y **filtra los
  `conflicts`** de `sentRefs`/`archive` simétricamente
  ([Mt101PayTaskProvider.java:353-365](platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101PayTaskProvider.java)).
  → el flujo real de PAY ejecuta la protección de P1.
- **P2 (abierto) — confirmado en las 3 capas y PEOR de lo dicho.** `run(id)` → `loadQueuedExecution` → `executeQueued`
  sin token; `ProcessExecutionService` no revalida owner/status en el loop; `completeProcess/failProcess/completeTask`
  setean el estado **incondicionalmente**. Existe un método `v54-fix` que SÍ usa `WHERE status='NEEDS_RECONCILIATION'`
  atómico → el equipo sabe hacer transiciones guardadas, pero las principales no. **Consecuencia nueva**: un worker zombi
  puede sobrescribir hasta un `NEEDS_RECONCILIATION` (deshaciendo la recuperación) con un `COMPLETED`. Confirma que P2 es
  el P0 real.
- **P5 (abierto) — confirmado y el fix está PROBADO en el repo.** `configuration(...)` → `toMap` (resuelve `${secret:...}`);
  **cero** `toMapUnresolved`/strip en la cadena async → sin mitigación. Pero `toMapUnresolved`/`resolveSecretsIn` **ya se
  usan** en `Mt101PayTaskProvider` y `ProcessTaskDefinitionCorrectiveConfigSource` (PAY correctivo reclama antes de
  re-resolver) → el patrón de arreglo existe y solo falta aplicarlo al offload genérico. Fix de bajo riesgo.

**Neto del doble-check**: la priorización (P2 → P5/P6 → P3 → P9) **no cambia**; P2 queda aún más justificado, P5 más
factible (patrón ya en el repo), y P9 refinado (el fix es backend, no frontend). Ningún error factual en el análisis;
una afirmación (P9) precisada y dos (P2/P5) reforzadas con el wiring real.

## Qué autorizar

Propongo, **bajo tu autorización y en incrementos separados** (cada uno documentado + pruebas evidenciadas):

1. **P2** fencing token end-to-end (el más importante).
2. **P5/P6** envelope async solo-referencias + re-resolución local tras claim.
3. **P3** PAY real solo desde fuente persistida.
4. **P9** fail-closed async.

Antes de tocar nada espero tu revisión de este análisis y qué punto(s) autorizas. Sugiero empezar por **P2** solo.
