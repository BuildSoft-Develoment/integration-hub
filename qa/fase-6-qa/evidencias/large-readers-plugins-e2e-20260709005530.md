# Evidencia E2E readers/plugins 10k - 20260709005530

- Plataforma: http://localhost:8080
- Usuario: admin
- Datos: C:\chatgtp\quarkus\qa\fase-6-qa\evidencias\large-readers-plugins-20260709005530\fixtures
- Resultado JSON: C:\chatgtp\quarkus\qa\fase-6-qa\evidencias\large-readers-plugins-20260709005530\result.json
- Screenshot login: C:\chatgtp\quarkus\qa\fase-6-qa\evidencias\large-readers-plugins-20260709005530\post-login.png

## Health

- Platform health: UP
- Audit consumer: OK

## Plugins

- Puertos: 50061=OK, 50062=OK, 50063=OK, 4300=OK
- Versiones registradas: undefined@1.0.0, undefined@1.0.0, undefined@1.0.0
- UI catalog size: 1

## Async status

- State: DISABLED
- Execution enabled: false
- Dispatch enabled: false
- Consumer enabled/live: false / false

## Escenarios

| Escenario | Modo | Esperado | Actual | Registros | HTTP calls | Resultado |
|---|---|---:|---:|---:|---:|---|
| csv-10k-ok-sync-db-write | sync | COMPLETED | COMPLETED | 10000 |  | PASS |
| txt-10k-ok-sync-db-write | sync | COMPLETED | COMPLETED | 10000 |  | PASS |
| xlsx-10k-ok-sync-db-write | sync | COMPLETED | COMPLETED | 10000 |  | PASS |
| swift-mt-10k-ok-sync-db-write | sync | COMPLETED | COMPLETED | 10000 |  | PASS |
| txt-10k-soft-errors-sync-db-write | sync | COMPLETED | COMPLETED | 9900 |  | PASS |
| csv-10k-sync-rest-call-batch | sync | COMPLETED | COMPLETED | 20000 | 20 | FAIL |
| csv-10k-async-rest-call-batch | async-intent-gated | COMPLETED | COMPLETED | 10000 | 10 | PASS |
| csv-missing-file-hard-error | sync | FAILED | FAILED |  |  | PASS |
| csv-invalid-reader-config-catalog-error |  | HTTP_4XX_OR_5XX | HTTP_200 |  |  | FAIL |

## Observaciones

- CSV/TXT/XLSX usan `FILE_READ -> DB_WRITE(staging_record)` con 10k filas.
- `csv-10k-sync-rest-call-batch` valida el camino regular sincrono `FILE_READ -> REST_CALL` por lotes.
- `csv-10k-async-rest-call-batch` valida async real si `/api/messaging/async-status` esta `READY`; si esta `DISABLED`, documenta el gate y corre sincrono por diseno del backend local.
- SWIFT_MT usa archivo FIN con 10k mensajes concatenados, un record por mensaje.
- `txt-10k-soft-errors` valida filas rechazadas por regla de reader sin fallar el proceso.
- `csv-missing-file-hard-error` valida falla dura de ejecucion por fuente inexistente.
- Los descriptors demo quedan instalados con `trusted:false`; por diseno quedan como diagnostico/UNTRUSTED hasta configurar confianza corporativa.