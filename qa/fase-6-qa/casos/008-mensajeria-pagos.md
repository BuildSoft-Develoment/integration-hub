# Caso QA — Mensajeria de pagos (spec 008)

Cubre las tareas QA T-022 (sprint 2 inbound + reconciliación) y T-028
(sprint 3 split + repair) de [spec-tareas.md](../../../specs/008-mensajeria-pagos/spec-tareas.md).

## Sprint 1 — Outbound MVP

### MT101_BUILD
- componer mensaje a partir de records con campos mínimos válidos
- componer con `splitBy.strategy = "none"` (caso base)
- rechazo cuando falta `sequenceA`
- rechazo cuando `format` no es JSON/XML/FIN
- verificar truncado de `:20:` a 16 chars
- verificar `controlTotals` por moneda

### MT101_VALIDATE
- validar mensaje sin errores (las 7 reglas STRUCT.*)
- emitir issue por monto ≤ 0
- emitir issue por moneda no ISO 4217
- emitir issue por charges fuera de OUR/BEN/SHA
- emitir issue por beneficiario sin account ni BIC
- emitir issue por sendersReference > 16 chars

### MT101_ARCHIVE
- persistir envelope + archive + transaction en `mt101_archive`
- calcular SHA-256 del rawPayload
- guardar plaintext cuando no hay encryption
- guardar AES-GCM-256 cuando hay `encryptColumn` + `encryptionSecretRef`
- rollback completo en error de constraint
- respetar `retentionDays`

### MT101_PAY (REST transport)
- enviar al gateway con `Idempotency-Key = sendersReference`
- aceptar 200 + `accepted: true` como ACCEPTED
- tratar 200 + `accepted: false` como REJECTED
- retry exponencial en 5xx hasta `maxRetries`
- no retry en 4xx
- parsear `gatewayReference` desde JSON-path
- transport=SFTP: upload con `.part` y rename atómico

### Pipeline end-to-end
- ejecutar cadena FILE_READ → VALIDATE → BUILD → ARCHIVE → PAY → NOTIFICATION
- verificar `Mt101OutboundEndToEndIT` pasa con WireMock

### RBAC
- `payments-operator` puede ejecutar procesos (POST /api/process-executions)
- `payments-operator` no puede editar catálogos (POST /api/source-definitions)

## Sprint 2 — Routing, reconciliación, status, inbound

### MT101_ROUTE
- clasificar records con primera regla matching
- aplicar `defaultRoute` cuando ningún predicado matchea
- rechazar predicado JEXL inválido
- rechazar nombres duplicados de regla
- tolerar campos nulos (no NPE)

### MT101_RECONCILE
- detectar SENT_WITHOUT_CONFIRM y CONFIRM_WITHOUT_SENT en ventana
- respetar `lookbackDays` para limitar la ventana
- 0 excepciones cuando todo cruza
- persistir excepciones a `mt101_reconciliation_exception`

### MT101_STATUS (query mode)
- HTTP GET por record con templating `${gatewayReference}`
- persistir confirmation a `mt101_confirmation`
- 4xx del gateway no inserta confirmation (queda en errors)
- rechazar mode `poll`/`callback` (requieren M-2)

### SwiftMtReaderProvider
- parsear los 5 blocks SWIFT
- separar Sequence A vs B por marcador `:21:`
- tolerar CRLF y LF
- preservar líneas multi-tag (59F con codes `1/`, `2/`, etc.)

### MT101_PARSE (single-output)
- mapear raw tags → Mt101Message tipado
- continuar con records corruptos (errors) sin abortar batch
- soportar input desde `readResult` (caso FILE_READ) y desde `taskOutputs`
  (caso embebido)

### SftpPaymentTransport
- upload exitoso con rename atómico
- archivo final sin `.part` residual
- rechazo limpio cuando SSH falla (no throw, retorna `TransportResult.rejected`)
- soporte `tmpExtension` configurable

## Sprint 3 — Split + Repair + Calendar

### BusinessCalendarService
- weekends nunca son business day en ningún calendario
- feriados PE (28 jul, 25 dic) son no-business solo para PE
- `addBusinessDays` salta weekends + feriados del calendario
- calendario desconocido cae a "solo weekends"

