# Evidencia E2E readers/plugins 10k - 20260709004937

- Plataforma: http://localhost:8080
- Usuario: admin
- Datos: C:\chatgtp\quarkus\qa\fase-6-qa\evidencias\large-readers-plugins-20260709004937\fixtures
- Resultado JSON: C:\chatgtp\quarkus\qa\fase-6-qa\evidencias\large-readers-plugins-20260709004937\result.json
- Screenshot login: C:\chatgtp\quarkus\qa\fase-6-qa\evidencias\large-readers-plugins-20260709004937\post-login.png

## Health

- Platform health: UP
- Audit consumer: OK

## Plugins

- Puertos: 50061=OK, 50062=OK, 50063=OK, 4300=OK
- Versiones registradas: undefined@1.0.0, undefined@1.0.0, undefined@1.0.0
- UI catalog size: 1

## Escenarios

| Escenario | Esperado | Actual | Registros | Resultado |
|---|---:|---:|---:|---|
| csv-10k-ok | COMPLETED | COMPLETED | 10000 | PASS |
| txt-10k-ok | COMPLETED | COMPLETED | 10000 | PASS |
| xlsx-10k-ok | COMPLETED | COMPLETED | 10000 | PASS |
| swift-mt-10k-ok | COMPLETED | COMPLETED | 10000 | PASS |
| txt-10k-soft-errors | COMPLETED | COMPLETED | 9900 | PASS |
| csv-missing-file-hard-error | FAILED | FAILED |  | PASS |
| csv-invalid-reader-config-catalog-error | HTTP_4XX_OR_5XX | HTTP_200 |  | FAIL |

## Validacion gRPC demo

| Backend | Comando | Resultado |
|---|---|---|
| Java | `node test/e2e-client.mjs localhost:50061 DEMO_TRANSFORM_JAVA` | PASS, `engine=java`, `result=HOLA MUNDO` |
| Node | `node test/e2e-client.mjs localhost:50062 DEMO_TRANSFORM_NODE` | PASS, `engine=node`, `result=HOLA MUNDO` |
| Python | `node test/e2e-client.mjs localhost:50063 DEMO_TRANSFORM_PY` | PASS, `engine=python`, `result=HOLA MUNDO` |

## Hallazgo

- El endpoint `POST /api/reader-definitions` acepto un reader `CSV` sin `fields`.
  El contrato de catalogo indica que el alta de readers valida layout por formato, y
  las pruebas unitarias del provider rechazan CSV sin campos. Riesgo: configuraciones
  invalidas pueden llegar al catalogo y fallar recien durante ejecucion.

## Observaciones

- CSV/TXT/XLSX usan `FILE_READ -> DB_WRITE(staging_record)` con 10k filas.
- SWIFT_MT usa archivo FIN con 10k mensajes concatenados, un record por mensaje.
- `txt-10k-soft-errors` valida filas rechazadas por regla de reader sin fallar el proceso.
- `csv-missing-file-hard-error` valida falla dura de ejecucion por fuente inexistente.
- Los descriptors demo quedan instalados con `trusted:false`; por diseno quedan como diagnostico/UNTRUSTED hasta configurar confianza corporativa.
