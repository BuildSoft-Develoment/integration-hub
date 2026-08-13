# Vertical SBS–SUCAVE: análisis contra el código real

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Guia de autor de plugins](guia-autor-plugins.md)
- Siguiente: [ADR](adr/README.md)
<!-- nav-guided:end -->

**Fecha:** 2026-08-10 · **Rama:** `experiment/quarkus-lts-native`
**Encargo:** dar de alta un vertical `vertical-sbs-sucave` (back) + `features/sbs-sucave` (front) que ofrezca,
en `#/processes`, grupos SBS → SUCAVE → subgrupos por formato, reutilizando la capa de escritura de
archivos del motor.
**Método:** contraste punto por punto de un análisis previo contra el código que hay hoy.

---

## 0. Veredicto en una línea

El análisis previo acierta en el **principio** —validar la garantía, no el nombre de la tarea— pero se
equivoca sobre el **punto de partida en las dos direcciones**: infravalora lo que ya está construido
(ADR-021 dejó el camino de extensión hecho, y su propio comentario nombra a SBS) y sobredimensiona lo
que falta (pone tres subsistemas transversales en P0, antes de escribir el primer archivo SUCAVE).

---

## 1. Lo que YA existe y el análisis previo propone construir

Verificado leyendo el código, no la documentación.

### 1.1 El camino de extensión completo (ADR-021)

| Pieza | Dónde | Qué resuelve |
|---|---|---|
| `TaskProvider` (SPI, CDI) | `platform-spi/.../task/TaskProvider.java` | alta de un tipo de tarea sin tocar el motor |
| `ProcessDefinitionValidator` (SPI, CDI) | `platform-spi/.../process/ProcessDefinitionValidator.java` | **regla de publicación aportada por un vertical** |
| `ProcessTaskView` | `platform-spi/.../process/ProcessTaskView.java` | vista neutra `(taskType, taskOrder, configurationJson)` |
| `TaskTypeCatalogService` → `/api/task-types` | `platform-app/.../execution/` | catálogo observable de tipos |
| Flyway por vertical | `quarkus.flyway.locations=...,classpath:db/migration-mt101` + ADR-023 | schema propio del vertical |
| `PROCESS_TASK_PROVIDERS` | `frontend/libs/core/providers/.../tasks/` | providers de tarea del front |
| `provideProcessTaskForms(...)` | idem | formulario por tipo |
| **`PROCESS_TEMPLATE_REGISTRY`** | `.../tasks/process-template-registry.ts` | **plantillas de proceso por vertical** |
| `provideXxxI18n()` | `features/swift-mt101/.../swift-mt101-i18n.ts` | vocabulario propio |
| categoría de paleta | `features/processes/.../flow/process-flow.presentation.ts` | **agrupación de la paleta declarada por el provider** |
| ensamblado en la app | `apps/web/.../core/platform-plugin.manifest.ts` | única capa que ve dos features (frontera Nx) |

El docstring de `process-template-registry.ts` dice literalmente:

> *"SBS registra la suya y aparece en el editor sin tocar el motor."*

El mecanismo de blueprint del §1–§2 del análisis previo **ya está construido**. Lo que falta no es el
registro: es la **jerarquía** (ver §3.1).

### 1.2 Modo de despacho por tarea — ya resuelto, y mejor

El análisis previo propone `TaskDispatchMode {INLINE, WORKER, AUTO}` como novedad. Ya existe, vía
ADR-015, con un reparto de responsabilidades **más seguro** que el propuesto:

- el **provider declara lo que es posible**: `TaskProvider.asyncOffloadSupport()` → `SUPPORTED` /
  `SLICE_ONLY` (solo scatter) / `UNSUPPORTED` (default conservador);
- el **motor honra** un flag `async: true` en la config de la tarea y **lanza** si se pide async sobre
  un provider incapaz — no degrada en silencio;
- el catálogo publica la capacidad (`TaskTypeCatalogEntry.asyncOffload`).