### MT101_SPLIT
- pass-through cuando el mensaje entra en límites
- split por transacciones cuando supera `maxTransactionsPerFragment`
- split por bytes cuando rawPayload supera `maxBytesPerFragment`
- reconstruir `:28D:` index/total en cada fragmento
- truncar `sendersReference` a 16 chars
- template custom de fragment reference

### MT101_REPAIR (sanitizer preventivo)
- `stripNonSwiftXChars` elimina caracteres no permitidos
- `truncateField` corta a `maxLength` configurado
- `uppercaseField` convierte BIC a mayúsculas
- aplicar múltiples repairs en orden (sanitize + truncate)
- `newReferenceTemplate` reescribe sendersReference cuando se provee
- rechazo de acción no soportada
- `totalChanges` cuenta solo cambios reales (no records sin cambio)

## Hardening correctivo y reproceso sin fallback

### Identidad estricta por fila
- corregir fila exige `stagingId` junto con `fragmentSetId`, `sourceFileHash` y `recordNumber`
- timeline de fila exige `stagingId` y no busca por hash+fila solamente
- reabrir rechazo exige `stagingId`
- dos archivos con misma fila/hash pero distinto origen no se mezclan

### Lifecycle correctivo
- rebuild desde cuarentena crea seleccion con `stagingId`
- correctivo con algunos fragmentos rechazados queda `PARTIALLY_FAILED`
- `PARTIALLY_FAILED` actualiza solo las selecciones rechazadas, no todo el run
- runs correctivos exponen `payStatus`, requester y checker para UI
- scheduler revisa runs activos en la base por defecto y conexiones JDBC activas
- PAY correctivo vencido en `EXECUTING` pasa a `UNCERTAIN` sin reintento automatico

### PAY correctivo
- request PAY solo aplica a runs `ARCHIVED`
- checker no puede ser el mismo requester
- claim atomico evita doble envio cuando dos checkers compiten
- fallo de transporte deja `pay_status=FAILED` para reintento gobernado
- request PAY guarda el hash del payload archivado y el checker lo revalida antes de enviar
- si el payload archivado cambia entre request y approve, PAY queda `INVALIDATED`
- envio parcial deja `pay_status=PARTIALLY_SENT` y detalle por fragmento
- despues de PAY se ejecutan `MT101_STATUS` y `MT101_RECONCILE` cuando existen en el proceso

### Cierre P0 correctivo pre-homologacion
- `MT101_ROUTE` acepta fuente persistida `{fragmentSetId}` y persiste `routed_as` por fragmento
- `MT101_PAY` correctivo crea ledger `PREPARED` antes de invocar el transporte
- `MT101_PAY` marca el fragmento `DISPATCHING` antes de llamar al gateway/SFTP
- la clave persistida en el ledger coincide con la clave entregada al transporte
- `MT101_STATUS` correctivo lee todos los `SENT` del ledger paginado, no el sample de PAY
- `MT101_RECONCILE` correctivo usa scope por `rebuildRunId` y no reconcilia archivos ajenos
- `PAY_UNCERTAIN` requiere conciliacion/operacion explicita; no hay reenvio ciego automatico

### Resolucion de incertidumbre y correctivo hijo
- `resolve-uncertain-pay` consulta `MT101_STATUS` sobre ledger `UNCERTAIN` y no invoca `MT101_PAY`
- estados aceptados del banco cierran fragmentos inciertos como `SENT`
- estados rechazados del banco cierran fragmentos inciertos como `REJECTED`
- estados no finales mantienen el run en `pay_status=UNCERTAIN`
- un padre `PARTIALLY_SENT` permite crear correctivo hijo solo con fragmentos `REJECTED`
- fragmentos `SENT` del padre parcial no se seleccionan ni se sobrescriben
- el run hijo registra lineage `parent_rebuild_run_id` y `parent_corrective_set_id`

## Frontend (sprint 1 + 2 + 3)

### M-1b registry
- forms del motor (FILE_READ, DB_WRITE, etc.) se resuelven vía registry sin
  fallback legacy switch
