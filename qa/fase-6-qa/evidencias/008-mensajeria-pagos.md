# Evidencia QA - Mensajeria de pagos (spec 008)

## Contexto

- Fecha de evidencia: 2026-06-12 y hardening adicional 2026-06-13.
- Feature: `specs/008-mensajeria-pagos`.
- Alcance: flujo SWIFT MT101 outbound, inbound base, alto volumen, reproceso funcional y formularios de configuracion MT101/SWIFT.
- Dependencias: motor de procesos de `003-diseno-y-ejecucion-procesos`, readers de `002-catalogo-readers`, observabilidad/auditoria de `004-observabilidad-y-auditoria`.

## Resultado ejecutivo

| Resultado | Estado | Evidencia |
| --- | --- | --- |
| Flujo masivo desde archivo comun | PASS | Proceso web `#5883` completo con 1,000,000 registros validos y 20,000 mensajes MT101/fragmentos enviados al gateway simulado. |
| Flujo MT101 outbound completo | PASS | Proceso web `#5884` completo con `FILE_READ -> MT101_BUILD -> MT101_SPLIT -> MT101_REPAIR -> MT101_NVR/MT101_VALIDATE -> MT101_ROUTE -> MT101_ARCHIVE -> MT101_PAY -> MT101_STATUS -> MT101_RECONCILE`. |
| Flujo MT101 inbound base | PASS | Proceso web `#5885` completo con `FILE_READ(SWIFT_MT) -> MT101_PARSE -> MT101_ROUTE`. |
| Pruebas backend MT101 focalizadas | PASS | `mvn -q -pl platform-app test "-Dtest=Mt101AllTasksProcessE2EIT,Mt101OutboundEndToEndIT,Mt101SplitRepairIT,Mt101MassivePipelinePerfIT,Mt101ArchiveTaskProviderTest,Mt101BuildFromTableTaskProviderTest,Mt101BuildTaskProviderTest,Mt101ParseTaskProviderTest,Mt101PayTaskProviderTest,Mt101ReconcileTaskProviderTest,Mt101RepairTaskProviderTest,Mt101RouteTaskProviderTest,Mt101SplitTaskProviderTest,Mt101StatusTaskProviderTest,Mt101ValidateTaskProviderTest,Mt101ValidateTaskProviderIssueHandlingTest,SwiftMtReaderProviderTest" "-DargLine=-Xmx768m"`. |
| Pruebas frontend | PASS con advertencia | `cmd.exe /c "cd frontend && npx nx test web --skip-nx-cache"`: 50 archivos y 167 tests pasaron. Nx reporto `web:test` como flaky aunque la ejecucion termino exitosa. |
| Hardening pendiente ejecutado | PASS | 2026-06-12: se agregaron negativos estructurales MT101 y reproceso por fragmentos; la suite MT101 extendida paso con REST/SFTP, perfiles simulados, E2E, validacion y reconciliacion. |

## Datos de prueba registrados

| Dato de prueba | Ruta | Uso | Estado |
| --- | --- | --- | --- |
| `payment-rules` perfil estricto | `qa/fase-6-qa/perfiles-simulados/bank-sim-estricto.json` | Import por `POST /api/payment-validation-rules/import`; valida `MT101_NVR/MT101_VALIDATE` con `ruleSet=bank:SIM-ESTRICTO`. | Fixture versionado y probado por `BankProfileHomologationIT`; carga local/dev disponible en `qa/fase-6-qa/perfiles-simulados/payment-validation-rule-seed.sql`. |
| `payment-rules` perfil flexible | `qa/fase-6-qa/perfiles-simulados/bank-sim-flexible.json` | Fixture de onboarding para `ruleSet=bank:SIM-FLEXIBLE`; permite probar variaciones de moneda, cargos y limites. | Fixture versionado; carga local/dev disponible en `qa/fase-6-qa/perfiles-simulados/payment-validation-rule-seed.sql`; pendiente de ejecucion E2E dedicada si se prioriza. |
| Seed SQL `payment-rules` simulados | `qa/fase-6-qa/perfiles-simulados/payment-validation-rule-seed.sql` | Inserta/actualiza 13 reglas ficticias en `public.payment_validation_rule`: 8 estrictas y 5 flexibles. | DISPONIBLE para bases dev/homologacion con migraciones V12-V14 aplicadas. |
| Perfiles reales `bank:*` | Base de datos de cada ambiente, tabla `payment_validation_rule` | Reglas H2H reales por banco, cargadas como datos de ambiente y no versionadas en este repo template. | PENDIENTE por guias licenciadas del banco. |

