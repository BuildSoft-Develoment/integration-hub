# v37 fase 2 — el checker aprueba el conjunto exacto de planes (maker-checker)

Fecha: 2026-06-25
Alcance: cerrar el último punto del análisis del v37 (P1): el checker debe aprobar el **conjunto exacto de
planes** preparados, no una configuración equivalente. Directiva: sin código fallback / sin caminos legacy.

## Qué cambió

Antes: la spec ejecutable se compilaba en `approveAndPayCorrective()`, **después** de que el checker aprobaba
y el run pasaba a EXECUTING. El checker aprobaba `configHash` + `payloadHash` (config equivalente), no un
conjunto durable de planes exactos.

Ahora (maker-checker del conjunto):
```
MAKER (requestCorrectivePay):
  ARCHIVED -> compila y PERSISTE los planes ejecutables por fragmento (dispatch_spec_json + hash)
  -> calcula el HASH AGREGADO del conjunto (orden canonico por senders_reference de
     senders_reference|payload_hash|dispatch_spec_hash)
  -> persiste pay_plan_version / pay_plan_count / pay_plan_set_hash en mt101_rebuild_run
  -> registra PAY_PLAN_PREPARED append-only
  -> PAY_REQUESTED

CHECKER (approveAndPayCorrective):
  valida payload_hash actual = solicitado
  valida config_hash actual = solicitado
  valida pay_plan_set_hash actual (recomputado de los fragmentos) = aprobado
  -> si cambio -> INVALIDA (re-solicitar), NO reconstruye ni reemplaza los planes
  -> claim EXECUTING -> ejecuta EXACTAMENTE los planes persistidos
```

La compilación (resolver de ruta) vive **solo en la preparación** (request). El approve ya **no** prepara ni
recompila: valida el conjunto y ejecuta.

## Componentes

- **Migración V60**: `pay_plan_version`, `pay_plan_count`, `pay_plan_set_hash` en `mt101_rebuild_run`.
- **`Mt101RebuildRepository`**: `computePayPlanSet` (hash agregado canónico), `persistPayPlanSet`,
  `payPlanSetHash`.
- **`Mt101CorrectiveLifecycleService.requestCorrectivePay`**: refresh + `preparePayIntents` + persistencia del
  conjunto + `PAY_PLAN_PREPARED`.
- **`Mt101CorrectiveLifecycleService.approveAndPayCorrective`**: elimina `preparePayIntents`; añade la
  validación `pay_plan_set_hash actual == aprobado` (INVALIDA si cambió).

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **38**:
  - `makerPreparesAndPersistsPlanSetAtRequestBeforeApproval` (los planes existen tras solicitar, antes de
    aprobar; `pay_plan_set_hash`/`pay_plan_count` persistidos; acción `PAY_PLAN_PREPARED`).
  - `approvalInvalidatesWhenPersistedPlanSetChangedAfterRequest` (si el conjunto persistido cambia tras la
    solicitud → INVALIDATED, 0 invocaciones de PAY).
  - `payActionsAreRecordedAppendOnly...` actualizado: `PAY_REQUESTED → PAY_PLAN_PREPARED → PAY_CLAIMED → ...`.
  - `payDispatchesTheFrozenApprovedConfig...` ajustado al nuevo conteo de lecturas (la preparación vive en
    request; el dispatch no re-lee config).
- Dominio swift completo: **237** tests, 0 fallos.
- Integración end-to-end (Flyway real V59+**V60**): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT`
  = **3**, 0 fallos.

## Estado final del objetivo "plan aprobado = plan ejecutado"

| Criterio | Estado |
|---|---|
| Plan ejecutable persistido por fragmento | Sí |
| No recalcular ruta en dispatch correctivo | Sí |
| Sin fallback cuando falta plan | Sí (INVALIDATED) |
| Transporte exclusivamente del plan | Sí (v37 P0.1) |
| Integridad completa del `dispatch_spec_hash` | Sí (v37 P0.2: verificación + claim atómico) |
| **Checker aprueba el conjunto exacto de planes** | **Sí (esta entrega)** |
| Protección de secretos literales | Sí (substring normalizado + credenciales URL) |

## Conclusión

El maker compila y persiste el conjunto exacto de planes al solicitar; el checker aprueba ese conjunto (valida
`pay_plan_set_hash`) y el dispatcher ejecuta exactamente esos planes, sin recompilar ni re-rutear y sin
fallback. Con esto, los tres puntos que el análisis del v37 marcaba como pendientes para afirmar "plan aprobado
= plan ejecutado" quedan cerrados.