- forms verticales (MT101_*) se resuelven igual
- mensaje "form not registered" cuando no hay registración

### Convención signal-based
- todos los forms usan `input.required()`, `computed()`, `signal()`
- ningún form usa `@Output()` para `patchTask` (todos vía `bridge.emit()`)
- host usa `computed()` para `usesWorkspaceLayout` (no método)

### Forms MT101 (10 task types)
- abrir editor por cada task type renderiza el componente correcto
- roundtrip hydrate → toTaskPatch → hydrate preserva todos los campos
- node del flow palette muestra badge + icono correcto

## Evidencia automatizada

| Caso | Test automatizado |
|------|-------------------|
| BUILD/VALIDATE/ARCHIVE/PAY/ROUTE/RECONCILE/STATUS/PARSE/SPLIT/REPAIR | tests unitarios backend (113 tests) |
| Correctivo/reproceso sin fallback | `Mt101CorrectiveLifecycleServiceTest`, `Mt101RebuildServiceTest`, `Mt101StagingCorrectionServiceTest`, `Mt101RowTimelineServiceTest`, `Mt101ReprocessServiceTest`, `Mt101MultiSourceLineageTest`, `Mt101QuarantineServiceTest`, `Mt101LargeVolumeLineageRebuildTest`, `Mt101ArchiveTaskProviderTest`, `Mt101BuildFromTableTaskProviderTest` |
| PAY correctivo gobernado V44 | `Mt101CorrectiveLifecycleServiceTest`, `Mt101RebuildServiceTest`, `Mt101StagingCorrectionServiceTest`, `Mt101MillionFileProcessE2EIT` |
| Cierre P0 correctivo V45 | `Mt101RoutePersistedFragmentTest`, `Mt101PayFragmentReprocessTest`, `Mt101StatusTaskProviderTest`, `Mt101ReconcileTaskProviderTest`, `Mt101CorrectiveLifecycleServiceTest` |
| Resolucion PAY incierto y correctivo hijo V46 | `Mt101StatusTaskProviderTest`, `Mt101CorrectiveLifecycleServiceTest` |
| RBAC payments-operator | `PaymentsOperatorRoleIT` |
| Pipeline end-to-end | `Mt101OutboundEndToEndIT` |
| Forms TS providers | vitest specs (10 providers × ~5 tests) |
| M-1b registry | `process-task-form-registry.spec.ts` |

Ejecucion correctiva 2026-06-21: `mvn -pl platform-app "-Dtest=Mt101CorrectiveLifecycleServiceTest,Mt101RebuildServiceTest,Mt101StagingCorrectionServiceTest,Mt101RowTimelineServiceTest,Mt101ReprocessServiceTest,Mt101MultiSourceLineageTest,Mt101QuarantineServiceTest,Mt101LargeVolumeLineageRebuildTest,Mt101ArchiveTaskProviderTest,Mt101BuildFromTableTaskProviderTest" test` (59 tests PASS).

Ejecucion V44 2026-06-21: `mvn -pl platform-app "-Dtest=Mt101CorrectiveLifecycleServiceTest,Mt101StagingCorrectionServiceTest" test` (13 tests PASS), `mvn -pl platform-app "-Dtest=Mt101RebuildServiceTest" test` (8 tests PASS, incluye scheduler sobre conexion JDBC no-default) y `mvn -pl platform-app "-Dtest=Mt101MillionFileProcessE2EIT" "-De2e.rows=1000" "-De2e.negativeRows=200" "-De2e.ncRows=200" test` (3 tests PASS).

Ejecucion V45 2026-06-21: `mvn -pl platform-app "-Dtest=Mt101CorrectiveLifecycleServiceTest,Mt101StatusTaskProviderTest,Mt101ReconcileTaskProviderTest,Mt101PayFragmentReprocessTest,Mt101RoutePersistedFragmentTest" test` (32 tests PASS).

Ejecucion V46 2026-06-21: `mvn -pl platform-app "-Dtest=Mt101CorrectiveLifecycleServiceTest,Mt101StatusTaskProviderTest" test` (26 tests PASS).

Ejecución: `mvn -pl platform-app test` (backend) + `npx nx run web:test` (frontend).
