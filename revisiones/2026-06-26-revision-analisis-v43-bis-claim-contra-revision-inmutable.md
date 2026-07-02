# v43-bis — el claim valida la spec del ledger contra la revisión ACTIVE inmutable

Fecha: 2026-06-26
Alcance: cierre del ÚNICO ítem que quedaba abierto del análisis app_htoh(42): "trazabilidad estricta — el
dispatcher ejecuta exactamente la revisión aprobada e inmutable; como mínimo, el claim debería validar que el
hash de la spec del ledger coincide con el de la fila de la revisión ACTIVE". Directiva: sin código fallback.

## Qué se implementó

El claim (`markPayFragmentDispatching`) ahora exige, además del binding ya existente (`plan_revision = active` +
`dispatch_spec_json` exacto + payload/ruta/plan_hash), que **la spec del ledger COINCIDA exactamente con la fila de
la revisión ACTIVE INMUTABLE** (`mt101_corrective_pay_plan_fragment`, protegida por el trigger V65):

```sql
and exists (select 1 from mt101_corrective_pay_plan_fragment pf
            where pf.rebuild_run_id = f.rebuild_run_id
              and pf.plan_revision = r.active_plan_revision
              and pf.corrective_senders_reference = f.corrective_senders_reference
              and pf.dispatch_spec_hash = f.dispatch_spec_hash
              and pf.dispatch_spec_json is not distinct from f.dispatch_spec_json)
```

Efecto: el dispatcher solo despacha la spec **aprobada e inmutable**. Una manipulación DIRECTA del ledger
(`dispatch_spec_json` + `dispatch_spec_hash` consistentes entre sí, que pasaría el binding exacto) que diverja de
la revisión inmutable es **atrapada** aquí. **Sin caminos legacy**: si no existe la fila de la revisión activa, no
se reclama (el ledger deja de ser la fuente final del plan; la revisión inmutable manda).

Esto cierra el concern de "el dispatcher lee el ledger mutable" sin el refactor mayor de leer físicamente desde la
tabla de revisión: el ledger se sigue leyendo, pero el claim **bloquea** cualquier despacho cuya spec no sea
idéntica a la revisión inmutable. Combinado con el trigger V65 (la revisión no puede mutarse), la garantía es
estricta: *se despacha exactamente la spec de la revisión ACTIVE aprobada*.

## Cambios

- **`Mt101RebuildRepository.markPayFragmentDispatching`**: añade el cross-check `exists (...)` contra
  `mt101_corrective_pay_plan_fragment` de la revisión activa (sin nuevos parámetros; subconsulta correlacionada).
- **`Mt101PayFragmentReprocessTest`** (harness): el esquema mínimo incluye `mt101_corrective_pay_plan_fragment`;
  un helper `seedActivePlanRevision` fija `active_plan_revision`, etiqueta el fragmento del ledger y persiste la
  fila inmutable con la MISMA spec; se invoca desde los 3 helpers de inserción de éxito; el test del binding de
  revisión siembra además la revisión 2 para su caso positivo.

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **51** (+1):
  - `claimRejectsALedgerSpecThatDivergesFromTheImmutableActiveRevision`: tras una solicitud (rev 1 ACTIVE), una
    manipulación directa del ledger (json+hash consistentes) es RECHAZADA por el claim (queda PREPARED, no se
    despacha).
- `Mt101PayFragmentReprocessTest` — **34** (harness reescrito con la revisión inmutable; claim positivo y negativo).
- `Mt101StatusTaskProviderTest` — **20**.
- Todos los tests Mt101 (unit): **284**, 0 fallos.
- Integración end-to-end con Flyway real (V65): `BankProfileHomologationIT` + `Mt101OutboundEndToEndIT` = **3**,
  0 fallos — el dispatch correctivo REAL pasa CON el cross-check (la activación copia ledger→plan_fragment, así que
  los claims legítimos reclaman; sólo una spec divergente se bloquea).

## Conclusión

Con v43-bis se cierra el último ítem del análisis app_htoh(42): el dispatcher despacha estrictamente la spec de la
revisión ACTIVE inmutable (cross-check en el claim contra `mt101_corrective_pay_plan_fragment`, protegida por
trigger), sin caminos legacy. No quedan pendientes del análisis: P0 de takeover (lock + token), abandono
transaccional, heartbeat, estado anterior restaurado, inmutabilidad por triggers y, ahora, trazabilidad estricta
del despacho contra la revisión inmutable.