## Estado global por tarea

> Nota: `MT101_NVR` es el nombre funcional/visual de la tarea de validacion NVR.
> En el contrato ejecutable del motor el task type registrado es `MT101_VALIDATE`.

| Tarea funcional | Task type ejecutable | Estado global | Cobertura actual |
| --- | --- | --- | --- |
| `MT101_BUILD` | `MT101_BUILD` | VERDE funcional | Web outbound, unitarios y composicion FIN/JSON/XML. |
| `MT101_PARSE` | `MT101_PARSE` | AMARILLO | Inbound base web y unitarios; faltan golden files reales por banco. |
| `MT101_SPLIT` | `MT101_SPLIT` | VERDE tecnico | Split por transacciones/bytes, `:28D:` y referencias por fragmento. |
| `MT101_REPAIR` | `MT101_REPAIR` | AMARILLO alto | Reparaciones preventivas probadas; falta evidencia con perfil bancario real. |
| `MT101_NVR` | `MT101_VALIDATE` | VERDE tecnico | NVR estructural, perfiles simulados, issues persistidos y negativos FIN/campos. |
| `MT101_ARCHIVE` | `MT101_ARCHIVE` | VERDE funcional | Archivo, hash, transacciones y fragmentos. |
| `MT101_PAY` | `MT101_PAY` | VERDE tecnico | REST, SFTP, retries, idempotencia y reproceso por fragmento. |
| `MT101_ROUTE` | `MT101_ROUTE` | AMARILLO | Routing outbound/inbound probado; faltan reglas conflictivas/prioridad. |
| `MT101_RECONCILE` | `MT101_RECONCILE` | AMARILLO | Dataset aislado backend; falta web en base limpia y mismatches avanzados. |
| `MT101_STATUS` | `MT101_STATUS` | AMARILLO | REST query simulado; faltan estados reales del banco/poll/callback. |

## Evidencia web

| Ejecucion | Proceso | Estado | Cobertura | Observaciones |
| --- | --- | --- | --- | --- |
| `#5883` | `process-mt101-browser-20260612004436` | COMPLETED | Archivo de 1,000,000 registros, staging, build masivo, validacion, archivo y pago simulado. | El gateway simulado recibio 20,000 mensajes MT101/fragmentos. Esto no equivale a 20,000 pagos: corresponde a 1,000,000 transacciones agrupadas en mensajes de 50 transacciones. |
| `#5884` | `process-mt101-all-web-202606121525` | COMPLETED | Outbound con todas las tareas principales `MT101_*`. | `FILE_READ` leyo 6 registros validos; `MT101_BUILD` compuso 1 mensaje con 6 transacciones; `MT101_SPLIT` genero 3 fragmentos; `MT101_REPAIR` aplico 6 cambios; `MT101_NVR/MT101_VALIDATE` produjo 0 issues; `MT101_ROUTE` enruto 3 mensajes; `MT101_ARCHIVE` archivo 3 mensajes; `MT101_PAY` acepto 3; `MT101_STATUS` confirmo 3; `MT101_RECONCILE` cruzo 3 confirmaciones. |
| `#5885` | `process-mt101-inbound-web-202606121525` | COMPLETED | Inbound base con lectura FIN, parseo y routing. | `FILE_READ` leyo 1 mensaje; `MT101_PARSE` parseo 1 mensaje con 2 transacciones y 0 errores; `MT101_ROUTE` enruto a `INBOUND_REVIEW`. |
| UI browser 2026-06-12 | `http://127.0.0.1:8080/#/processes` | PARCIAL | Login Keycloak `admin`, listado de procesos, detalle y modo edicion. | Se verifico paleta con `BUILD`, `BUILD DB`, `NVR`, `ARCHIVE`, `PAY`, `ROUTE`, `RECON`, `STATUS`, `PARSE`, `SPLIT`, `REPAIR` y nodos de las 10 tareas MT101. No se logro capturar el panel de formulario del nodo desde automatizacion; queda como evidencia visual pendiente. |

