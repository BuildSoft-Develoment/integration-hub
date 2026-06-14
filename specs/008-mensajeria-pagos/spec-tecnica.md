# Spec tecnica - Mensajeria de pagos

## Componentes relacionados

### Backend (`platform-app`)

- Providers de task types (sub-paquete `provider/task/payments/`):
  - `swift/Mt101BuildTaskProvider`, `Mt101BuildFromTableTaskProvider`,
    `Mt101FragmentStore`, `Mt101ValidateTaskProvider`,
    `Mt101ArchiveTaskProvider`, `Mt101PayTaskProvider`, `Mt101StatusTaskProvider`,
    `Mt101ReconcileTaskProvider`, `Mt101RouteTaskProvider`, `Mt101ParseTaskProvider`,
    `Mt101SplitTaskProvider`, `Mt101RepairTaskProvider`.
  - `iso20022/` y `openbanking/`: vacios al inicio, espacios reservados.
- SPI de formateadores: `PaymentMessageFormatter` con implementaciones
  `JsonMt101Formatter`, `XmlMt101Formatter`, `FinMt101Formatter`.
- SPI de transportes: `PaymentMessageTransport` con implementaciones ejecutables
  `RestPaymentTransport` y `SftpPaymentTransport`. `MqPaymentTransport` queda
  fuera del contrato actual hasta implementar su provider.
- SPI de reglas: `ValidationRuleProvider` con catalogo cargable.
- Reader `swift-mt` en `provider/reader/SwiftMtReaderProvider` (registrado en el
  catalogo 002, pero su codigo vive en el modulo de pagos para ownership).
- Servicios: `PaymentsCatalogService`, `Mt101ArchiveService`,
  `Mt101ReconciliationService`.

### Frontend (Angular/Nx)

- Formularios por task type registrados via el mecanismo de descubrimiento de
  spec 003.
- `MT101_BUILD` debe exponer una paleta de fuentes compatible con `FILE_READ`,
  metadata, variables y outputs previos, y un tablero de mapping por campos SWIFT.
- `MT101_BUILD_FROM_TABLE` reutiliza el formulario de `MT101_BUILD`, pero orientado
  al flujo `FILE_READ -> DB_WRITE(staging) -> build`, con controles de tamano de
  fragmento y salida persistida.
- `MT101_PAY` solo debe ofrecer transportes soportados por backend.

## Contrato `configuration_json` por task type

### MT101_BUILD

```jsonc
{
  "taskRef": "build-mt101",
  "taskType": "MT101_BUILD",
  "executionMode": "once",
  "input": {
    "source": "task-output",
    "sourceTaskRef": "<ref previa>",
    "sourceOutput": "records",
    "batchSize": 5000,
    "cursor": { "orderBy": "id" },
    "filters": { "status": "PENDING" }
  },
  "configuration": {
    "format": "JSON",                     // JSON | XML | FIN
    "debitAccountMode": "singleDebit",    // singleDebit | multipleDebit | subsidiary
    "envelope": {
      "senderLt": "SGOBFRPPAXXX",
      "receiverLt": "BCPLPEPLXXXX",
      "uetrStrategy": "perMessage",
      "priority": "N"
    },
    "sequenceA": {
      "sendersReferenceTemplate": "PROC-${_processExecutionId}-${messageIndex}",
      "requestedExecutionDate": "${today+1bd}",
      "orderingCustomer": {
        "option": "H",                     // F | G | H
        "account": "001-10200200",
        "nameAndAddress": ["EMPRESA INTEGRADORA SAC", "AV. JAVIER PRADO 1234", "LIMA PE"]
      },
      "accountServicingInstitution": { "option": "A", "bic": "BCPLPEPLXXX" }
    },
    "transactionMappings": {
      "transactionReferenceTemplate": "TX-${_processExecutionId}-${recordNumber}-${dni}",
      "amount": { "currencyField": "moneda", "valueField": "monto" },
      "orderingCustomer": {
        "option": "H",                     // "" | "F" | "G" | "H"
        "accountField": "cuenta_ordenante",
        "nameAndAddressFields": ["nombre_ordenante", "dni_ordenante"]
      },
      "beneficiary": {
        "option": "",                      // "" | "A" | "F"
        "accountField": "cuenta_beneficiario",
        "nameAndAddressFields": ["nombre", "dni"]
      },
      "accountWithInstitution": { "option": "A", "bicField": "bic_beneficiario" },
      "remittanceInformationField": "concepto",
      "detailsOfChargesField": "cargos"
    },
    "splitBy": {
      "strategy": "none",                  // none | debitAccount | maxTransactions
      "maxTransactionsPerMessage": 999,
      "rebuildIndexTotal": true
    }
  }
}
```

