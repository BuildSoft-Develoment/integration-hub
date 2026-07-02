# Revisión del análisis app_htoh(46) → v46-fix — saneamiento extendido + VALIDATE de FKs anti-huérfanos

Fecha: 2026-06-26
Alcance: el análisis confirma que v45-fix cerró la cadena referencial. Detecta dos mejoras de homologación: (1) el
saneamiento de V68 no cubre punteros a cabeceras DRAFT/SUPERSEDED; (2) las FKs anti-huérfanos de V68 quedaron NOT
VALID. Directiva: sin código fallback.

## Verdictos contra el código real

| Hallazgo | Verdicto | Acción |
|---|---|---|
| **V68 no sanea toda la semántica histórica**: anulaba `active_plan_revision` solo si apuntaba a cabecera INEXISTENTE, no a DRAFT/SUPERSEDED (la FK los permite, el claim los bloquea, pero el run queda inconsistente). | **REAL** (hygiene/homologación; no es brecha de envío — el claim ya exige ACTIVE) | **CORREGIDO** (V69): saneamiento extendido (null si no apunta a ACTIVE). |
| **`fk_pay_plan_run` y `fk_pay_plan_fragment_plan` siguen NOT VALID** (histórico sin verificar). | **REAL** (homologación) | **CORREGIDO** (V69): `VALIDATE CONSTRAINT` de ambas. |
| Faltan pruebas de migración sobre datos contaminados. | **REAL** (cobertura) | **AÑADIDA** (lógica del saneamiento). |
| Dispatcher lee la spec desde el ledger, no desde `pf` directamente. | Hardening arquitectónico — **ya decidido** (mantener v43-ter, vía pregunta explícita). El análisis reconfirma: "es seguro; una divergencia impide el claim y no hay envío". | Reafirmado. |

## Verificación previa (seguridad del despliegue)

Antes de añadir el `VALIDATE`, se consultó el dev DB: **0 planes huérfanos, 0 fragmentos huérfanos, 0 punteros
no-ACTIVE**. Por tanto el `VALIDATE` y el saneamiento extendido son seguros (no-op en datos limpios), sin riesgo de
fallo de arranque.

## Correcciones (V69)

### Saneamiento extendido del puntero
V68 solo anulaba punteros a cabecera **inexistente**. V69 anula **todo puntero que NO apunte a una cabecera
ACTIVE** (también DRAFT/SUPERSEDED):

```sql
update mt101_rebuild_run r
   set active_plan_revision = null
 where r.active_plan_revision is not null
   and not exists (select 1 from mt101_corrective_pay_plan p
                   where p.rebuild_run_id = r.rebuild_run_id
                     and p.plan_revision = r.active_plan_revision
                     and p.status = 'ACTIVE');
```

Un run legítimo SIEMPRE apunta a su revisión ACTIVE, por lo que **no se ve afectado**; solo se corrigen punteros
corruptos históricos. (La transición de estado de runs REQUESTED/EXECUTING corruptos a INVALIDATED/UNCERTAIN según
evidencia de envío queda como tarea operativa deliberada, fuera de una migración automática, por requerir análisis
de evidencia stateful; el saneamiento del puntero ya hace que el claim no despache.)

### VALIDATE de las FKs anti-huérfanos
`fk_pay_plan_run` y `fk_pay_plan_fragment_plan` (creadas NOT VALID en V68) se promueven a verificadas para todo el
histórico: `alter table ... validate constraint ...`. En datos del lifecycle no hay huérfanos (los runs nunca se
borran — confirmado: `delete from mt101_rebuild_run` no existe en el código — y los `plan_fragment` siempre se crean
con/tras su cabecera en la misma transacción).

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **58** (+1):
  `extendedSanitizeNullsPointersToNonActiveHeadersButNotActiveOnes`: control (puntero a ACTIVE → no se toca) +
  puntero a SUPERSEDED → anulado. Más `claimFailsWhenTheRunHasNoActivePlanRevision` (doble check del turno anterior).
- `Mt101PayFragmentReprocessTest` — **34**.
- Todos los tests Mt101 (unit): **291**, 0 fallos.
- Integración end-to-end con Flyway real (V69: saneamiento extendido + `VALIDATE` de ambas FKs;
  `Successfully applied 69 migrations`): **3**, 0 fallos.

## Pendiente documentado (decisión previa)

El dispatcher leyendo la spec DIRECTAMENTE desde `mt101_corrective_pay_plan_fragment` sigue siendo evolución
arquitectónica opcional (decidido: mantener v43-ter). El análisis lo reconfirma como seguro: el claim ya cruza todo
el contrato del ledger contra la revisión ACTIVE inmutable, de modo que el dispatcher nunca envía algo distinto a
`pf`; leer desde `pf` es limpieza arquitectónica sin valor de seguridad adicional (y removería la defensa en capas
+ cambiaría la semántica de tamper a `PREPARED`, ya analizado).

## Conclusión

La integridad referencial del plan versionado queda **verificada para todo el histórico** (FKs validadas) y los
punteros corruptos históricos se sanean por completo (no solo inexistentes, también DRAFT/SUPERSEDED). La cadena
`run → cabecera ACTIVE → fragmento inmutable → claim → envío` está atada por triggers + claves foráneas verificadas.
No quedan brechas de integridad; solo persiste el cierre arquitectónico opcional (dispatcher leyendo desde `pf`).
