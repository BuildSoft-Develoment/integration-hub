# Análisis — SFTP / route-aware en `resolve-uncertain-normal-pay` (follow-up de v52)

Fecha: 2026-07-05
Tipo: **análisis** (validación contra código real; sin implementar).
Contexto: v52 resuelve el `UNCERTAIN`/`DISPATCHING` del PAY normal consultando el gateway, pero **solo REST** y contra
un **único endpoint** (`query.url`). Bancos que despachan MT101 por **SFTP** (ACK/NACK) o con **enrutamiento por ruta**
(distintos endpoints por `routed_as`) no pueden resolverse hoy.

## Qué hace hoy v52 (verificado)

`Mt101PayUncertainResolutionService`:
- lee `query.url` (plantilla por `${sendersReference}`) y consulta con `Mt101StatusGateway.query(method, url, timeout)`
  (REST/HTTP);
- clasifica `confirmedStatus` con `acceptedStatuses`/`rejectedStatuses`;
- **rechaza con error claro** si no hay `query.url` (documentado como "REST-only; SFTP/route-aware follow-up").
- **No** consulta `route`/`routeQuery` (aunque la fuente durable `unresolvedPayStatusRecords` ya devuelve `route`), y
  **no** maneja SFTP.

## Qué ya existe en el STATUS (a reusar)

`Mt101StatusTaskProvider` ya resuelve el plan de consulta por transporte y ruta, sin fallback:
- `resolveStatusQuery(record, routeAware, routeQuery, sharedUrl, …)` → `StatusQuery` (REST | SFTP | error):
  - **no route-aware** → endpoint REST compartido;
  - **route-aware** → usa `record.route` para tomar `routeQuery[route]`; cada ruta es REST (`url`) o SFTP
    (`sftp` + `responseFileTemplate` + `acceptedTokens`/`rejectedTokens`); una ruta sin endpoint = **error ruidoso**.
- **SFTP**: `sftpGateway.fetchResponse(sftp, responsePath)` lee el ACK/NACK del banco; si aún no existe → pendiente
  (no error); clasifica por `classifyByTokens` o `statusField`. `Mt101StatusSftpGateway` es **sin dependencias**
  (`new Mt101StatusSftpGateway()`), reutilizable.

La fuente durable de v52 (`unresolvedPayStatusRecords`) **ya incluye `route`** en cada registro, así que el camino
route-aware es cableable sin tocar el SQL.

## Por qué v52 no reusó el provider (y la tensión de diseño)

v52 consultó el gateway por su cuenta (no reusó el provider) para evitar la **muestra acotada** de `outputs.records`
(cap `maxRecordsInOutput`) del provider, que no escala. Consecuencia: la lógica de transporte/ruta (REST+SFTP+route)
quedó **sin reusar**. Extender v52 a SFTP/route-aware exige o **duplicar** esa lógica o **extraerla** a un componente
compartido.

## Diseño propuesto

**Opción A (recomendada) — extraer un ejecutor de consulta compartido.**
Nuevo colaborador `Mt101StatusQueryExecutor` (o similar) que encapsule: `resolveStatusQuery` (route-aware) + ejecución
(REST vía `Mt101StatusGateway`, SFTP vía `Mt101StatusSftpGateway`) + clasificación por tokens/`statusField` →
`confirmedStatus`/pendiente/error, **por registro** (sin muestra acotada). Lo usan **ambos**: el `Mt101StatusTaskProvider`
(hoy tiene la lógica inline) y el `Mt101PayUncertainResolutionService`. Elimina la duplicación y da al resolver soporte
completo de transporte. Es un **refactor del STATUS provider** (extraer ~70–100 líneas a la clase compartida, sin
cambiar comportamiento — cubierto por los 20 tests de `Mt101StatusTaskProviderTest`).

**Opción B — replicar en el resolver.** El `Mt101PayUncertainResolutionService` replica `resolveStatusQuery` + SFTP +
clasificación (~100 líneas duplicadas). Más rápido, pero dos copias que pueden divergir (contra el ethos "sin legacy").

## Riesgos / consideraciones

- El refactor (A) toca el `Mt101StatusTaskProvider` (flujo money-path del pipeline y del correctivo). Debe ser
  **refactor puro** (mismo comportamiento), validado por `Mt101StatusTaskProviderTest` (20, incl. SFTP con contenedor
  atmoz/sftp) + los E2E.
- SFTP "pendiente" (ACK/NACK aún no presente) → el fragmento se mantiene `UNCERTAIN`/`DISPATCHING` (igual que v52 con
  gateway no concluyente): correcto, reintentar luego. **Nunca reenvía.**
- La config `routeQuery` debe venir en la tarea `MT101_STATUS` de la definición de proceso (opción B de v52); el
  resolver ya la carga.

## Veredicto

Gap **REAL** funcional: los bancos SFTP/route-aware no pueden resolver un `UNCERTAIN` normal hoy. La solución correcta
es la **opción A** (extraer el ejecutor de consulta compartido) — cierra el gap y elimina la duplicación latente entre
el STATUS provider y el resolver. Es un refactor mediano money-path (extracción + wiring en dos sitios + tests), de
bajo riesgo si se mantiene como refactor puro validado por la suite existente. **Nunca reenvía** (solo consulta).