Reglas del modo debito:

- `singleDebit`: `sequenceA.orderingCustomer` es obligatorio y
  `transactionMappings.orderingCustomer` no debe emitirse.
- `multipleDebit`: `sequenceA.orderingCustomer` no debe emitirse y cada
  transaccion debe construir `orderingCustomer`.
- `subsidiary`: igual que `multipleDebit`; el mapping representa la cuenta o
  identidad de la subsidiaria que origina el pago.
- `MT101_BUILD` falla si `:20:` o `:21:` exceden 16 caracteres.

Los valores `*Field` y `nameAndAddressFields` de `transactionMappings` aceptan:
campos del record de entrada (`records`/`table`), variables de ejecucion,
metadata transversal (`_processExecutionId`, `_sourceFileName`, etc.) y salidas
previas calificadas para outputs agregados (`<taskRef>.summary.<campo>`,
`<taskRef>.out.<campo>`). Esto permite que `MT101_BUILD` use la misma semantica
de fuentes configurables que `DB_WRITE`: el usuario elige columnas o datos
disponibles en la paleta y el runtime los resuelve antes de construir el mensaje.

Outputs publicados:

- `build-mt101.summary`: `{messageCount, transactionCount, totalsByCurrency, format}`.
- `build-mt101.records`: lista de `Mt101Message` con `envelope`, `sequenceA`,
  `transactions[]`, `rawPayload`, `uetr`, `sendersReference`.
- `build-mt101.controlTotals`: totales por moneda.
- `build-mt101.errors`: vacio (la validacion vive en `MT101_VALIDATE`).

El fast-path de streaming `FILE_READ -> sink` no debe capturar `MT101_BUILD`,
porque esta tarea produce outputs materiales (`records` con mensajes) que tareas
posteriores consumen.

### MT101_BUILD_FROM_TABLE

```jsonc
{
  "taskRef": "build-mt101-massive",
  "taskType": "MT101_BUILD_FROM_TABLE",
  "executionMode": "once",
  "input": {
    "source": "task-output",
    "sourceTaskRef": "db-write-staging"
  },
  "source": {
    "table": "staging_record",
    "payloadColumn": "payload_json",
    "idColumn": "id",
    "processExecutionId": "${db-write-staging.processExecutionId}",
    "taskDefinitionId": "${db-write-staging.taskDefinitionId}",
    "connectionRef": "${db-write-staging.table.connectionRef}"
  },
  "maxTransactionsPerMessage": 100,
  "maxBytesPerMessage": 10000,
  "fragmentSetIdTemplate": "MT101-${_processExecutionId}-${_taskDefinitionId}",
  "replaceExisting": true,
  "format": "FIN",
  "debitAccountMode": "multipleDebit",
  "sequenceA": {
    "sendersReferenceTemplate": "P${_processExecutionId}${messageIndex}",
    "requestedExecutionDate": "${today+1bd}",
    "accountServicingInstitution": { "option": "A", "bic": "BCPLPEPLXXX" }
  },
  "transactionMappings": {
    "transactionReferenceTemplate": "TX-${recordNumber}",
    "amount": { "currencyField": "moneda", "valueField": "monto" },
    "orderingCustomer": {
      "option": "H",
      "accountField": "cuenta",
      "nameAndAddressFields": ["nombre"]
    },
    "beneficiary": {
      "option": "",
      "accountField": "cuenta_beneficiario",
      "nameAndAddressFields": ["nombre_beneficiario"]
    },
    "accountWithInstitution": { "option": "A", "bicField": "bic" },
    "remittanceInformationField": "concepto"
  }
}
```

Contrato operativo:

- `MT101_BUILD_FROM_TABLE` lee `staging_record.payload_json` por paginas ordenadas
  por `id`; no carga el archivo completo ni el set completo de mensajes en memoria.
- Cada pagina produce un MT101 y se persiste en `mt101_build_fragment` con
  `fragmentSetId`, rango de filas origen, hash, `raw_payload`, `message_json` y
  estado inicial `BUILT`.