El `AUTO` del análisis previo es un retroceso: dejaría que el sistema eligiera un modo que el provider
no puede honrar. La razón por la que `UNSUPPORTED` es el default está escrita en el enum: el consumer
async reconstruye el `TaskContext` desde el envelope y **no** propaga `sourcePayload`, `readResult`,
`taskOutputs` ni `executionVariables`.

> **Corrección (3ª pasada — verificación del propio análisis).** La 1ª versión afirmaba que "la UI
> gatea el toggle async". **Es falso, y el error fue mío**: lo copié del javadoc de
> `AsyncOffloadSupport`, que declara esa intención, sin comprobar el frontend. Buscando `async` y
> `asyncOffload` en todo `frontend/libs` no aparece **ningún control**: `asyncOffload` del catálogo
> **no se consume en ninguna parte**, y `async` solo figura en
> `process-task-provider.abstract.ts:76,179,201` como clave que se **preserva** en el round-trip si ya
> venía en el JSON. O sea: un operador **no puede** elegir el modo de despacho desde el editor.
> Existe el mecanismo de backend, no la elección del usuario. Por tanto el §9 y el §14 del análisis
> previo —mostrar y poder cambiar inline/worker por tarea en el editor— describen un **hueco real**,
> y la 1ª versión de este documento los descartó por equivocación.

### 1.3 Ejecución durable — existe la mitad del §7, pero NO casi todo el §10

> **Corrección (2ª pasada).** La primera versión de este análisis dijo que el §10 "existe salvo por
> los nombres". Es falso, y el matiz importa mucho para SUCAVE.

Sí existe: lease + heartbeat + reintento (`executionOwner`, `executionToken`, `executionLeaseUntil`,
`executionHeartbeatAt`, `executionAttempt`) y suspensión/reanudación
(`suspendedState`, `resumeToken`, `suspendedContinuation`, `suspendExpiresAt`, `resumeCount`).

**Pero suspend/resume NO es checkpoint-and-restart.** El docstring de `SuspendableTaskProvider` lo
dice sin ambigüedad: es *esperar un evento externo* — `MT101_STATUS` en modo poll o callback, SCA de
Open Banking, aprobaciones humanas. `grep checkpoint` en los servicios de ejecución no devuelve
ningún mecanismo de punto de control por lote.

Consecuencia directa para SUCAVE: **una generación de 5M registros que muere al 80% vuelve a empezar
desde cero.** El §10 del análisis previo pide reanudar por "último lote confirmado / última clave de
paginación" y tiene razón: es un hueco real, sin cubrir, y pesa mucho más aquí que en MT101 por puro
volumen.

### 1.4 La historia de auditoría está protegida — la CONTINUACIÓN no

> **Corrección (2ª pasada).** La primera versión dijo que el §11 del análisis previo "cubre un riesgo
> menor que ya está cubierto". Acerté en la mitad que no importa y fallé en la que sí.

**Auditoría: protegida.** `ProcessCatalogService.update()` desactiva las filas viejas e inserta
nuevas; `ProcessTaskExecution.taskDefinition` apunta por FK a la fila **vieja**. Editar un proceso no
reescribe lo que ya ocurrió.

**Continuación: NO protegida.** `ProcessExecutionService.continueAfterResume:123`:

```java
var plan = processExecutionStateService.loadExecutionPlan(processDefinitionId);  // ← definición VIVA
var remaining = plan.tasks().stream()
        .filter(taskPlan -> taskPlan.taskOrder() != null && taskPlan.taskOrder() > afterTaskOrder)
        .toList();
```

El envelope de continuación persiste `{taskOutputs, executionVariables, afterTaskOrder,
processDefinitionId, triggerSource}` — **los datos, no el grafo**. Al reanudar, el plan se
**reconstruye desde la definición actual**.

