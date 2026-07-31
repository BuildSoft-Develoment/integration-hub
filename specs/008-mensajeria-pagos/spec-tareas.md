# Spec de tareas - Mensajeria de pagos

## Regla
Cada tarea es una FILA EJECUTABLE de la tabla `## Tabla ejecutable de tareas`. Las
rutas de `archivo` y `test` apuntan a entregables nuevos (spec `origin: nuevo`).
El estado se mantiene `pending` hasta que la evidencia formal RED-GREEN se
capture en `tdd-evidence.md`.

## Contexto
- Feature: `008-mensajeria-pagos`
- Spec funcional: `spec-funcional.md`
- Spec tecnica: `spec-tecnica.md`
- Entidades BD: `swift_message_envelope`, `mt101_archive`, `mt101_transaction`,
  `mt101_validation_issue`, `mt101_confirmation`,
  `mt101_reconciliation_exception`, `payment_validation_rule`,
  `mt101_build_fragment`
- Sub-catalogo activo: `swift/` (MT101 sprint 1)
- Dependencias bloqueantes del motor: M-1a (`TaskTypeRegistry`), M-1b
  (frontend discovery), M-2 (long-running), M-3 (multi-output) declaradas en
  spec 003.
- Gate: `gate-sdd-approved` (pendiente de validacion humana)

## Sprints

- **Sprint 1 (MVP outbound MT101)**: T-001 a T-012.
- **Sprint 2 (status, conciliacion, inbound, routing)**: T-013 a T-022.
- **Sprint 3 (split, repair, calendarios, ISO 20022 placeholder)**: T-023 a T-028.
- **Sprint 4 (hardening MT101 multi-debito/subsidiarias)**: T-029 a T-034.
- **Sprint 5 (alto volumen y reproceso MT101)**: T-035 a T-041.
- **Sprint 6 (perfiles bancarios operables)**: T-042 a T-046.
- **Sprint 7 (PAY correctivo gobernado y concurrencia)**: T-047 a T-052.
- **Sprint 8 (cierre P0 correctivo pre-homologacion)**: T-053 a T-057.
- **Sprint 9 (resolucion de incertidumbre y correctivo hijo)**: T-058 a T-060.

## Tabla ejecutable de tareas

