# Revisión del análisis app_htoh(49) → v49-fix — canonicalización inyectiva + validación de versión/conteo + preflight V69

Fecha: 2026-06-26
Alcance: el análisis confirma que v48 cerró el hardening funcional (el hash agregado cubre el contrato completo) y
propone tres mejoras de **rigor criptográfico y operación**, no de envío indebido. Directiva: sin código fallback.

## Verdicto contra el código real

| Hallazgo del análisis | Verdicto | Acción |
|---|---|---|
| **Serialización ambigua del hash V2**: `valor1\|…\|valor10\n` con `null→""`. Permite `null ≡ ""` y, si un valor contiene `\|` o `\n`, colisión teórica entre tuplas de contrato distintas. Debilita "maker-checker criptográficamente completo" (aunque el claim sigue comparando campos uno a uno, así que no hay envío indebido). | **REAL** (rigor criptográfico) | **CORREGIDO** → serialización inyectiva V3 |
| **Versión/conteo no validados al aprobar**: la aprobación comparaba solo hashes, no que `pay_plan_version = plan_version = <algoritmo vigente>` ni el conteo. Evidencia débil de qué algoritmo aprobó el checker. | **REAL** (gobierno/evidencia) | **CORREGIDO** → validación de versión + conteo + hash en las tres vistas |
| **Run V1 pendiente al actualizar**: recomendaba una rama `PAY_PLAN_HASH_ALGORITHM_UPGRADED → INVALIDATED` específica. | **RECHAZADO** (contradice "sin caminos legacy") | La validación de versión ya invalida con motivo explícito **sin** rama de compatibilidad. Subsume el hallazgo. |
| **Preflight histórico antes de V69**: V69 hace VALIDATE de FKs sin un diagnóstico previo de huérfanos. | **REAL** (operativo) | **AÑADIDO** → script de diagnóstico (no migración) |

## Correcciones (sin rutas legacy)

### 1. Serialización canónica INYECTIVA (V3)
`PAY_PLAN_SET_VERSION → MT101_PAY_PLAN_SET_V3`. La fila se serializa con longitud-prefijada y centinela NULL explícito:

```
campo NULL  → "-1:"
campo valor → <longitud> ":" <valor>
```

Como cada campo lleva su longitud, la descomposición es unívoca: ni `null` vs `""` (`-1:` vs `0:`) ni un valor con
`|`/`\n` pueden colisionar con otra combinación de campos. `computePayPlanSet` (ledger) y
`computePayPlanSetFromPlanRevision` (revisión inmutable) comparten la MISMA función `appendPayPlanSetRow(List<String>)`,
ahora visible a nivel de paquete para pruebas de inyectividad. No queda el algoritmo V2 en ninguna ruta.

### 2. Validación de versión + conteo + hash al aprobar
La aprobación (`Mt101CorrectiveLifecycleService`) ya no compara solo hashes. Lee un **resumen** (versión, conteo, hash)
de las tres vistas y exige coincidencia total, y que el algoritmo sea exactamente el vigente:

```
run.pay_plan_version  == ACTIVE.plan_version  == MT101_PAY_PLAN_SET_V3
run.pay_plan_count    == ACTIVE.plan_count    == computePayPlanSet(ledger).count
run.pay_plan_set_hash == ACTIVE.plan_set_hash == computePayPlanSet(ledger).setHash
```

Cualquier desajuste → INVALIDA con un motivo explícito (`"PAY plan set (algorithm/count/hash) changed or is not
MT101_PAY_PLAN_SET_V3 after request"`). Un run firmado con un algoritmo anterior queda así invalidado por **versión**
(motivo claro), no como un genérico "cambió el plan" — y sin una rama de compatibilidad dedicada. Se reemplazaron los
lectores de solo-hash (`payPlanSetHash`, `payActivePlanRevisionSetHash`) por `payApprovedPlanSummary` /
`payActivePlanRevisionSummary` (record `PayPlanSummary`); no quedan métodos legacy.

### 3. Preflight de V69 (diagnóstico, no migración)
`ops/sql/mt101-corrective-v69-preflight.sql`: solo-lectura, detecta antes del despliegue (1) planes sin run, (2)
fragmentos de plan sin cabecera, (3) runs con `active_plan_revision` no-ACTIVE, y (4, informativo) runs REQUESTED con
algoritmo anterior. Las tres primeras deben dar 0 antes de correr V69 (su VALIDATE fallaría si no).

## Pruebas (todas en verde)

- `Mt101PayPlanSetCanonicalTest` — **5** (NUEVO, sin BD): `null` vs `""` distinguidos; un valor con `|` no colisiona
  con otra partición de campos (V2 colisionaba); un valor con `\n` no colisiona con un límite de campo; determinismo;
  y **cada uno de los 10 campos** del contrato participa en el canónico (parametrizado por campo).
- `Mt101CorrectiveLifecycleServiceTest` — **62** (+2):
  `approvalInvalidatesWhenTheApprovedPlanSetWasBuiltWithAnOlderHashAlgorithm` (run con `pay_plan_version` anterior →
  INVALIDATED por versión, 0 envíos) y `approvalInvalidatesWhenTheApprovedPlanCountDivergesFromTheActiveRevision`
  (conteo divergente → INVALIDATED, 0 envíos). Más el de v48 (`approved_routed_as`).
- `Mt101PayFragmentReprocessTest` — **35** (seed de versión actualizado a V3).
- **Suite Mt101 completa: 286 tests, 0 fallos** (BUILD SUCCESS), incluyendo los E2E con Flyway real
  (`Mt101AllTasksProcessE2EIT`, `Mt101MillionFileProcessE2EIT`, `Mt101OutboundEndToEndIT`).

## Compatibilidad

No hay datos persistidos que migrar: `pay_plan_set_hash`/`plan_set_hash`/versión/conteo se (re)calculan en cada
solicitud. El bump a V3 solo etiqueta el algoritmo; cualquier run en vuelo con un algoritmo anterior se re-solicita
antes de aprobar (lo fuerza la validación de versión). No se dejó ninguna ruta que compute o acepte V1/V2.

## Conclusión

Cerrados los dos hallazgos reales de v49: (1) el hash del conjunto es ahora **criptográficamente inequívoco**
(serialización inyectiva), de modo que "maker-checker criptográficamente completo" es ahora una afirmación estricta;
(2) la aprobación valida **algoritmo + conteo + hash** en las tres vistas, robusteciendo la evidencia de qué aprobó el
checker e invalidando con motivo explícito cualquier algoritmo anterior — sin ramas de compatibilidad. El preflight de
V69 queda como script de diagnóstico operativo. No quedan P0 ni brechas de disponibilidad sobre "plan aprobado = plan
ejecutado".
