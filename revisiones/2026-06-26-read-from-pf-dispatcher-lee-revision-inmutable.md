# read-from-pf — el dispatcher lee el contrato desde la revisión ACTIVE inmutable

Fecha: 2026-06-26
Alcance: cierre arquitectónico final pedido por los análisis app_htoh(43..46) y autorizado explícitamente: el
dispatcher correctivo deja de leer el contrato ejecutable del ledger operativo mutable y lo lee DIRECTAMENTE de la
revisión ACTIVE inmutable (`mt101_corrective_pay_plan_fragment`). El ledger queda como estado operativo + espejo de
verificación. Directiva: sin código fallback.

## Antes vs ahora

Antes (v45/v46): el dispatcher leía la spec del ledger (`mt101_corrective_pay_fragment`) y el claim la contrastaba
contra `pf`. Seguro, pero el ledger seguía siendo el origen de lectura del contrato.

Ahora (read-from-pf): el contrato (spec, payload_hash, ruta, destino, plan_hash, idempotencia) se lee de `pf` (la
revisión ACTIVE inmutable). **La revisión inmutable es la fuente literal de ejecución**; el ledger solo aporta el
gate operativo (`pay_status='PREPARED'`).

## Cambios

### `readPreparedDispatchSpec` lee de `pf`
La consulta pasa a leer de `mt101_corrective_pay_plan_fragment pf`, uniendo la cadena completa y exigiendo
coherencia: cabecera ACTIVE + el run apunta a esa revisión + el fragmento del ledger PREPARED.

```sql
select pf.dispatch_spec_json, pf.dispatch_spec_hash, pf.approved_routed_as, pf.payload_hash, pf.dispatch_plan_hash
from mt101_corrective_pay_plan_fragment pf
join mt101_corrective_pay_plan p
  on p.rebuild_run_id = pf.rebuild_run_id and p.plan_revision = pf.plan_revision and p.status = 'ACTIVE'
join mt101_rebuild_run r
  on r.rebuild_run_id = pf.rebuild_run_id and r.active_plan_revision = pf.plan_revision
join mt101_corrective_pay_fragment f
  on f.rebuild_run_id = pf.rebuild_run_id and f.corrective_senders_reference = pf.corrective_senders_reference
where pf.rebuild_run_id = ? and pf.corrective_senders_reference = ? and f.pay_status = 'PREPARED';
```

Si la cadena no es coherente (sin revisión activa, cabecera no ACTIVE, fragmento no PREPARED) → devuelve null → el
dispatcher INVALIDA (sin fallback al ledger ni al resolver vivo).

### Divergencia ledger↔pf → INVALIDATED (estado terminal claro)
El dispatcher materializa y envía desde `pf`. Para no dejar el fragmento atascado en PREPARED si el ledger
operativo se MANIPULA directamente (en el flujo normal el ledger == pf por construcción), se añade
`invalidatePayFragmentDivergingFromActiveRevision`: si NO existe una fila de la revisión ACTIVE cuyo contrato
COMPLETO coincida con el ledger, el fragmento es incoherente → INVALIDATED, no se despacha. Se invoca tras leer
`pf` y antes del claim.

### `Mt101PayTaskProvider` (flujo correctivo)
```
prepared = readPreparedSpec(...)   // ahora desde pf
if (prepared == null) -> invalidateMissingSpec; continue
if (invalidateIfLedgerDivergesFromActiveRevision(...)) -> continue   // ledger != pf -> INVALIDATED
integridad de pf (defensa); materializa de pf; claim; re-resuelve secretos de pf; envia
```

El claim (`markPayFragmentDispatching`) conserva su cross-check completo contra `pf` como defensa en capas.

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **59** (+1):
  `readPreparedDispatchSpecReadsTheContractFromTheImmutableActiveRevisionNotTheLedger`: tras manipular SOLO el
  ledger, `readPreparedDispatchSpec` sigue devolviendo la spec/payload_hash de `pf` (inmutable). Más los ajustes:
  `claimFailsIfActivePlanRevisionPointsToANonActiveHeader` lee el contrato mientras la revisión es ACTIVE (porque
  read-from-pf solo lee de una revisión ACTIVE).
- `Mt101PayFragmentReprocessTest` — **34**: `correctiveDispatchInvalidatesWhenPersistedSpecTamperedWithoutHash`
  ahora invalida por DIVERGENCIA ledger↔pf (antes por integridad specHash); el resto del flujo de despacho intacto.
- `Mt101StatusTaskProviderTest` — **20**.
- Todos los tests Mt101 (unit): **292**, 0 fallos.
- Integración end-to-end con Flyway real (V69): **3**, 0 fallos — el dispatch correctivo REAL lee el contrato de
  `pf` y envía correctamente (en el flujo normal ledger == pf por construcción).

## Conclusión

Cerrado el último pendiente arquitectónico: **plan aprobado = fuente directa de ejecución**. El dispatcher lee el
contrato ejecutable de la revisión ACTIVE inmutable (`mt101_corrective_pay_plan_fragment`), no del ledger mutable;
el ledger solo aporta el estado operativo y un espejo de verificación (una divergencia directa → INVALIDATED).
Combinado con triggers (inmutabilidad ACTIVE/SUPERSEDED, INSERT/UPDATE/DELETE) + claves foráneas verificadas + el
claim, la revisión inmutable es ahora literal y estrictamente la fuente de qué se envía al banco.