Y el filtro es por `taskOrder`, que `replaceTasks` **reasigna** desde el request. O sea: si alguien
borra o reordena una tarea mientras una ejecución está suspendida, `taskOrder > afterTaskOrder`
selecciona **un conjunto distinto de tareas** del que la ejecución tenía. La ejecución reanudada
puede saltarse un paso o ejecutar uno que nunca estuvo en su plan.

Esto **no es teórico ni futuro: está vivo hoy en el money-path**, donde `MT101_PAY` suspende
esperando al banco y `MT101_STATUS` resuelve después.

El §11 del análisis previo —*"las ejecuciones iniciadas con V1 terminan con V1"*— es **correcto y yo
lo descarté**. Su forma concreta ("congelar el grafo en cada ejecución") es el arreglo adecuado, y
hay una versión barata: **persistir el plan restante dentro del envelope de continuación** y reanudar
desde ahí, en vez de releer la definición. Eso cierra el agujero sin construir versionado de procesos.

### 1.5 No hay cancelación

No existe endpoint de cancelación ni estado `CANCELLED`. Para los volúmenes que implica SUCAVE
(generaciones largas de millones de registros) no hay forma de detener una ejecución desbocada salvo
esperar o tocar la base. El análisis previo lo listaba; la primera versión de este documento lo
archivó como "coste de ampliar el enum" en vez de como carencia operativa.

### 1.5 "Se puede quitar cualquier nodo, pero no activar un proceso inválido"

Es **exactamente el comportamiento actual**, y está en una sola línea:

```java
// ProcessCatalogService.create/update
if (request.active()) {
    validateMoneyPath(toTaskViews(request.tasks()));   // → delega en los validators del vertical
}
```

Con el comentario: *"solo un proceso RUNNABLE (active) exige el cableado money-path; un borrador
(inactive) se guarda libre."* La regla fundamental del veredicto del análisis previo ya está
implementada.

### 1.6 La capa de salida es, por suerte, justo la forma que pide SUCAVE

`TxtWriter` (ADR-016) tiene dos modos, y el primero es **ancho fijo**: `length`, `pad`, `align` por
columna, **fail-loud si un valor excede su ancho**, cabecera/detalle/trailer, `encoding`
(UTF-8/ISO-8859-1/Windows-1252/US-ASCII) y `lineEnding` (LF/CRLF). Más `CsvWriter` y `XlsxWriter`,
más `FILE_COMPRESS` y `FILE_DELIVER` con sinks (ADR-017).

El "diseño de registro" de SUCAVE es precisamente un layout posicional de ancho fijo. La reutilización
que pides no solo es posible: es casi un calce exacto.

---

## 2. Lo que el análisis previo da por hecho y NO existe

| Pieza | Estado real |
|---|---|
| Grafo de capacidades (`consumes()`/`produces()`) | **No existe nada.** `grep -i capability` en `platform-spi` da **1** hit, y es un comentario en `ReaderProvider`. Lo único parecido son dos booleanos opt-in en `TaskProvider`: `movesMoney()` y `producesConsumableRecords()` |
| Elección de modo de despacho por tarea **en la UI** | **No existe** (ver corrección en §1.2). El backend lo honra; el editor no lo ofrece |
| Sinks de salida más allá de disco y SFTP | **Solo hay dos**: `FilesystemSink` y `SftpSink`. No hay FTP, HTTPS ni S3 como destino de `FILE_DELIVER` |
| Versionado de procesos | **No existe.** `ProcessDefinition` tiene `id, name, description, active, scheduled, scheduleEvery, nextRunAt, lastRunAt, flowLayoutJson`. Sin versión, sin enum de estado, sin hash de grafo |
| Blueprint en el backend | **No existe.** Las plantillas son **solo de frontend**. El backend nunca sabe qué plantilla originó un proceso → `blueprintVersion`/`blueprintHash` congelados por ejecución no tienen dónde anclarse |
| Jerarquía en las plantillas | **No existe.** `ProcessTemplateRegistration` es plano: `{id, labelKey, tasks[]}`, encadenado `task[i] → task[i+1]` |
| `purpose` del proceso | **No existe** (VALIDATE_ONLY / GENERATE / GENERATE_AND_DELIVER) |
| Invocación síncrona | **No existe.** El único camino es `startAsync`; `POST /api/process-executions/{id}` responde y sigue |
| Guard de runtime (pre-flight / pre-entrega) | **No existe como hook.** Solo hay validación en **publicación**. MT101 resolvió su seguridad de runtime por otra vía: `movesMoney()` + comportamiento del motor en huérfanas |
| Estados que propone (`QUEUED`, `CLAIMED`, `WAITING`, `CANCELLED`, `SKIPPED`, `RETRY_PENDING`) | **No existen.** `ExecutionStatus` tiene 7: `PENDING`, `RUNNING`, `COMPLETED`, `COMPLETED_WITH_ERRORS`, `FAILED`, `SUSPENDED`, `NEEDS_RECONCILIATION`. Es SPI y gobierna toda la UI y la reconciliación: ampliarlo no es gratis |