### Nota de reconciliacion

La ejecucion web `#5884` reporto `unmatchedSent=60000` porque el ambiente local compartia registros archivados de pruebas masivas previas. La reconciliacion aislada se cubre en pruebas backend con dataset controlado. Para cierre productivo se debe repetir el escenario web en una base limpia o con `batchId/processExecutionId` aislado.

## Evidencia automatizada

| Capa | Comando | Resultado | Lectura |
| --- | --- | --- | --- |
| Backend MT101 | `mvn -q -pl platform-app test "-Dtest=Mt101AllTasksProcessE2EIT,Mt101OutboundEndToEndIT,Mt101SplitRepairIT,Mt101MassivePipelinePerfIT,Mt101ArchiveTaskProviderTest,Mt101BuildFromTableTaskProviderTest,Mt101BuildTaskProviderTest,Mt101ParseTaskProviderTest,Mt101PayTaskProviderTest,Mt101ReconcileTaskProviderTest,Mt101RepairTaskProviderTest,Mt101RouteTaskProviderTest,Mt101SplitTaskProviderTest,Mt101StatusTaskProviderTest,Mt101ValidateTaskProviderTest,Mt101ValidateTaskProviderIssueHandlingTest,SwiftMtReaderProviderTest" "-DargLine=-Xmx768m"` | PASS | Cubre providers MT101, reader SWIFT_MT, E2E outbound/inbound y prueba de volumen controlada. |
| Backend volumen | Incluido en `Mt101MassivePipelinePerfIT` | PASS | 20,000 registros de staging generaron 800 fragmentos. La prueba midio heap y tiempo de build, validacion y archivo. |
| Backend hardening | `mvn -q -pl platform-app test "-Dtest=Mt101AllTasksProcessE2EIT,Mt101OutboundEndToEndIT,Mt101SplitRepairIT,Mt101MassivePipelinePerfIT,BankProfileHomologationIT,PaymentValidationRuleResourceIT,DbValidationRuleProviderTest,Mt101ArchiveTaskProviderTest,Mt101BuildFromTableTaskProviderTest,Mt101BuildTaskProviderTest,Mt101ParseTaskProviderTest,Mt101PayFragmentReprocessTest,Mt101PayTaskProviderTest,Mt101ReconcileTaskProviderTest,Mt101RepairTaskProviderTest,Mt101RouteTaskProviderTest,Mt101SplitTaskProviderTest,Mt101StatusTaskProviderTest,Mt101ValidateTaskProviderTest,Mt101ValidateTaskProviderIssueHandlingTest,RestPaymentTransportTest,SftpPaymentTransportTest,SwiftMtReaderProviderTest" "-DargLine=-Xmx768m"` | PASS | Agrega perfiles bancarios simulados, API de reglas, REST 4xx/5xx/idempotencia, SFTP con rename, validacion negativa extendida y reproceso explicito de fragmentos `REJECTED`. |
| Validacion negativa MT101 | `Mt101ValidateTaskProviderTest` | PASS | 24 tests. Cubre BIC invalido, payload FIN mayor a 10 KB, cuenta >34, `:70:` >4x35, `:77B:` >3x35, `:32B:` >15 digitos, `:71A:` invalido y referencia `:21:` duplicada. |
| Perfiles bancarios simulados | `mvn -q -pl platform-app test "-Dtest=BankProfileHomologationIT,PaymentValidationRuleResourceIT,DbValidationRuleProviderTest" "-DargLine=-Xmx768m"` | PASS | Verifica catalogo `payment_validation_rule`, import/API y homologacion con perfil simulado. |
| Reproceso tecnico | `Mt101PayFragmentReprocessTest` | PASS | 2 tests. PAY envia solo `ARCHIVED` por defecto y permite reprocesar explicitamente solo fragmentos `REJECTED` sin regenerar el lote. |
| Frontend | `cmd.exe /c "cd frontend && npx nx test web --skip-nx-cache"` | PASS | 50 archivos de prueba y 167 tests pasaron. Queda advertencia de flakiness reportada por Nx. |
| Hardening SOLID MT101 | `mvn -q -pl platform-app test "-Dtest=Mt101AllTasksProcessE2EIT,Mt101OutboundEndToEndIT,Mt101SplitRepairIT,Mt101ArchiveTaskProviderTest,Mt101BuildFromTableTaskProviderTest,Mt101BuildTaskProviderTest,Mt101ParseTaskProviderTest,Mt101PayFragmentReprocessTest,Mt101PayTaskProviderTest,Mt101ReconcileTaskProviderTest,Mt101RepairTaskProviderTest,Mt101RouteTaskProviderTest,Mt101SplitTaskProviderTest,Mt101StatusTaskProviderTest,Mt101ValidateTaskProviderTest,Mt101ValidateTaskProviderIssueHandlingTest,RestPaymentTransportTest,SftpPaymentTransportTest,SwiftMtReaderProviderTest" "-DargLine=-Xmx768m"` | PASS | Verifica Flyway V18, idempotencia operacional `sender_lt + :20: + anio`, linaje de issues NVR por fragmento y SFTP `SKIP_IF_SAME_HASH` con SHA-256 real. |

