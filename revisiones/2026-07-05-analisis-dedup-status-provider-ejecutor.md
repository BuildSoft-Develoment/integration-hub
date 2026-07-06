# Análisis — dedup de la ruta correctiva del STATUS provider hacia `Mt101StatusQueryExecutor` (cierre de opción A, follow-up de v55)

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar).
Contexto: v55 extrajo `Mt101StatusQueryExecutor` (resolveStatusQuery route-aware + ejecución REST/SFTP) y lo usó en el
resolver del UNCERTAIN normal, pero **no** refactorizó el `Mt101StatusTaskProvider` (se evitó cirugía apurada). Queda
la duplicación: el ejecutor es un **port verbatim** de la lógica que sigue inline en `executeCorrectiveQuery`.

## Dónde está la duplicación (verificado)

En `Mt101StatusTaskProvider`:
- `resolveStatusQuery(...)` (L770) + el record `StatusQuery` (L744): **solo** los usa `executeCorrectiveQuery` (L592).
- El bloque de ejecución por transporte (L609–663): REST (`gateway.query`) / SFTP (`sftpGateway.fetchResponse` +
  `classifyByTokens`) → `confirmedStatus`/`gatewayReference`/`rawBody`, con manejo de error/pendiente.
- `sftpGateway` (L102): **solo** lo usa ese bloque SFTP correctivo.

El ejecutor (`Mt101StatusQueryExecutor.query`) ya hace exactamente L590–663: devuelve
`StatusQueryResult(confirmedStatus, gatewayReference, rawBody, pending, error)`.

## Migración propuesta (refactor PURO)

Reemplazar en `executeCorrectiveQuery` el bloque por-registro L590–663 por:
```java
queriedCount++;
var result = statusQueryExecutor.query(record, planConfig);   // planConfig = QueryPlanConfig(routeAware, routeQuery, url, method, timeout, statusPath, referencePath)
if (result.error() != null) { errorCount++; byStatus.merge("ERROR",1,…); errors.add(entryFrom(record, result.error())); continue; }
if (result.pending()) { continue; }                            // SFTP sin ACK aún
var rawBody = result.rawBody();
var confirmedStatus = result.confirmedStatus();
var gatewayReference = result.gatewayReference();
// L664–703 (persistencia: ConfirmationRow, pay resolution, counts, confirmations) SIN CAMBIOS
```
La salida del ejecutor **cubre todo** lo que la persistencia necesita (`confirmedStatus`, `gatewayReference`,
`rawBody`); la entrada de `errors` se arma desde `record` + `result.error()` (sin pérdida de info: `sendersReference`,
`gatewayReference`, `route` salen del record).

Tras migrar se **eliminan** del provider: `resolveStatusQuery`, el record `StatusQuery`, y el campo `sftpGateway`
(solo los usaba el bloque correctivo). Se **conservan** `gateway` y `resolveTemplate` (los usan `poll` (L357) y el
query normal (L477)). El ejecutor se construye reusando el `gateway` del provider:
`new Mt101StatusQueryExecutor(gateway, new Mt101StatusSftpGateway())` — sin doble `HttpClient`, y sirve para los
constructores de test que inyectan un `HttpClient` stub.

## Alcance / opcional

- **Núcleo (recomendado):** migrar solo `executeCorrectiveQuery` — ahí vive la duplicación real (route-aware + SFTP).
- **Opcional:** `poll` (L347–400) y el query normal (L444–520) son **REST-only** e inline triviales
  (`resolveTemplate` + `gateway.query`, 2 líneas); migrarlos al ejecutor centraliza todo pero aporta poco vs el
  riesgo de tocar más rutas. Se puede dejar para después o hacer en el mismo cambio si se quiere `resolveTemplate`
  también en el ejecutor.

## Corrección del doble-check — NO es byte-idéntico: mensajes de error de ruta

Al portar `resolveStatusQuery` al ejecutor **cambié levemente la redacción de los mensajes de error de ruta**
(p.ej. provider: *"corrective fragment has no route…"* → ejecutor: *"fragment has no route…"*). Verificado: **ningún
test** (STATUS, correctivo ni otro) asserta esos strings, así que **no rompe nada**. Además, como el ejecutor es
**compartido** (resolver normal + correctivo), la redacción **neutral** (sin "corrective") es la correcta. Es un
cambio **cosmético** (texto en la muestra `errors`/logs), no una regresión funcional. → La migración es un refactor
**de comportamiento equivalente**, no byte-idéntico en el texto de esos errores.

## Puntos de validación adicionales (del doble-check)

- El ejecutor re-implementa helpers triviales (`stringValue`/`intValue`/`mapValue`/`stringList`); verificar que son
  equivalentes a los del provider (lo cubren `Mt101StatusTaskProviderTest` route-aware/SFTP).
- `resolveTemplate` queda duplicado (provider para poll/normal + ejecutor para el correctivo) — trivial (5 líneas);
  se elimina del provider solo si además se migran poll/normal (opcional).

## Riesgos / validación

- Es un refactor de **comportamiento equivalente** (salvo la redacción cosmética de los errores de ruta, no asertada).
  El seam es limpio: L590–663 ↔ `executor.query`, L664–703 intactas.
- Validado por `Mt101StatusTaskProviderTest` (**20**, incl. SFTP con contenedor `atmoz/sftp` y route-aware),
  `Mt101CorrectiveLifecycleServiceTest` (**62**, resolveUncertainPay) y los E2E con Flyway real.
- Toca el path de confirmación bancaria del correctivo → correr la suite completa antes de commitear (idealmente sin
  la app dev corriendo, para evitar las races de I/O sobre `target/` vistas en v55).

## Veredicto

Dedup **REAL** y bounded: cierra la opción A completa (una sola copia de la lógica de transporte/ruta). Bajo riesgo
como refactor puro, bien cubierto por la suite del STATUS + correctivo + E2E. Elimina la duplicación latente antes de
que las dos copias diverjan.
