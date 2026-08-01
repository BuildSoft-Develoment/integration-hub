# Traceability - Mensajeria de pagos (MT101)

[README principal](../../README.md) | [Specs](../README.md)

> Feature de reingenieria (`origin: reingenieria`): el codigo y las pruebas ya existen y operan. La
> Fase 2 (UX/UI · prototipo · SPDD) NO aplica (ver `CONSTITUTION.md`, Principio 4 — excepcion). Las
> columnas `UX/SPDD` y `Prototipo` van en `-` por esa razon. El resto de la trazabilidad
> RF→API→BD→Codigo→Test es real y esta verificada contra el arbol, no copiada de la tabla de tareas
> (cuyas rutas apuntan al layout anterior a ADR-021).

> **Este fichero faltaba.** Era la unica de las ocho specs sin `traceability.md`, y ese fichero lo
> leen 27 scripts del framework. El efecto medible: `check:gates-mentioned` respondia
> *"OK. 7 feature(s) bajo specs/ mencionan al menos un gate"* — siete de ocho, y en verde. La spec
> que mueve dinero real no tenia **donde** declararse sus gates, empezando por `gate-deploy-ready`.

## Proposito
Matriz viva que conecta cada requerimiento con su API, datos, codigo, prueba, estado y evidencia. Es
la fuente que `node scripts/ai-framework-agent.mjs sync-memory` parsea para poblar `ai_trace_links`,
`ai_gate_runs` y `ai_evidence_items`. Es el detalle por feature del rollup global en
`TRACEABILITY_MATRIX.md`.

## Flujo (reingenieria)
```text
Codigo existente -> SDD (spec-tecnica) -> Trazabilidad -> QA (evidencia GREEN real)
```

## Matriz de trazabilidad

Convencion (`TRACEABILITY_MATRIX.md`): **un artefacto atomico por celda**, sin listas; `-` cuando no
hay dato. Un `-` en `Test` no es un descuido: significa que ese requisito **no tiene prueba propia**.

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia | Frontend | Front-test |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RF-001 | - | - | - | - | - | - | - | Retirado | spec-funcional.md | - | - |
| RF-002 | - | - | - | GET /api/payment-validation-rules | payment_validation_rule | Mt101ValidateTaskProvider | Mt101ValidateTaskProviderTest | Implementado | tdd-evidence.md | mt101-quarantine | mt101-quarantine.component.spec.ts |
| RF-003 | - | - | - | GET /api/query/mt101-fragments/summary | mt101_archive | Mt101ArchiveTaskProvider | Mt101ArchiveTaskProviderTest | Implementado | tdd-evidence.md | mt101-fragment-lookup | mt101-archive-task.provider.spec.ts |
| RF-004 | - | - | - | POST /api/query/mt101-quarantine/rebuild-runs/approve-pay | mt101_pay_dispatch_intent | Mt101PayTaskProvider | Mt101PayTaskProviderTest | Implementado | tdd-evidence.md | mt101-pay-dispatch | mt101-pay-dispatch.component.spec.ts |
| RF-005 | - | - | - | GET /api/query/mt101-fragments/pay-conflicts/confirmations | mt101_confirmation | Mt101StatusTaskProvider | Mt101StatusTaskProviderTest | Implementado | tdd-evidence.md | mt101-pay-conflicts | process-mt101-status-task-form.component.spec.ts |
| RF-006 | - | - | - | POST /api/query/mt101-quarantine/process-executions/close-reconciled | mt101_confirmation | Mt101ReconcileTaskProvider | Mt101ReconcileTaskProviderTest | Implementado | tdd-evidence.md | mt101-pay-conflicts | - |
| RF-007 | - | - | - | - | inbound_routed_transaction | Mt101RouteTaskProvider | Mt101RouteTaskProviderTest | Implementado | tdd-evidence.md | - | - |
| RF-008 | - | - | - | - | swift_message_envelope | Mt101ParseTaskProvider | Mt101ParseTaskProviderTest | Implementado | tdd-evidence.md | - | - |
| RF-009 | - | - | - | - | mt101_build_fragment | Mt101SplitTaskProvider | Mt101SplitTaskProviderTest | Implementado | tdd-evidence.md | - | - |
| RF-010 | - | - | - | POST /api/query/mt101-fragments/reprocess/reopen-rejected | mt101_failed_record | Mt101RepairTaskProvider | Mt101RepairTaskProviderTest | Implementado | tdd-evidence.md | mt101-quarantine | mt101-quarantine.component.spec.ts |
| RF-011 | - | - | - | POST /api/payment-validation-rules/import | payment_validation_rule | ValidationRuleProvider | DbValidationRuleProviderTest | Implementado | tdd-evidence.md | - | - |
| RF-012 | - | - | - | - | - | - | - | Otro vertical | iso20022-pain001-design.md | - | - |
| RF-013 | - | - | - | - | mt101_archive | Mt101ArchiveRepository | Mt101ArchiveTaskProviderTest | Implementado | tdd-evidence.md | - | - |
| RF-014 | - | - | - | - | mt101_archive | AesGcmPayloadEncryptor | Mt101ArchiveTaskProviderTest | Implementado | tdd-evidence.md | - | - |
| RF-015 | - | - | - | - | swift_message_envelope | - | - | No implementado | spec-funcional.md | - | - |
| RF-016 | - | - | - | - | - | RestPaymentTransport | RestPaymentTransportTest | Implementado | tdd-evidence.md | - | - |
| RF-017 | - | - | - | - | - | SftpPaymentTransport | SftpPaymentTransportTest | Implementado | tdd-evidence.md | - | - |
| RF-018 | - | - | - | - | - | - | - | Futuro | spec-funcional.md | - | - |
| RF-019 | - | - | - | - | - | PlatformRoles | - | Implementado | spec-funcional.md | - | - |
| RF-020 | - | - | - | - | - | - | - | No implementado | spec-funcional.md | - | - |
| RF-021 | - | - | - | - | mt101_archive | - | - | No implementado | spec-funcional.md | - | - |
| RF-022 | - | - | - | POST /api/query/mt101-quarantine/rebuild-runs/execute | mt101_build_fragment | Mt101BuildFromTableTaskProvider | Mt101BuildFromTableTaskProviderTest | Implementado | tdd-evidence.md | mt101-bulk-correction-wizard | mt101-build-from-table-task.provider.spec.ts |
| RF-023 | - | - | - | POST /api/payment-validation-rules | payment_validation_rule | PaymentValidationRuleResource | PaymentValidationRuleResourceIT | Implementado | tdd-evidence.md | - | - |
| RF-024 | - | - | - | POST /api/query/mt101-quarantine/rebuild-runs/request | mt101_rebuild_run | Mt101CorrectiveLifecycleService | Mt101CorrectiveLifecycleServiceTest | Implementado | tdd-evidence.md | mt101-quarantine | mt101-quarantine.component.spec.ts |

