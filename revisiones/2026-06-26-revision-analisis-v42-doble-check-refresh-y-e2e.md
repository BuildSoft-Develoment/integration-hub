# Doble check del análisis app_htoh(41) (re-envío) sobre v42

Fecha: 2026-06-26
Alcance: re-validación completa del v42 (token de propiedad de la reserva + rearmado de INVALIDATED) contra el
código real. El re-envío del análisis listaba explícitamente las operaciones que deben exigir el `reservation_id`.
Directiva: sin código fallback / sin caminos legacy; validar lo implementado.

## Resultado del doble check

El v42 ya cerraba los tres hallazgos. Al re-cotejar la **lista exacta** de operaciones que el análisis exige que
validen el token, encontré **un residuo real que había quedado abierto** y una prueba pedida que faltaba completar:

| Operación que el análisis exige con `reservation_id` | Estado tras v42 | Acción en este doble check |
|---|---|---|
| `preparePayIntents` | exigía token | OK |
| `requestPayWithPlanSet` / `requestPay` | exigía token | OK |
| `releasePayPlanReservation` | exigía token | OK |
| `compileDraftPlanRevision` / `deleteDraftPlanRevision` | exigía token | OK |
| **`refreshPayFragmentsFromCorrectiveSet`** | **NO exigía token** | **CORREGIDO** |
| `computePayPlanSet` | es una LECTURA pura (hash del conjunto) | No requiere token (no muta nada); se documenta |

### Residuo cerrado — `refreshPayFragmentsFromCorrectiveSet` con propiedad

`refresh` se llama en dos contextos: (a) al preparar (run PREPARING_PLAN, bajo reserva) y (b) post-dispatch en
`persistPayDetail` (run EXECUTING). En v42 **no** validaba el token, así que un maker A que perdió la reserva
(takeover) aún podía tocar el ledger de ejecución del nuevo dueño B durante la preparación.

Se añadió un guard de propiedad que respeta ambos contextos:

```sql
and exists (select 1 from mt101_rebuild_run r where r.rebuild_run_id = ?
            and (r.pay_status <> 'PREPARING_PLAN'
                 or r.pay_plan_reservation_id is not distinct from ?))
```

- Prepare-time (run PREPARING_PLAN): solo actúa para el DUEÑO del token (un maker con token perdido → no-op).
- Post-dispatch (run EXECUTING): la primera disyunción es verdadera → actúa con token `null` (sin cambios de
  comportamiento en la sincronización post-dispatch).

Con esto, **todas** las escrituras al ledger de ejecución de un run reservado exigen propiedad. (`computePayPlanSet`
es una lectura: no muta y no necesita token; un no-dueño que lea el hash es inocuo.)

### Prueba e2e completada (hallazgo 2)

El análisis pedía la prueba completa: *request → invalidación pre-envío → nuevo request → aprobación → el
transporte recibe exactamente un envío → run SENT*. El test del v42 solo llegaba al rearmado a PREPARED. Ahora el
test continúa hasta el envío real: tras rearmar, el checker aprueba la nueva revisión, el transporte se invoca
**exactamente una vez** y el run termina **SENT** con ambos fragmentos (incluido el rearmado) en SENT.

## Cambios

- **`Mt101RebuildRepository.refreshPayFragmentsFromCorrectiveSet(+reservationId)`**: guard de propiedad en el
  `WHERE EXISTS` (dueño-en-PREPARING_PLAN o cualquier otro estado).
- **`Mt101CorrectiveLifecycleService`**: el `refresh` de preparación pasa el `reservationId`; el de
  `persistPayDetail` (post-dispatch) pasa `null`.

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **47**:
  - `aStaleReservationTakeoverFullyDispossessesThePreviousMaker`: reforzado — A (token perdido) tampoco puede
    **refrescar** el ledger (`refresh` devuelve 0); B mantiene la propiedad.
  - `reRequestRearmsPreSendInvalidatedFragmentsAndCompletesTheRetryToSent`: e2e completo — rearmado del fragmento
    INVALIDATED pre-envío + aprobación + **un** envío + run **SENT** (ambos fragmentos SENT).
- `Mt101PayFragmentReprocessTest` — **34** · `Mt101StatusTaskProviderTest` — **20**.
- Todos los tests Mt101 (unit): **280**, 0 fallos.
- Integración end-to-end con Flyway real (V63, `Successfully applied 63 migrations`): **3**, 0 fallos.

## Conclusión

Tras el doble check, **todas** las operaciones que el análisis exige (escritura, compilación, promoción,
liberación y refresh del ledger) exigen el `reservation_id`; la única excepción es `computePayPlanSet`, que es una
lectura sin mutación. La preparación del plan es exclusiva y con propiedad por token de extremo a extremo, y el
reintento tras una invalidación pre-envío se completa hasta SENT con un único envío. No quedan caminos legacy ni
pendientes abiertos del análisis.
