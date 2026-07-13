# Evidencia E2E readers/plugins 10k - 20260709004851

- Plataforma: http://localhost:8080
- Usuario: admin
- Datos: C:\chatgtp\quarkus\qa\fase-6-qa\evidencias\large-readers-plugins-20260709004851\fixtures
- Resultado JSON: C:\chatgtp\quarkus\qa\fase-6-qa\evidencias\large-readers-plugins-20260709004851\result.json
- Screenshot login: C:\chatgtp\quarkus\qa\fase-6-qa\evidencias\large-readers-plugins-20260709004851\post-login.png

## Health

- Platform health: UP
- Audit consumer: OK

## Plugins

- Puertos: undefined
- Versiones registradas: 
- UI catalog size: undefined

## Escenarios

| Escenario | Esperado | Actual | Registros | Resultado |
|---|---:|---:|---:|---|

## Observaciones

- CSV/TXT/XLSX usan `FILE_READ -> DB_WRITE(staging_record)` con 10k filas.
- SWIFT_MT usa archivo FIN con 10k mensajes concatenados, un record por mensaje.
- `txt-10k-soft-errors` valida filas rechazadas por regla de reader sin fallar el proceso.
- `csv-missing-file-hard-error` valida falla dura de ejecucion por fuente inexistente.
- Los descriptors demo quedan instalados con `trusted:false`; por diseno quedan como diagnostico/UNTRUSTED hasta configurar confianza corporativa.