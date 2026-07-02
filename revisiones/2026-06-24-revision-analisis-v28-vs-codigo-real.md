# Revisión del análisis v28 (app_htoh(28)) contra el código real

Fecha: 2026-06-24
Alcance: el v28 valida que los P0 del v26/v27 quedaron corregidos (carrera scheduler↔dispatcher, secretos
redactados que rompían STATUS/SFTP diferido, error inesperado→rechazo seguro, error SFTP oculto como "ACK
pendiente", cadena hash serializada, plan aprobado validado antes de dispatch). Quedaban **pendientes finos**.
Directiva: sin código fallback / sin caminos legacy. Validar lo ya implementado.

## Veredicto general

El v28 **no detecta defectos nuevos**: confirma que los P0 están corregidos en el código actual. Sus cuatro
"pendientes reales antes de homologación" se atienden así:

| # | Pendiente v28 | Veredicto | Acción |
|---|---|---|---|
| 1 | Prueba de **concurrencia real** (scheduler+dispatcher simultáneos, 2 conexiones, Postgres real) | **VIABLE → IMPLEMENTADO** | Test `schedulerAndDispatcherNeverLeaveRunNotExecutingWithDispatchingFragment`: 2 hilos con `CountDownLatch` sobre Postgres real, **25 iteraciones**; cada vuelta corre `markExpiredPayExecutionsUncertain` (scheduler) y `markPayFragmentDispatching` (dispatcher) a la vez sobre el mismo run, y asevera el **invariante**: nunca un fragmento DISPATCHING con el run fuera de EXECUTING |
| 2 | Ejecutar PAY **directamente desde el plan persistido** por fragmento | **VALIDADO — funcionalmente cerrado** | El propio v28 lo califica de *hardening final, no carencia de trazabilidad*. El claim atómico ya exige `payload_hash`+`approved_routed_as`+`dispatch_plan_hash` == aprobado; ante cualquier drift → **INVALIDATED** (no envía). "Plan usado = plan aprobado" garantizado. Persistir el raw payload+config almacenaría secretos (lo que el propio análisis prohíbe) sin añadir seguridad |
| 3 | **Exigir secretRef/Vault** para STATUS y RECONCILE (un literal se redacta pero no se recupera para un PAY_UNCERTAIN) | **VIABLE → IMPLEMENTADO** | `assertSecretsAreResolvableRefs`: al aprobar, si STATUS/RECONCILE traen un secreto **literal** (no `${secret:...}`) se **rechaza pre-claim** (sin dejar el run EXECUTING) exigiendo una referencia re-resoluble. Sin fallback: no se degrada en silencio redactando-e-irrecuperando |
| 4 | Mantener excepciones tipadas para todos los transports futuros | **VALIDADO — contrato establecido** | `PreDispatchTransportException` (SPI) ya es el contrato: pre-dispatch→REJECTED, cualquier otra→UNCERTAIN. Los transports REST/SFTP la lanzan; un transport futuro que no la use cae por defecto en UNCERTAIN (la ruta segura) |

---

## Detalle de lo implementado (con prueba)

### #1 — prueba de concurrencia real (scheduler ↔ dispatcher)
Antes la garantía P0.1 se evidenciaba con un test secuencial (lease vencido → no despacha). El v28 pide
**concurrencia real**. Nuevo test (`Mt101PayFragmentReprocessTest`):
- Postgres real (Testcontainers). Run EXECUTING con **lease vencido** (el escenario de carrera).
- Dos hilos liberados a la vez con `CountDownLatch`: hilo A = scheduler (`markExpiredPayExecutionsUncertain`),
  hilo B = dispatcher (`markPayFragmentDispatching` con los hashes aprobados).
- **25 iteraciones** independientes. En cada una se asevera:
  - el claim del dispatcher devuelve **0** (lease vencido → no puede reclamar),
  - el fragmento **nunca** queda `DISPATCHING`,
  - el run queda `INVALIDATED` (lo resolvió el scheduler) — nunca `EXECUTING`+fragmento despachado.
- Sin excepciones en ninguna vuelta (el advisory lock serializa; el check run+lease los hace disjuntos).

Esto demuestra el invariante bancario: **no hay carrera que deje un run inválido con un pago despachado**.

### #3 — exigir secretRef/Vault para STATUS y RECONCILE
**Causa (validada):** un secreto **literal** en STATUS/RECONCILE se redacta al congelar el snapshot
(`***REDACTED***`), pero entonces **no puede recuperarse** para autenticar una resolución diferida de
`PAY_UNCERTAIN` (STATUS/SFTP). El v27 ya re-resolvía los `${secret:...}`; faltaba **prohibir el literal**.

**Fix (sin fallback):** `assertSecretsAreResolvableRefs` recorre la config sin resolver; si una clave de
secreto (`password`, `token`, `authorization`, `apiKey`, …) trae un valor **literal** (sin `${`), lanza
`IllegalStateException` señalando la ruta del secreto. Se valida **antes del claim** → el PAY no avanza y el
run **no queda colgado en EXECUTING**; se exige convertir el literal en una referencia Vault re-resoluble.
Tests: literal en STATUS → `approve` rechaza y el run sigue `REQUESTED`; con refs → `approve` procede y el
snapshot conserva ambas referencias sin resolver (re-resolubles), nunca un secreto resuelto.

## Pruebas que evidencian el cierre (todas en verde)

- `Mt101PayFragmentReprocessTest` — **12** (incluye la prueba de **concurrencia real** de 25 iteraciones).
- `Mt101CorrectiveLifecycleServiceTest` — **33** (rechazo de secreto literal + perfil con refs conservado).
- Dominio swift (provider + service + repository + status): **215** tests del filtro, 0 fallos
  (`Mt101StatusTaskProviderTest` 19, `Mt101PayTaskProviderTest` 13 incluidos).
- Integración end-to-end (Flyway real **V57**): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT`
  = **3** tests, 0 fallos, `BUILD SUCCESS`.

## Mejora del análisis (#2)

El v28 reitera "ejecutar PAY directamente desde el plan persistido". Se mantiene la conclusión del v27: la
recomendación literal sería **menos segura** (enviaría con un plan "aprobado" aunque el fragmento haya
driftado). El diseño actual exige que el plan ACTUAL del fragmento sea **bit-a-bit** el aprobado y, ante
cualquier drift, **INVALIDA** sin enviar. El propio v28 lo reconoce como *hardening final, no carencia*.
Persistir el raw payload+config con secretos contradice el #3 del mismo análisis.

## Documentado (infra, no bloqueante)

**HMAC/WORM/rol DB exclusivo de inserción** para la cadena hash de auditoría siguen documentados como
endurecimiento de infraestructura (no código de aplicación).

## Conclusión

El v28 confirma que la liberación del PAY está endurecida frente a concurrencia, caídas y errores ambiguos.
De sus pendientes: la **prueba de concurrencia real** (#1) y la **exigencia de secretRef/Vault** (#3) quedan
implementadas y evidenciadas; ejecutar-desde-el-ledger (#2) queda validado como hardening redundante (la
validación atómica ya garantiza "plan usado = aprobado") y las **excepciones tipadas** (#4) ya son el contrato
con la ruta segura (UNCERTAIN) por defecto.