- Si `replaceExisting=true`, un reproceso con el mismo `fragmentSetId` reemplaza
  los fragmentos previos antes de reconstruirlos. Si es `false`, el constraint por
  `fragmentSetId + fragmentIndex` impide sobrescrituras accidentales.
- Las tareas posteriores consumen la salida `fragments` como referencia persistida:
  `{table: "mt101_build_fragment", fragmentSetId, fragmentCount, connectionRef?}`.
- La ruta recomendada para archivos mayores a 1,000,000 registros es
  `FILE_READ -> DB_WRITE(staging_record) -> MT101_BUILD_FROM_TABLE ->
  MT101_VALIDATE -> MT101_ARCHIVE -> MT101_PAY -> NOTIFICATION`.
- La plantilla UI `MT101 masivo desde archivo` debe crear esa ruta base y dejar
  defaults seguros para volumen/reproceso: `DB_WRITE.jdbcBatchSize=5000`,
  `fragmentSetIdTemplate=MT101-${_processExecutionId}`, `replaceExisting=true`,
  `maxTransactionsPerMessage=100`, `maxBytesPerMessage=10000`, `pageSize=200`
  en tareas downstream y muestras acotadas (`maxRecordsInOutput`/
  `maxIssuesInOutput`). `MT101_STATUS` y `MT101_RECONCILE` no forman parte de
  la plantilla base porque suelen correr como seguimiento programado/callback
  despues del pago.

**Cadena de bindings en modo masivo (fragments → fragments)**: en el flujo
masivo el `fragment source` se pasa de tarea en tarea por REFERENCIA (no carga
los mensajes en los outputs). El binding debe ser homogeneo:

```
MT101_BUILD_FROM_TABLE.output = fragments
MT101_VALIDATE.input  = <build>.fragments   ;  marca VALIDATED/REJECTED por fragmento
MT101_ARCHIVE.input   = <build>.fragments   ;  consume VALIDATED -> ARCHIVED
MT101_PAY.input       = <build>.fragments   ;  consume ARCHIVED  -> SENT
```

El frontend ya defaultea `MT101_BUILD_FROM_TABLE` a output `fragments` y expone
`fragments` como output de `MT101_VALIDATE`/`MT101_ARCHIVE`, de modo que el
auto-binding de la UI encadena `fragments` sin elegir `records`/`summary` por
error. Cada etapa lee SOLO los estados que su gate permite
(`VALIDATE←BUILT`, `ARCHIVE←VALIDATED`, `PAY←ARCHIVED`), garantizando
`BUILT → VALIDATED → ARCHIVED → SENT`.

**Estado durable y muestreo de outputs**:
- `mt101_archive.status` se sincroniza a lo largo del pipeline (`ARCHIVED` →
  `SENT`/`REJECTED` por PAY → `CONFIRMED`/`REJECTED` por STATUS → `RECONCILED`
  por RECONCILE), no queda en `COMPOSED`.
- En flujo no fragmentado, `MT101_ARCHIVE.records` publica `archiveId`,
  `envelopeId`, `connectionRef` y el `message`; `MT101_PAY` conserva esos ids
  en su output y sincroniza `mt101_archive.status` por `archiveId`, no solo por
  `:20:`.
- La sincronizacion durable se separa por capas: PAY, STATUS y RECONCILE llaman
  a `Mt101ArchiveStatusUpdater` como servicio de dominio, y el SQL de lifecycle
  vive en `Mt101ArchiveStatusRepository`. Sin fallback: toda tabla MT101 usada
  para lifecycle debe cumplir el contrato migrado (`status`, `updated_at`);
  si falta `updated_at`, la tarea falla rapido y debe corregirse la tabla.
- `MT101_ARCHIVE`/`MT101_PAY` publican una MUESTRA acotada en `records`/`errors`
  (`maxRecordsInOutput`, default 1000) con `recordsSampled` cuando hay recorte;
  los conteos (`archivedCount`/`dispatchCount`/`sentCount`/...) son siempre
  exactos. En `MT101_PAY`, `dispatchCount` representa mensajes procesados por el
  transporte y `sentCount` representa mensajes aceptados por el canal. El detalle
  completo se consulta en `mt101_build_fragment`/`mt101_archive`.
- `:20:` por defecto es `${batchCode}${messageIndex}` (batchCode = base36 del
  processExecutionId): unico por ejecucion Y por fragmento, evitando colision
  con el indice de idempotencia `(sender_lt, senders_reference, year_of_execution)`.
