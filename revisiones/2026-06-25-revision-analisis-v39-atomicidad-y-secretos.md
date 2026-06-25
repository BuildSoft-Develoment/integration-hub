# Revisión del análisis v39 — atomicidad de la solicitud y control de secretos en ruta

Fecha: 2026-06-25
Alcance: el v39 valida 3 de los 4 endurecimientos del v38 (claim antes de secretos, enlace del JSON exacto,
output del transporte real) y deja **dos puntos**: atomicidad completa de la solicitud, y que una referencia a
secreto no pueda cambiar el destino. Directiva: sin código fallback / sin caminos legacy.

| Punto v39 | Veredicto | Acción |
|---|---|---|
| Claim antes de resolver secretos | **VALIDADO (v38)** | Confirmado en el código + pruebas reales del dispatcher |
| Enlace del `dispatch_spec_json` exacto | **VALIDADO (v38)** | Confirmado + prueba |
| Output del transporte real (`PERSISTED_PLAN`) | **VALIDADO (v38)** | Confirmado + prueba |
| Cobertura del dispatcher correctivo real | **YA EXISTÍA** | El v39 revisó un snapshot anterior; las pruebas del branch correctivo real ya estaban (SFTP-spec, claim-perdido, Vault-falla, json-binding) |
| **Atomicidad: solicitud + plan + auditoría** | **REAL → CORREGIDO** | Nueva operación única `requestPayWithPlanSet` (una transacción, advisory lock): REQUESTED + `pay_plan_set_hash` + `PAY_REQUESTED` + `PAY_PLAN_PREPARED`. Elimina los estados intermedios (REQUESTED-sin-hash, hash-sin-acción) |
| **Secreto puede cambiar destino** | **REAL → CORREGIDO** | El compilador rechaza referencias dinámicas (`${secret|vault|env|config:...}`) en campos de ruta/destino/host/URL/puerto/path/endpoint/correlación; solo se permiten en campos de credencial |

## Detalle

### Atomicidad de la solicitud (casos B y C del v39)
`requestPayWithPlanSet(...)` ejecuta en UNA transacción bajo `pg_advisory_xact_lock` por run:
1. `UPDATE run -> REQUESTED` (validando ARCHIVED + pay_status elegible).
2. `UPDATE run` con `pay_plan_version/count/set_hash`.
3. `recordPayAction(PAY_REQUESTED)`.
4. `recordPayAction(PAY_PLAN_PREPARED)`.

Todo-o-nada: ya no puede quedar `REQUESTED` con `pay_plan_set_hash` nulo, ni un hash sin su acción
append-only. La cadena hash de auditoría encadena PAY_REQUESTED → PAY_PLAN_PREPARED en la misma transacción.

**Caso A (intents huérfanos):** los intents/specs se compilan y persisten ANTES (idempotentes vía ON CONFLICT)
para no mantener una transacción larga con miles de fragmentos. Si la solicitud atómica falla, quedan filas
`PREPARED` bajo un run `NOT_REQUESTED`: son **inertes** (no hay solicitud → no hay aprobación → no hay despacho)
y una re-solicitud las **sobrescribe**. No es una brecha de seguridad ni de doble pago. (La alternativa de tabla
draft del v39 cerraría también esto; se deja documentada como opción de escalabilidad.)

### Control de secretos en ruta/destino
`Mt101DispatchPlanCompiler.assertSpecSafety` (antes `assertNoLiteralSecrets`):
- Campo de **credencial** (nombre normalizado contiene token/secret/password/passphrase/authorization/apikey/
  credential/bearer/privatekey/knownhosts): debe ser una **referencia** (no literal).
- Cualquier valor: prohibido embeber credenciales en URL (`user:pass@host`).
- **v39:** una **referencia dinámica** a fuente externa mutable (`${secret|vault|env|config:...}`) en un campo
  que NO es de credencial (host, URL, puerto, path, endpoint, correlación, transport) se **rechaza**: el destino
  debe ser un valor estático persistido. Las plantillas de mensaje deterministas (`${sendersReference}`,
  `${idempotencyKey}`) sí se permiten (no llevan prefijo `fuente:`).

Así "plan persistido = destino aprobado" es estrictamente cierto: un cambio de secreto solo puede afectar
credenciales, nunca mover el host/URL/endpoint del banco sin cambiar (e invalidar) la spec.

## Pruebas (todas en verde)

- `Mt101PayFragmentReprocessTest` — **32**:
  - `dispatchPlanCompilerRejectsDynamicRefInRoutingFieldButAllowsItInCredentials` (`${secret:...}` en URL y
    `${env:...}` en host → rechazados; referencia en campo de credencial + plantilla de mensaje → permitido).
  - más las del v38 (claim-perdido sin Vault, Vault-falla → INVALIDATED, json-binding, SFTP-spec + output).
- `Mt101CorrectiveLifecycleServiceTest` — **39**:
  - `requestPayWithPlanSetIsAtomicLeavingNoRequestedWithoutPlanOrAudit` (segunda solicitud no elegible falla
    atómicamente; queda exactamente 1 PAY_REQUESTED + 1 PAY_PLAN_PREPARED + hash persistido).
- Dominio swift completo: **242** tests, 0 fallos.
- Integración end-to-end (Flyway real V59+V60): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT` = **3**,
  0 fallos.

## Conclusión

El v39 deja el modelo prácticamente cerrado: la solicitud, el conjunto de planes y las dos acciones append-only
se persisten atómicamente (sin estados maker-checker incompletos), y ninguna referencia dinámica puede cambiar
ruta/destino/endpoint/correlación al re-resolver secretos (solo credenciales). El riesgo residual ya no es doble
pago, re-routing desde config viva, ni inconsistencia de plan: es únicamente el Caso A (intents huérfanos
inertes), documentado y auto-sanado en la re-solicitud.
