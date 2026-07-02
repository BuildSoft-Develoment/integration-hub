# Doble check del análisis app_htoh(42) (re-envío) sobre v43 + recuperación de la app

Fecha: 2026-06-26
Alcance: re-validación del v43 (advisory lock, abandono transaccional, heartbeat, estado anterior, triggers de
inmutabilidad) contra el código real, más recuperación del arranque de la app. Directiva: sin código fallback.

## Recuperación de la app (incidente de arranque)

Tras el commit v43 la app no levantó en el relanzamiento: la JVM de Quarkus dev murió dejando un `npm install`
de Quinoa (frontend) **huérfano y colgado** (proceso `node` vivo sin java padre). Es un problema de arranque del
frontend, **ajeno al backend v43**. Recuperación: se mató el `node` huérfano y se relanzó el dev app limpio →
arrancó en **76 s**, Flyway aplicó **V64 + V65** al dev DB (`now at version v65`), y el login quedó alcanzable
(`health` 200, `login-page` 200, Keycloak OIDC 200, `request-pay` sin token 401).

## Verdicto del doble check sobre v43

Todos los ítems del análisis quedaron cerrados en v43, validados contra el código y con pruebas en verde
(corrective 50, reprocess 34, status 20, todos Mt101 283, IT 3 con Flyway V65):

| Ítem del análisis | Estado |
|---|---|
| P0 carrera takeover vs escritura (lock en `preparePayIntents`/`refresh`) | **Cerrado** (advisory lock + fallo explícito) |
| Limpieza del DRAFT fallido | **Cerrado** (`abandonPayPlanPreparation` transaccional) |
| Heartbeat de preparación masiva | **Cerrado** (renovación por página + `renewPayPlanReservation`) |
| Restaurar estado anterior al abortar | **Cerrado** (`pay_plan_previous_status` + `PAY_PLAN_PREPARATION_ABORTED`) |
| `preparePayIntents` no devuelva solo la cantidad intentada | **Cerrado**: el análisis pedía "verificar executeBatch **O** lanzar error si perdió la reserva"; v43 **lanza explícitamente** bajo el lock cuando se pierde el token (la rama de la condición OR ya satisfecha) |
| Plan versionado ACTIVE/SUPERSEDED inmutable | **Reforzado** (triggers de BD V65) |
| Pruebas concurrentes (CountDownLatch) y de cleanup del DRAFT | **Añadidas** |

## Único ítem abierto: "dispatcher lee la revisión inmutable" (hardening recomendado)

El análisis lo cataloga como **hardening recomendado** (no P0): el dispatcher lee la spec del ledger mutable
(`mt101_corrective_pay_fragment`) y, "como mínimo", el claim debería validar que el hash de la spec del ledger
coincide con el de la fila de la revisión ACTIVE inmutable.

### Estado real de la garantía (por qué ya se sostiene funcionalmente)
- **Inmutabilidad declarada en BD (v43):** los triggers V65 impiden mutar `mt101_corrective_pay_plan_fragment` de
  una revisión ACTIVE/SUPERSEDED y las transiciones ilegales del plan.
- **Claim atado a la revisión activa + spec exacto (v41/v38):** `f.plan_revision = r.active_plan_revision` +
  `dispatch_spec_json` EXACTO.
- **Sin ruta funcional de reescritura tras REQUESTED:** `preparePayIntents` solo corre bajo la reserva exclusiva
  (PREPARING_PLAN + token, ahora bajo advisory lock). No existe camino de aplicación que reescriba la spec del
  ledger después de aprobar.

Con esto, en **todos los flujos funcionales** el dispatcher despacha exactamente la spec de la revisión aprobada.
El cross-check del claim solo añade defensa frente a una **manipulación DIRECTA de la fila del ledger** (cambiar
`dispatch_spec_json` + `dispatch_spec_hash` de forma consistente por fuera de la aplicación), un vector de menor
prioridad (quien tiene escritura directa al ledger podría también atacar otras superficies).

### Por qué se trata como hardening dedicado (no se precipita en este turno)
Implementar el cross-check estricto **sin caminos legacy** (un bypass condicional cuando `active_plan_revision` es
null sería precisamente un camino legacy, prohibido por la directiva) obliga a reescribir el harness del
`Mt101PayFragmentReprocessTest` (esquema mínimo + `ensureRun` + ~4 helpers de inserción + tests del claim) para
que cada caso provea la revisión inmutable correspondiente. Es un cambio amplio en la **ruta de dinero** sobre 34
pruebas, y hacerlo de forma apresurada **justo después de un incidente de arranque** introduce más riesgo
(bloquear claims legítimos = pagos que no se despachan) que el que mitiga (un vector de tampering directo de BD ya
acotado por los triggers). Se planifica como una sesión enfocada con harness reescrito y validación completa
(corrective + reprocess + IT), o bien como el refactor mayor "el dispatcher LEE la spec desde
`mt101_corrective_pay_plan_fragment`" (que elimina el cross-check al no usar el ledger como fuente de la spec).

## Conclusión

El v43 cierra todos los P0 y defectos confirmados del análisis; la app fue recuperada (incidente de arranque del
frontend, no del backend) y el login está alcanzable. Queda un único punto de **hardening recomendado** (el
dispatcher/claim contra la revisión inmutable), ya cubierto funcionalmente por construcción + triggers de BD, que
se aborda como trabajo dedicado por su impacto en la ruta de dinero y no se precipita tras el incidente.