---

## 3. Correcciones al análisis previo

### 3.1 El hueco real del front no es el blueprint: es la jerarquía

Lo que pides —SBS → SUCAVE → Formato 0228 → Anexo 01 → Flujo desde archivo— no cabe en
`ProcessTemplateRegistration`, que tiene **una** etiqueta y **una** lista. Este es el cambio de
frontend que sí hay que hacer, y es pequeño: añadir agrupación jerárquica al registro (o un
`group: readonly string[]` que el editor pinte como árbol), sin tocar el ensamblado.

Con ~30 formatos del Sistema Financiero (0100–0307, 0500, 0202–0204, 0224, 0228–0238) por varios
anexos cada uno, una lista plana de plantillas es inservible. La jerarquía no es cosmética.

### 3.2 El grafo de capacidades resuelve un problema que el código ya resuelve de otra forma

El principio del análisis previo es correcto: *no exijas `SBS_SUCAVE_MATERIALIZE`, exige que algo
produzca el dataset materializado.* Pero ese principio **ya es la filosofía del código**, implementado
sin grafo: un `ProcessDefinitionValidator` del vertical que lee el `configurationJson` crudo de las
tareas que le incumben e ignora en silencio los procesos que no.

MT101 tiene tres (`Mt101PayResolutionValidator`, `Mt101PayStatusConnectionCoverageValidator`,
`Mt101StatusRouteCoverageValidator`) y ninguno pregunta "¿existe la tarea X?": preguntan por
emparejamientos y por banderas de config, con mensajes de error que explican la consecuencia.

Y el propio análisis previo **concede en su §13** que declarar una capacidad no basta —hace falta un
`SucaveDatasetAdapter` que inspeccione columnas, tipos, orden, unicidad y conteo—. Es decir: el grafo
no elimina la inspección específica del vertical, **le añade una capa encima**. Coste: declarar
`consumes`/`produces` en **todos los tipos de tarea existentes**
([catálogo de tipos](../transversal/90.17-catalogo-de-tipos.md), auto-generado); beneficio sobre lo
que ya hay: feedback del editor al borrar un nodo (§12). Eso es una mejora de UX real, pero no es un
P0 ni un requisito de cumplimiento.

> **Corrección (3ª pasada, y su corrección en la 4ª).** La 1ª versión decía "~34 tipos de tarea" — el
> grep de `public String type()` barrió también los providers de FUENTE y de LECTOR, que no son
> tareas. La 3ª pasada lo corrigió a "21" contando el log de arranque del motor. **También estaba
> mal: son 22.** Faltaba `FILE_READ`, que es fast-path del motor y **no tiene provider**, así que no
> aparece ni en el grep ni en el registro de providers.
>
> La lección no es el número: es que
> [`90.17-catalogo-de-tipos.md`](../transversal/90.17-catalogo-de-tipos.md) existe justamente porque
> las listas escritas a mano caducan, y aquí escribí una a mano dos veces seguidas. Por eso este
> documento ya no enumera: enlaza al catálogo, que lo genera el código y lo verifica el CI.
>
> Detalle que sí importa para el diseño: si algún día se declara el contrato de capacidades,
> **`FILE_READ` no tiene clase donde colgarlo**. El productor canónico del stream de registros es
> precisamente el que no es un provider.