- `MT101_BUILD_FROM_TABLE` falla temprano si el set excederia 99999 fragmentos
  (limite 5n de `:28D:`).

Outputs:

- `build-mt101-massive.fragmentSetId`: identificador reprocesable del lote.
- `build-mt101-massive.fragmentCount`: cantidad de mensajes MT101 generados.
- `build-mt101-massive.transactionCount`: cantidad de filas de staging procesadas.
- `build-mt101-massive.fragments`: referencia persistida consumible por tareas MT101.

### MT101_VALIDATE

```jsonc
{
  "taskRef": "validate-mt101",
  "taskType": "MT101_VALIDATE",
  "executionMode": "once",
  "input": { "source": "task-output", "sourceTaskRef": "build-mt101", "sourceOutput": "records" },
  "configuration": {
    "rules": ["__catalog__"],              // referencia al catalogo cargado
    "ruleSet": "swift-fin-uat-2024-q4",    // identificador del set
    "businessCalendar": "PE",
    "failOn": "ERROR",
    "publishIssuesTo": "table:mt101_validation_issue",
    "maxIssuesInOutput": 1000
  }
}
```

Outputs:

- `validate-mt101.summary`: `{validCount, invalidCount, issueCount, issuesBySeverity, ruleSet}`.
- `validate-mt101.errors`: muestra acotada de issues `{ruleCode, severity, transactionRef, message}`.
- `validate-mt101.issuesTruncated`: `true` cuando `errors` es una muestra y no el total.
- `validate-mt101.fragments`: referencia persistida cuando consume `mt101_build_fragment`.

Las reglas concretas NO se enumeran en este spec (ver RF-011). El catalogo se carga
via SPI `ValidationRuleProvider`.

`publishIssuesTo` soporta `table:mt101_validation_issue`,
`table:<connectionRef>:mt101_validation_issue` y objeto
`{"connectionRef":"<ref>","table":"mt101_validation_issue"}`. La tabla soportada
queda restringida a `mt101_validation_issue` para evitar SQL dinamico arbitrario.

### MT101_ARCHIVE

```jsonc
{
  "taskRef": "archive-mt101",
  "taskType": "MT101_ARCHIVE",
  "executionMode": "once",
  "input": { "source": "task-output", "sourceTaskRef": "build-mt101", "sourceOutput": "records" },
  "configuration": {
    "connectionRef": "12",
    "table": "mt101_archive",
    "hashAlgorithm": "SHA-256",
    "encryptColumn": "raw_payload",
    "encryptionSecretRef": "${secret:archive_key}",
    "retentionDays": 3650
  }
}
```

Outputs:

- `archive-mt101.summary`: `{archivedCount, totalBytes}`.
- `archive-mt101.table`: `mt101_archive`.
- `archive-mt101.records`: con `archiveId` por mensaje (clave para `PAY`).

### MT101_PAY

```jsonc
{
  "taskRef": "pay-mt101",
  "taskType": "MT101_PAY",
  "executionMode": "once",
  "input": { "source": "task-output", "sourceTaskRef": "archive-mt101", "sourceOutput": "records" },
  "configuration": {
    "transport": "REST",                   // REST | SFTP
    "rest": {
      "url": "${env:GATEWAY_MT101_URL}",
      "method": "POST",
      "authType": "login-request",
      "loginUrl": "https://auth.banco.local/oauth/token",
      "loginBodyTemplate": "grant_type=client_credentials&client_id=${secret:cid}&client_secret=${secret:csecret}",
      "tokenPath": "$.access_token",
      "contentType": "application/json",
      "timeoutSeconds": 60
    },
    "sftp": {
      "host": "sftp.banco.local",
      "port": 22,
      "username": "${secret:sftp_user}",
      "password": "${secret:sftp_pass}",
      "dropPathTemplate": "/in/mt101/${sendersReference}.xml",
      "tmpExtension": ".part",
      "remoteDuplicatePolicy": "SKIP_IF_SAME_HASH",
      "strictHostKeyChecking": true,
      "knownHostsPath": "/etc/ssh/ssh_known_hosts",
      "timeoutMillis": 15000
    },
    "idempotencyKeyTemplate": "${sendersReference}",
    "retryPolicy": {
      "maxRetries": 5,
      "backoffStrategy": "exponential",
      "initialBackoffSeconds": 30,
      "maxBackoffSeconds": 900,
      "retryOn": ["TIMEOUT", "5xx", "CONNECTION_REFUSED"]
    },
    "confirmationMode": "sync",            // sync | async-callback | async-poll
    "expectedGatewayResponse": {
      "successField": "$.accepted",
      "referenceField": "$.gatewayReference",
      "errorMessageField": "$.error.message"
    }
  }
}
```

