# Evidencia — arreglos de hallazgos v65 (tanda 1) — 2026-07-14

Rama `experiment/quarkus-lts-native`. Plan: [analisis-v65-y-plan-de-arreglo-20260714.md](../analisis-v65-y-plan-de-arreglo-20260714.md).
Principio: **sin fallback ni caminos legacy** — donde había degradación silenciosa, ahora hay fallo ruidoso.

## Hallazgos cerrados en esta tanda (7 + 2 tests obsoletos)

### 1. Acknowledge de PAY_CONFLICT: contrato estricto + motivos separados *(A2-2/3/4)*
- **`source` estricto**: `NORMAL|CORRECTIVE`; cualquier otro → `400`. Se eliminó el
  `equalsIgnoreCase("CORRECTIVE") ? … : NORMAL` (fallback silencioso que reconocía el conflicto equivocado).
  [Mt101PayConflictAcknowledgeService.java:66](../../../platform-app/src/main/java/com/integrationhub/platform/service/payments/swift/Mt101PayConflictAcknowledgeService.java)
- **Body JSON** en vez de query params: `reason` ya no viaja en la URL (no más motivo en access-logs/proxies).
  `ticketRef` **obligatorio** (backend + front). [Mt101FragmentLookupResource.java:207](../../../platform-app/src/main/java/com/integrationhub/platform/api/resource/execution/Mt101FragmentLookupResource.java)
- **Motivo original preservado**: migración `V98` añade `pay_conflict_ack_by/at/reason/ticket`. El `UPDATE` ya
  **no pisa** `pay_conflict_reason` (la evidencia del banco), lo deja intacto y escribe el reconocimiento aparte.
  La trama `PAY_CONFLICT_RESOLVED` lleva ambos motivos + ticket.
- **Front**: nuevo campo Ticket obligatorio en la consola; el botón exige motivo **y** ticket.

### 2. Evidencia de confirmaciones acotada por ejecución *(A2-1)*
`/pay-conflicts/confirmations` ahora exige `processExecutionId` (`400` si falta) y el SQL filtra
`a.process_execution_id = ?`. La referencia `:20:` se repite entre corridas → sin la ejecución, la evidencia
podía ser de **otra corrida**. La rama correctiva de la consola ahora también expone `processExecutionId`
(join a `mt101_build_fragment`). [Mt101FragmentRepository.java:1118](../../../platform-app/src/main/java/com/integrationhub/platform/repository/payments/swift/Mt101FragmentRepository.java)

### 3. Selección de proveedor de secretos determinista + test CDI que faltaba *(H9)*
- `SecretResolver` inyecta con `@All List<>` (ordenado por `@Priority`): con dos providers de `"secret"` en
  test (FileVault + TestConfigBacked) el de test gana **determinísticamente** (antes `findFirst()` sobre orden
  arbitrario). [SecretResolver.java](../../../platform-app/src/main/java/com/integrationhub/platform/service/secret/SecretResolver.java)
- **`SecretResolverCdiWiringIT`** (nuevo): resuelve `${config:...}` y `${secret:...}` a través del contenedor
  CDI — la prueba que habría cazado el bug de `@DefaultBean`. **3/3 PASS.**

### 4. Flush del insert de fragmentos por bytes *(H7)*
`Mt101BuildFromTableTaskProvider` flushea por filas **o** bytes acumulados (`INSERT_BATCH_MAX_BYTES` ~1 MB), lo
que ocurra primero. Evita el deadlock de pgJDBC con fragmentos grandes.
[Mt101BuildFromTableTaskProvider.java:65](../../../platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101BuildFromTableTaskProvider.java)

### 6. Monto no numérico → cuarentena por fila *(H8)*
`parseAmount` ya no propaga `NumberFormatException`: devuelve `null`, el fragmento se construye y
`MT101_VALIDATE` lo rechaza vía `STRUCT.AMOUNT_POSITIVE` (que ya trata `value==null`) → la fila cae en
cuarentena, igual que un BIC/moneda inválidos. Se degrada de "cae el lote" a "cae la fila"; la transacción **no**
se paga. [Mt101BuildTaskProvider.java:417](../../../platform-app/src/main/java/com/integrationhub/platform/provider/task/payments/swift/Mt101BuildTaskProvider.java)

### 8. Validador PAY↔STATUS con emparejamiento explícito *(A2-5)*
Fin del falso positivo multi-banco. Con un único PAY, se empareja sin ambigüedad; con **varios** PAY, cada
STATUS resolutor **debe** declarar `resolvesPayTaskRef` (→ `400` si no, o si nombra un PAY inexistente). Se
comparó exactamente el par nombrado, no el producto cartesiano.
[Mt101PayStatusConnectionCoverageValidator.java](../../../platform-app/src/main/java/com/integrationhub/platform/service/process/Mt101PayStatusConnectionCoverageValidator.java)