### Sprint 1 - MVP outbound MT101

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-001 | RF-013 | impl | platform-app/src/main/resources/db/migration/V12__payments_mt101_schema.sql | platform-app/src/test/java/com/integrationhub/platform/migration/PaymentsMt101SchemaMigrationTest.java | mvn -pl platform-app -Dtest=PaymentsMt101SchemaMigrationTest test | FAIL sin migracion V12 | mvn -pl platform-app -Dtest=PaymentsMt101SchemaMigrationTest test | PASS | - | si | pending |
| T-002 | RF-011 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/spi/ValidationRuleProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/spi/ValidationRuleProviderTest.java | mvn -pl platform-app -Dtest=ValidationRuleProviderTest test | FAIL sin SPI | mvn -pl platform-app -Dtest=ValidationRuleProviderTest test | PASS | T-001 | si | pending |
| T-003 | RF-001 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101BuildTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101BuildTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101BuildTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101BuildTaskProviderTest test | PASS | spec 003 M-1a | si | pending |
| T-004 | RF-001 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/format/JsonMt101Formatter.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/format/JsonMt101FormatterTest.java | mvn -pl platform-app -Dtest=JsonMt101FormatterTest test | FAIL sin formatter | mvn -pl platform-app -Dtest=JsonMt101FormatterTest test | PASS | T-003 | si | pending |
| T-005 | RF-001 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/format/XmlMt101Formatter.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/format/XmlMt101FormatterTest.java | mvn -pl platform-app -Dtest=XmlMt101FormatterTest test | FAIL sin formatter | mvn -pl platform-app -Dtest=XmlMt101FormatterTest test | PASS | T-003 | si | pending |
| T-006 | RF-001 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/format/FinMt101Formatter.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/format/FinMt101FormatterTest.java | mvn -pl platform-app -Dtest=FinMt101FormatterTest test | FAIL sin formatter | mvn -pl platform-app -Dtest=FinMt101FormatterTest test | PASS | T-003 | si | pending |
| T-007 | RF-002 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ValidateTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ValidateTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101ValidateTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101ValidateTaskProviderTest test | PASS | T-002, T-003 | si | pending |
| T-008 | RF-003 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ArchiveTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ArchiveTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101ArchiveTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101ArchiveTaskProviderTest test | PASS | T-001, T-003 | si | pending |
| T-009 | RF-004, RF-016 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101PayTaskProvider.java + transport/RestPaymentTransport.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101PayTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101PayTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101PayTaskProviderTest test | PASS | T-008 | si | pending |
| T-010 | RF-019 | impl | el rol `payments-operator` ejecuta procesos y lee vistas operativas requeridas por la UI sin poder editar catalogos ni acciones admin | platform-app/src/test/java/com/integrationhub/platform/integration/PaymentsOperatorRoleIT.java | mvn -pl platform-app "-Dtest=PaymentsOperatorRoleIT" test | FAIL sin rol/lecturas operativas | mvn -pl platform-app "-Dtest=PaymentsOperatorRoleIT" test | PASS | - | si | pending |
| T-011 | RF-001, RF-002, RF-003, RF-004 | impl | frontend/libs/features/payments-swift/src/lib/components/mt101-build-form, mt101-validate-form, mt101-archive-form, mt101-pay-form | frontend/libs/features/payments-swift/src/lib/components/*.spec.ts | npx nx test payments-swift | FAIL sin componentes | npx nx test payments-swift | PASS | spec 003 M-1b, T-003..T-009 | si | pending |
| T-012 | RF-001, RF-002, RF-003, RF-004 | test | escenarios/payments-swift/mt101-outbound-mvp/ con fixtures de los 4 casos canonicos | tests/it/Mt101OutboundEndToEndIT.java | mvn -pl platform-app -Dtest=Mt101OutboundEndToEndIT verify | FAIL sin fixtures + ejecucion | mvn -pl platform-app -Dtest=Mt101OutboundEndToEndIT verify | PASS | T-003..T-011 | si | pending |

### Sprint 2 - Status, conciliacion, inbound, routing

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-013 | RF-005 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101StatusTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101StatusTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101StatusTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101StatusTaskProviderTest test | PASS | spec 003 M-2, T-009 | si | pending |
| T-014 | RF-006 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ReconcileTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ReconcileTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101ReconcileTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101ReconcileTaskProviderTest test | PASS | T-008, T-013 | si | pending |
| T-015 | RF-002, RF-008 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/reader/SwiftMtReaderProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/reader/SwiftMtReaderProviderTest.java | mvn -pl platform-app -Dtest=SwiftMtReaderProviderTest test | FAIL sin reader | mvn -pl platform-app -Dtest=SwiftMtReaderProviderTest test | PASS | - | si | pending |
| T-016 | RF-008 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ParseTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ParseTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101ParseTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101ParseTaskProviderTest test | PASS | spec 003 M-3, T-015 | si | pending |
| T-017 | RF-007 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101RouteTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101RouteTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101RouteTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101RouteTaskProviderTest test | PASS | T-016 | si | pending |
| T-018 | RF-017 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/transport/SftpPaymentTransport.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/transport/SftpPaymentTransportTest.java | mvn -pl platform-app -Dtest=SftpPaymentTransportTest test | FAIL sin transporte SFTP | mvn -pl platform-app -Dtest=SftpPaymentTransportTest test | PASS | T-009 | si | pending |
| T-019 | RF-018 | doc | contrato MQ de pagos | prueba futura MqPaymentTransportTest | mvn -pl vertical-swift-mt101 -Dtest=MqPaymentTransportTest test | MQ no pertenece al contrato ejecutable actual | mvn -pl vertical-swift-mt101 -Dtest=MqPaymentTransportTest test | MqPaymentTransportTest en verde con el transporte MQ registrado | T-009 | si | blocked |
| T-020 | RF-014, RF-021 | impl | platform-app/src/main/java/com/integrationhub/platform/service/payments/Mt101ArchiveEncryptionService.java | platform-app/src/test/java/com/integrationhub/platform/service/payments/Mt101ArchiveEncryptionServiceTest.java | mvn -pl platform-app -Dtest=Mt101ArchiveEncryptionServiceTest test | FAIL sin cifrado | mvn -pl platform-app -Dtest=Mt101ArchiveEncryptionServiceTest test | PASS | T-008 | si | pending |
| T-021 | RF-005, RF-006, RF-007, RF-008 | impl | frontend/libs/features/payments-swift/src/lib/components/mt101-status-form, mt101-reconcile-form, mt101-parse-form, mt101-route-form + reconciliation-board | frontend/libs/features/payments-swift/src/lib/components/*.spec.ts | npx nx test payments-swift | FAIL sin componentes | npx nx test payments-swift | PASS | T-013..T-017, M-1b | si | pending |
| T-022 | RF-005, RF-006, RF-007, RF-008 | test | escenarios/payments-swift/mt101-inbound-end-to-end/ + escenarios/payments-swift/mt101-reconciliation/ | tests/it/Mt101InboundEndToEndIT.java + Mt101ReconciliationIT.java | mvn -pl platform-app -Dtest=Mt101*IT verify | FAIL sin fixtures | mvn -pl platform-app -Dtest=Mt101*IT verify | PASS | T-013..T-021 | si | pending |

### Sprint 3 - Split, repair, calendarios, ISO 20022 placeholder

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-023 | RF-009 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101SplitTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101SplitTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101SplitTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101SplitTaskProviderTest test | PASS | T-003 | si | pending |
| T-024 | RF-010 | impl | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101RepairTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101RepairTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101RepairTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101RepairTaskProviderTest test | PASS | T-013 | si | pending |
| T-025 | RF-002 | impl | platform-app/src/main/java/com/integrationhub/platform/service/payments/BusinessCalendarService.java (PE, EU, US) | platform-app/src/test/java/com/integrationhub/platform/service/payments/BusinessCalendarServiceTest.java | mvn -pl platform-app -Dtest=BusinessCalendarServiceTest test | FAIL sin servicio | mvn -pl platform-app -Dtest=BusinessCalendarServiceTest test | PASS | T-007 | si | pending |
| T-026 | RF-009, RF-010 | impl | frontend/libs/features/payments-swift/src/lib/components/mt101-split-form, mt101-repair-form | frontend/libs/features/payments-swift/src/lib/components/*.spec.ts | npx nx test payments-swift | FAIL sin componentes | npx nx test payments-swift | PASS | T-023, T-024 | si | pending |
| T-027 | RF-012 | doc | specs/008-mensajeria-pagos/iso20022-pain001-design.md (placeholder de contratos pain.001) | - | node ci/scripts/check-docs.mjs | falla: no existe specs/008-mensajeria-pagos/iso20022-pain001-design.md | node ci/scripts/check-docs.mjs && node ci/scripts/check-markdown-paths.mjs | ambos gates en verde con el diseno pain.001 enlazado y sus rutas resueltas | T-002 | si | pending |
| T-028 | RF-009, RF-010 | test | escenarios/payments-swift/mt101-split-and-repair/ con casos de 28D y rechazos reparables | tests/it/Mt101SplitRepairIT.java | mvn -pl platform-app -Dtest=Mt101SplitRepairIT verify | FAIL sin fixtures | mvn -pl platform-app -Dtest=Mt101SplitRepairIT verify | PASS | T-023..T-026 | si | pending |

## Dependencias hacia spec 003 (motor)

Las siguientes tareas del spec 003 son **bloqueantes** para 008:

- M-1a `TaskTypeRegistry` backend: bloquea T-003 (no se puede registrar `MT101_BUILD`).
- M-1b descubrimiento frontend: bloquea T-011 y T-021 (formularios verticales).
- M-2 long-running tasks: bloquea T-013 (`MT101_STATUS` mode `poll`).
- M-3 multi-output: bloquea T-016 (`MT101_PARSE` multi-shape).

Ver el delta de tareas del motor en
[../003-diseno-y-ejecucion-procesos/spec-tareas.md](../003-diseno-y-ejecucion-procesos/spec-tareas.md)
seccion "Motor para verticales (ADR-009)".

### Sprint 4 - Hardening MT101 multi-debito/subsidiarias

| id | rf | tipo | objetivo verificable | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-029 | RF-001, RF-002 | impl | `MT101_BUILD` declara `debitAccountMode` y rechaza colocaciones invalidas de `:50a:` antes de formatear | Mt101BuildTaskProviderTest | mvn -pl platform-app -Dtest=Mt101BuildTaskProviderTest test | FAIL si acepta Sequence A y B a la vez | mvn -pl platform-app -Dtest=Mt101BuildTaskProviderTest test | PASS | T-003 | si | done |
| T-030 | RF-002 | impl | `MT101_VALIDATE` agrega reglas estructurales propietarias para placement, duplicados, fecha, BIC y charset basico | Mt101ValidateTaskProviderTest | mvn -pl platform-app -Dtest=Mt101ValidateTaskProviderTest test | FAIL si no detecta placement invalido | mvn -pl platform-app -Dtest=Mt101ValidateTaskProviderTest test | PASS | T-007 | si | done |
| T-031 | RF-003, RF-013 | impl | `MT101_ARCHIVE` persiste datos completos de Sequence A/B relevantes para multi-debito y subsidiarias | Mt101ArchiveTaskProviderTest | mvn -pl platform-app -Dtest=Mt101ArchiveTaskProviderTest test | FAIL si pierde ordering customer por transaccion | mvn -pl platform-app -Dtest=Mt101ArchiveTaskProviderTest test | PASS | T-008 | si | done |
| T-032 | RF-001, RF-004, RF-009, RF-010 | impl | tareas MT101 consumen mensajes directos o records `{message}` de tareas previas mediante contrato comun | Mt101ValidateTaskProviderTest, Mt101ArchiveTaskProviderTest, Mt101PayTaskProviderTest | mvn -pl platform-app -Dtest=Mt101*TaskProviderTest test | FAIL si `ARCHIVE -> PAY/VALIDATE` no resuelve mensajes | mvn -pl platform-app -Dtest=Mt101*TaskProviderTest test | PASS | T-007..T-010 | si | done |
| T-033 | RF-001, RF-004 | impl | `MT101_BUILD` guia `singleDebit/multipleDebit/subsidiary` y `MT101_PAY` solo ofrece transportes backend soportados | mt101-build-task.provider.spec.ts, mt101-pay-task.provider.spec.ts | npx nx test core-providers | FAIL si UI permite MQ o mapping contradictorio | npx nx test core-providers | PASS | T-011 | si | done |
| T-034 | RF-001, RF-004, RF-017 | impl | fast-path no captura `MT101_BUILD` y SFTP nace con host key checking estricto | FileReadTaskFastPathTest, SftpPaymentTransportTest | mvn -pl platform-app -Dtest=FileReadTaskFastPathTest,SftpPaymentTransportTest test | FAIL si fast-path pierde outputs o SFTP acepta default inseguro | mvn -pl platform-app -Dtest=FileReadTaskFastPathTest,SftpPaymentTransportTest test | PASS | T-003, T-018 | si | done |

### Sprint 5 - Alto volumen y reproceso MT101

| id | rf | tipo | objetivo verificable | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-035 | RF-013, RF-022 | impl BD | existe almacenamiento de fragmentos MT101 con indices por lote, estado y ejecucion para reproceso | V14__mt101_massive_fragments.sql | mvn -pl platform-app -DskipTests compile | FAIL sin tabla `mt101_build_fragment` o codigos largos | mvn -pl platform-app -DskipTests compile | PASS | T-001 | si | done |
| T-036 | RF-001, RF-022 | impl | `MT101_BUILD_FROM_TABLE` lee staging paginado y genera fragmentos sin cargar todo el archivo en memoria | Mt101BuildFromTableTaskProviderTest | mvn -pl platform-app -Dtest=Mt101BuildFromTableTaskProviderTest test | FAIL si no crea multiples fragmentos desde staging | mvn -pl platform-app -Dtest=Mt101BuildFromTableTaskProviderTest test | PASS | T-003, T-035, spec 003 DB_WRITE | si | done |
| T-037 | RF-002, RF-003, RF-004, RF-022 | impl | `VALIDATE`, `ARCHIVE` y `PAY` consumen referencias persistidas de fragmentos y actualizan estado operacional | Mt101ValidateTaskProviderTest, Mt101ArchiveTaskProviderTest, Mt101PayTaskProviderTest | mvn -pl platform-app -Dtest=Mt101ValidateTaskProviderTest,Mt101ArchiveTaskProviderTest,Mt101PayTaskProviderTest test | FAIL si no resuelve `{fragmentSetId}` | mvn -pl platform-app -Dtest=Mt101ValidateTaskProviderTest,Mt101ArchiveTaskProviderTest,Mt101PayTaskProviderTest test | PASS | T-007..T-009, T-035 | si | done |
| T-038 | RF-001, RF-022 | impl | `FILE_READ -> DB_WRITE` publica linaje de ejecucion/tarea para que el build masivo filtre su staging | FileReadTaskFastPathTest | mvn -pl platform-app -Dtest=FileReadTaskFastPathTest test | FAIL si DB_WRITE no expone `processExecutionId` y `taskDefinitionId` | mvn -pl platform-app -Dtest=FileReadTaskFastPathTest test | PASS | spec 003 DB_WRITE | si | done |
| T-039 | RF-002, RF-011 | impl | validaciones estructurales cubren limite FIN 10KB, longitudes 50/52/57/59, 70, 77B, 32B y 71A con codigos largos | Mt101ValidateTaskProviderTest | mvn -pl platform-app -Dtest=Mt101ValidateTaskProviderTest test | FAIL si acepta payload FIN fuera de limite o campos invalidos | mvn -pl platform-app -Dtest=Mt101ValidateTaskProviderTest test | PASS | T-030, T-035 | si | done |
| T-040 | RF-001, RF-022 | impl | la UI registra `MT101_BUILD_FROM_TABLE` y reutiliza el mapping tipo DB_WRITE con fuente, metadata, variables y columnas previas | mt101-build-from-table-task.provider.spec.ts, mt101-build-task.provider.spec.ts | npx nx test web --skip-nx-cache | FAIL si el tipo no existe o no serializa limites de fragmento | npx nx test web --skip-nx-cache | PASS | T-033 | si | done |
| T-041 | RF-003, RF-004, RF-022 | impl frontend/backend | `MT101_ARCHIVE` y `MT101_PAY` se configuran como `once` para procesar el lote/referencia de fragmentos completo | mt101-archive-task.provider.spec.ts, mt101-pay-task.provider.spec.ts | npx nx test web --skip-nx-cache | FAIL si la UI conserva `batch` o `per-record` | npx nx test web --skip-nx-cache | PASS | T-037 | si | done |

### Sprint 6 - Perfiles bancarios operables

| id | rf | tipo | objetivo verificable | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-042 | RF-011, RF-023 | impl | existe API `/api/payment-validation-rules` para CRUD, activar/desactivar, import y export de ruleSets | testCompile + pruebas servicio/API | mvn -pl platform-app test-compile | FAIL sin recurso/DTO/service | mvn -pl platform-app test-compile | PASS | T-002, T-035 | si | done |
| T-043 | RF-011 | impl | `DbValidationRuleProvider` filtra en SQL por `ruleSet`, `standard`, `appliesTo` y solo carga reglas activas | DbValidationRuleProviderTest | mvn -pl platform-app -Dtest=DbValidationRuleProviderTest test | FAIL si mezcla bank:OTHER o reglas inactivas | mvn -pl platform-app -Dtest=DbValidationRuleProviderTest test | PASS | T-042 | si | done |
| T-044 | RF-002, RF-022 | impl | `MT101_VALIDATE` persiste issues opcionalmente y limita `errors` en outputs para cargas masivas | Mt101ValidateTaskProviderIssueHandlingTest | mvn -pl platform-app -Dtest=Mt101ValidateTaskProviderIssueHandlingTest test | FAIL si retiene todos los issues o no inserta en tabla | mvn -pl platform-app -Dtest=Mt101ValidateTaskProviderIssueHandlingTest test | PASS | T-037, T-042 | si | done |
| T-045 | RF-023 | impl | existe pantalla admin `payment-rules` para gestionar perfiles, activar/desactivar e importar/exportar JSON, con guards RBAC y capacidades `audit-*` alineados a ADR-003 | payment-validation-rule-api.service.spec.ts, payment-validation-rules-page.spec.ts, auth-access.service.spec.ts, app-section-access.policy.spec.ts | npm run test -- --watch=false | FAIL sin ruta/guards/specs de API UI | npm run test -- --watch=false | PASS | T-042 | si | done |
| T-046 | RF-011, RF-023 | qa/config | perfiles reales se cargan por ambiente desde guia H2H licenciada y se validan con golden files | evidencia QA por banco | - | pendiente de guia bancaria real | - | pendiente de cliente/banco | T-042..T-045 | no | pending |

### Sprint 7 - PAY correctivo gobernado y concurrencia

| id | rf | tipo | objetivo verificable | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-047 | RF-024 | impl BD | el rebuild correctivo guarda hash solicitado/clamado, lease y detalle de PAY por fragmento | V44__mt101_corrective_pay_hash_uncertain_partial.sql | mvn -pl platform-app -DskipTests compile | FAIL sin columnas V44 o tabla de detalle | mvn -pl platform-app -DskipTests compile | PASS | T-035, T-042 | si | done |
| T-048 | RF-024 | impl | `requestPay` guarda el hash del payload archivado y `approveAndPay` invalida si el payload cambia antes de enviar | Mt101CorrectiveLifecycleServiceTest | mvn -pl platform-app -Dtest=Mt101CorrectiveLifecycleServiceTest test | FAIL si envia con hash distinto | mvn -pl platform-app -Dtest=Mt101CorrectiveLifecycleServiceTest test | PASS | T-047 | si | done |
| T-049 | RF-024 | impl | PAY correctivo persiste resultado por fragmento y calcula `SENT`, `PARTIALLY_SENT` o `FAILED` sin marcar todo el lote igual | Mt101CorrectiveLifecycleServiceTest | mvn -pl platform-app -Dtest=Mt101CorrectiveLifecycleServiceTest test | FAIL si mezcla aceptados/rechazados como exito total | mvn -pl platform-app -Dtest=Mt101CorrectiveLifecycleServiceTest test | PASS | T-047 | si | done |
| T-050 | RF-024 | impl | scheduler sincroniza lifecycles correctivos en datasource default y conexiones JDBC activas, y convierte PAY vencido en `UNCERTAIN` | Mt101RebuildServiceTest | mvn -pl platform-app -Dtest=Mt101RebuildServiceTest test | FAIL si reintenta automaticamente un PAY incierto | mvn -pl platform-app -Dtest=Mt101RebuildServiceTest test | PASS | T-047, spec 005 | si | done |
| T-051 | RF-024 | impl frontend/backend | correccion de staging exige version `If-Match`; sin version retorna 400 y con version obsoleta retorna conflicto | Mt101StagingCorrectionServiceTest, Mt101MillionFileProcessE2EIT, mt101-quarantine.component.spec.ts | mvn -pl platform-app -Dtest=Mt101StagingCorrectionServiceTest test | FAIL si permite guardar sin version | mvn -pl platform-app "-Dtest=Mt101StagingCorrectionServiceTest,Mt101MillionFileProcessE2EIT" "-De2e.rows=1000" "-De2e.negativeRows=200" "-De2e.ncRows=200" test | PASS | T-038 | si | done |
| T-052 | RF-005, RF-006, RF-007, RF-010, RF-024 | impl | el avance correctivo ejecuta `REPAIR -> VALIDATE -> ROUTE -> ARCHIVE` antes de PAY y, despues de PAY, invoca `STATUS/RECONCILE` cuando existen | Mt101CorrectiveLifecycleServiceTest | mvn -pl platform-app -Dtest=Mt101CorrectiveLifecycleServiceTest test | FAIL si salta ROUTE o no invoca STATUS/RECONCILE configurados | mvn -pl platform-app -Dtest=Mt101CorrectiveLifecycleServiceTest test | PASS | T-042, T-047 | si | done |

### Sprint 8 - Cierre P0 correctivo pre-homologacion

| id | rf | tipo | objetivo verificable | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-053 | RF-007, RF-024 | impl | `MT101_ROUTE` acepta `{fragmentSetId}` persistido del correctivo y guarda `routed_as` por `:20:` sin depender de listas en memoria | Mt101RoutePersistedFragmentTest | mvn -pl platform-app -Dtest=Mt101RoutePersistedFragmentTest test | FAIL si ROUTE espera `List` y no fuente persistida | mvn -pl platform-app -Dtest=Mt101RoutePersistedFragmentTest test | PASS | T-017, T-052 | si | done |
| T-054 | RF-004, RF-024 | impl BD/backend | PAY correctivo crea intencion `PREPARED` antes del transporte y marca `DISPATCHING` por fragmento antes de invocar gateway/SFTP | Mt101PayFragmentReprocessTest | mvn -pl platform-app -Dtest=Mt101PayFragmentReprocessTest test | FAIL si no existe ledger durable pre-envio | mvn -pl platform-app -Dtest=Mt101PayFragmentReprocessTest test | PASS | T-047, T-049 | si | done |
| T-055 | RF-004, RF-024 | impl | la clave de correlacion persistida es la misma que usa el transporte (`Idempotency-Key` REST o drop path SFTP) | Mt101CorrectiveLifecycleServiceTest, Mt101PayTaskProviderTest | mvn -pl platform-app -Dtest=Mt101CorrectiveLifecycleServiceTest,Mt101PayTaskProviderTest test | FAIL si el ledger guarda una clave distinta a la enviada | mvn -pl platform-app -Dtest=Mt101CorrectiveLifecycleServiceTest,Mt101PayTaskProviderTest test | PASS | T-054 | si | done |
| T-056 | RF-005, RF-024 | impl | `MT101_STATUS` correctivo consulta todos los `SENT` del ledger paginado y no el output muestral de PAY | Mt101StatusTaskProviderTest | mvn -pl platform-app -Dtest=Mt101StatusTaskProviderTest test | FAIL si solo procesa `maxRecordsInOutput` | mvn -pl platform-app -Dtest=Mt101StatusTaskProviderTest test | PASS | T-013, T-054 | si | done |
| T-057 | RF-006, RF-024 | impl | `MT101_RECONCILE` correctivo filtra por referencias del run y no actualiza archivos ajenos | Mt101ReconcileTaskProviderTest | mvn -pl platform-app -Dtest=Mt101ReconcileTaskProviderTest test | FAIL si reconcilia todo el dia/base | mvn -pl platform-app -Dtest=Mt101ReconcileTaskProviderTest test | PASS | T-014, T-054 | si | done |

### Sprint 9 - Resolucion de incertidumbre y correctivo hijo

| id | rf | tipo | objetivo verificable | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-058 | RF-005, RF-024 | impl BD/backend | un PAY correctivo `UNCERTAIN` se resuelve consultando `MT101_STATUS` sobre ledger `UNCERTAIN`, sin reejecutar `MT101_PAY`, y actualiza fragmentos a `SENT`/`REJECTED` solo con estados finales conocidos | Mt101StatusTaskProviderTest, Mt101CorrectiveLifecycleServiceTest | mvn -pl platform-app -Dtest=Mt101StatusTaskProviderTest,Mt101CorrectiveLifecycleServiceTest test | FAIL si reenvia PAY o marca enviado sin confirmacion | mvn -pl platform-app "-Dtest=Mt101CorrectiveLifecycleServiceTest,Mt101StatusTaskProviderTest" test | PASS | T-050, T-056 | si | done |
| T-059 | RF-022, RF-024 | impl | un run `PARTIALLY_SENT` permite solicitar un correctivo hijo solo para fragmentos correctivos rechazados, preservando los enviados como inmutables | Mt101CorrectiveLifecycleServiceTest | mvn -pl platform-app -Dtest=Mt101CorrectiveLifecycleServiceTest test | FAIL si selecciona fragmentos enviados o no registra lineage padre-hijo | mvn -pl platform-app "-Dtest=Mt101CorrectiveLifecycleServiceTest" test | PASS | T-049, T-054 | si | done |
| T-060 | RF-024 | impl API | la operacion expone endpoints para `resolve-uncertain-pay` y `request-child`, sin acceso directo a BD y con roles administrativos/operador segun el flujo | testCompile + pruebas recurso existentes | mvn -pl platform-app test-compile | FAIL sin contrato REST compilable | mvn -pl platform-app test-compile | PASS | T-058, T-059 | si | done |

### Sprint 10 - Cierre de ruteo ejecutable y snapshot de destino PAY

| id | rf | tipo | objetivo verificable | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-061 | RF-004, RF-007, RF-024 | impl | `MT101_PAY` consume `routed_as` persistido y selecciona transporte/destino por `routeTransports`; si falta ruta, no llama al gateway/SFTP | Mt101PayFragmentReprocessTest | mvn -pl platform-app -Dtest=Mt101PayFragmentReprocessTest test | FAIL si PAY ignora `routed_as` y usa `transport` global | mvn -pl platform-app "-Dtest=Mt101PayFragmentReprocessTest" test | PASS | T-053, T-054 | si | done |
| T-062 | RF-004, RF-024 | impl BD/backend | maker-checker congela hash de payload y hash canonico de configuracion `MT101_PAY`; cambios de ruta/destino invalidan el request antes del dispatch | Mt101CorrectiveLifecycleServiceTest | mvn -pl platform-app -Dtest=Mt101CorrectiveLifecycleServiceTest test | FAIL si un cambio de URL/dropPath/idempotencia permite enviar con aprobacion vieja | mvn -pl platform-app "-Dtest=Mt101CorrectiveLifecycleServiceTest" test | PASS | T-048, T-061 | si | done |

## Checklist de cierre
- [ ] Todas las tareas tienen estado (pendiente / en curso / hecho / bloqueado).
- [ ] Cada tarea critica tiene evidencia TDD (prueba red + green) en `tdd-evidence.md`.
- [ ] Cambios de contrato, seguridad, datos o UX critica tienen revision humana.
- [ ] Pruebas ejecutadas y registradas en `qa/fase-6-qa/`.
- [ ] Preguntas abiertas o bloqueantes documentados.
- [ ] Catalogo de reglas SWIFT/NVR cargado desde fuente licenciada antes de
      cualquier ejecucion productiva.

Referencia: `docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
