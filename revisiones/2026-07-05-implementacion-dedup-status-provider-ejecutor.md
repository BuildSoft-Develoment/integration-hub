# Implementación — dedup de la ruta correctiva del STATUS provider hacia `Mt101StatusQueryExecutor` (v56-fix, cierre de opción A)

Fecha: 2026-07-05
Alcance: implementa el [análisis](2026-07-05-analisis-dedup-status-provider-ejecutor.md). Migra `executeCorrectiveQuery`
del `Mt101StatusTaskProvider` para usar el ejecutor compartido `Mt101StatusQueryExecutor` (v55), eliminando la copia
inline de la lógica de transporte/ruta. **Una sola copia** de `resolveStatusQuery` + ejecución REST/SFTP. Refactor de
comportamiento equivalente, sin rutas legacy.

## Cambios (en `Mt101StatusTaskProvider`)

- **Campo**: `sftpGateway` → reemplazado por `statusQueryExecutor` (construido reusando el `gateway` del provider:
  `new Mt101StatusQueryExecutor(gateway, new Mt101StatusSftpGateway())` — sin doble `HttpClient`, sirve para los
  constructores de test que inyectan un `HttpClient` stub).
- **`executeCorrectiveQuery`**: el bloque por-registro (resolveStatusQuery + ejecución REST/SFTP, ~70 líneas) se
  reemplaza por `statusQueryExecutor.query(record, planConfig)` + branch (`error` → error ruidoso; `pending` → SFTP
  sin ACK aún, se mantiene; si no → usar `confirmedStatus`/`gatewayReference`/`rawBody`). La **persistencia**
  (`ConfirmationRow`, `correctivePayResolution`, conteos, `confirmations`) queda **intacta**.
- **Eliminados** (ya sin uso): el record `StatusQuery`, `resolveStatusQuery` y el helper `stringList` (solo los usaba
  esa ruta). Se conservan `gateway` y `resolveTemplate` (los usan `poll` y el query normal REST).

## Diferencia (documentada en el doble-check): no byte-idéntico

Los mensajes de error de ruta cambian levemente (p.ej. *"corrective fragment has no route…"* → *"fragment has no
route…"*): el ejecutor es **compartido** (resolver normal + correctivo), así que la redacción **neutral** es la
correcta. **Ningún test asserta** esos strings → sin breakage. Cambio cosmético en la muestra `errors`/logs, no una
regresión funcional. (También las entradas `errors` del caso REST ahora incluyen `route`, como las demás — más
consistente.)

## Pruebas (evidenciadas)

- `Mt101StatusTaskProviderTest` (**20**): el STATUS provider sigue verde — incl. **SFTP** (contenedor `atmoz/sftp`) y
  **route-aware**, que ahora corren a través del ejecutor. Es la validación clave del refactor puro.
- `Mt101CorrectiveLifecycleServiceTest` (**62**): `resolveUncertainPay` (que dispara `executeCorrectiveQuery`) verde.
- `Mt101PayUncertainResolutionServiceTest` (**3**): el resolver normal (mismo ejecutor) sigue verde.
- **Suite Mt101 completa: 298 tests, 0 fallos** (BUILD SUCCESS), incluyendo los E2E con Flyway real
  (`Mt101AllTasksProcessE2EIT`, `Mt101MillionFileProcessE2EIT`, `Mt101OutboundEndToEndIT`).

## Conclusión

Cerrada la **opción A completa**: la lógica de consulta de STATUS por transporte y ruta (REST + SFTP + route-aware)
existe en **un solo lugar** (`Mt101StatusQueryExecutor`), usada por el provider (correctivo) y por el resolver del
UNCERTAIN normal. Se eliminó la duplicación latente introducida en v55. Comportamiento equivalente (salvo la redacción
cosmética de los errores de ruta), validado por la suite del STATUS + correctivo + E2E.