### Los huecos, dichos en voz alta

No se marcan "Implementado" por comodidad. Medido sobre el arbol:

- **RF-015** (lineage por UETR): la columna `uetr` existe en `swift_message_envelope`, pero **no hay
  ninguna consulta que busque por ella** (cero coincidencias de `findByUetr` / `where uetr`). El dato
  se guarda y no se explota.
- **RF-020** (enmascarado de campos sensibles en logs): **cero clases** lo mencionan. En un producto
  que mueve pagos, esto es lo que hace que un numero de cuenta acabe en un fichero de log.
- **RF-021** (retencion configurable de `mt101_archive`, 3650 dias por defecto): no existe ningun
  servicio de retencion para esa tabla.
- **RF-018** (transporte MQ): futuro declarado por la propia spec, no un hueco.
- **RF-006** no tiene prueba de frontend: el componente `mt101-pay-conflicts` tiene `.ts`, `.html` y
  `.css` pero **ningun `.spec.ts`**. Es la bandeja de entrada de los conflictos de pago.
- **RF-019** no tiene prueba propia: el rol se declara, pero ningun test fija que un
  `payments-operator` pueda ejecutar y no editar.

Ademas, **RF-012** (schemas ISO 20022) pertenece al vertical `vertical-iso20022`, que es otra
feature: se deja en `-` en vez de atribuirse trazabilidad ajena.

## Gates
> Fase 2 N/A por reingenieria: `gate-spdd-approved` y `gate-prototype-ready` no aplican.

| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-sdd-approved | pending | — | — | spec-tecnica.md |
| gate-build-ready | pending | — | — | traceability.md |
| gate-qa-passed | pending | — | — | tdd-evidence.md |
| gate-deploy-ready | pending | — | — | spec-tecnica.md |
| gate-operations-ready | pending | — | — | spec-tecnica.md |

> **`gate-deploy-ready` no es una casilla mas en esta feature.** Aprobarlo exige un release manager
> humano (contrato de fase 7: un agente *"no puede aprobar gate-deploy-ready"*), y aqui lo que se
> firma incluye lo que dice `ops/fase-7-deploy/rollback.md`: que esta release **no se revierte
> desplegando el binario anterior**, y que restaurar la base **no devuelve los pagos ya despachados**
> — deja fragmentos re-pagables y puede pagar dos veces. Mientras el producto siga en
> pre-produccion, recrear la base es salida valida; deja de serlo en la primera instalacion real.
> El runbook operativo del camino del dinero es `ops/runbooks/008-mensajeria-pagos-runbook.md`.

## Decisiones
- Vertical SWIFT MT101 como modulo Maven propio, dentro del monolito modular (ADR-021).
- Esquema `vertical_mt101` separado del motor, con `search_path` a nivel de base (ADR-023).
- Salida generica de escritura y entrega reutilizada por el money-path (ADR-016, ADR-017).
- Segregacion de funciones sobre el cierre de conflictos de pago: `pay-conflict-maker` y
  `pay-conflict-checker`, con el checker distinto del maker (ADR-003).

## Preguntas abiertas
- RF-015, RF-020 y RF-021 no tienen implementacion ni tarea que las cubra: decidir si entran en
  alcance o se retiran de la spec como se hizo con RF-001.
- La consola de conflictos de pago (`mt101-pay-conflicts`) no tiene prueba de frontend.
- Los tres ITs del modulo (`Mt101OutboundEndToEndIT`, `Mt101SplitRepairIT`,
  `Mt101MassivePipelinePerfIT`) no entran en `mvn test`: los recoge failsafe en `verify`.
