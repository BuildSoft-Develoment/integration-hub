# Defectos

## Regla

Registrar aqui defectos abiertos o historicos relevantes cuando se formalicen ciclos de QA.

## Estado actual

- baseline creado
- sin catalogo formal de defectos migrado a esta carpeta todavia

## Registro 2026-06-12 - spec 008 mensajeria de pagos

| ID | Tipo | Severidad | Estado | Descripcion | Evidencia |
| --- | --- | --- | --- | --- | --- |
| QA-008-001 | Brecha de cobertura | Media | Abierto | `payment-rules` simulados quedaron versionados como fixtures y seed SQL local/dev (`bank:SIM-ESTRICTO`, `bank:SIM-FLEXIBLE`). Falta cargar/certificar perfiles reales por banco (`bank:*`) desde guias H2H licenciadas y golden files del banco. | `qa/fase-6-qa/evidencias/008-mensajeria-pagos.md`, `qa/fase-6-qa/perfiles-simulados/` |
| QA-008-002 | Brecha de cobertura | Media | Parcial | REST 4xx/5xx, retries, idempotencia y SFTP con contenedor real quedaron cubiertos; `SKIP_IF_SAME_HASH` valida SHA-256 real. Falta homologar contra gateway bancario real y rechazos semanticos certificados. | `RestPaymentTransportTest`, `SftpPaymentTransportTest` |
| QA-008-003 | Brecha de cobertura | Media | Cerrado tecnico | Se agrego prueba de reproceso selectivo por estado de fragmento: PAY consume `ARCHIVED` por defecto y reprocesa `REJECTED` solo cuando se solicita explicitamente. | `Mt101PayFragmentReprocessTest` |
| QA-008-004 | Riesgo de datos de prueba | Baja | Abierto | La prueba web de reconciliacion compartio base con pruebas masivas previas y mostro `unmatchedSent` alto; se requiere repetir en base limpia para evidencia de cierre. | `#5884` |
| QA-008-005 | Observacion tecnica | Baja | Abierto | Nx marco `web:test` como flaky aunque los 50 archivos y 169 tests pasaron; conviene aislar la causa antes del gate final. | `cmd.exe /c "cd frontend && npx nx test web --skip-nx-cache"` |
| QA-008-006 | Brecha de evidencia UI | Baja | Abierto | Browser verifico login, procesos, modo edicion y paleta `MT101_*`, pero no se capturo el panel de formulario del nodo; queda pendiente evidencia visual de formularios y mapping tipo `DB_WRITE`. | `qa/fase-6-qa/evidencias/008-mensajeria-pagos.md` |
| QA-008-007 | Hardening tecnico | Media | Cerrado tecnico | Se cerro el riesgo P0 pre-homologacion: limpieza de temporales parciales en fuentes FTP/SFTP/REST, SFTP seguro por defecto con `knownHostsPath`, guard de duplicados en V19 sin alterar V18, separacion `dispatchCount`/`sentCount` en `MT101_PAY` y lifecycle MT101 sin fallback legacy. | `TempFileSourcePayloadTest`, `Mt101ArchiveStatusRepositoryTest`, `Mt101PayTaskProviderTest`, `Mt101PayFragmentReprocessTest`, `Mt101AllTasksProcessE2EIT`, `qa/fase-6-qa/evidencias/008-mensajeria-pagos.md` |
