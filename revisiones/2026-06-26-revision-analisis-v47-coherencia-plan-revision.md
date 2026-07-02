# Revisión del análisis app_htoh(47) → v47-fix — coherencia de plan_revision en la divergencia

Fecha: 2026-06-26
Alcance: el análisis confirma que read-from-pf cierra el pendiente arquitectónico (el dispatcher lee el contrato de
la revisión ACTIVE inmutable). Detecta una **brecha menor de disponibilidad** (no de envío indebido) en el
invalidador de divergencia. Directiva: sin código fallback.

## Verdicto contra el código real

| Hallazgo | Verdicto | Acción |
|---|---|---|
| **plan_revision divergente puede quedar atascado**: `invalidatePayFragmentDivergingFromActiveRevision` comparaba payload/idempotencia/ruta/destino/hashes/spec, pero NO `f.plan_revision = r.active_plan_revision`. Si SOLO se altera `plan_revision` (contrato intacto), la divergencia no invalidaba, el claim fallaba (sí exige plan_revision) y el fragmento quedaba PREPARED atascado (→ UNCERTAIN al vencer el lease), aunque nunca se llamó al banco. | **REAL** (disponibilidad, no envío indebido) | **CORREGIDO** |
| Preflight de datos históricos antes de V69 (planes/fragmentos huérfanos harían fallar el VALIDATE). | **REAL** (operativo) | Documentado (preflight ya ejecutado en dev: 0 huérfanos). |

## Corrección (sin código fallback)

`invalidatePayFragmentDivergingFromActiveRevision` ahora invalida un fragmento PREPARED cuando **(a)** el ledger no
apunta a la revisión activa (`f.plan_revision is distinct from r.active_plan_revision`) **o (b)** no existe una fila
de la revisión ACTIVE cuyo contrato completo coincida con el ledger:

```sql
and (f.plan_revision is distinct from r.active_plan_revision
     or not exists (select 1 from mt101_corrective_pay_plan_fragment pf
                    join mt101_corrective_pay_plan p ... p.status = 'ACTIVE'
                    where ... pf.plan_revision = r.active_plan_revision
                      and pf.payload_hash is not distinct from f.payload_hash
                      and ... (todo el contrato) ...))
```

Así el caso residual (solo `plan_revision` alterado, contrato intacto) → INVALIDATED (estado terminal claro), en vez
de quedar PREPARED atascado. En el flujo normal `f.plan_revision == active` y el contrato coincide, por lo que NO se
invalida y el despacho prosigue.

## Pruebas (todas en verde)

- `Mt101PayFragmentReprocessTest` — **35** (+1):
  `correctiveDispatchInvalidatesWhenLedgerPlanRevisionDivergesFromActive`: con SOLO `ledger.plan_revision` alterado
  (contrato intacto) → no se llama al banco y el fragmento queda INVALIDATED (no atascado en PREPARED).
- `Mt101CorrectiveLifecycleServiceTest` — **59** (incl. los de read-from-pf).
- Todos los tests Mt101 (unit): **293**, 0 fallos.
- Integración end-to-end con Flyway real (V69): **3**, 0 fallos — el dispatch correctivo REAL lee de `pf` y envía
  (en el flujo normal ledger == pf, plan_revision == active, no se invalida).

## Consideración de despliegue (documentada)

V69 valida FKs históricas; si producción tuviera planes huérfanos o fragmentos sin cabecera, Flyway fallaría al
validar. **Preflight recomendado antes de desplegar V69:**

```sql
-- 0 esperado en las tres:
select count(*) from mt101_corrective_pay_plan p where not exists (select 1 from mt101_rebuild_run r where r.rebuild_run_id = p.rebuild_run_id);
select count(*) from mt101_corrective_pay_plan_fragment pf where not exists (select 1 from mt101_corrective_pay_plan p where p.rebuild_run_id = pf.rebuild_run_id and p.plan_revision = pf.plan_revision);
select count(*) from mt101_rebuild_run r where r.active_plan_revision is not null and not exists (select 1 from mt101_corrective_pay_plan p where p.rebuild_run_id = r.rebuild_run_id and p.plan_revision = r.active_plan_revision and p.status = 'ACTIVE');
```

(En dev: 0/0/0, V69 aplicó limpio.) Para runs REQUESTED/EXECUTING cuyo puntero anule el saneamiento, la transición
a INVALIDATED/UNCERTAIN según evidencia de envío + acción append-only queda como tarea operativa deliberada (es
stateful, no apta para una migración automática).

## Conclusión

Cerrada la brecha de disponibilidad: una incoherencia de `plan_revision` en el ledger ya no deja el fragmento
atascado en PREPARED — se INVALIDA (sin envío). El principio "plan aprobado = plan ejecutado" se mantiene fuerte
(nunca hubo envío indebido) y ahora también sin estados atascados. No quedan brechas P0 ni de disponibilidad.