**Recomendación:** no construir el grafo para el primer formato. Si más adelante el editor lo pide,
introducirlo como declaración opt-in en `TaskProvider` (el patrón exacto de `movesMoney()`), nunca
como bloqueante.

### 3.2-bis Lo que el análisis previo aporta y la 1ª pasada infravaloró

Cuatro puntos que se archivaron como "no existe" o "se resuelve más barato" y merecen rango propio.

**A. Los guards de runtime (§5) son su mejor aporte.** Hoy la validación ocurre **solo al publicar**.
Pero el contexto regulatorio cambia en **otro eje de tiempo** que el grafo: el periodo cierra, la
versión del layout sube, los catálogos se actualizan. Un proceso publicado válido en marzo puede
ejecutarse en junio contra un snapshot que ya no aplica — y una validación de publicación **no puede
estructuralmente** atrapar eso. Además, el guard de entrega es el análogo SUCAVE de `movesMoney()`:
entregar un archivo equivocado a la SBS crea un registro oficial y obliga a rectificar. Poner el
control donde ocurre lo irreversible es exactamente el instinto que el money-path ya codifica.
Sube a fase propia (ver §4, F4).

**B. El análisis de impacto al borrar (§12) no necesita el grafo de capacidades.** Hoy te enteras al
**activar**, con un 400. Decírtelo al **borrar**, con opciones, se consigue corriendo los mismos
validadores en seco contra el borrador. Es una mejora de UX real y barata; la 1ª pasada la enterró
dentro del debate sobre capacidades.

**C. El adapter de certificación (§13) vale por sí solo.** La 1ª pasada lo usó solo como argumento
retórico contra el grafo. Pero si un usuario declara "mi SP ya produce el dataset SUCAVE", algo tiene
que verificar columnas, tipos, orden, unicidad y conteo **antes** de generar un archivo regulatorio.
`SucaveDatasetAdapter.inspect()` es local al vertical y útil exista o no un grafo de capacidades.

**D. El propósito del proceso (§6) es una idea correcta.** "Las garantías mínimas dependen del
objetivo del proceso" se sostiene. Mantengo la implementación barata —un campo que lee el validador
SUCAVE, no un concepto del núcleo— pero el mérito es del análisis previo.

### 3.3 El versionado que hace falta no es el del proceso: es el del formato regulatorio

> **Matiz (2ª pasada).** Esta sección decía que el §11 cubre "un riesgo menor". Tras encontrar el
> agujero de §1.4, la formulación correcta es: **ambos importan, y el barato es urgente**. Congelar
> el plan en el envelope de continuación cierra un fallo vivo hoy y cuesta poco. El versionado
> completo del proceso (versión + hash de grafo + "V1 termina en V1") sigue siendo diferible. Lo que
> sí se mantiene es la prioridad relativa del snapshot regulatorio, por lo que sigue.

La SBS publica **actualizaciones constantes** de SUCAVE: la versión vigente del Sistema Financiero es
**5.10.00 (mayo 2026)**, con una progresión 3.91 → 3.99 → 4.00+ → 5.00+ y entregables por
actualización (diseño de registro `.xls/.xlsx`, layouts, manuales, anexos). Lo que cambia bajo tus
pies es **el layout del formato**, no el grafo del proceso.

De ahí que lo verdaderamente crítico sea versionar la **definición del formato** —diseño de registro,
reglas, catálogos, versión SUCAVE, periodo— y congelar esa versión en la ejecución. Un archivo del
periodo 2026-03 debe poder regenerarse **con el layout que regía en 2026-03**, aunque el layout ya
haya cambiado dos veces.

