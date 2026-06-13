# Plan de pruebas aplicado

## Alcance

- backend Quarkus
- frontend Angular/Nx
- seguridad OIDC
- ejecucion de procesos
- observabilidad y auditoria
- vertical de mensajeria de pagos SWIFT MT101 (`specs/008-mensajeria-pagos`)

## Estrategia

- unitarias e integracion para `platform-app`
- pruebas UI y `e2e` para `frontend`
- smoke tests por ambiente
- validacion de roles y trazabilidad
- pruebas web autenticadas para flujos end-to-end de procesos configurables
- pruebas de volumen para `FILE_READ -> DB_WRITE -> MT101_BUILD_FROM_TABLE`
- pruebas de contratos por tarea `MT101_*` y reader `SWIFT_MT`
- pruebas negativas de `MT101_NVR`/`MT101_VALIDATE` antes de homologar con bancos
- pruebas de reproceso por estado de fragmento para no regenerar lotes completos

## Cobertura especifica - spec 008

| Frente | Estrategia | Evidencia |
| --- | --- | --- |
| Outbound MT101 | Ejecutar pipeline completo desde archivo comun hasta pago, status y reconciliacion. | `qa/fase-6-qa/evidencias/008-mensajeria-pagos.md` |
| Inbound MT101 | Leer FIN/MT101, parsear y enrutar a revision o siguiente tarea. | `qa/fase-6-qa/evidencias/008-mensajeria-pagos.md` |
| Alto volumen | Procesar 1,000,000 registros desde archivo comun usando staging y build paginado. | `qa/fase-6-qa/evidencias/008-mensajeria-pagos.md` |
| Formularios frontend | Validar configuracion `MT101_*`, mapping tipo `DB_WRITE`, variables previas y Angular Material. | `qa/fase-6-qa/evidencias/008-mensajeria-pagos.md` |
| `MT101_NVR` / validacion negativa | Probar limites FIN/campos: BIC, `:70:`, `:77B:`, `:32B:`, `:71A:`, 10 KB y referencias duplicadas. | `Mt101ValidateTaskProviderTest` |
| Reproceso | Reintentar fragmentos `REJECTED` sin regenerar todo el lote y sin enviar fragmentos no elegibles. | `Mt101PayFragmentReprocessTest` |
| Hardening bancario | Ejecutar perfiles `bank:*`, golden files H2H y transporte real. | Pendiente por guias bancarias/licencias y ambiente de homologacion. |