## Matriz por tarea

| Tarea | Estado | Que hace | Cobertura actual | Falta principal |
| --- | --- | --- | --- | --- |
| `FILE_READ` | VERDE | Lee archivos comunes (`csv`, `txt`, Excel) y SWIFT MT/FIN mediante readers configurables. | Probado por web en outbound masivo, outbound completo e inbound FIN. | Mas negativos de encoding, archivos corruptos y duplicados por fuente. |
| `DB_WRITE` | VERDE | Persiste staging para procesos masivos y expone linaje de ejecucion/tarea. | Usado en `#5883` para 1,000,000 registros. | Medir con base limpia y perfiles de indices reales. |
| `MT101_BUILD` | VERDE funcional | Construye la estructura SWIFT MT101 desde archivo/outputs previos con mapping dinamico. | Probado en web, unitarios y E2E outbound. | Mas casos negativos de mapping incompleto, multi-debito/subsidiarias y reglas de banco. |
| `MT101_BUILD_FROM_TABLE` | VERDE tecnico | Construye MT101 paginado desde staging para alto volumen y reproceso. | Prueba masiva backend y proceso web `#5883`. | Repetir con 1,000,000 en ambiente controlado con metricas persistidas. |
| `MT101_PARSE` | AMARILLO | Convierte FIN/MT101 inbound a estructura tipada. | Probado inbound base web y tests unitarios. | Golden files reales por banco, multi-mensaje y errores parciales. |
| `MT101_SPLIT` | VERDE tecnico | Divide mensajes por limite de transacciones/bytes y recalcula `:28D:`. | Probado en web/backend, con limite de bytes y referencias unicas por fragmento. | Casos de homologacion bancaria con limites propietarios. |
| `MT101_REPAIR` | AMARILLO alto | Sanitiza, trunca y normaliza campos antes de validacion/envio. | Probado en web y backend. | Evidencia de reparacion por perfil bancario real. |
| `MT101_NVR` (`MT101_VALIDATE`) | VERDE tecnico | Aplica NVR/reglas estructurales y ruleSets bancarios. | Probado con structural MVP, negativos de campos FIN, persistencia de issues y perfil bancario simulado. | Carga de perfiles reales `bank:*` desde guias H2H y golden files certificados. |
| `MT101_ROUTE` | AMARILLO | Clasifica mensajes hacia rutas de pago/revision por reglas. | Probado outbound e inbound. | Routing negativo por reglas conflictivas, prioridad y ruta por defecto auditada. |
| `MT101_ARCHIVE` | VERDE funcional | Persiste mensajes, transacciones, hash y estados de fragmentos. | Probado web/backend. | Retencion, cifrado y purga con volumen real. |
| `MT101_PAY` | VERDE tecnico | Envia MT101 por transporte configurado y registra resultado. | Probado REST con WireMock, SFTP con contenedor real, retries, idempotencia y errores. | Homologacion contra gateway bancario real y evidencias de rechazo semantico del banco. |
| `MT101_STATUS` | AMARILLO | Consulta confirmaciones del gateway y persiste estados. | Probado con REST simulado. | Poll/callback reales y estados intermedios del banco. |
| `MT101_RECONCILE` | AMARILLO | Cruza enviados, confirmaciones y excepciones. | Probado aislado backend y web con caveat de datos compartidos. | Repetir web en base limpia y casos de mismatch de monto/referencia. |
| `MT101_ARCHIVE` reproceso | VERDE tecnico | Permite reutilizar fragmentos archivados para reintentos. | `Mt101PayFragmentReprocessTest` cubre gate por estado y retry de `REJECTED`. | Escenario web/operativo de reproceso selectivo con datos productivos simulados. |
| `REST/NOTIFICATION` | ROJO | Integracion posterior a pago para notificar resultado. | No queda cubierto como parte central del spec 008. | Definir si pertenece al vertical SWIFT o al motor transversal y agregar caso E2E. |