### 9. `set-task-secret.cmd` reescrito + verificación real *(H2)*
La corrupción venía del pipe de PowerShell (`$secret | keytool`). Ahora alimenta el valor por stdin (dos
líneas, sin PowerShell) y **verifica el round-trip** del valor con `tools/VerifyVaultSecret.java` — si no
coincide, aborta ruidosamente (un secreto corrupto sólo se veía luego como `Auth fail` en el banco).

### + 2 tests obsoletos preexistentes (desbloquean la suite)
`PluginDiagnosticsResourceTest` (faltaba el arg `configSchemas` del record) y `SystemThemeSettingServiceTest`
(faltaba declarar `repository` en un método). No relacionados con esta tanda, pero bloqueaban `mvn test`.

## Verificación

| Prueba | Resultado |
|--------|-----------|
| `mvn -pl platform-app test-compile` (main + tests) | **BUILD SUCCESS** |
| `Mt101PayConflictAcknowledgeAtomicityIT` (source estricto, ticket, motivo preservado, rollback atómico) | **4/4 PASS** |
| `SecretResolverCdiWiringIT` (config + secret vía CDI, source desconocida falla) | **3/3 PASS** |
| `Mt101PayStatusConnectionCoverageValidatorTest` (+4 casos multi-banco) | **12/12 PASS** |
| `PluginDiagnosticsResourceTest` (obsoleto arreglado) | **18/18 PASS** |
| `SystemThemeSettingServiceTest` (obsoleto arreglado) | **4/4 PASS** |
| `nx run web:lint` (frontend) | 0 errores (1 warning preexistente) |

## Validación estática profunda + doble check (2026-07-14)

Auditoría escéptica de cada cambio contra el esquema y el código reales. **No se encontró ningún bug**; se
verificaron 12 puntos de riesgo:

| # | Riesgo auditado | Resultado |
|---|-----------------|-----------|
| 1 | Columnas de V98 (`pay_conflict_ack_*`) y de los joins nuevos existen | ✅ verificado en BD (`information_schema`) |
| 2 | El `LEFT JOIN` de la consola correctiva (`build_fragment` por `corrective_set_id`+`senders_reference`) no multiplica filas | ✅ 1:1 (60 = 60 filas contra datos vivos, sin fan-out) |
| 3 | `SecretResolver @All` no crea colisión de `source` en producción | ✅ FileVault=`secret`/`vault`, HashiCorp=`vaultkv`, cloud=`awssecret`/`azuresecret`/`gcpsecret`; un solo provider por source |
| 4 | Selección determinista por `@Priority` funciona en runtime (no sólo teoría) | ✅ `SecretResolverCdiWiringIT` 3/3 lo prueba empíricamente |
| 5 | Todos los llamadores de firmas cambiadas actualizados (`acknowledge`, `payConflictConfirmations`, `resolvedEnvelope`, record `AcknowledgedPayConflict`) | ✅ grep exhaustivo: sin restos |
| 6 | `RETURNING` de los dos acknowledge casa con el record; V98 cubre las 4 columnas escritas; `pay_conflict_reason` NO se pisa | ✅ releído línea a línea |
| 7 | Flush por bytes resetea `bufferedBytes` y el flush final post-bucle se mantiene | ✅ correcto |
| 8 | `amount=null` no mueve el crash aguas abajo | ✅ `FinMt101Formatter.appendAmount` omite `:32B:` con null; `STRUCT.AMOUNT_POSITIVE` lo caza → cuarentena |
| 9 | Frontend sin llamadores obsoletos; claves i18n en ambos diccionarios; e2e no roto | ✅ `open` ya devuelve `processExecutionId`; mock de `confirmations` es wildcard; e2e no ejercita acknowledge |
| 10 | IT y unit test del validador preservan comportamiento (ambos usan un solo PAY) | ✅ + 4 casos multi-banco nuevos (12/12) |
| 11 | Flyway aplica V98 al arrancar; `writeBatch` tolera colección vacía (acknowledge idempotente) | ✅ `migrate-at-start=true`; early-return en vacío |
| 12 | Evidencia de conflictos CORRECTIVOS resuelve bien (no sólo fail-closed) | ✅ los archive del correctivo llevan la ejecución original (12), igual que el join → match correcto |

Ningún script/smoke externo (`ops/`, `scripts/`, `qa/`) llama a los endpoints con la firma vieja.

## Diferidos a una segunda tanda (con tu visto bueno)

- **H4** (cuarentena del run hijo): correctness real, pero exige SQL de lifecycle que cruce generaciones por la
  tupla estable. Riesgo moderado.
- **H5** (unificar las 3 ramas de `MT101_STATUS`): bajo valor — el SFTP ya funciona vía `resolveNormalPay`
  (probado: ejecución 15 COMPLETED). Sólo mejora un mensaje de error.
- **H10 / D.2** (clasificar fallo de transporte vs. rechazo del banco): **alto riesgo**. `TransportResult` es un
  SPI compartido; separar "auth/transporte re-solicitable" de "rechazo de negocio" reshapea el modelo de estados
  terminales en el camino normal **y** correctivo + migración. Necesita tu confirmación explícita de la opción
  D.2 antes de tocar el core del money-path.