`processDefinitionVersion` + `processGraphHash` son deseables, sí, pero resuelven un riesgo menor
(alguien editó el proceso) que ya está parcialmente cubierto (§1.4). El `regulatorySnapshotId`
resuelve el riesgo mayor, y es **independiente**: puede vivir entero dentro de `vertical-sbs-sucave`,
en su propio schema, sin tocar el motor. Empezar por ahí compra casi toda la seguridad regulatoria
por una fracción del coste.

### 3.4 `SUCAVE_ARTIFACT_QUALIFIED` no es una garantía: es un pre-vuelo

El análisis previo trata la postvalidación local como la calificación que habilita la entrega. Pero
**quien valida de verdad es la SBS**: SUCAVE recibe el archivo, valida contra el diseño de registro y
**devuelve un reporte de validación**. Nuestra postvalidación es una réplica local que reduce
rechazos; no certifica nada ante el regulador.

La consecuencia de diseño importa: el estado que hay que modelar y persistir no es solo
"artefacto calificado localmente", sino **el ciclo de vida ante la SBS** (enviado → validado →
observado → aceptado, más rectificación). Eso es lo que un auditor pedirá ver, y el análisis previo
no lo modela: sus estados terminan en `DELIVERY_RECEIPT`.

### 3.5 Riesgo abierto: puede que la entrega no sea automatizable

El análisis previo asume `GENERATE_AND_DELIVER` con `DELIVERY_RECEIPT` como propósito de primera
clase. Pero según la propia SBS, el envío es por el **Portal del Supervisado**
(`https://extranet.sbs.gob.pe`), con servidores `six01.sbs.gob.pe` / `six02.sbs.gob.pe` y un canal
`sftp.sbs.gob.pe`.

Si el canal operativo real de tu institución es el portal web (login + certificado), **no hay entrega
automatizada** y `GENERATE_AND_DELIVER` no es implementable: el proceso termina en `GENERATE` y la
subida la hace una persona. Si el canal es el SFTP, `FILE_DELIVER` sobre un sink SFTP ya lo cubre hoy
sin escribir código.

> **Precisión (3ª pasada).** Solo existen **dos** sinks: `FilesystemSink` y `SftpSink`. La frase "ya
> lo cubre sin escribir código" vale **únicamente** para SFTP. Si el canal resultara ser FTP plano o
> HTTPS, hoy no hay destino y habría que escribir el sink — pequeño, pero deja de ser gratis.

> **Sobre las cifras de la SBS.** Los códigos de formato (0100–0307, 0224, 0228–0238, 0040–0093,
> 0700–0712) y la versión 5.10.00 de mayo 2026 provienen de una lectura resumida de la página índice
> de SUCAVE, no de los documentos de diseño de registro. Sirven para dimensionar el árbol de la
> paleta; **no** para especificar un formato. Antes de F1 hay que descargar el diseño de registro y
> el instructivo del formato elegido y leerlos directamente.

Es la única pregunta cuya respuesta cambia el alcance de forma material, y no la puedo resolver
leyendo código.

### 3.6 Sync/async: la recomendación es correcta, la mitad ya está hecha, el resto sobra

*"SYNC = ejecución durable + esperar; ASYNC = ejecución durable + devolver el id"* es la conclusión
correcta y la parte durable ya existe. Lo que falta es una envoltura de espera con timeout sobre
`startAsync` — pequeño.

`ProcessInvocationMode`, `syncPolicy`, `asyncPolicy` y sobre todo `AUTO` (que decide por
`maximumEstimatedRecords`) son especulativos: nada en el producto los pide, y `AUTO` colisiona con el
modelo de capacidad del §1.2. Descartar hasta que haya evidencia.

### 3.7 El orden del plan invierte el riesgo