## Brechas para aumentar cobertura

| Categoria | Casos pendientes |
| --- | --- |
| Validacion negativa MT101 | Cubierto: FIN mayor a 10 KB, conflicto `:50H:` A/B, `:70:` mayor a 4x35, `:77B:` mayor a 3x35, BIC invalido, monto invalido, `:32B:` mayor a 15 digitos, `:71A:` invalido y `:21:` duplicado. Pendiente: reglas propietarias reales por banco y golden files licenciados. |
| Transporte | Cubierto: REST 4xx/5xx, retries, idempotencia, SFTP `.part -> rename`, extension temporal, fallo SSH y duplicado remoto con hash SHA-256 distinto. Pendiente: gateway bancario real, timeout real de red y rechazo semantico certificado. |
| Reconciliacion | Enviado sin confirmacion, confirmacion sin enviado, monto distinto, referencia distinta, rechazo confirmado y confirmacion duplicada. |
| Perfiles bancarios | Carga de perfiles reales `bank:*` desde guias H2H licenciadas; perfiles objetivo: BCP, BBVA, Interbank, Santander, Citi y Scotiabank segun prioridad del cliente. |
| Reproceso | Cubierto tecnico: reproceso por `fragmentSource.statuses=["REJECTED"]` sin regenerar el lote. Pendiente: escenario web/operativo con seleccion de lote o fragmento desde UI. |
| UI | Cubierto parcial: login, listado, detalle, edicion y paleta MT101. Pendiente: evidencia visual de paneles de formulario `MT101_*` con mapping tipo `DB_WRITE`, scroll controlado y Angular Material consistente. |

## Criterio de salida actual

La vertical MT101 queda en estado **apta para validacion funcional, hardening tecnico y homologacion tecnica interna**, con evidencia de ejecucion web, backend y frontend. No queda certificada para produccion bancaria hasta cargar perfiles reales por banco, ejecutar golden files H2H y cerrar pruebas con gateway bancario real.

## Trazabilidad

- Casos QA: `qa/fase-6-qa/casos/008-mensajeria-pagos.md`.
- Spec tareas: `specs/008-mensajeria-pagos/spec-tareas.md`.
- ADR: `docs/fase-3-arquitectura/adr/ADR-009-vertical-mensajeria-pagos.md`.