Outputs:

- `pay-mt101.summary`: `{dispatchCount, sentCount, acceptedCount, rejectedCount, retriedCount, totalDurationMs}`.
  `dispatchCount` es el total procesado por el transporte; `sentCount` equivale
  a mensajes aceptados por el canal/gateway (`acceptedCount`).
- `pay-mt101.records`: por mensaje `{sendersReference, archiveId?, envelopeId?, uetr, status, gatewayReference, attempts, lastError}`.
- `pay-mt101.errors`: mensajes fallidos definitivamente.

### MT101_STATUS

Primer consumidor productivo del SPI M-2 (`SuspendableTaskProvider`). Tres modos:

```jsonc
{
  "taskRef": "status-mt101",
  "taskType": "MT101_STATUS",
  "executionMode": "once",
  "configuration": {
    "mode": "poll",                        // query | callback | poll
    "input": { "sourceTaskRef": "pay-mt101", "sourceOutput": "records" },
    "query": {
      "url": "https://gateway-pagos.banco.local/v1/swift/status/${gatewayReference}",
      "method": "GET",
      "timeoutSeconds": 30
    },
    "expectedGatewayResponse": {
      "statusField": "$.status",
      "referenceField": "$.gatewayReference"
    },
    "poll": {
      "intervalSeconds": 300,              // vencimiento de la suspension (auto-despertar)
      "maxAttempts": 10,
      "finalStatuses": ["ACCEPTED", "REJECTED"]
    },
    "callback": { "completeOnPartial": false },
    "connectionRef": "12",
    "confirmationTable": "mt101_confirmation"
  }
}
```

- **`query`**: single-shot, sin suspension (tipico bajo scheduler de spec 006).
- **`callback`**: la tarea se suspende; el gateway invoca
  `POST /api/process-executions/resume/{token}` con body
  `{"confirmations":[{"sendersReference":"...","status":"ACCP","gatewayReference":"...","raw":"..."}]}`.
  El resume persiste a `mt101_confirmation` (type `CALLBACK`) y re-suspende con
  token nuevo si quedan pendientes. Con HMAC habilitado
  (`integrationhub.resume.hmac.enabled`), el caller firma el body crudo en el
  header `X-Signature` (HMAC-SHA256 hex, prefijo `sha256=` opcional).
- **`poll`**: primera consulta en execute; lo no-final queda suspendido con
  vencimiento `poll.intervalSeconds`; el `SuspensionExpiryScheduler` (property
  `integrationhub.suspension.expiry-check-every`, default 60s) re-invoca el
  resume al vencer. Solo estados de `finalStatuses` se persisten (type `POLL`);
  failure al agotar `maxAttempts`.

**Continuacion M-2.1**: si hay tareas con `taskOrder` mayor despues de
`MT101_STATUS`, al completar el resume el engine rehidrata el contexto del
pipeline (capturado al suspender en `suspended_continuation`, V16) y las
ejecuta automaticamente — sin re-drive manual.

### MT101_RECONCILE (fase 2)

```jsonc
{
  "taskRef": "reconcile-mt101",
  "taskType": "MT101_RECONCILE",
  "executionMode": "once",
  "configuration": {
    "connectionRef": "12",
    "sentTable": "mt101_archive",
    "confirmationTable": "mt101_confirmation",
    "matchKeys": ["senders_reference", "uetr"],
    "asOfDate": "${today}",
    "lookbackDays": 5,
    "publishExceptionsTo": "table:12:mt101_reconciliation_exception"
  }
}
```

### MT101_ROUTE (fase 2)

```jsonc
{
  "taskRef": "route-mt101",
  "taskType": "MT101_ROUTE",
  "executionMode": "per-record",
  "input": { "source": "task-output", "sourceTaskRef": "parse-mt101", "sourceOutput": "records" },
  "configuration": {
    "rules": [
      { "name": "internal-book-transfer", "predicate": "beneficiary.bic == receiver_lt", "routeTo": "BOOK_TRANSFER" },
      { "name": "domestic-clearing",      "predicate": "beneficiary.bic.endsWith('PE')",  "routeTo": "LOCAL_CLEARING" },
      { "name": "international",          "predicate": "true",                            "routeTo": "MT103_OUTBOUND" }
    ],
    "defaultRoute": "MT103_OUTBOUND",
    "publishTo": "records"
  }
}
```

