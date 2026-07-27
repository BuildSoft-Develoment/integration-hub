# ADR-021 Limite motor <-> verticales: camino de extension para nuevos estandares y ubicacion de MT101

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-020 Correccion masiva de cuarentena MT101: agrupacion por causa + planilla de correccion](ADR-020-correccion-masiva-cuarentena-mt101-agrupacion-y-planilla.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

**Propuesto (2026-07-26).** Cierra la decision que [ADR-009](ADR-009-vertical-mensajeria-pagos.md) difirio explicitamente ("sub-modulo Maven opcional para 008; decision diferida") y complementa [ADR-014](ADR-014-backend-modular-extensible-plugins.md) (que reservo el modelo out-of-process para terceros y dejo las verticales de primera parte como modulos de build) y [ADR-019](ADR-019-auditoria-standard-packs-agrupacion-por-dominio.md) (que propuso el split de la lib Nx de auditoria como Fase 2).

Motivado por una necesidad concreta: se preven **nuevos verticales** (archivos regulatorios SBS y otros estandares) ademas de SWIFT MT101. El diagnostico se verifico contra codigo mediante una auditoria adversarial (ver *Contexto*); **una primera version de este analisis fue refutada y corregida** — los numeros de abajo son los de la version verificada.

## Contexto

El repo es un **monolito modular**: 4 modulos Maven (`platform-contract`, `platform-app`, `audit-consumer`, `ejemplos/backend-plugin-sidecar`), con `platform-app` concentrando ~94% del codigo main. El vertical SWIFT MT101 vive dentro de `platform-app` como paquetes (`provider/task/payments/swift`, `service/payments/swift`, `repository/payments/swift`, `spi/task/payments`): **116 archivos main + 70 de test, ~28.800 de ~60.200 LOC (~48%)**.

La pregunta que motivo este ADR fue "¿separo MT101 a su propio proyecto para que el repo no se vuelva un bloque?". La auditoria mostro que **son dos preguntas distintas con respuestas opuestas**, y que la intuicion de separar primero apunta a la mas cara.

### Hallazgo 1 — Agregar un vertical nuevo ya es casi gratis en backend, y caro en frontend

Costo de extension medido en "archivos del core que hay que editar para dar de alta el vertical #2":

| | Obligatorios | Total realista |
|---|---|---|
| **Backend** | **0** | 0-2 |
| **Frontend** | **9** | 9-16 |

- **Backend abierto**: `domain/TaskType.java` **no es un enum** (es una clase de constantes cuyo `BUILTIN` solo tiene los 6 tipos del motor); `TaskProviderRegistry` inyecta `Instance<TaskProvider>` (descubrimiento CDI puro); `TaskTypeRegistry.all() = BUILTIN union availableTaskTypes()`; JAX-RS auto-descubre resources; Flyway no enumera `locations`. Un `SBS_BUILD` funcional en JVM cuesta **cero** archivos del core. **La deuda M-1a de ADR-009 se cumplio.**
- Excepciones acotadas y honestas: `service/NativeReflectionRegistrations.java` (limitacion de GraalVM, no de diseño) y `service/process/ProcessCatalogService.java` (unica violacion de OCP de diseño del backend: inyecta validadores por nombre concreto en vez de por registry).
- **Frontend cerrado**: `process-catalog-page.ts` importa a mano los 12 componentes de formulario MT101; los diccionarios `es.ts`/`en.ts` son un monolito de ~1.634 lineas donde MT101 metio **247 claves** (con test de paridad que rompe el build); dos `Record<PlatformProcessTaskType, ...>` **totales** obligan a editar libs del core para no caer al icono generico de plugin; y `process-flow.presentation.ts` ramifica con `if (type.startsWith('MT101_'))` y etiqueta en español fija.
- **Causa raiz**: `process-task-manager.service.ts` filtra `origin === 'REMOTE'` al consumir `/api/task-types`. El backend ya clasifica BUILTIN/LOCAL/REMOTE y ya expone `configSchema()`, pero **el frontend solo hidrata los REMOTE**. Un vertical remoto obtiene formulario dinamico con cero ediciones; uno in-process paga 9-16 archivos. **Los mecanismos abiertos existen y estan sin usar**: `PROCESS_TASK_FORM_REGISTRY` (token multi), `I18nService.registerMessages()` (overlay con anti-shadowing), `provideAppNavigationContributions()`, `buildAppRoutesFromPluginManifests([...])` (acepta array de manifests).

### Hallazgo 2 — Extraer MT101 es caro, y el acoplamiento no esta donde parecia

Una primera lectura conto "6 costuras" de acoplamiento entrante (motor -> vertical). La auditoria adversarial encontro **24 puntos adicionales reales** (13 que rompen compilacion, 11 que rompen comportamiento), y sobre todo **un vector completo omitido**:

- **El modelo de auditoria de la plataforma tiene forma de pago.** `AuditEnvelope` (en `platform-contract`, el contrato compartido) declara 7 componentes SWIFT (`paymentReference`, `transactionReference`, `uetr`, `archiveId`, `gatewayReference`, `standard`, `messageType`); la entidad generica `AuditRecordEvent` los persiste; `V23__audit_record_operational_keys.sql` crea 4 indices sobre ellos; `AuditRecordEventRepository` los expone con `case "20"` / `case "21"` (los tags de campo MT101 como alias de query); y el DDL de ClickHouse de **otro modulo** (`audit-consumer`) ordena la tabla por `(record_id, payment_reference, transaction_reference, ...)`. El acoplamiento cruza el contrato compartido y llega al segundo deployable.
- **`PAYMENTS_OPERATOR` esta importado en 12 resources genericos**: borrar la constante rompe la compilacion de media API.
- **10 clases `Mt101*` viven en `api.resource.execution` / `api.response.execution`**, y 4 validadores `Mt101*` en `service.process`.

### Hallazgo 3 — El esquema no esta soldado por FKs, sino por `staging_record` y por el `connectionRef`

El conteo de FKs es exacto y tranquilizador: **2 FKs declaradas cruzan el limite** (`swift_message_envelope.process_execution_id`, `mt101_build_fragment.process_execution_id`), ambas nullable con `ON DELETE SET NULL`; **ninguna FK del nucleo hacia MT101**; **cero triggers/vistas/funciones cruzadas**; **ninguna query del nucleo lee tablas `mt101_*`**. Pero "pocas FKs" mide la **politica de constraints** (este esquema evita FKs a proposito para correr sobre `connectionRef` externos), no el acoplamiento. El acoplamiento real:

- **`staging_record` (tabla del nucleo) esta capturada por el vertical**: las **5** migraciones que la alteran despues de V1 son todas por necesidad MT101 (V15 se llama literalmente `mt101_scale`); **5 de sus 12 columnas y 4 de sus 4 indices no-PK** existen por MT101; y el vertical **le hace UPDATE** desde `repository/payments/swift/Mt101StagingRecordRepository.java` con su propio locking optimista.
- **`staging_id` es soft-FK en 6 tablas MT101, y en 3 de ellas esta dentro de un indice UNIQUE**: la identidad/dedup del vertical depende del PK del nucleo.
- **Una sola transaccion JDBC abarca ambos dominios**: `Mt101StagingCorrectionService` commitea `staging_record` (nucleo) + `mt101_staging_correction` (vertical) atomicamente. Separar bases rompe la atomicidad de una correccion de **money-path**.
- **5 sentencias SQL cruzan dominios en una sola query** (un `UPDATE...FROM`, un `INSERT...SELECT`, 3 `SELECT` con JOIN/EXISTS), incluyendo el snapshot y la deteccion de aprobacion stale del **maker-checker**, que comparan hash/version contra `staging_record`.
- **El `connectionRef` sella la cohabitacion**: el datasource del ledger MT101 debe contener `staging_record`.
- **~60 de 101 migraciones Flyway** son del vertical, intercaladas con las del nucleo en una unica secuencia lineal.

### Sintesis

El motor **ya esta abierto a extension donde importa (backend)**; lo que falta es el camino equivalente en el frontend. Extraer MT101 es un trabajo grande que toca dinero y no es requisito para que exista el vertical #2. **Construir el camino es barato; reubicar al inquilino actual es caro.**

## Decision

**1. Se reafirma el monolito modular.** El vertical vive en el mismo deployable. Se descartan el repo separado/microservicio, el esquema Postgres separado y el plugin out-of-process (ver *Alternativas*).

**2. La inversion va en el CAMINO DE EXTENSION, no en la reubicacion de MT101.** El trabajo prioritario es cerrar la asimetria del frontend para que un vertical in-process se de de alta sin editar libs del core. En concreto:
   - El frontend hidrata tambien los tipos `LOCAL` de `/api/task-types`, no solo los `REMOTE`. Un vertical sin componente TS propio obtiene formulario dinamico via `configSchema()` + `ih-schema-form`.
   - Se elimina el branching por prefijo de estandar (`startsWith('MT101_')`): la **categoria la declara el provider**, no la infiere el motor.
   - Los dos `Record<PlatformProcessTaskType, ...>` totales pasan a `Partial` + fallback explicito, para que agregar un tipo no rompa la compilacion de libs del core.
   - El i18n del vertical se aporta por `registerMessages()` (mecanismo existente), no por el diccionario monolitico.

**3. `staging_record` es del NUCLEO, y su correccion con lock optimista se PROMUEVE a capacidad del motor.** Hoy el vertical escribe una tabla del nucleo; eso es **ownership mal ubicado**, no acoplamiento irrompible. "Editar una fila de staging con merge-patch + If-Match + auditoria" es generico; lo especifico de MT101 es **la politica de si esa fila puede editarse** (`NON_REPROCESSABLE`, freeze por rebuild activo). Se separa en: servicio del nucleo + politica aportada por el vertical. No se mueve ninguna tabla ni se rediseña el maker-checker.

**4. El modelo de auditoria payment-shaped se ACEPTA y se DOCUMENTA como deuda con criterio de disparo.** Generalizar las claves operativas a un mapa key/value hoy cruzaria `platform-contract`, `audit-consumer`, el DDL de ClickHouse y los datos existentes, sin beneficio inmediato. **Disparador explicito**: cuando el vertical #2 necesite claves operativas que no encajen en las columnas actuales, se generaliza a `operationalKeys` manteniendo las columnas actuales como proyeccion/vista de compatibilidad.

**5. MT101 NO se extrae ahora, ni como big-bang.** Se mantiene en `platform-app`. Una vez que el camino de extension este probado por un vertical real, MT101 puede migrar **de forma incremental y oportunista** (paquete por paquete), sin ventana de riesgo unica sobre el money-path.

**6. Se instala un trinquete (ArchUnit) con freeze-list.** Se congelan los puntos de acoplamiento actuales como excepciones explicitas y se falla el build ante cualquier **nuevo** acoplamiento motor -> vertical. Hoy no existe ningun control automatico de capas (ni ArchUnit, ni Checkstyle, ni Enforcer): sin trinquete, el vertical #2 repite el patron y la deuda se duplica.

## Diseno

### Que es un "vertical" (contrato)

Un vertical es un conjunto cohesivo de capacidades de un estandar de negocio (MT101, SBS, ...) que:

- **Aporta** tipos de tarea (`TaskProvider`), lectores/escritores, reglas de validacion, tablas propias, endpoints propios y pantallas propias.
- **Consume** del motor: SPI de tareas, auditoria, `ConnectionPoolManager`, registries de writer/sink, estado de ejecucion, y la capacidad generica de correccion de staging (decision 3).
- **Nunca es referenciado** por el motor: la dependencia es unidireccional `vertical -> motor`.
- **No es un plugin instalable**: los verticales de primera parte son codigo compilado del deployable (ADR-014). El sistema de plugins sigue siendo para piezas del pipeline de terceros.

### Superficie permitida y trinquete

Como el vertical usa servicios del motor (no solo el SPI), **un modulo "SPI puro" no alcanza**. La superficie permitida se gobierna por **allow-list en ArchUnit**, no solo por limite de modulo:

- Regla dura: ninguna clase fuera de `**.payments.**` / `**.swift.**` puede importar clases de esos paquetes (con freeze-list inicial).
- Regla dura: ningun literal `"MT101_*"` en codigo del motor (con freeze-list inicial).
- Regla blanda (allow-list): un vertical solo importa los paquetes del motor declarados como superficie de extension.

En frontend el trinquete ya existe y funciona: `@nx/enforce-module-boundaries` por tags `type:*` impide que una feature importe otra. Se mantiene y se extiende a los verticales.

### Migraciones

Nuevas migraciones del vertical van con prefijo de dominio y, cuando se configure `flyway.locations` multiple, a su propio location. **Las 101 migraciones historicas no se tocan, renumeran ni mueven** (riesgo en entornos ya desplegados). La regla aplica de V102 en adelante.

## Reglas

Invariantes no negociables derivados de esta decision:

1. **El motor no conoce verticales.** Ni por import, ni por literal de tipo de tarea, ni por inyeccion de una clase concreta del vertical. Extension siempre por registry/SPI.
2. **La dependencia es unidireccional.** Si se borra un vertical, el motor compila y ejecuta procesos no-verticales.
3. **Un vertical no escribe tablas del nucleo directamente.** Lo hace a traves de una capacidad del motor (decision 3).
4. **Ningun cambio de este ADR toca la atomicidad del money-path.** La transaccion de correccion sigue siendo unica; el maker-checker sigue comparando hash/version en una sola query.
5. **La suite de ITs de MT101 debe estar verde antes y despues de cada fase.** No negociable.
6. **Toda fase que agregue acoplamiento motor -> vertical esta prohibida por build** (trinquete).

## Consecuencias

Positivas:
- El vertical #2 (SBS) nace bien desde el dia 1, **sin costo de migracion** — es codigo nuevo sobre un camino ya abierto.
- La inversion se concentra donde esta la friccion real (frontend, ~9-16 archivos evitados por vertical), no donde parecia estar.
- El trinquete detiene el crecimiento de la deuda aunque no se pague la existente.
- La decision 3 convierte el acoplamiento mas incomodo (`staging_record`) en ownership correcto, sin mover datos.
- MT101 sigue funcionando sin ventana de riesgo sobre el money-path.

Costos y riesgos aceptados:
- **La deuda existente de MT101 no se paga**: los 24 puntos de acoplamiento y las ~60 migraciones intercaladas siguen ahi. Se congelan, no se limpian.
- **El modelo de auditoria sigue payment-shaped** hasta que se dispare el criterio de la decision 4.
- Hidratar tipos `LOCAL` en el frontend cambia el comportamiento del catalogo de tareas: hay que verificar que los 12 tipos MT101 (que ya tienen componente TS propio) sigan resolviendo a su formulario dedicado y no al dinamico.
- El build nativo no mejora con nada de esto (sigue siendo un binario unico, ~30 min).
- La freeze-list de ArchUnit es una lista de vergüenza que hay que mantener: si se deja crecer, el trinquete pierde sentido.

## Alternativas consideradas

1. **Extraer MT101 a modulo Maven propio primero (big-bang).** Rechazada *por ahora*. Es la opcion que parecia obvia y la auditoria mostro que es la mas cara: 24 puntos de acoplamiento entrante, contrato de auditoria compartido con otro deployable, `staging_record` capturada, y una transaccion de money-path que habria que partir. No es requisito para tener el vertical #2. Queda como decision 5 (migracion incremental posterior).
2. **MT101 como plugin instalable out-of-process.** Rechazada. Tecnicamente imposible hoy y ya descartada por ADR-014: un plugin no puede definir tablas propias (MT101 tiene 22), ni endpoints REST en el core (tiene 5 resources), ni entidades JPA, ni participar de transacciones del nucleo.
3. **Repo separado / microservicio.** Rechazada. Comparte `process_execution`, auditoria y scheduler; convertiria consistencia transaccional del money-path en consistencia distribuida, a cambio de aislamiento nominal. Ademas duplica el costo del build nativo.
4. **Schema Postgres separado para el vertical.** Rechazada. Rompe las 2 FKs reales, complica las queries de lineage y el control maker-checker (que compara contra `staging_record`), y no aporta beneficio operativo hoy.
5. **Federar el frontend del vertical como remote (Native Federation).** Rechazada para verticales de primera parte. El contrato existe y esta probado (ADR-013), pero agrega firma, hosting y operacion para codigo propio que Quinoa ya empaqueta. La federacion sigue siendo el canal para terceros.
6. **Generalizar ahora el modelo de auditoria a claves operativas key/value.** Diferida (decision 4), con criterio de disparo explicito.

## Plan por fases

| Fase | Que | Gate |
|---|---|---|
| **A** | Abrir el camino en frontend: hidratar tipos `LOCAL`, categoria declarada por el provider, `Record` totales -> `Partial` + fallback, i18n por `registerMessages()` | ITs + specs de frontend verdes; los 12 tipos MT101 siguen resolviendo a su formulario dedicado |
| **B** | Trinquete: ArchUnit con freeze-list de los puntos actuales | El build falla ante un acoplamiento nuevo |
| **C** | Promover la correccion de staging al motor + politica aportada por el vertical (decision 3) | Suite de money-path verde; atomicidad de la transaccion intacta |
| **D** | Construir el vertical #2 (SBS) usando A+B+C, como validacion real del camino | El alta del vertical no edita libs del core |
| **E** | *(Opcional, posterior)* Migracion incremental de MT101 al camino, paquete por paquete | Sin big-bang; cada paso reversible |

Las fases A y B son independientes entre si y ambas de bajo riesgo. C toca money-path y exige la suite completa. D es la validacion de que el camino sirve; si D obliga a editar libs del core, A quedo incompleta.

## Alcance / lo que NO entra

- **No** se extrae MT101 a modulo Maven en este ADR (decision 5; queda la fase E como opcional posterior).
- **No** se renumeran, mueven ni reescriben las 101 migraciones historicas.
- **No** se generaliza el modelo de auditoria a claves key/value ahora (decision 4, con disparador).
- **No** se cambia el modelo de plugins de terceros (ADR-012/013/014 siguen vigentes sin modificacion).
- **No** se separa la base de datos ni el deployable.
- **No** se toca la semantica del maker-checker ni la atomicidad de la correccion de money-path.

## Referencias

- [ADR-009 Vertical de mensajeria de pagos](ADR-009-vertical-mensajeria-pagos.md) — establecio el limite motor <-> vertical y difirio el sub-modulo Maven; su deuda M-1a (abrir `TaskType`) esta **cumplida**, la M-1b (extension del frontend) es lo que cierra este ADR.
- [ADR-012 Frontend modular extensible por contribuciones](ADR-012-frontend-modular-extensible-plugins.md) — mecanismos de contribucion declarativa reutilizados por la decision 2.
- [ADR-014 Backend modular extensible por plugins instalables](ADR-014-backend-modular-extensible-plugins.md) — reserva el out-of-process para terceros y deja las verticales de primera parte como modulos de build.
- [ADR-019 Auditoria por dominio: standard packs](ADR-019-auditoria-standard-packs-agrupacion-por-dominio.md) — precedente de separacion de un vertical en el frontend (lib `features/swift-mt101`, ya implementada).
- [ADR-011 Patron repository para el acceso a datos](ADR-011-patron-repository-acceso-datos.md) — capas que la decision 3 respeta al promover la correccion de staging.
- Codigo verificado (backend abierto): `domain/TaskType.java` (constantes, no enum), `service/TaskProviderRegistry.java` (`Instance<TaskProvider>`), `service/execution/TaskTypeRegistry.java`.
- Codigo verificado (friccion frontend): `libs/core/services/src/lib/managers/process-task-manager.service.ts` (filtro `origin === 'REMOTE'`), `libs/features/processes/src/lib/flow/process-flow.presentation.ts` (`startsWith('MT101_')` + categorias fijas), `libs/features/processes/src/lib/catalog/process-catalog-page.ts` (composition-root con 12 imports), `libs/core/services/src/lib/presentation/resource-presentation.maps.ts` (`Record` total), `libs/core/i18n/src/lib/dictionaries/es.ts` / `en.ts` (247 claves MT101).
- Codigo verificado (acoplamiento entrante): `service/NativeReflectionRegistrations.java`, `service/process/ProcessCatalogService.java` + 4 `Mt101*Validator`, `service/execution/async/BackgroundProcessExecutionDispatcher.java`, `service/execution/fastpath/FileReadTaskFastPath.java`, `api/security/PlatformRoles.java`, `api/resource/execution/Mt101*Resource.java`, `api/response/execution/Mt101*Response.java`.
- Codigo verificado (auditoria payment-shaped): `platform-contract/.../audit/AuditEnvelope.java`, `entity/AuditRecordEvent.java`, `repository/AuditRecordEventRepository.java`, `db/migration/V23__audit_record_operational_keys.sql`, `audit-consumer/src/main/resources/clickhouse/audit_record_event.sql`.
- Codigo verificado (esquema): `db/migration/V12`, `V14` (las 2 FKs cruzadas), `V15`/`V31`/`V34`/`V90`/`V93` (`staging_record` dirigida por MT101), `repository/payments/swift/Mt101StagingRecordRepository.java` (UPDATE al nucleo), `service/payments/swift/Mt101StagingCorrectionService.java` (transaccion cruzada), `repository/payments/swift/Mt101RebuildRepository.java` (INSERT...SELECT y JOIN cruzados del maker-checker).