El §18 pone en P0 el grafo de capacidades, el versionado y sync/async; el primer formato queda en P3.
Eso significa construir tres subsistemas transversales **antes de haber escrito un solo archivo
SUCAVE** — y por tanto antes de saber qué abstracción hace falta. Es el orden con más probabilidad de
producir abstracciones equivocadas y caras de revertir.

---

## 4. Orden recomendado

> **Alcance cerrado (2026-08-10, tras la conversación).** La finalidad es **GENERAR**: producir los
> archivos de formato, empaquetarlos en ZIP y depositarlos en un destino ya configurado. El sistema
> **no presenta a la SBS** — eso lo hace una persona. Con ello **desaparece la pregunta abierta de
> §3.5**, y con ella `GENERATE_AND_DELIVER`, `DELIVERY_RECEIPT`, el guard de entrega y el ciclo de
> vida ante el regulador (§3.4). Se añade un requisito nuevo que no es de SUCAVE sino del motor:
> **toda fuente de entrada debe tener su salida** — hoy hay 8 tipos de entrada y 2 de salida.
>
> El plan detallado y ejecutable vive ahora en **[`specs/009-sbs-sucave/`](../../specs/009-sbs-sucave/README.md)**;
> lo que sigue queda como el razonamiento que lo originó.

**F0 — Congelar el plan en la continuación. ✅ HECHO (2026-08-10).** Era un fallo vivo del motor que
afectaba al money-path (§1.4), independiente de SUCAVE. El envelope lleva ahora `remainingTasks` y la
reanudación corre ese plan en vez de releer la definición; la ausencia del plan (envelope anterior al
cambio) degrada a `COMPLETED_NEEDS_REDRIVE` en vez de adivinar. Al implementarlo aparecio **el mismo
fallo en un segundo sitio**: `countDownstreamTasks` tambien consultaba la definicion viva, asi que un
proceso podia cerrarse `COMPLETED` con tareas pendientes en su propio plan. `TaskPlan` quedo
registrado en `NativeReflectionRegistrations` — sin eso, en nativo la suspension habria escrito
`null` y CADA resume con tareas downstream habria degradado. Tests: 5 unitarios
(`SuspensionContinuationTest`) + 2 de integracion en `ProcessExecutionSuspendResumeIT` que cubren las
dos direcciones (borrar una tarea durante la suspension → debe ejecutarse igual; añadir una → no debe
colarse).

**F1 — Un formato de punta a punta con lo que ya hay.** `vertical-sbs-sucave` + `features/sbs-sucave`,
Formato 0228 / Anexo 01, camino `FROM_FILE`. Tipos nuevos mínimos (probablemente
`SBS_SUCAVE_PREPARE` y `SBS_SUCAVE_VALIDATE`); la salida es `FILE_WRITE` en TXT ancho fijo, tal cual.
Una plantilla registrada en `PROCESS_TEMPLATE_REGISTRY`. Un `SucaveProcessDefinitionValidator`
implementando el SPI existente. Migraciones en `db/migration-sucave` con schema propio (ADR-023).
Sale un archivo real y se aprende el dominio.

**F2 — Jerarquía en la paleta de plantillas.** El árbol SBS → SUCAVE → formato → anexo → flujo.
Es lo que pediste explícitamente y lo que hace usable el resto.

**F3 — Snapshot regulatorio versionado.** Diseño de registro, reglas y catálogos versionados por
periodo, congelados en la ejecución. Entero dentro del vertical.

**F4 — Guards de runtime** (§3.2-bis A). Pre-vuelo antes de ejecutar y guard antes de entregar, como
hook del motor implementado por el vertical. Es lo que impide que un proceso publicado en marzo
entregue en junio contra un snapshot caduco.

**F5 — Ciclo de vida ante la SBS.** Presentación, reporte de validación devuelto, observaciones,
rectificación. Depende de la respuesta a §3.5.

**F6 — Escala: checkpoint y cancelación** (§1.3, §1.5). Reanudar por último lote confirmado y poder
detener una ejecución. El momento correcto es cuando F1 dé cifras reales de volumen, no antes.