Output: cada record con campo `routedAs` agregado.

### MT101_PARSE (fase 2)

```jsonc
{
  "taskRef": "parse-mt101",
  "taskType": "MT101_PARSE",
  "executionMode": "once",
  "input": { "source": "task-output", "sourceTaskRef": "read-swift", "sourceOutput": "records" },
  "configuration": {
    "interpretSequenceAB": true,
    "publishMultiOutput": true,            // requiere gap M-3 del motor
    "outputs": [
      { "name": "envelope",     "type": "summary" },
      { "name": "header",       "type": "summary" },
      { "name": "transactions", "type": "records" }
    ]
  }
}
```

### MT101_SPLIT (fase 3)

```jsonc
{
  "taskRef": "split-mt101",
  "taskType": "MT101_SPLIT",
  "executionMode": "once",
  "input": { "source": "task-output", "sourceTaskRef": "build-mt101", "sourceOutput": "records" },
  "configuration": {
    "maxTransactionsPerFragment": 100,
    "maxBytesPerFragment": 10000,
    "rebuildIndexTotal": true,
    "fragmentReferenceTemplate": "${sendersReference}-${fragmentIndex}"
  }
}
```

### MT101_REPAIR (fase 3)

```jsonc
{
  "taskRef": "repair-mt101",
  "taskType": "MT101_REPAIR",
  "executionMode": "per-record",
  "input": { "source": "task-output", "sourceTaskRef": "status-mt101", "sourceOutput": "errors" },
  "configuration": {
    "repairs": [
      { "ruleCode": "<code>", "action": "stripNonSwiftXChars", "targetFields": ["beneficiary.nameAndAddress"] },
      { "ruleCode": "<code>", "action": "recomputeExchangeRate", "rateSource": "table:12:fx_rates_daily" }
    ],
    "newReferenceTemplate": "${sendersReference}-R${repairAttempt}",
    "linkToOriginalUetr": true,
    "publishTo": "records"
  }
}
```

## Modelo de datos

Tablas nuevas en sub-catalogo `swift/`:

### Tabla `swift_message_envelope`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `message_type` | char(3) | `101`, `103`, `202`, `900`, `910`, `940`, `942` |
| `sender_lt` | char(12) | block 1 LT address |
| `receiver_lt` | char(12) | block 2 LT address |
| `session` | bigint | block 1 |
| `sequence` | bigint | block 1 |
| `uetr` | uuid | `{121:UETR}` block 3 |
| `priority` | char(1) | N/U/S |
| `raw_payload` | text | crudo (cifrable) |
| `payload_hash` | char(64) | SHA-256 hex |
| `parsed_at` | timestamp | |
| `source_file_name` | varchar(255) | |
| `process_execution_id` | bigint | FK -> process_execution.id |

Indices: PK; UNIQUE `(sender_lt, uetr) WHERE uetr IS NOT NULL`;
INDEX `(message_type, parsed_at)`.

### Tabla `mt101_archive`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `envelope_id` | bigint | FK -> swift_message_envelope.id |
| `sender_lt` | char(12) | copia operacional del LT emisor para idempotencia |
| `senders_reference` | varchar(16) | `:20:` |
| `customer_specified_reference` | varchar(16) | `:21R:` |
| `message_index` | integer | `:28D:` numerador |
| `message_total` | integer | `:28D:` denominador |
| `requested_execution_date` | date | `:30:` |
| `instructing_party_kind` | char(1) | C/L/NULL |
| `instructing_party_value` | text | |
| `ordering_customer_kind` | char(1) | F/G/H/NULL (si en Sequence A) |
| `ordering_customer_account` | varchar(34) | |
| `ordering_customer_name_addr` | text | |
| `account_servicing_kind` | char(1) | A/C/NULL |
| `account_servicing_value` | text | |
| `status` | varchar(20) | PENDING/COMPOSED/SENT/ACCEPTED/REJECTED |
| `format` | char(4) | JSON/XML/FIN |
| `created_at` | timestamp | |
| `retention_until` | date | derivado de `retentionDays` |

