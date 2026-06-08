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
  `mt101_reconciliation_exception`, `payment_validation_rule`
- Sub-catalogo activo: `swift/` (MT101 sprint 1)
- Dependencias bloqueantes del motor: M-1a (`TaskTypeRegistry`), M-1b
  (frontend discovery), M-2 (long-running), M-3 (multi-output) declaradas en
  spec 003.
- Gate: `gate-sdd-approved` (pendiente de validacion humana)

## Sprints

- **Sprint 1 (MVP outbound MT101)**: T-001 a T-012.
- **Sprint 2 (status, conciliacion, inbound, routing)**: T-013 a T-022.
- **Sprint 3 (split, repair, ISO 20022 placeholder)**: T-023 a T-028.

## Tabla ejecutable de tareas

### Sprint 1 - MVP outbound MT101

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-001 | RF-013 | impl backend | platform-app/src/main/resources/db/migration/V12__payments_mt101_schema.sql | platform-app/src/test/java/com/integrationhub/platform/migration/PaymentsMt101SchemaMigrationTest.java | mvn -pl platform-app -Dtest=PaymentsMt101SchemaMigrationTest test | FAIL sin migracion V12 | mvn -pl platform-app -Dtest=PaymentsMt101SchemaMigrationTest test | PASS | - | si | pending |
| T-002 | RF-011 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/spi/ValidationRuleProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/spi/ValidationRuleProviderTest.java | mvn -pl platform-app -Dtest=ValidationRuleProviderTest test | FAIL sin SPI | mvn -pl platform-app -Dtest=ValidationRuleProviderTest test | PASS | T-001 | si | pending |
| T-003 | RF-001 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101BuildTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101BuildTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101BuildTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101BuildTaskProviderTest test | PASS | spec 003 M-1a | si | pending |
| T-004 | RF-001 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/format/JsonMt101Formatter.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/format/JsonMt101FormatterTest.java | mvn -pl platform-app -Dtest=JsonMt101FormatterTest test | FAIL sin formatter | mvn -pl platform-app -Dtest=JsonMt101FormatterTest test | PASS | T-003 | si | pending |
| T-005 | RF-001 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/format/XmlMt101Formatter.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/format/XmlMt101FormatterTest.java | mvn -pl platform-app -Dtest=XmlMt101FormatterTest test | FAIL sin formatter | mvn -pl platform-app -Dtest=XmlMt101FormatterTest test | PASS | T-003 | si | pending |
| T-006 | RF-001 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/format/FinMt101Formatter.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/format/FinMt101FormatterTest.java | mvn -pl platform-app -Dtest=FinMt101FormatterTest test | FAIL sin formatter | mvn -pl platform-app -Dtest=FinMt101FormatterTest test | PASS | T-003 | si | pending |
| T-007 | RF-002 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ValidateTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ValidateTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101ValidateTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101ValidateTaskProviderTest test | PASS | T-002, T-003 | si | pending |
| T-008 | RF-003 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ArchiveTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ArchiveTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101ArchiveTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101ArchiveTaskProviderTest test | PASS | T-001, T-003 | si | pending |
| T-009 | RF-004, RF-016 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101PayTaskProvider.java + transport/RestPaymentTransport.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101PayTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101PayTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101PayTaskProviderTest test | PASS | T-008 | si | pending |
| T-010 | RF-019 | impl backend | platform-app/src/main/resources/application.yml (rol `payments-operator`) + ProcessExecutionResource RBAC | platform-app/src/test/java/com/integrationhub/platform/api/resource/process/PaymentsOperatorRoleIT.java | mvn -pl platform-app -Dtest=PaymentsOperatorRoleIT test | FAIL sin rol | mvn -pl platform-app -Dtest=PaymentsOperatorRoleIT test | PASS | - | si | pending |
| T-011 | RF-001 a RF-004 | impl frontend | frontend/libs/features/payments-swift/src/lib/components/mt101-build-form, mt101-validate-form, mt101-archive-form, mt101-pay-form | frontend/libs/features/payments-swift/src/lib/components/*.spec.ts | npx nx test payments-swift | FAIL sin componentes | npx nx test payments-swift | PASS | spec 003 M-1b, T-003..T-009 | si | pending |
| T-012 | RF-001 a RF-004 | qa | escenarios/payments-swift/mt101-outbound-mvp/ con fixtures de los 4 casos canonicos | tests/it/Mt101OutboundEndToEndIT.java | mvn -pl platform-app -Dtest=Mt101OutboundEndToEndIT verify | FAIL sin fixtures + ejecucion | mvn -pl platform-app -Dtest=Mt101OutboundEndToEndIT verify | PASS | T-003..T-011 | si | pending |

### Sprint 2 - Status, conciliacion, inbound, routing

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-013 | RF-005 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101StatusTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101StatusTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101StatusTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101StatusTaskProviderTest test | PASS | spec 003 M-2, T-009 | si | pending |
| T-014 | RF-006 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ReconcileTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ReconcileTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101ReconcileTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101ReconcileTaskProviderTest test | PASS | T-008, T-013 | si | pending |
| T-015 | RF-002 catalogo 002 + RF-008 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/reader/SwiftMtReaderProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/reader/SwiftMtReaderProviderTest.java | mvn -pl platform-app -Dtest=SwiftMtReaderProviderTest test | FAIL sin reader | mvn -pl platform-app -Dtest=SwiftMtReaderProviderTest test | PASS | - | si | pending |
| T-016 | RF-008 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ParseTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101ParseTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101ParseTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101ParseTaskProviderTest test | PASS | spec 003 M-3, T-015 | si | pending |
| T-017 | RF-007 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101RouteTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101RouteTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101RouteTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101RouteTaskProviderTest test | PASS | T-016 | si | pending |
| T-018 | RF-017 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/transport/SftpPaymentTransport.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/transport/SftpPaymentTransportTest.java | mvn -pl platform-app -Dtest=SftpPaymentTransportTest test | FAIL sin transporte SFTP | mvn -pl platform-app -Dtest=SftpPaymentTransportTest test | PASS | T-009 | si | pending |
| T-019 | RF-018 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/transport/MqPaymentTransport.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/transport/MqPaymentTransportTest.java | mvn -pl platform-app -Dtest=MqPaymentTransportTest test | FAIL sin transporte MQ | mvn -pl platform-app -Dtest=MqPaymentTransportTest test | PASS | T-009 | si | pending |
| T-020 | RF-014, RF-021 | impl backend | platform-app/src/main/java/com/integrationhub/platform/service/payments/Mt101ArchiveEncryptionService.java | platform-app/src/test/java/com/integrationhub/platform/service/payments/Mt101ArchiveEncryptionServiceTest.java | mvn -pl platform-app -Dtest=Mt101ArchiveEncryptionServiceTest test | FAIL sin cifrado | mvn -pl platform-app -Dtest=Mt101ArchiveEncryptionServiceTest test | PASS | T-008 | si | pending |
| T-021 | RF-005..RF-008 | impl frontend | frontend/libs/features/payments-swift/src/lib/components/mt101-status-form, mt101-reconcile-form, mt101-parse-form, mt101-route-form + reconciliation-board | frontend/libs/features/payments-swift/src/lib/components/*.spec.ts | npx nx test payments-swift | FAIL sin componentes | npx nx test payments-swift | PASS | T-013..T-017, M-1b | si | pending |
| T-022 | RF-005..RF-008 | qa | escenarios/payments-swift/mt101-inbound-end-to-end/ + escenarios/payments-swift/mt101-reconciliation/ | tests/it/Mt101InboundEndToEndIT.java + Mt101ReconciliationIT.java | mvn -pl platform-app -Dtest=Mt101*IT verify | FAIL sin fixtures | mvn -pl platform-app -Dtest=Mt101*IT verify | PASS | T-013..T-021 | si | pending |

### Sprint 3 - Split, repair, calendarios, ISO 20022 placeholder

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-023 | RF-009 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101SplitTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101SplitTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101SplitTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101SplitTaskProviderTest test | PASS | T-003 | si | pending |
| T-024 | RF-010 | impl backend | platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101RepairTaskProvider.java | platform-app/src/test/java/com/integrationhub/platform/provider/task/payments/swift/Mt101RepairTaskProviderTest.java | mvn -pl platform-app -Dtest=Mt101RepairTaskProviderTest test | FAIL sin provider | mvn -pl platform-app -Dtest=Mt101RepairTaskProviderTest test | PASS | T-013 | si | pending |
| T-025 | RF-002 | impl backend | platform-app/src/main/java/com/integrationhub/platform/service/payments/BusinessCalendarService.java (PE, EU, US) | platform-app/src/test/java/com/integrationhub/platform/service/payments/BusinessCalendarServiceTest.java | mvn -pl platform-app -Dtest=BusinessCalendarServiceTest test | FAIL sin servicio | mvn -pl platform-app -Dtest=BusinessCalendarServiceTest test | PASS | T-007 | si | pending |
| T-026 | RF-009, RF-010 | impl frontend | frontend/libs/features/payments-swift/src/lib/components/mt101-split-form, mt101-repair-form | frontend/libs/features/payments-swift/src/lib/components/*.spec.ts | npx nx test payments-swift | FAIL sin componentes | npx nx test payments-swift | PASS | T-023, T-024 | si | pending |
| T-027 | RF-012 | diseno | specs/008-mensajeria-pagos/iso20022-pain001-design.md (placeholder de contratos pain.001) | - | - | - | - | - | T-002 | si | pending |
| T-028 | - | qa | escenarios/payments-swift/mt101-split-and-repair/ con casos de 28D y rechazos reparables | tests/it/Mt101SplitRepairIT.java | mvn -pl platform-app -Dtest=Mt101SplitRepairIT verify | FAIL sin fixtures | mvn -pl platform-app -Dtest=Mt101SplitRepairIT verify | PASS | T-023..T-026 | si | pending |

## Dependencias hacia spec 003 (motor)

Las siguientes tareas del spec 003 son **bloqueantes** para 008:

- M-1a `TaskTypeRegistry` backend: bloquea T-003 (no se puede registrar `MT101_BUILD`).
- M-1b descubrimiento frontend: bloquea T-011 y T-021 (formularios verticales).
- M-2 long-running tasks: bloquea T-013 (`MT101_STATUS` mode `poll`).
- M-3 multi-output: bloquea T-016 (`MT101_PARSE` multi-shape).

Ver el delta de tareas del motor en
[../003-diseno-y-ejecucion-procesos/spec-tareas.md](../003-diseno-y-ejecucion-procesos/spec-tareas.md)
seccion "Motor para verticales (ADR-009)".

## Checklist de cierre
- [ ] Todas las tareas tienen estado (pendiente / en curso / hecho / bloqueado).
- [ ] Cada tarea critica tiene evidencia TDD (prueba red + green) en `tdd-evidence.md`.
- [ ] Cambios de contrato, seguridad, datos o UX critica tienen revision humana.
- [ ] Pruebas ejecutadas y registradas en `qa/fase-6-qa/`.
- [ ] Preguntas abiertas o bloqueantes documentados.
- [ ] Catalogo de reglas SWIFT/NVR cargado desde fuente licenciada antes de
      cualquier ejecucion productiva.

Referencia: `docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