**F7 — Solo si la evidencia lo pide.** Grafo de capacidades, análisis de impacto al borrar
(§3.2-bis B, se puede adelantar barato), certificación por adapter (§3.2-bis C), versionado completo
del grafo de proceso, envoltura SYNC, y **exponer el modo de despacho por tarea en el editor**
(§1.2 corrección): el backend ya lo honra, falta el control — y en cuanto SUCAVE genere volúmenes
grandes, alguien va a querer marcar una tarea como WORKER sin editar JSON a mano.

---

## 5. Preguntas abiertas (bloquean alcance, no el arranque)

1. **Canal de entrega real**: ¿portal web (manual) o `sftp.sbs.gob.pe` (automatizable)? Decide si
   existe `GENERATE_AND_DELIVER`.
2. **Formatos objetivo**: ¿solo Sistema Financiero (0100–0307, 0224, 0228–0238…) o también Asegurador
   (0040–0093) y SPP (0700–0712)? Cambia el tamaño del árbol, no el diseño.
3. **Origen del dato**: ¿archivo (`FILE_READ`), procedimiento almacenado (`DB_EXECUTE_SP`) o tabla?
   El análisis previo asume los tres; F1 debería comprometerse con uno.

---

## 5-bis. Verificación de este documento (3ª pasada)

Se re-comprobaron contra el código las afirmaciones que la 1ª pasada dio por buenas.

**Falso o inexacto (corregido arriba):**

| Afirmación | Realidad |
|---|---|
| "la UI gatea el toggle async" | **Falso.** Copiado del javadoc del SPI sin comprobar el frontend. No hay control; `asyncOffload` no se consume en ninguna parte |
| "~34 tipos de tarea" | **21.** El grep barrió providers de fuente y de lector |
| "`grep Capability` → 0" | **1**, un comentario en `ReaderProvider` |
| "`FILE_DELIVER` sobre SFTP lo cubre sin código" | Cierto **solo** para SFTP: hay dos sinks, disco y SFTP |

**Confirmado leyendo el código:**

- `TxtWriter` es fail-loud de verdad al desbordar un ancho (`TxtWriter.java:180-182`), no solo en su
  javadoc — el punto de apoyo de todo F1.
- Los otros dos validadores MT101 (`Mt101PayStatusConnectionCoverageValidator`,
  `Mt101StatusRouteCoverageValidator`) comprueban **cobertura y emparejamiento**, no "¿existe la tarea
  X?". La tesis de §3.2 se sostiene sobre los tres, no sobre uno.
- La historia está protegida **más** de lo que decía §1.4: `ProcessTaskExecution.taskDefinition` es
  `@ManyToOne(optional = false)` con `@JoinColumn(nullable = false)` y sin cascade, así que el FK
  **impide** borrar en duro una definición de tarea con ejecuciones.
- La categoría de paleta la declara cada provider de verdad (`category: 'swift-mt101'` en los 12 de
  MT101), así que SBS obtiene su grupo declarando `category: 'sbs-sucave'`. Pero es **un solo nivel**:
  confirma que la jerarquía de §3.1 es el hueco.

## 6. Fuentes

- [SBS — SUCAVE (normativa y estándares)](https://www.sbs.gob.pe/normativa-y-estandares/normativa/normativa-sbs/sucave)
- [SBS — Guía de instalación y manual del usuario SUCAVE 3](https://www.sbs.gob.pe/Portals/0/jer/DOC_SUCAVE_30/Manual%20SUCAVE%203.pdf)
- [SBS — Instrucciones Formato 224 v6](https://www.sbs.gob.pe/Portals/0/jer/SUCAVE_2023/Instrucciones%20Fto%20224%20v6.doc)
- [SBS — Instructivo Registro de Operaciones](https://www.sbs.gob.pe/Portals/0/jer/sucave_2021/Instructivo%20RO%20%C3%9Anicas%20y%20M%C3%BAltiples%20enero%202021.pdf)
