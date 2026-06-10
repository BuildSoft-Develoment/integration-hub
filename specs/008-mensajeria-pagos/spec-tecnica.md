# Spec tecnica - Mensajeria de pagos

## Componentes relacionados

### Backend (`platform-app`)

- Providers de task types (sub-paquete `provider/task/payments/`):
  - `swift/Mt101BuildTaskProvider`, `Mt101ValidateTaskProvider`,
    `Mt101ArchiveTaskProvider`, `Mt101PayTaskProvider`, `Mt101StatusTaskProvider`,
    `Mt101ReconcileTaskProvider`, `Mt101RouteTaskProvider`, `Mt101ParseTaskProvider`,
    `Mt101SplitTaskProvider`, `Mt101RepairTaskProvider`.
  - `iso20022/` y `openbanking/`: vacios al inicio, espacios reservados.
- SPI de formateadores: `PaymentMessageFormatter` con implementaciones
  `JsonMt101Formatter`, `XmlMt101Formatter`, `FinMt101Formatter`.
- SPI de transportes: `PaymentMessageTransport` con implementaciones
  `RestPaymentTransport`, `SftpPaymentTransport`, `MqPaymentTransport`.
- SPI de reglas: `ValidationRuleProvider` con catalogo cargable.
- Reader `swift-mt` en `provider/reader/SwiftMtReaderProvider` (registrado en el
  catalogo 002, pero su codigo vive en el modulo de pagos para ownership).
- Servicios: `PaymentsCatalogService`, `Mt101ArchiveService`,
  `Mt101ReconciliationService`.

### Frontend (`frontend/libs/features/payments-swift`, Angular/Nx)

- Feature lazy-loaded `features/payments-swift/` con componentes por task type:
  `mt101-build-form`, `mt101-validate-form`, `mt101-archive-form`,
  `mt101-pay-form`, `mt101-status-form`, `mt101-reconcile-form`,
  `mt101-route-form`, `mt101-parse-form`, `mt101-split-form`, `mt101-repair-form`.
- Registro de formularios via el mecanismo de descubrimiento Nx descrito en spec
  003 (gap M-1b).
- Stores CQRS: `payments-catalog-query.store.ts`,
  `payments-catalog-command.service.ts`, `payments-archive.store.ts`.
- Tablero de conciliacion: `mt101-reconciliation-board`.

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
    "sourceOutput": "table",
    "batchSize": 5000,
    "cursor": { "orderBy": "id" },
    "filters": { "status": "PENDING" }
  },
  "configuration": {
    "format": "JSON",                     // JSON | XML | FIN
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
    },
    "publishTo": "records"                 // records | table:<connRef>:<tabla>
  }
}
```

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
    "publishIssuesTo": "table:12:mt101_validation_issue"
  }
}
```

Outputs:

- `validate-mt101.summary`: `{validCount, invalidCount, issuesBySeverity, ruleSet}`.
- `validate-mt101.errors`: lista de issues `{ruleCode, severity, transactionRef, message}`.
- `validate-mt101.table`: nombre tabla de issues persistidos.

Las reglas concretas NO se enumeran en este spec (ver RF-011). El catalogo se carga
via SPI `ValidationRuleProvider`.

### MT101_ARCHIVE

```jsonc
{
  "taskRef": "archive-mt101",
  "taskType": "MT101_ARCHIVE",
  "executionMode": "batch",
  "input": { "source": "task-output", "sourceTaskRef": "build-mt101", "sourceOutput": "records", "batchSize": 100 },
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
  "executionMode": "per-record",
  "input": { "source": "task-output", "sourceTaskRef": "archive-mt101", "sourceOutput": "records" },
  "configuration": {
    "transport": "REST",                   // REST | SFTP | MQ
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
      "connectionRef": "21",
      "dropPathTemplate": "/in/mt101/${sendersReference}.xml",
      "tmpExtension": ".part",
      "fileMode": "0600"
    },
    "mq": {
      "connectionRef": "22",
      "queue": "BANK.MT101.IN",
      "messageType": "TEXT"
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

- `pay-mt101.summary`: `{sentCount, acceptedCount, rejectedCount, retriedCount, totalDurationMs}`.
- `pay-mt101.records`: por mensaje `{sendersReference, uetr, status, gatewayReference, attempts, lastError}`.
- `pay-mt101.errors`: mensajes fallidos definitivamente.

### MT101_STATUS (fase 2)

```jsonc
{
  "taskRef": "status-mt101",
  "taskType": "MT101_STATUS",
  "executionMode": "once",
  "input": { "source": "task-output", "sourceTaskRef": "pay-mt101", "sourceOutput": "records" },
  "configuration": {
    "mode": "poll",                        // poll | callback
    "poll": {
      "url": "https://gateway-pagos.banco.local/v1/swift/status/${gatewayReference}",
      "intervalSeconds": 60,
      "maxAttempts": 1440,
      "successStatuses": ["CONFIRMED", "SETTLED"],
      "failureStatuses": ["REJECTED", "RETURNED"]
    },
    "callback": {
      "endpointPath": "/api/payments/swift/status-callback",
      "matchByHeader": "X-Senders-Reference",
      "timeoutHours": 72
    },
    "publishTo": "table:12:mt101_confirmation"
  }
}
```

Requiere gap M-2 del motor (tareas long-running).

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

Indices: PK; UNIQUE `(sender_lt_via_envelope, senders_reference, year_of_execution)`
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
| `rule_code` | varchar(20) | del catalogo NVR cargado |
| `rule_set` | varchar(50) | identificador del set de reglas |
| `severity` | char(1) | E/W/I |
| `message` | text | |
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
| `code` | varchar(20) | codigo de regla |
| `standard` | varchar(20) | SWIFT/ISO20022/OPENBANKING |
| `applies_to` | varchar(50) | MT101/MT103/PAIN001/... |
| `severity` | char(1) | E/W/I |
| `predicate_kind` | varchar(20) | SQL/JS/JAVA_CLASS |
| `predicate_body` | text | |
| `active` | boolean | default true |

UNIQUE `(rule_set, code, applies_to)`.

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
- `MT101_STATUS` mode `poll` depende del gap M-2 del motor (tareas long-running);
  hasta que exista, se usa `MT101_STATUS` mode `callback` o un scheduler externo.
- `MT101_PARSE` con multi-output depende del gap M-3 del motor; hasta que exista,
  publica un solo `summary` con campos anidados (`summary.envelope`,
  `summary.header`, `summary.transactions`).
- El frontend `features/payments-swift/` depende del gap M-1b del motor; hasta que
  exista, se registran los formularios editando `process-form-factory.service.ts`
  directamente (deuda temporal).

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
