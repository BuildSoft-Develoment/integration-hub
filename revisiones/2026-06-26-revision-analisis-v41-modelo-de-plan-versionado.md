# v41 — modelo de plan versionado (DRAFT/ACTIVE/SUPERSEDED)

Fecha: 2026-06-26
Alcance: implementación del pendiente documentado de "máxima robustez": separar el PLAN APROBADO INMUTABLE
(versionado) del ledger de EJECUCIÓN mutable, con histórico de revisiones, despacho atado a la revisión activa y
aprobación validada contra la revisión inmutable. Directiva: sin código fallback / sin caminos legacy.

## Motivación

Tras la v40-bis la inmutabilidad y la exclusividad ya estaban cerradas (reserva PREPARING_PLAN + upsert atado a la
reserva + solicitud atómica + claim de spec exacto). El modelo versionado añade la dimensión que faltaba:
**conservar cada conjunto de planes aprobado como una revisión inmutable** (auditoría del plan a lo largo del
tiempo) y hacer **explícito** que el dispatcher solo ejecuta la **revisión ACTIVE**.

## Diseño (sin reescribir el ledger de ejecución — bajo riesgo en la ruta de dinero)

Se añade el plan versionado **en paralelo** al ledger de ejecución existente, que sigue siendo el runtime:

- **`mt101_corrective_pay_plan`** — una fila por revisión: `plan_revision`, `plan_set_hash`, `plan_count`,
  `status` (DRAFT | ACTIVE | SUPERSEDED), timestamps. Índices únicos parciales: **a lo sumo UNA ACTIVE y UNA
  DRAFT** por run.
- **`mt101_corrective_pay_plan_fragment`** — el spec inmutable por fragmento de cada revisión (copia exacta de lo
  preparado: transporte, destino, `dispatch_spec_json/hash`, `payload_hash`, etc.).
- **`mt101_rebuild_run.active_plan_revision`** — la revisión despachable.
- **`mt101_corrective_pay_fragment.plan_revision`** — el ledger de ejecución queda ETIQUETADO con la revisión
  activa.

### Flujo

```
reservePayForPlanPreparation     NOT_REQUESTED/FAILED/INVALIDATED -> PREPARING_PLAN  (reserva exclusiva, v40-bis)
refresh + preparePayIntents      compila/persiste specs en el ledger de ejecución (exclusivo)
compileDraftPlanRevision         SNAPSHOT inmutable del conjunto -> nueva revisión DRAFT (plan + plan_fragment)
requestPayWithPlanSet (atómico)  PREPARING_PLAN -> REQUESTED
                                 + DRAFT -> ACTIVE  (la revisión recién compilada)
                                 + ACTIVE anterior -> SUPERSEDED  (histórico inmutable)
                                 + etiqueta el ledger de ejecución con la revisión activa
                                 + active_plan_revision + pay_plan_set_hash + PAY_REQUESTED + PAY_PLAN_PREPARED
finally (si no concreta):        release reserva + deleteDraftPlanRevision + deleteOrphanPreparedIntents
```

### Garantías nuevas (verificadas por pruebas)

1. **Histórico de revisiones inmutable.** Cada solicitud activa una revisión y marca la anterior SUPERSEDED. Las
   revisiones SUPERSEDED se conservan (auditoría del plan en el tiempo). Nunca hay dos ACTIVE (índice único parcial).
2. **El dispatcher solo ejecuta la revisión ACTIVE.** El claim (`markPayFragmentDispatching`) exige
   `f.plan_revision = r.active_plan_revision`: un fragmento de una revisión SUPERSEDED **jamás se despacha**, aunque
   payload/ruta/plan_hash/spec coincidan.
3. **La aprobación valida contra la fuente inmutable.** `approveAndPayCorrective` valida en dos frentes: el run
   apunta al hash de la revisión ACTIVE **y** el ledger de ejecución (lo que se despachará) sigue coincidiendo con
   ese hash. Cualquier divergencia -> INVALIDA, sin enviar.
4. **DRAFT desechable.** Si la solicitud no concreta (fallo de compilación/preparación), el DRAFT nunca llega a
   ACTIVE y se elimina en el `finally` (junto con la reserva y los intents parciales). No quedan revisiones a medias.
5. **Sin secretos resueltos.** Los `plan_fragment` llevan las referencias de secreto intactas (igual que el ledger
   de ejecución); el dispatch re-resuelve desde Vault tras el claim (sin cambios respecto a v37-v40).

## Cambios

- **Migración V62**: `mt101_corrective_pay_plan` + `mt101_corrective_pay_plan_fragment` (con índices únicos
  parciales de ACTIVE/DRAFT), `mt101_rebuild_run.active_plan_revision`, `mt101_corrective_pay_fragment.plan_revision`.
- **`Mt101RebuildRepository`**:
  - `compileDraftPlanRevision(ds, runId, createdBy)` — snapshot inmutable -> revisión DRAFT (bajo advisory lock;
    descarta un DRAFT previo y numera la siguiente revisión). Devuelve `DraftPlanRevision(revision, planSet)`.
  - `requestPayWithPlanSet(..., planRevision)` — ahora ACTIVA la DRAFT (DRAFT->ACTIVE), supersede la ACTIVE
    anterior, etiqueta el ledger y fija `active_plan_revision`, todo en la misma transacción atómica.
  - `deleteDraftPlanRevision`, `payActivePlanRevisionSetHash`, `computePayPlanSetFromPlanRevision`.
  - `markPayFragmentDispatching` — añade `and f.plan_revision is not distinct from r.active_plan_revision`.
- **`Mt101CorrectiveLifecycleService`**: `requestCorrectivePay` compila el DRAFT y activa la revisión;
  `approveAndPayCorrective` valida contra la revisión ACTIVE inmutable; el `finally` descarta el DRAFT no concretado.

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **45** (+2):
  - `requestActivatesAnImmutablePlanRevisionAsTheApprovedSource`: una sola revisión ACTIVE (=1), DRAFT consumido,
    hash del run = hash de la revisión inmutable, ledger etiquetado con la revisión activa.
  - `reRequestAfterInvalidationSupersedesPriorRevisionAndActivatesANewOne`: revisión 1 -> SUPERSEDED, revisión 2 ->
    ACTIVE, nunca dos ACTIVE, `active_plan_revision`=2, ledger re-etiquetado.
- `Mt101PayFragmentReprocessTest` — **34** (+1):
  - `claimRequiresFragmentToBelongToTheRunsActivePlanRevision`: un fragmento de una revisión SUPERSEDED (1 != activa
    2) NO se reclama; alineado con la activa, reclama.
- Todos los tests Mt101 (unit): **278**, 0 fallos.
- Integración end-to-end con Flyway real (aplica hasta **V62**, `Successfully applied 62 migrations`):
  `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT` = **3**, 0 fallos.

## Nota de migración

El comentario de cabecera de V62 evita la sintaxis literal de referencia de secreto para no chocar con el
reemplazo de placeholders de Flyway (mismo cuidado que en V59).

## Conclusión

El plan correctivo es ahora un **artefacto versionado e inmutable**: el maker compila una revisión DRAFT, la
solicitud la ACTIVA (superseando la anterior, que se conserva como histórico), el dispatcher solo ejecuta la
revisión ACTIVE y la aprobación se valida contra esa revisión inmutable. "plan aprobado = plan ejecutado" queda
respaldado por un modelo de revisiones con auditoría completa, sin código fallback. No quedan pendientes abiertos
del análisis.
