# Revisión del análisis app_htoh(44) → v44-fix — existencia y jerarquía de la revisión activa

Fecha: 2026-06-26
Alcance: el análisis confirma que v43-ter cerró el cross-check completo del contrato y el trigger INSERT; detecta
una **nueva brecha de jerarquía**: se podía borrar la cabecera ACTIVE/SUPERSEDED y el claim no exigía que esa
cabecera siguiera existiendo y ACTIVE. Directiva: sin código fallback.

## Verdictos contra el código real

| Hallazgo | Verdicto | Acción |
|---|---|---|
| **P0: la cabecera ACTIVE/SUPERSEDED puede borrarse** (V65 tiene `before update`, V66 `before insert`, pero NO `before delete`). Borrarla deja los `plan_fragment` huérfanos y desactiva su trigger de inmutabilidad (que decide consultando la cabecera). | **REAL** | **CORREGIDO** (V67): trigger `before delete` (solo DRAFT se borra). |
| **P0: el claim no exige cabecera ACTIVE.** El cross-check exigía que exista la fila `plan_fragment` para `active_plan_revision`, pero no que su cabecera fuera `status='ACTIVE'`. Un puntero alterado hacia una revisión SUPERSEDED pasaría. | **REAL** | **CORREGIDO**: el claim une la cabecera y exige `p.status='ACTIVE'`. |
| **Integridad referencial run→plan** (el puntero podría apuntar a una revisión inexistente). | **REAL** | **CORREGIDO** (V67): FK compuesta `NOT VALID`. |
| Dispatcher lee la spec desde `pf` directamente. | Hardening (ya decidido: mantener v43-ter). | Documentado. |

## Correcciones (sin código fallback)

### P0 #1 — la cabecera ACTIVE/SUPERSEDED es indeleble (V67)
Trigger `before delete` en `mt101_corrective_pay_plan`: rechaza borrar una revisión `ACTIVE` o `SUPERSEDED`. Solo
un `DRAFT` abandonado puede borrarse (lo que hace `deleteDraftPlanRevision`). Así no se puede dejar huérfanos a
los `plan_fragment` ni desactivar su trigger de inmutabilidad.

### P0 #2 — el claim exige cabecera ACTIVE (cadena inseparable)
El cross-check del claim ahora **une la cabecera** y exige `p.status='ACTIVE'`:

```sql
and exists (select 1 from mt101_corrective_pay_plan_fragment pf
            join mt101_corrective_pay_plan p
              on p.rebuild_run_id = pf.rebuild_run_id and p.plan_revision = pf.plan_revision
            where pf.rebuild_run_id = f.rebuild_run_id
              and pf.plan_revision = r.active_plan_revision
              and p.status = 'ACTIVE'
              and pf.corrective_senders_reference = f.corrective_senders_reference
              and pf.payload_hash is not distinct from f.payload_hash
              and ... (todo el contrato) ...)
```

Si la cabecera ACTIVE desaparece (DELETE) o el puntero `r.active_plan_revision` se altera hacia una revisión
SUPERSEDED/DRAFT, el claim falla (ya no basta que exista la fila de fragmento). **Cabecera + puntero + fragmento +
ledger forman una cadena inseparable.**

### Integridad referencial (V67)
FK compuesta `mt101_rebuild_run (rebuild_run_id, active_plan_revision) → mt101_corrective_pay_plan
(rebuild_run_id, plan_revision)` sin cascade: el puntero del run debe referenciar una cabecera existente y no se
puede borrar una revisión que el run aún declara activa. `NOT VALID` para no fallar por datos históricos;
`active_plan_revision` NULL no se valida (MATCH SIMPLE), así los runs sin plan siguen válidos. Se promovió el
índice único `(rebuild_run_id, plan_revision)` a CONSTRAINT (`uq_pay_plan_run_rev`) para poder referenciarlo.

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **55** (+2):
  - `anActiveOrSupersededPlanHeaderCannotBeDeleted`: DELETE de cabecera ACTIVE → rechazado; tras una re-solicitud,
    DELETE de la cabecera SUPERSEDED → rechazado; ambas cabeceras permanecen.
  - `claimFailsIfActivePlanRevisionPointsToANonActiveHeader`: con el puntero alterado hacia una revisión SUPERSEDED
    (cuyo fragmento existe), el claim retorna 0 y no se despacha.
- `Mt101PayFragmentReprocessTest` — **34** (harness: tabla de cabecera + `seedActivePlanRevision` crea cabecera ACTIVE).
- Todos los tests Mt101 (unit): **288**, 0 fallos.
- Integración end-to-end con Flyway real (V67: promoción de índice a constraint + FK + trigger DELETE;
  `Successfully applied 67 migrations`): **3**, 0 fallos — el dispatch correctivo REAL reclama y envía con el claim
  que exige cabecera ACTIVE y con la FK activa.

## Pendiente documentado (decisión previa)

El dispatcher leyendo la spec DIRECTAMENTE desde `mt101_corrective_pay_plan_fragment` queda como evolución
arquitectónica opcional (decidido en el turno anterior: mantener v43-ter). Con el cross-check completo + la cadena
cabecera/puntero/fragmento protegida, el dispatcher nunca puede enviar algo que no sea la revisión ACTIVE
inmutable; la lectura directa no añade seguridad.

## Conclusión

Cerrada la protección de la **existencia y jerarquía** de la revisión activa, no solo de su contenido: la cabecera
ACTIVE/SUPERSEDED es indeleble, el claim exige que el puntero del run apunte a una cabecera realmente ACTIVE, y una
FK ata el puntero a una cabecera existente. "plan aprobado = plan ejecutado" se sostiene también frente a la
eliminación de la cabecera o la alteración del puntero.