Indices: PK; UNIQUE `(sender_lt, senders_reference, year_of_execution)`
para idempotencia operacional; INDEX `(status, created_at)`.

### Tabla `mt101_transaction`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `archive_id` | bigint | FK -> mt101_archive.id |
| `sequence_number` | integer | orden en Sequence B |
| `transaction_reference` | varchar(16) | `:21:` |
| `amount_currency` | char(3) | `:32B:` |
| `amount_value` | numeric(18,3) | `:32B:` |
| `ordering_customer_kind` | char(1) | si 50a en Sequence B |
| `ordering_customer_account` | varchar(34) | |
| `beneficiary_kind` | char(1) | NULL/A/F |
| `beneficiary_account` | varchar(34) | |
| `beneficiary_name_addr` | text | |
| `account_with_institution` | text | |
| `remittance_information` | text | `:70:` |
| `details_of_charges` | char(3) | `:71A:` OUR/BEN/SHA |
| `original_amount_currency` | char(3) | `:33B:` |
| `original_amount_value` | numeric(18,3) | |
| `exchange_rate` | numeric(15,8) | `:36:` |

Indices: PK; UNIQUE `(archive_id, transaction_reference)`;
INDEX `(amount_currency)`.

### Tabla `mt101_validation_issue`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `archive_id` | bigint | FK NULL (puede ser pre-archive) |
| `transaction_id` | bigint | FK NULL |
| `rule_code` | varchar(80) | del catalogo NVR cargado |
| `rule_set` | varchar(50) | identificador del set de reglas |
| `severity` | char(1) | E/W/I |
| `message` | text | |
| `fragment_set_id` | varchar(80) | lote masivo origen, si aplica |
| `senders_reference` | varchar(16) | `:20:` del fragmento/mensaje |
| `fragment_index` | integer | indice `:28D:` del fragmento, si aplica |
| `detected_at` | timestamp | |

### Tabla `mt101_confirmation`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `archive_id` | bigint | FK |
| `confirmation_type` | varchar(10) | MT900/MT910/STATUS_API |
| `gateway_reference` | varchar(35) | |
| `confirmed_status` | varchar(20) | CONFIRMED/REJECTED/RETURNED |
| `raw_payload` | text | mensaje de confirmacion crudo |
| `received_at` | timestamp | |

### Tabla `mt101_reconciliation_exception`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `as_of_date` | date | |
| `archive_id` | bigint | FK NULL |
| `confirmation_id` | bigint | FK NULL |
| `exception_type` | varchar(30) | SENT_WITHOUT_CONFIRM / CONFIRM_WITHOUT_SENT / AMOUNT_MISMATCH |
| `details` | text | |
| `resolved_at` | timestamp | NULL hasta cierre manual |

### Tabla `payment_validation_rule`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `rule_set` | varchar(50) | identificador del set (`swift-fin-uat-2024-q4`, etc.) |
| `code` | varchar(80) | codigo de regla |
| `standard` | varchar(20) | SWIFT/ISO20022/OPENBANKING |
| `applies_to` | varchar(50) | MT101/MT103/PAIN001/... |
| `severity` | char(1) | E/W/I |
| `predicate_kind` | varchar(20) | FIELD_REQUIRED/FIELD_FORBIDDEN/OPTION_ALLOWED/MAX_LENGTH/CURRENCY_ALLOWED/AMOUNT_MAX/CHARGES_ALLOWED/JEXL |
| `predicate_body` | text | |
| `active` | boolean | default true |

UNIQUE `(rule_set, code, applies_to)`.

### API `payment_validation_rule`

Contrato REST del catalogo:

- `GET /api/payment-validation-rules`: pagina reglas con filtros `ruleSet`, `q`,
  `standard`, `appliesTo`, `status`, `page`, `size`.
- `POST /api/payment-validation-rules`: crea una regla.
- `PUT /api/payment-validation-rules/{ruleId}`: reemplaza una regla.
- `POST /api/payment-validation-rules/{ruleId}/activation/{active}`: activa o
  desactiva sin borrar historico.
- `GET /api/payment-validation-rules/export?ruleSet=<id>`: exporta reglas de un
  set para promocion entre ambientes.
- `POST /api/payment-validation-rules/import`: importa reglas, con
  `replaceExisting` opcional para onboarding/certificacion.

Roles: lectura para `platform-admin`, `integration-admin`, `auditor`; escritura
solo para `platform-admin` e `integration-admin`.

