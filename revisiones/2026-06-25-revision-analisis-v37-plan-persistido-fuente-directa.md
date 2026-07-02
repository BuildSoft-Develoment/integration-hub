# v37 — el ledger PAY como fuente directa de ejecución (plan persistido)

Fecha: 2026-06-25
Alcance: implementar el pendiente principal de todas las revisiones previas (v29..v36): que el dispatch
correctivo **ejecute el plan persistido** y **Mt101PayRouteResolver deje de ejecutarse en el dispatch**, con
re-resolución de solo las referencias a secretos y sin fallback al resolver vigente. Bajo autorización explícita.
Directiva: sin código fallback / sin caminos legacy.

## Qué cambió (flujo correctivo; el no-correctivo queda igual)

Antes:
```
config PAY congelada + routed_as actual + fragmento actual
  -> Mt101PayRouteResolver.resolve(...) (reconstruye el plan EN el dispatch)
  -> recalcula hash -> compara con ledger -> envia
```
Ahora:
```
PREPARACION (al preparar intents, sobre la config PAY SIN resolver):
  Mt101DispatchPlanCompiler.compile(...) -> especificacion canonica por fragmento
  (transport + configuracion con referencias a secretos por nombre + correlacion) + spec_hash
  -> persistida en mt101_corrective_pay_fragment (dispatch_spec_json/version/hash)

DISPATCH (correctivo):
  lee la spec persistida del ledger (sin Mt101PayRouteResolver)
  -> materializa: re-resuelve SOLO las referencias a secretos -> PayPlan
  -> claim (payload_hash actual = aprobado + approved_routed_as + dispatch_plan_hash recomputado del plan
     materializado) -> envia ese plan
  -> SIN spec persistida: NO hay fallback al resolver -> el fragmento se INVALIDA y NO se llama al banco
```

`mt101_build_fragment` queda como fuente del **payload** (verificado por hash); `mt101_corrective_pay_fragment`
es ahora la **fuente de verdad del contrato de despacho**.

## Componentes (nuevos y modificados)

- **Migración V59**: `dispatch_spec_version`, `dispatch_spec_json`, `dispatch_spec_hash` en
  `mt101_corrective_pay_fragment`.
- **`Mt101DispatchPlanCompiler`** (nuevo): `compile(unresolvedPayConfig, routedAs, routeError, message)` resuelve
  la ruta UNA vez (etapa de preparación), serializa la config **canónica** (claves ordenadas, hash estable) con
  **referencias a secretos intactas**, **rechaza secretos literales** y calcula `spec_hash`. `materialize(specJson,
  secretResolver)` reconstruye el `PayPlan` re-resolviendo solo las referencias — **no** consulta `routeTransports`
  ni la config vigente, **no** recalcula destino ni cambia transporte.
- **`Mt101CorrectiveLifecycleService.preparePayIntents`**: compila la spec desde
  `taskConfigSource.taskConfigUnresolved(..., "MT101_PAY")` (refs intactas) y la persiste por fragmento.
- **`Mt101RebuildRepository`**: `PayFragmentIntent` + insert con los campos de spec; `readPreparedDispatchSpec`
  (contrato + `approved_routed_as` + `payload_hash`); `invalidatePayFragmentMissingSpec` (fail-safe).
- **`Mt101CorrectivePayStore`**: `readPreparedSpec` / `invalidateMissingSpec`.
- **`Mt101PayTaskProvider`**: el bucle correctivo lee la spec y materializa (sin resolver); sin spec → INVALIDATED.
  Inyecta `JsonConfigurationMapper` (constructor `@Inject` de 6 args; los demás delegan con `null` para tests sin
  secretos) como re-resolutor de referencias.

## Garantías (sin fallback)

- En el dispatch correctivo **no se invoca `Mt101PayRouteResolver`**: el plan viene del ledger.
- **Sin spec persistida no hay camino alterno**: el fragmento se INVALIDA y nunca se llama al banco
  (no se "rellena" con la config vigente).
- El **secreto resuelto nunca se persiste**: la spec lleva referencias por nombre; un literal se rechaza al
  compilar. Las referencias se re-resuelven solo en el dispatch.
- "plan usado = plan aprobado" sigue garantizado por el claim (payload_hash + approved_routed_as +
  dispatch_plan_hash recomputado del plan materializado; ante drift → INVALIDATED).

## Pruebas (todas en verde)

- `Mt101PayFragmentReprocessTest` — **25**:
  - `correctiveDispatchWithoutPersistedSpecInvalidatesAndNeverCallsBank` (fail-safe: sin spec → INVALIDATED, 0
    llamadas al banco).
  - `correctiveDispatchExecutesPersistedSpecNotTheLiveConfig` (se ejecuta el plan persistido aunque la config
    vigente, de re-resolverse, lanzaría: el resolver no corre en el dispatch).
  - `dispatchPlanCompilerRejectsLiteralSecretButKeepsSecretReference` (nunca persiste secretos resueltos).
  - más todas las previas (claim, drift→INVALIDATED, carrera real, conflicto, etc.) ahora con spec persistida.
- `Mt101CorrectiveLifecycleServiceTest` — **36** (el flujo real compila y persiste la spec en `preparePayIntents`).
- Dominio swift completo: **232** tests, 0 fallos.
- Integración end-to-end (Flyway real **V59**): `BankProfileHomologationIT` (homologación correctiva completa,
  dispatch desde spec) + `Mt101OutboundEndToEndIT` = **3** tests, 0 fallos, `BUILD SUCCESS`.

## Fase 2 (documentada, no incluida en este incremento)

Este incremento entrega el núcleo: **el dispatch correctivo ejecuta el plan persistido y el resolver ya no
participa**. Quedan como fase 2 (refinamientos, no brechas):
- Mover la compilación del plan a `requestCorrectivePay` (hoy se compila al preparar, dentro de la aprobación) y
  añadir un `pay_plan_set_hash` a nivel de run para que el checker apruebe el **conjunto exacto** de planes.
- Ampliar la spec con método HTTP/headers/timeouts/mTLS/known_hosts explícitos (hoy se persiste la configuración
  efectiva resuelta por ruta, con refs de secretos; los campos técnicos del transporte viajan dentro de
  `configuration`).
- Separar formalmente `Mt101PersistedDispatchPlanMaterializer` como componente independiente (hoy `materialize`
  vive en `Mt101DispatchPlanCompiler`).

## Conclusión

El ledger PAY es ahora la **fuente directa de ejecución** del dispatch correctivo: el plan se compila y persiste
en la preparación, y el dispatcher lo lee y ejecuta re-resolviendo solo las referencias a secretos, sin volver a
decidir ruta/transporte/destino y sin fallback. Esto cierra el pendiente funcional principal arrastrado desde la
v29, manteniendo "plan usado = plan aprobado" y sin persistir secretos resueltos.
