# ADR-021 Limite motor <-> verticales: camino de extension para nuevos estandares y ubicacion de MT101

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-020 Correccion masiva de cuarentena MT101: agrupacion por causa + planilla de correccion](ADR-020-correccion-masiva-cuarentena-mt101-agrupacion-y-planilla.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

**Propuesto (2026-07-26); fases A, B, 2 y 3 implementadas (2026-07-27)** — ver *Alcance implementado*. La **decision 5 quedo revertida** por la medicion: MT101 si se extrajo a su modulo, y `platform-app` quedo sin una sola clase de vertical. Pendiente de gate humano para pasar a Aceptado.

Cierra la decision que [ADR-009](ADR-009-vertical-mensajeria-pagos.md) difirio explicitamente ("sub-modulo Maven opcional para 008; decision diferida") y complementa [ADR-014](ADR-014-backend-modular-extensible-plugins.md) (que reservo el modelo out-of-process para terceros y dejo las verticales de primera parte como modulos de build) y [ADR-019](ADR-019-auditoria-standard-packs-agrupacion-por-dominio.md) (que propuso el split de la lib Nx de auditoria como Fase 2).

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

Una primera lectura conto "6 costuras" de acoplamiento entrante (motor -> vertical). La auditoria adversarial encontro **24 puntos adicionales reales** (13 que rompen compilacion, 11 que rompen comportamiento), y sobre todo **un vector completo omitido**. *(Estos numeros son los del diagnostico inicial, leidos a ojo; ver **Correccion del diagnostico** mas abajo para la medicion real y lo que cambio.)*

- **El modelo de auditoria de la plataforma tiene forma de pago.** `AuditEnvelope` (en `platform-contract`, el contrato compartido) declara 7 componentes SWIFT (`paymentReference`, `transactionReference`, `uetr`, `archiveId`, `gatewayReference`, `standard`, `messageType`); la entidad generica `AuditRecordEvent` los persiste; `V23__audit_record_operational_keys.sql` crea 4 indices sobre ellos; `AuditRecordEventRepository` los expone con `case "20"` / `case "21"` (los tags de campo MT101 como alias de query); y el DDL de ClickHouse de **otro modulo** (`audit-consumer`) ordena la tabla por `(record_id, payment_reference, transaction_reference, ...)`. El acoplamiento cruza el contrato compartido y llega al segundo deployable.
- **`PAYMENTS_OPERATOR` esta importado en 12 resources genericos**: borrar la constante rompe la compilacion de media API.
- **10 clases `Mt101*` viven en `api.resource.execution` / `api.response.execution`**, y 4 validadores `Mt101*` en `service.process`.

### Hallazgo 3 — El esquema no esta soldado por FKs, sino por `staging_record` y por el `connectionRef`

El conteo de FKs es exacto y tranquilizador: **2 FKs declaradas cruzan el limite** (`swift_message_envelope.process_execution_id`, `mt101_build_fragment.process_execution_id`), ambas nullable con `ON DELETE SET NULL`; **ninguna FK del nucleo hacia MT101**; **cero triggers/vistas/funciones cruzadas**; **ninguna query del nucleo lee tablas `mt101_*`**. Pero "pocas FKs" mide la **politica de constraints** (este esquema evita FKs a proposito para correr sobre `connectionRef` externos), no el acoplamiento. El acoplamiento real:

- **`staging_record` (tabla del nucleo) esta capturada por el vertical**: las **5** migraciones que la alteran despues de V1 son todas por necesidad MT101 (V15 se llama literalmente `mt101_scale`); **5 de sus 12 columnas y 4 de sus 4 indices no-PK** existen por MT101; y el vertical **le hace UPDATE** desde `repository/Mt101StagingRecordRepository.java` con su propio locking optimista.
- **`staging_id` es soft-FK en 6 tablas MT101, y en 3 de ellas esta dentro de un indice UNIQUE**: la identidad/dedup del vertical depende del PK del nucleo.
- **Una sola transaccion JDBC abarca ambos dominios**: `Mt101StagingCorrectionService` commitea `staging_record` (nucleo) + `mt101_staging_correction` (vertical) atomicamente. Separar bases rompe la atomicidad de una correccion de **money-path**.
- **5 sentencias SQL cruzan dominios en una sola query** (un `UPDATE...FROM`, un `INSERT...SELECT`, 3 `SELECT` con JOIN/EXISTS), incluyendo el snapshot y la deteccion de aprobacion stale del **maker-checker**, que comparan hash/version contra `staging_record`.
- **El `connectionRef` sella la cohabitacion**: el datasource del ledger MT101 debe contener `staging_record`.
- **~60 de 101 migraciones Flyway** son del vertical, intercaladas con las del nucleo en una unica secuencia lineal.

### Correccion del diagnostico (2026-07-27, medido con el trinquete)

El conteo del Hallazgo 2 se hizo leyendo codigo. Al instalar el trinquete (fase B) y medir de verdad, la **cantidad** resulto mayor y la **naturaleza** distinta — y esto ultimo cambia el razonamiento:

- Violaciones reales al arrancar: **205 dependencias** motor -> vertical + **16 clases** de vertical alojadas en paquetes del motor.
- Pero **194 de esas 205 (95%) venian de 4 `Mt101*Resource` ubicados en `api.resource.execution`**, junto a los recursos genericos del motor. Solo **11** (todas de `NativeReflectionRegistrations`) eran acoplamiento de una clase genuina del motor.

**El acoplamiento motor -> vertical era casi todo UBICACION DE ARCHIVOS, no diseño.** Eso reordena la prioridad: la reubicacion fisica, que este ADR habia tratado como higiene, resulto la palanca mas grande del backend — mecanica, sin tocar logica ni contratos, y verificable por el trinquete. Se ejecuta como *fase 2* (ver *Alcance implementado*).

La leccion metodologica vale registrarla: **la deuda de acoplamiento hay que medirla, no estimarla**. Un conteo a ojo confunde "cuantos lugares duelen" con "cuanto trabajo es arreglarlo".

### Sintesis

El motor **ya esta abierto a extension donde importa (backend)**; lo que falta es el camino equivalente en el frontend. Extraer MT101 es un trabajo grande que toca dinero y no es requisito para que exista el vertical #2. **Construir el camino es barato; reubicar al inquilino actual es caro** — con el matiz de la correccion de arriba: la parte *mecanica* de reubicar resulto barata y de alto rendimiento; lo caro es el resto (esquema, auditoria, atomicidad).

## Decision

**1. Se reafirma el monolito modular.** El vertical vive en el mismo deployable. Se descartan el repo separado/microservicio, el esquema Postgres separado y el plugin out-of-process (ver *Alternativas*).

**2. La inversion va en el CAMINO DE EXTENSION, no en la reubicacion de MT101.** El trabajo prioritario es cerrar la asimetria del frontend para que un vertical in-process se de de alta sin editar libs del core. En concreto:
   - El frontend hidrata tambien los tipos `LOCAL` de `/api/task-types`, no solo los `REMOTE`. Un vertical sin componente TS propio obtiene formulario dinamico via `configSchema()` + `ih-schema-form`.
   - Se elimina el branching por prefijo de estandar (`startsWith('MT101_')`): la **categoria la declara el provider**, no la infiere el motor.
   - Los dos `Record<PlatformProcessTaskType, ...>` totales pasan a `Partial` + fallback explicito, para que agregar un tipo no rompa la compilacion de libs del core.
   - El i18n del vertical se aporta por `registerMessages()` (mecanismo existente), no por el diccionario monolitico.

   *Precision (2026-07-27): "no en la reubicacion" se refiere a EXTRAER MT101 a su propio modulo (decision 5), no a corregir archivos del vertical mal ubicados DENTRO del modulo. La medicion mostro que esa correccion era mecanica y de altisimo rendimiento, asi que se hizo — es la fase 2, y no contradice esta decision: no mueve el limite del deployable, solo pone cada archivo en su paquete.*

**3. `staging_record` es del NUCLEO, y su correccion con lock optimista se PROMUEVE a capacidad del motor.** Hoy el vertical escribe una tabla del nucleo; eso es **ownership mal ubicado**, no acoplamiento irrompible. "Editar una fila de staging con merge-patch + If-Match + auditoria" es generico; lo especifico de MT101 es **la politica de si esa fila puede editarse** (`NON_REPROCESSABLE`, freeze por rebuild activo). Se separa en: servicio del nucleo + politica aportada por el vertical. No se mueve ninguna tabla ni se rediseña el maker-checker.

**4. El modelo de auditoria payment-shaped se ACEPTA y se DOCUMENTA como deuda con criterio de disparo.** Generalizar las claves operativas a un mapa key/value hoy cruzaria `platform-contract`, `audit-consumer`, el DDL de ClickHouse y los datos existentes, sin beneficio inmediato. **Disparador explicito**: cuando el vertical #2 necesite claves operativas que no encajen en las columnas actuales, se generaliza a `operationalKeys` manteniendo las columnas actuales como proyeccion/vista de compatibilidad.

**5. MT101 NO se extrae ahora, ni como big-bang.** Se mantiene en `platform-app`. Una vez que el camino de extension este probado por un vertical real, MT101 puede migrar **de forma incremental y oportunista** (paquete por paquete), sin ventana de riesgo unica sobre el money-path.

   > **REVERTIDA el 2026-07-27 — ver *Correccion de la decision 5*.** MT101 **si** se extrajo a `vertical-swift-mt101`, en tres olas incrementales (no big-bang: cada ola con build y suite verdes). Lo que hizo caer el argumento fue la medicion: con las dependencias motor -> vertical en cero, extraer dejo de ser un rediseño y paso a ser mudanza. Todo lo demas de esta decision sigue vigente — mismo deployable, misma base de datos, monolito modular.

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
- **La deuda existente de MT101 no se paga entera.** *(Corregido 2026-07-27: la parte de dependencias de codigo SI se pago — quedo en cero, ver Alcance implementado, porque resulto ser mudanza y no rediseño.)* Sigue en pie lo estructural: las ~60 migraciones Flyway intercaladas en una unica secuencia, `staging_record` compartida, la transaccion de money-path que cruza ambos dominios y el `connectionRef` que obliga a cohabitar.
- **El modelo de auditoria sigue payment-shaped** hasta que se dispare el criterio de la decision 4.
- Hidratar tipos `LOCAL` en el frontend cambia el comportamiento del catalogo de tareas: hay que verificar que los 12 tipos MT101 (que ya tienen componente TS propio) sigan resolviendo a su formulario dedicado y no al dinamico.
- El build nativo no mejora con nada de esto (sigue siendo un binario unico, ~30 min).
- La freeze-list de ArchUnit es una lista de vergüenza que hay que mantener: si se deja crecer, el trinquete pierde sentido.

## Alternativas consideradas

1. **Extraer MT101 a modulo Maven propio primero (big-bang).** Rechazada *por ahora*, y la razon cambio en el camino — conviene registrarlo. El argumento original era el volumen de acoplamiento de codigo; medido y ejecutado, ese acoplamiento resulto barato (mudanza, no rediseño) y hoy esta **en cero**. Lo que sostiene el rechazo es lo estructural, que sigue intacto: el contrato de auditoria compartido con `audit-consumer`, `staging_record` capturada por el vertical, la transaccion de money-path que cruza ambos dominios, el `connectionRef` que obliga a cohabitar, y ~60 migraciones Flyway intercaladas en una unica secuencia. Nada de eso es requisito para tener el vertical #2. Queda como decision 5 (migracion incremental posterior).
2. **MT101 como plugin instalable out-of-process.** Rechazada. Tecnicamente imposible hoy y ya descartada por ADR-014: un plugin no puede definir tablas propias (MT101 tiene 22), ni endpoints REST en el core (tiene 5 resources), ni entidades JPA, ni participar de transacciones del nucleo.
3. **Repo separado / microservicio.** Rechazada. Comparte `process_execution`, auditoria y scheduler; convertiria consistencia transaccional del money-path en consistencia distribuida, a cambio de aislamiento nominal. Ademas duplica el costo del build nativo.
4. **Schema Postgres separado para el vertical.** Rechazada. Rompe las 2 FKs reales, complica las queries de lineage y el control maker-checker (que compara contra `staging_record`), y no aporta beneficio operativo hoy.
5. **Federar el frontend del vertical como remote (Native Federation).** Rechazada para verticales de primera parte. El contrato existe y esta probado (ADR-013), pero agrega firma, hosting y operacion para codigo propio que Quinoa ya empaqueta. La federacion sigue siendo el canal para terceros.
6. **Generalizar ahora el modelo de auditoria a claves operativas key/value.** Diferida (decision 4), con criterio de disparo explicito.

## Plan por fases

| Fase | Que | Gate | Estado |
|---|---|---|---|
| **A** | Abrir el camino en frontend: hidratar tipos `LOCAL`, categoria declarada por el provider, `Record` totales -> `Partial` + fallback, i18n por `registerMessages()` | ITs + specs de frontend verdes; los 12 tipos MT101 siguen resolviendo a su formulario dedicado | **Hecha** (2026-07-27) |
| **B** | Trinquete: ArchUnit con freeze-list de los puntos actuales | El build falla ante un acoplamiento nuevo | **Hecha** (2026-07-27) |
| **2** | *(Fase nueva, ver Correccion del diagnostico)* Reubicacion fisica de las clases del vertical alojadas en paquetes del motor + registry de validadores + reflexion nativa por vertical | Trinquete: regla de dependencias motor -> vertical en cero | **Hecha** (2026-07-27) |
| **3** | *(Fase nueva, ver Correccion de la decision 5)* Modulo Maven propio: `platform-spi` + `vertical-swift-mt101`, en tres olas | El vertical compila contra el SPI, sin ver `platform-app` | **Hecha** (2026-07-27) |
| **C** | Promover la correccion de staging al motor + politica aportada por el vertical (decision 3) | Suite de money-path verde; atomicidad de la transaccion intacta | **Hecha** (2026-07-28) |
| **D** | Construir el vertical #2 (SBS) usando A+B+C, como validacion real del camino | El alta del vertical no edita libs del core | Pendiente |
| **E** | ~~Migracion incremental de MT101~~ | — | **Absorbida por la fase 3** |

Las fases A y B son independientes entre si y ambas de bajo riesgo. C toca money-path y exige la suite completa. D es la validacion de que el camino sirve; si D obliga a editar libs del core, A quedo incompleta.

### Correccion de la decision 5 (2026-07-27)

La decision 5 dijo *"no se extrae MT101 a un modulo Maven"*, con el argumento de que el costo no se justificaba. Ese argumento se apoyaba en el diagnostico previo a la medicion: 205 dependencias motor -> vertical hacian ver la extraccion como un rediseño. Cuando la fase 2 llevo esas dependencias a **cero**, el costo real de extraer paso a ser mudanza de archivos, y el usuario pidio dejar el camino listo antes de construir el vertical SBS. La decision se revierte de forma explicita: **el vertical SI vive en su modulo Maven** (fase 3). Sigue en pie todo lo demas de la decision — mismo deployable, misma base de datos, monolito modular.

## Alcance implementado (2026-07-27)

**Fase A — camino de extension en el frontend.** El backend ya estaba abierto (`TaskType` es una clase de constantes, CDI descubre providers, `PluginConfigSchemaResource` resuelve el schema de providers LOCALES): el unico bloqueo era que el frontend filtraba `origin === 'REMOTE'` al hidratar `/api/task-types`, dejando invisible a cualquier vertical in-process. Ahora:

- El catalogo expone `configurable` (el provider declara un config-schema no vacio) y el frontend hidrata todo tipo sin formulario compilado, con la regla "REMOTE siempre, o configurable". Un tipo sin schema no se ofrece: no habria forma de completarlo. La regla **no nombra ningun tipo concreto** — por eso `PAIN001_PARSE` sigue oculto (no declara schema) sin hardcodear su nombre.
- La **categoria** de la paleta la declara el provider (`descriptor.category`); se elimino `type.startsWith('MT101_')` del motor de presentacion.
- Los dos `Record<PlatformProcessTaskType, ...>` **totales** pasan a `Partial` con cadena de resolucion descriptor -> mapa del motor -> generica; un vertical puede traer icono y badge propios. Verificado: agregar un tipo a la union ya no rompe la compilacion de libs del core.
- El i18n del vertical va por `registerMessages()`, no por el diccionario monolitico.

**Fase B — trinquete.** Tres reglas congeladas (`FreezingArchRule` + escaneo de fuentes para literales, que ArchUnit no cubre). Verificado empiricamente con una sonda que introduce una violacion nueva: falla con mensaje accionable y **no** se auto-congela.

**Fase 2 — reubicacion y cierre del acoplamiento backend.** Efecto medido por el trinquete:

| Regla | Al instalar el trinquete | Tras fase 2 |
|---|---|---|
| Dependencias motor -> vertical | 205 | **0** |
| Clases de vertical en paquetes del motor | 16 | **2** |

Lo hecho: los 10 endpoints/DTOs MT101 salen de `api.*.execution` a `api.*.payments` (relocalizacion pura: `@Path` fija la URL, no el paquete); `ProcessCatalogService` deja de inyectar por tipo concreto los 3 validadores del money-path y pasa a `Instance<ProcessDefinitionValidator>` sobre un SPI nuevo (`spi/process`, con `ProcessTaskView` neutro), con lo que los 4 archivos se mudan al vertical sin convertir una violacion de ubicacion en una dependencia real; y cada vertical registra sus tipos para reflexion nativa (`Mt101ReflectionRegistrations`).

Las **2 violaciones restantes** son los readers `SwiftMtReaderProvider` y `Pain001XmlReaderProvider`, que viven en `provider/reader` por una decision documentada en el propio codigo (se registran en el catalogo de formatos como uno mas). Se dejan congeladas a proposito: revisarlas exige revisar esa decision, no solo mover archivos.

**Fase 3 — modulo Maven propio.** Tres modulos nuevos, en cinco olas:

- **`platform-spi`** — el contrato de extension. Se extrajo *entero* el paquete `platform.spi`, conservando su nombre: sin paquete partido y sin reescribir un solo import. Despues fue creciendo con lo que la migracion fue revelando como contrato y no como interioridad.
- **`vertical-swift-mt101`** — el vertical, en paquete `com.integrationhub.vertical.swift.mt101`.
- **`vertical-iso20022`** — proyecto base de PAIN.001, sin implementar (ver mas abajo).

El orden importo: primero se invirtieron las dependencias, despues se movieron los archivos. Medida en tres pasadas, la superficie del vertical hacia el motor:

| | Entradas distintas | Referencias |
|---|---|---|
| Antes de la ola 3 | 15 | 46 |
| Tras invertir las 3 grandes | 12 | 17 |
| Tras el segundo barrido | 4 | 4 |

La primera pasada mostro que **tres clases concentraban 46 de las 46 referencias** y su API usada eran 7 metodos: `ConnectionPoolManager` -> `JdbcConnectionResolver`, `JsonConfigurationMapper` -> `ConfigurationMapper`, y `RecordAuditEmitter` que ya era interfaz y solo habia que mudar. La segunda pasada separo lo que era **utilidad mal ubicada** de lo que necesitaba un puerto:

- Al SPI, tal cual: `DbTaskSupport`, `TaskOutputSupport`, `StoredProcedureRuntimeSupport` (dependen solo del JDK y del propio SPI) y `ExecutionStatus`. Que el motor tambien las use es la señal de que son contrato de autor de tareas, no interioridades.
- Puertos nuevos que el motor implementa: `SinkDefinitionResolver`, `AuditSpoolGateway`, `ExecutionReconciliationGateway`, `FileFormatWriterResolver`. Los registries se quedan en el motor con sus 10 hermanos; solo viaja el contrato.

**Esto evito un `platform-core`.** La ola 3 parecia exigir sacar el motor entero de `platform-app` (~324 archivos) para que el vertical pudiera llevarse lo que le faltaba. Medir primero mostro que no hacia falta: el vertical no necesitaba *el motor*, necesitaba 7 metodos.

#### Ola 4 — la revision que corrigio cuatro clasificaciones

Al cerrar la ola 3 se listaron cinco cosas como "se quedan en `platform-app` a proposito". **Cuatro de las cinco estaban mal.** La revision del usuario las cuestiono una por una y, al medirlas, resulto que ninguna tenia dependencia del motor:

| Lo que se dijo | Lo que decia el codigo | Donde quedo |
|---|---|---|
| `RestInboundDeliveryTransport` es un adaptador del motor | Implementa un puerto MT101, usa `SwiftInboundStore`, dice `"MT101_INBOUND_DELIVER via REST"` y su gemelo `DbInboundDeliveryTransport` ya estaba en el vertical. El unico bloqueo real era `HttpRequestSupport`, que se habia quedado en el motor mientras sus 3 hermanos subian al SPI | vertical (+ `HttpRequestSupport` al SPI) |
| `PaymentValidationRule*` es catalogo de *pagos*, no de MT101 | Los tres consumidores de `payment_validation_rule` estan en el modulo del vertical. La clasificacion salio del prefijo `Payment` y de la columna `standard`, sin mirar quien lee | vertical |
| `PaymentValidationRuleApiMapper` es capa API | Mapea entidad del vertical -> DTO del vertical. Cero dependencias del motor | vertical |
| Los 5 recursos JAX-RS son "capa de composicion" | **Cero** imports del motor: solo `jakarta.ws.rs` y `jakarta.annotation.security`. `@Path` fija la URL, no el paquete: mover no cambio ninguna ruta | vertical |

El patron de los cuatro errores es el mismo y vale registrarlo: **se clasifico por el nombre o por la capa, no por los consumidores.** El unico metodo que no fallo en toda la migracion fue medir quien depende de quien.

De paso, `PlatformRoles` se partio: los 5 roles transversales al SPI (los usa el motor en 11-20 archivos cada uno) y los 2 del maker-checker al vertical (**el motor no los usaba nunca**).

#### Ola 5 — el ultimo puerto, y por que NO se hizo por REST

Quedaban dos adaptadores en `platform-app` (`ProcessTaskDefinition{Build,Corrective}ConfigSource`), correctos en sentido de dependencia pero satisfaciendo puertos llamados `Mt101*`. Se evaluaron dos caminos para llegar a cero.

**Descartado: que el vertical lea el config por REST.** El dato que devuelven esos puertos termina en `provider.execute(context, config)` — el envio al banco — y sale de `ConfigurationMapper.toMap()`, que **resuelve los `${secret:...}`**. Las claves de un config de PAY son `host, port, username, password, privateKeyPath, passphrase`. Ponerlo en un cable HTTP contradice una invariante que el propio codigo ya cuida (*"las refs viajan INTACTAS: el spec persistido nunca lleva secretos resueltos"*), y ademas ese mismo config se hashea para el freeze del maker-checker: una lectura no transaccional abriria una ventana TOCTOU en un control de cuatro ojos. REST seria la respuesta si el vertical fuera otro deployable; dentro del mismo JVM paga serializacion, pierde la transaccion y expone secretos a cambio de un desacople que ya da una interfaz.

**Hecho: un puerto generico en el SPI.** `ProcessTaskConfigSource` (`configOf`, `siblingConfigOf`, `siblingConfigOfUnresolved`), implementado UNA vez por el motor en `ProcessTaskDefinitionConfigSource`. Las dos interfaces del vertical y sus dos adaptadores desaparecen; SBS lo hereda sin escribir el suyo. `resolveConfig` tambien se fue: `ConfigurationMapper.resolveSecretsIn` del SPI ya hacia exactamente eso.

**Y se cerro un fail-open.** La interfaz vieja traia `taskConfigUnresolved` como `default` que delegaba en la version resuelta: quien no lo sobreescribiera persistia secretos en claro en el snapshot congelado. Con una sola implementacion se aguantaba (la unica productiva si lo sobreescribia); con un SPI que cada vertical nuevo implementa, no. Ahora es **abstracto**: el compilador obliga a decidir. El precio es que los dobles de test dejan de ser lambdas — y ese es el punto, la eleccion resuelto/sin-resolver queda escrita en cada prueba.

Con esto `platform-app/src/main` queda en **cero clases de vertical**.

Lo que **si** se queda en `platform-app`:

| Que | Por que |
|---|---|
| `Mt101ReflectionRegistrationsTest` | Prueba de guardia que compara contra el registro central del motor: necesita ver ambos modulos |

#### Tercer modulo: `vertical-iso20022`

PAIN.001 tenia 602 lineas de andamiaje en `platform-app` y **no esta implementado**: `PAIN001_PARSE` ni siquiera esta dado de alta como tipo de tarea (el propio spec del frontend lo afirma con `expect(types).not.toContain(...)`). Se saca a modulo propio como **proyecto base**, para que implementarlo mas adelante no signifique volver a desenredarlo de MT101.

Trae una **dependencia deliberada entre verticales** (`vertical-iso20022` -> `vertical-swift-mt101`): `Pain001ToMt101Mapper` normaliza el mensaje a `Mt101Message` para reusar el pipeline downstream, y eso ES lo que hace este vertical hoy. Se prefirio a esconder el mapper en `platform-app`, donde el MOTOR terminaria conociendo dos verticales — justo lo que el trinquete existe para impedir. Al implementar ISO 20022 de verdad esa dependencia debe desaparecer; si no desaparece, la conversion dejo de ser transitoria y hay que revisarla.

Las pruebas del vertical viajaron con el (48 archivos). Dejaron de instanciar `JsonConfigurationMapper` del motor — que arrastraba toda la resolucion de secretos solo para parsear un JSON — y usan un doble del contrato. La expansion real de `${secret:...}` se sigue probando donde vive, en `JsonConfigurationMapperTest`.

Se añadio una **guardia al propio trinquete**: falla si el importador deja de ver alguno de los dos espacios de paquetes. Sin ella, mover el vertical a otro paquete deja todas las reglas pasando por vacio — que es exactamente lo que paso en la fase 2 y dejo colarse 14 dependencias nuevas. Un trinquete ciego reporta verde.

### Fase C — la correccion de staging pasa a ser capacidad del motor (2026-07-28)

La decision 3 decia que `staging_record` es del nucleo y que su correccion debia promoverse. Estaba sin hacer: el vertical abria la transaccion, aplicaba el merge-patch, hacia el `update ... where version = ?` y commiteaba, todo con SQL propio contra una tabla que no es suya.

Se partio en tres piezas, en `platform-spi`:

- **`StagingRowCorrectionService`** (motor) — el algoritmo entero: transaccion, If-Match, merge-patch RFC 7386, bump de version con lock optimista, hashes de evidencia y commit/rollback.
- **`StagingCorrectionPolicy`** (puerto) — *si* la fila puede editarse. MT101 aporta el veto por rebuild APPROVED/BUILDING.
- **`StagingCorrectionJournal`** (puerto) — *donde* se archiva la evidencia. Cada vertical tiene su tabla con las columnas de su estandar.

Ambos puertos se invocan **dentro** de la transaccion, con la misma conexion. No es estilo: chequear el veto en otra conexion abriria una ventana TOCTOU —el rebuild podria aprobarse entre el chequeo y el `UPDATE`— y archivar la evidencia fuera dejaria correcciones sin rastro. Son **parametros y no beans inyectados**: no existe un discriminador de vertical que el motor pueda resolver, y fingir que existe termina en ambiguedad de CDI o en un registro por nombre.

Efecto medible: `Mt101StagingRecordRepository` perdio sus **tres** metodos de escritura (dos ya estaban muertos desde antes) y quedo de solo lectura sobre `staging_record`. El vertical no tiene ni una sentencia de escritura contra la tabla del nucleo.

Lo que **no** se movio, a proposito: resolver a que fragmento pertenece la fila y exigir que este RECHAZADO es logica de SWIFT (usa la referencia `:20:`), y sigue en el vertical. El motor identifica la fila por `stagingId` y nada mas; el vertical traduce el conflicto a su vocabulario (`fila N del archivo`) para que el 409 siga nombrando lo que el operador vio en pantalla.

El gate se verifico con dos suites que prueban cosas distintas: la del vertical (7 casos contra Postgres real) cubre el SQL; `StagingRowCorrectionServiceTest` (9 casos con dobles de JDBC) cubre el **orden** de las llamadas y el rollback en cada modo de fallo —veto, If-Match, carrera perdida en el `UPDATE`, journal caido, fila inexistente— que contra una BD real no se puede afirmar. Costo por fila corregida sin cambios: 5 conexiones antes y despues.

### Los readers de vertical salen del motor (2026-07-28)

Quedaban dos clases ENTERAS de vertical viviendo en `com.integrationhub.platform.provider.reader`: `SwiftMtReaderProvider` y `Pain001XmlReaderProvider`. Eran las unicas cuatro entradas del freeze store de ArchUnit (dos reglas × dos clases) y pesaban mas que los literales sueltos: un vertical nuevo que trajera su propio formato de lectura no tenia donde ponerlo salvo el paquete del motor.

Se movieron a `vertical-swift-mt101/…/provider/reader` y `vertical-iso20022/…/provider/reader`, con sus pruebas. La mudanza resulto ser **solo relocacion**: ambas dependian exclusivamente de `platform-spi` (`ReaderProvider`, `ReadBatch`, `SourcePayload`) y ningun codigo las referenciaba por clase —los verticales usan sus constantes de tipo (`"SWIFT_MT"`, `"PAIN001_XML"`) y solo las nombran en comentarios—. El descubrimiento sigue siendo por CDI, ahora desde el indice Jandex de cada vertical.

**El freeze store de ArchUnit quedo en CERO** para las cuatro reglas. La deuda congelada que queda son los dos literales de `FROZEN_LITERAL_FILES` (`BackgroundProcessExecutionDispatcher` con `"MT101_PAY"`, `FileReadTaskFastPath` con `"MT101_PARSE"`), que se cierran declarando capacidades en el SPI en vez de preguntar por el tipo.

### Limitacion de verificacion conocida

Las registraciones de `@RegisterForReflection` son **inertes en JVM**: solo actuan en la imagen nativa. Ni dev, ni los tests, ni un build JVM validan que sigan siendo efectivas (se intento inspeccionar `generated-bytecode.jar` y `quarkus-application.dat`; ninguno da evidencia confiable). La equivalencia se apoya en que la anotacion se resuelve por el indice del modulo, identico antes y despues. **La prueba real es el proximo build nativo.** Como mitigacion hay un test que falla si una entrada desaparece del vertical o si el registro central del motor vuelve a nombrar un tipo de vertical — prueba que sigan declaradas, no que GraalVM las use.

## Alcance / lo que NO entra

- ~~**No** se extrae MT101 a modulo Maven en este ADR (decision 5; queda la fase E como opcional posterior).~~ **Ya no aplica**: se extrajo en la fase 3 (ver *Correccion de la decision 5*). Lo que sigue sin entrar es separar el deployable o la base de datos.
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
- Implementacion (2026-07-27): `spi/process/ProcessDefinitionValidator.java` + `spi/process/ProcessTaskView.java` (SPI de validacion de publicacion), `service/Mt101ReflectionRegistrations.java` (reflexion nativa por vertical), `api/resource/payments/` y `api/response/payments/` (endpoints/DTOs reubicados).
- Trinquete: `src/test/java/.../architecture/VerticalBoundaryArchTest.java`, `src/test/resources/archunit.properties`, store versionado en `platform-app/archunit_store/`. Para descongelar lo que se arregla: `mvn -pl platform-app test -Dtest=VerticalBoundaryArchTest` (FreezingArchRule poda solo las violaciones que dejan de existir).
- Codigo verificado (friccion frontend): `libs/core/services/src/lib/managers/process-task-manager.service.ts` (filtro `origin === 'REMOTE'`), `libs/features/processes/src/lib/flow/process-flow.presentation.ts` (`startsWith('MT101_')` + categorias fijas), `libs/features/processes/src/lib/catalog/process-catalog-page.ts` (composition-root con 12 imports), `libs/core/services/src/lib/presentation/resource-presentation.maps.ts` (`Record` total), `libs/core/i18n/src/lib/dictionaries/es.ts` / `en.ts` (247 claves MT101).
- Codigo verificado (acoplamiento entrante): `service/NativeReflectionRegistrations.java`, `service/process/ProcessCatalogService.java` + 4 `Mt101*Validator`, `service/execution/async/BackgroundProcessExecutionDispatcher.java`, `service/execution/fastpath/FileReadTaskFastPath.java`, `spi/security/PlatformRoles.java`, `api/resource/execution/Mt101*Resource.java`, `api/response/execution/Mt101*Response.java`.
- Codigo verificado (auditoria payment-shaped): `platform-contract/.../audit/AuditEnvelope.java`, `entity/AuditRecordEvent.java`, `repository/AuditRecordEventRepository.java`, `db/migration/V23__audit_record_operational_keys.sql`, `audit-consumer/src/main/resources/clickhouse/audit_record_event.sql`.
- Codigo verificado (esquema): `db/migration/V12`, `V14` (las 2 FKs cruzadas), `V15`/`V31`/`V34`/`V90`/`V93` (`staging_record` dirigida por MT101), `repository/Mt101StagingRecordRepository.java` (UPDATE al nucleo), `service/Mt101StagingCorrectionService.java` (transaccion cruzada), `repository/Mt101RebuildRepository.java` (INSERT...SELECT y JOIN cruzados del maker-checker).
