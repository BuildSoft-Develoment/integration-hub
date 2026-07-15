# Evidencia tanda-5 — `uncertain` sticky en los transportes (money-safety) — 2026-07-15

Autorizado tras el doble check de tanda-4. Cierra un hueco **pre-existente** (lógica de clasificación de
tanda-2) que la re-solicitud automática de tanda-4 (#7) elevaba a riesgo de **doble pago**.

## Hallazgo (del doble check de tanda-4)

El agregado del loop de reintentos de ambos transportes **no era sticky en `uncertain`**:

- **SFTP** (`SftpPaymentTransport`): `lastUncertain = result.uncertain()` se **sobrescribía** cada iteración.
- **REST** (`RestPaymentTransport`): en `ConnectException` hacía **`lastUncertain = false`** (borraba un uncertain
  previo), y las salidas inline `4xx/2xx-false` devolvían `rejected` **sin** mirar si un intento anterior fue
  incierto.

Con `DEFAULT_MAX_RETRIES=5` y sin break tras un uncertain, la secuencia **`uncertain` (intento 1: la petición/
archivo salió, el banco pudo recibirlo) → `retriable`/`rejected` (intento posterior)** agregaba a
`transportFailure`/`rejected`. Como tanda-4 revierte `transportFailure → ARCHIVED` y **re-paga**, un pago que
**pudo haber llegado** se re-pagaría → **doble pago**. La idempotencia de transporte solo cubre parte (REST por
idempotency-key; SFTP `OVERWRITE` NO protege si el banco ya consumió el archivo del intento 1).

## Fix — `uncertain` sticky/monótono

Principio: **"si algún intento pudo haber enviado, el resultado final es INCIERTO y NUNCA se degrada"** a
`transportFailure`/`rejected` (ni re-pagable ni rechazo reusable). Se resuelve por verificación remota/STATUS.

- SFTP: `boolean anyUncertain` acumulativo (`anyUncertain |= result.uncertain()`), y el agregado final devuelve
  `uncertain` si `anyUncertain`, preservando el error del intento incierto.
- REST: `boolean anyUncertain`; `ConnectException` ya **no** borra el uncertain; **todas** las salidas de
  degradación inline (`2xx`-successFalse, HTTP `4xx/5xx` no-retry, `ConnectException` no-retry) devuelven
  `uncertain` si `anyUncertain`, si no su clasificación normal.

Archivos: `SftpPaymentTransport.java`, `RestPaymentTransport.java`. `SftpPaymentTransport.attemptUpload` pasa a
package-private para poder scriptear la secuencia por-intento en el test.

## Validación (todo verde)

| Clase | Resultado | Qué valida |
|---|---|---|
| `RestPaymentTransportTest` | **16/16** (+1) | `aReadTimeoutFollowedByABusinessRejectionStaysUncertain_sticky`: timeout (intento 1) → HTTP 400 (intento 2) → **uncertain** (no rejected). WireMock scenario. |
| `SftpPaymentTransportTest` | **14/14** (+1) | `uncertainThenTransportFailureAcrossRetriesStaysUncertain_sticky`: uncertain → transportFailure → **uncertain** (no transportFailure). attemptUpload scripteado. |

Sin el fix ambos tests fallarían: REST devolvía `rejected` (salida 4xx inline ignoraba el uncertain previo);
SFTP devolvía `transportFailure` (agregado por el último intento). Los transportes son los únicos con esta
lógica; el resto del money-path usa stubs, así que no hay regresión (suites de transporte completas verdes).

## Propiedad garantizada

Combinada con tanda-4: la re-solicitud automática de un `transportFailure` es money-safe porque `transportFailure`
ahora implica que **ningún** intento llegó a despachar (uncertain es sticky). "Si alguna vez pudimos enviar, no
lo re-pagamos a ciegas."
