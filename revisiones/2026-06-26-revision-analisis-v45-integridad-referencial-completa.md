# Revisión del análisis app_htoh(45) → v45-fix — integridad referencial completa + fidelidad de tests

Fecha: 2026-06-26
Alcance: el análisis confirma que v44-fix resolvió el P0 de jerarquía (cabecera indeleble + claim exige ACTIVE +
FK del puntero). Detecta tres mejoras: (1) el esquema de test no reflejaba la FK real; (2) la FK del puntero es
NOT VALID (histórico sin verificar); (3) faltan FKs anti-huérfanos. Directiva: sin código fallback.

## Verdictos contra el código real

| Hallazgo | Verdicto | Acción |
|---|---|---|
| El esquema de test no crea `fk_run_active_plan_revision`; el helper apuntaba `active_plan_revision` ANTES de insertar la cabecera (con la FK real ese orden fallaría). | **REAL** (fidelidad de test) | **CORREGIDO**: FK en el esquema correctivo + fixture reordenado (cabecera→fragmento→puntero) + test de rechazo de puntero colgado. |
| La FK del puntero (V67) es `NOT VALID`: el histórico no queda verificado. | **REAL** (homologación) | **CORREGIDO** (V68): saneamiento + `VALIDATE CONSTRAINT`. |
| Faltan FKs `plan→run` y `plan_fragment→plan` (anti-huérfanos). | **REAL** | **CORREGIDO** (V68). |
| Dispatcher lee la spec desde el ledger, no desde `pf`. | Hardening arquitectónico (ya decidido: mantener v43-ter). | Documentado. |

## Correcciones (sin código fallback)

### Fidelidad de los tests
- El esquema **correctivo** de test crea ahora la FK real `fk_run_active_plan_revision` (refleja V67), de modo que
  apuntar `active_plan_revision` a una revisión inexistente lo rechaza PostgreSQL, no solo el claim.
- El **fixture** (`seedActivePlanRevision`) se reordenó al orden de producción: **cabecera DRAFT/ACTIVE → fragmento
  → puntero**. Antes apuntaba el puntero primero, lo que con la FK real fallaría (lo señaló el análisis).
- Nuevo test `pointingTheRunToANonExistentPlanRevisionIsRejectedByForeignKey` (`active_plan_revision = 999` →
  rechazado por la FK).

### Integridad referencial completa (V68)
- **`plan → run`** (`fk_pay_plan_run`, ON DELETE RESTRICT): ningún plan huérfano de su run; no se puede borrar un
  run con planes.
- **`plan_fragment → plan`** (`fk_pay_plan_fragment_plan`, ON DELETE RESTRICT, **DEFERRABLE INITIALLY DEFERRED**):
  ningún fragmento huérfano de su cabecera. Es DEFERRABLE porque `compileDraftPlanRevision` inserta los fragmentos
  ANTES que la cabecera dentro de UNA transacción → la FK se verifica al commit (ambos existen), **sin reordenar la
  ruta de dinero**.
- Ambas FK nuevas se crean `NOT VALID` (no fallan el arranque por datos históricos; quedan enforced para escrituras
  nuevas).

### Verificación del histórico (V68)
- **Saneamiento**: se anulan los punteros `active_plan_revision` colgados (datos históricos pre-V67; el claim ya los
  rechaza, anularlos es seguro y no cambia ningún despacho).
- **`VALIDATE CONSTRAINT fk_run_active_plan_revision`**: la FK del puntero pasa de "protegida para cambios nuevos" a
  "verificada para todo el histórico".

## Pruebas (todas en verde)

- `Mt101CorrectiveLifecycleServiceTest` — **56** (+1):
  `pointingTheRunToANonExistentPlanRevisionIsRejectedByForeignKey` (FK rechaza `active_plan_revision=999`). Más los
  de v44 (DELETE de cabecera ACTIVE/SUPERSEDED rechazado; claim 0 si el puntero apunta a SUPERSEDED), ahora con las
  FKs reales en el esquema.
- `Mt101PayFragmentReprocessTest` — **34** (fixture `seedActivePlanRevision` reordenado a cabecera→fragmento→puntero).
- Todos los tests Mt101 (unit): **289**, 0 fallos.
- Integración end-to-end con Flyway real (V68: FKs `plan→run` + `plan_fragment→plan` DEFERRABLE + saneamiento +
  `VALIDATE`; `Successfully applied 68 migrations`): **3**, 0 fallos — el dispatch correctivo REAL reclama y envía
  con toda la integridad referencial activa.

## Pendiente documentado (decisión previa)

El dispatcher leyendo la spec DIRECTAMENTE desde `mt101_corrective_pay_plan_fragment` sigue siendo evolución
arquitectónica opcional (decidido: mantener v43-ter). El propio análisis lo confirma: "no es una brecha inmediata
de doble pago; cualquier divergencia del ledger con el plan inmutable hace que el claim falle".

## Conclusión

La cadena `run → active_plan_revision → cabecera ACTIVE → fragmento inmutable → claim → envío` queda atada por
triggers (UPDATE/DELETE/INSERT) **y** claves foráneas (puntero verificado + plan→run + plan_fragment→plan), con el
histórico verificado por `VALIDATE`. El P0 de v44 estaba resuelto; v45 cierra la fidelidad de los tests y la
integridad referencial completa. No quedan brechas de no-duplicidad ni de integridad del claim; solo persiste el
cierre arquitectónico opcional (dispatcher leyendo desde `pf`).
