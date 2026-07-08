# PAY normal — reconciliación automática dentro del flujo STATUS (item 4)

**Fecha:** 2026-07-08
**Rama:** `feat/pay-normal-symmetric-terminal-resolution`
**Alcance:** item 4 del análisis app_htoh(59), validado (doble-check) contra código real.

## Hallazgo (re-verificado)

El PAY **correctivo** (ledger `mt101_rebuild_run`) SÍ se reconcilia dentro del flujo automático: la tarea
`MT101_STATUS`, con el flag `resolveCorrectivePay=true`, consulta el gateway y resuelve el ledger por `runId`
(`Mt101StatusTaskProvider.executeCorrectiveQuery`). El PAY **normal** (`mt101_build_fragment`) NO tenía ese camino
automático: `Mt101PayUncertainResolutionService.resolveUncertainNormalPay` existía y estaba completo (atómico + trama
`PAY_CONFLICT` + visible por items 1-3), pero solo se invocaba **manualmente** (endpoint/servicio); el scheduler de
lifecycle (`Mt101RebuildLifecycleScheduler.synchronizeActiveLifecycles`) **no** consulta gateway (solo avanza estados
de cuarentena). Asimetría: el correctivo se auto-concilia por STATUS, el normal no.

> Doble-check que corrigió mi análisis inicial: la reconciliación automática del correctivo vive en la **tarea
> MT101_STATUS** (flag `resolveCorrectivePay`), no en el scheduler. Por tanto item 4 = **flag `resolveNormalPay` en
> `MT101_STATUS`, espejo del correctivo**, no un scheduler nuevo.

## Cambio (SOLID)

`Mt101StatusTaskProvider` gana el flag opt-in `resolveNormalPay` (default `false`) en `mode=query`. Cuando es `true`:

- **SRP**: la tarea solo **enruta**. No reimplementa consulta/resolución; delega en
  `Mt101PayUncertainResolutionService.resolveUncertainNormalPay(connectionRef, fragmentSetId, executedBy, reason)`,
  que ya es atómico (transición + confirmación en 1 tx), emite la trama `PAY_CONFLICT` en las contradicciones
  `SENT`→banco-`REJECTED` y las deja visibles (API/UI). Nunca reenvía (STATUS solo consulta).
- **DIP**: el servicio (`@ApplicationScoped`) se **inyecta** por constructor (nuevo arg del constructor `@Inject`);
  nullable en los constructores de test que no lo ejercitan, con guard ruidoso si se pide `resolveNormalPay` sin él.
- **OCP**: nuevo camino sin tocar los flujos `query` normal ni el correctivo; no coexiste con el correctivo (el flag
  es explícito).
- El `fragmentSetId` es **explícito** en la config, o se **deriva** del output `fragmentSetId` del build upstream
  (`input.sourceTaskRef`), espejo de cómo el correctivo deriva `correctivePayRunId` de `taskOutputs`. Sin fallback
  silencioso: si no hay ninguno → error ruidoso.
- `executedBy`/`reason` son opcionales; por defecto son de sistema (`MT101_STATUS` /
  `automatic reconciliation by MT101_STATUS`), porque es una acción automática, no un maker humano.
- El resultado (`NormalPayResolution`) se mapea a outputs (`resolvedSent/Rejected`, `stillPending`, `gatewayErrors`,
  `conflicts`) para trazabilidad desde el pipeline. Errores de gateway y conflictos **no** son fallo de la tarea
  (se reintenta / conciliación manual); solo falla si no puede leer el set.

## Pruebas (evidencia)

`Mt101StatusTaskProviderTest` — **24 / 0 / 0** (20 previos sin regresión + 4 nuevos de item 4):

- `resolveNormalPayDelegatesWithExplicitSetAndDefaultActorReason`: delega con `connectionRef` + set explícito +
  actor/reason por defecto; mapea el resultado a outputs (`conflicts=1`, etc.).
- `resolveNormalPayDerivesFragmentSetFromUpstreamOutput`: sin `fragmentSetId` explícito, lo deriva del output del
  build upstream; respeta `executedBy`/`reason` custom.
- `resolveNormalPayFailsWhenSetCannotBeResolved`: sin set explícito ni upstream → `IllegalArgumentException` (sin
  fallback silencioso).
- `resolveNormalPayRequiresWiredService`: `resolveNormalPay` sin servicio inyectado → `IllegalStateException` claro.

Suite money-path completa (`Mt101*`): **318 / 0 / 0** (BUILD SUCCESS), sin regresión — incluye el wiring CDI del
nuevo argumento del constructor `@Inject`. La lógica real de resolución/atomicidad/trama sigue cubierta por
`Mt101PayUncertainResolutionServiceTest`; item 4 añade solo el wiring de delegación.