### Tabla `mt101_build_fragment`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | bigserial | PK |
| `fragment_set_id` | varchar(80) | lote reprocesable generado por `MT101_BUILD_FROM_TABLE` |
| `process_execution_id` | bigint | FK NULL -> `process_execution.id` |
| `task_definition_id` | bigint | tarea que genero el fragmento |
| `source_table` | varchar(255) | tabla staging origen |
| `source_row_from` | bigint | primera fila origen incluida |
| `source_row_to` | bigint | ultima fila origen incluida |
| `fragment_index` | integer | indice 1..N del mensaje |
| `fragment_total` | integer | total N del lote |
| `senders_reference` | varchar(16) | `:20:` |
| `payload_hash` | char(64) | SHA-256 del `raw_payload` |
| `raw_payload` | text | FIN/XML/JSON generado |
| `message_json` | text | representacion canonica para validar, archivar y pagar |
| `status` | varchar(20) | BUILT/ARCHIVED/SENT/REJECTED |
| `error_message` | text | ultimo error operacional del fragmento |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

Indices: UNIQUE `(fragment_set_id, fragment_index)`, UNIQUE
`(fragment_set_id, senders_reference)`, INDEX `(fragment_set_id, status)`,
INDEX `(process_execution_id, task_definition_id)`.

El estado de fragmento es operacional. El archivo bancario oficial sigue siendo
`mt101_archive`; `mt101_build_fragment` habilita volumen alto, reintentos y
reconstruccion controlada antes y despues de archivo/pago.

## Variables de entorno y secretos

- `${env:GATEWAY_MT101_URL}`: URL del gateway por entorno.
- `${secret:archive_key}`: clave de cifrado de `raw_payload`.
- `${secret:cid}`, `${secret:csecret}`: client credentials del OAuth del gateway.
- `${secret:gateway_token}`: token estatico si `authType=bearer`.
- `${secret:sftp_user}`, `${secret:sftp_password}` o `${secret:sftp_key}`: SFTP del banco.

## Observabilidad (depende de spec 004)

Atributos OTel propuestos:

- `swift.message.type`, `swift.sender_lt`, `swift.receiver_lt`, `swift.uetr`,
  `swift.senders_reference`, `swift.transaction_count`, `swift.total_amount_eur`.

Metricas:

- `mt101_messages_built_total{format}`,
  `mt101_messages_sent_total{transport,status}`,
  `mt101_validation_failures_total{rule_code,severity}`,
  `mt101_pay_latency_seconds{transport}` (histograma),
  `mt101_archive_bytes_total`.

## Consideraciones tecnicas

- El sub-catalogo `iso20022/` y `openbanking/` quedan reservados; sus task types
  se especificaran cuando entren al roadmap.
- El reader `swift-mt` se registra en el catalogo 002 (RF-005 spec 002) pero su
  codigo vive bajo ownership del modulo de pagos.
- `MT101_STATUS` modes `poll` y `callback` corren sobre el SPI M-2 del motor
  (suspend/resume con token de un solo uso, auto-despertar por
  `SuspensionExpiryScheduler` y continuacion downstream M-2.1).
- `MT101_PARSE` con multi-output depende del gap M-3 del motor; hasta que exista,
  publica un solo `summary` con campos anidados (`summary.envelope`,
  `summary.header`, `summary.transactions`).
- Los formularios MT101 ya se registran sobre el mecanismo existente del motor.
  El catalogo de perfiles bancarios vive en `features/payments` y no en spec 003:
  es configuracion propia de la vertical SWIFT/pagos.

## Pruebas tecnicas sugeridas

- Build end-to-end con fixtures de los 4 casos canonicos
  (`one-debit-account`, `multiple-debit-accounts`, `subsidiary`, `with-fx`).
- Validacion con un set de reglas mock cargado via SPI.
- Pay con WireMock simulando gateway REST; con Testcontainers SFTP server;
  con Testcontainers MQ (RabbitMQ o ActiveMQ Artemis).
- Archive con verificacion de hash, retencion y cifrado de columna.
- Status mode poll con `MockServer` que cambia de respuesta entre intentos.
- Reconcile con fixtures de sent y confirmaciones desalineadas.
- Idempotencia: ejecutar el mismo proceso dos veces y verificar que la segunda
  ejecucion rechaza por UNIQUE constraint sin efectos secundarios.
