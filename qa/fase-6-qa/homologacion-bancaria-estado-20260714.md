# Estado hacia "Homologación bancaria final" — 2026-07-14 (rev. tanda-3)

Rama `experiment/quarkus-lts-native`. Incluye (a) el doble check de las tandas 2 y 3 y (b) el inventario
completo de pendientes para homologación bancaria final, priorizado.

## Doble check tanda-3 (D2-R1) — money-safe verificado

| Verificación | Resultado |
|---|---|
| **D2-R1 sin doble pago (incl. runs con UNCERTAIN)** | ✅ **CRÍTICO OK.** El re-request re-envía sólo fragmentos re-preparados a PREPARED, y `markPayFragmentDispatching` reclama **sólo** `pay_status='PREPARED'`. `persistPayIntents` re-prepara con `not in (DISPATCHING,SENT,REJECTED,UNCERTAIN)`: INVALIDATED→PREPARED (re-envía; nunca llegó), UNCERTAIN queda UNCERTAIN (NO re-envía; pudo llegar), SENT queda SENT (NO re-envía). Tres niveles: read=ARCHIVED, prepare-exclusion, claim=PREPARED. |
| Alcance del cambio | ✅ `reservePayForPlanPreparation` tiene un solo llamador (`requestCorrectivePay`); el guard (status=ARCHIVED + countInvalidated>0) acota la elegibilidad. Sin regresión en otros flujos. |
| D2-R1 vs D.2 consistentes | ✅ `syncCorrectiveBuildFragmentsFromPay` propaga sólo SENT/REJECTED al build → INVALIDATED deja build ARCHIVED (re-pagable), confirmando ambos diseños. |

**Pendiente D2-R1:** validación contra los 62 ITs correctivos + IT nuevo + evidencia viva (todo Docker). D2-R2
(mixto con rechazo del banco) sigue diferido.

---

---

# Parte A — Doble check de la tanda-2 (#1, #5, D.2)

Auditoría escéptica centrada en **riesgo de doble pago** y casos límite (lo que importa para un banco).

## Lo que quedó SÓLIDO (verificado contra el código)

| Verificación | Resultado |
|---|---|
| **D.2 sin riesgo de doble pago** | ✅ **CRÍTICO OK.** `transportFailure` (→ INVALIDATED, re-solicitable) sólo se devuelve con `dispatchStarted=false`, es decir ANTES del `channel.put` (`SftpPaymentTransport:222` pone el flag justo antes del put). Un fallo durante/después del put → `uncertain` (nunca reenvío ciego). Conclusión: un fragmento INVALIDATED **nunca** llegó al banco → re-solicitarlo no puede duplicar el pago. |
| D.2 caso principal (H3) | ✅ Rechazo total por transporte/credencial → fragmentos `ARCHIVED` → run `status=ARCHIVED` + `pay_status=INVALIDATED` → re-solicitable. Sin callejón sin salida. Rechazo real del banco sigue `FAILED` terminal. |
| D.2 no rompió el correctivo | ✅ 62/62 `Mt101CorrectiveLifecycleServiceTest`. |
| Otros consumidores de `TransportResult` | ✅ `BrokerRemotePluginTransport` no usa `TransportResult` (no money-path). Ningún otro consumidor mal-clasifica `retriable`. |
| #5 (H4) sin fan-out ni ciclo | ✅ Join por tupla estable 1:1; el CTE sube por `parent_rebuild_run_id` (árbol append-only, sin ciclos por construcción). Idempotente. IT lo cubre. |
| #1 (multi-PAY) consistente | ✅ Regla única en `Mt101PayResolverPairing`, usada por ambos validadores (12/12 + 14/14). |

## Corners RESIDUALES que el doble check encontró (para homologación)

Ninguno es un riesgo de doble pago; son huecos de **re-solicitabilidad** en combinaciones poco comunes:

1. **[D2-R1] Run PARTIALLY_SENT con fragmentos INVALIDATED.** El SFTP conecta por fragmento; una negativa de
   conexión intermitente puede dar algunos SENT y otros transport-failed en el mismo lote → run PARTIALLY_SENT
   con INVALIDATED. Hoy el run hijo (`correctivePayRejectedReferences`) sólo reprocesa `pay_status='REJECTED'`,
   **no INVALIDATED**. Ampliarlo choca con `assertRebuildableFragments` (sólo admite build_fragment `REJECTED`;
   los invalidados quedan `ARCHIVED`). **Requiere diseño** (cómo re-solicitar invalidados sin romper el
   invariante de supersede). NO lo forcé para no arriesgar el money-path.
2. **[D2-R2] Run mixto sent=0, rejected>0, invalidated>0.** Va a la rama FAILED; con build_fragments mixtos
   REJECTED+ARCHIVED el lifecycle da `PARTIALLY_FAILED` → ni `reservePayForPlanPreparation` (exige ARCHIVED) ni
   el hijo (exige PARTIALLY_SENT) lo recuperan. Corner del mismo origen que D2-R1.

Ambos comparten la raíz: el mecanismo de reproceso (hijo/supersede) se diseñó para REJECTED del banco, no para
"no salió por transporte" mezclado con envíos exitosos. Se cierran juntos con un diseño de "reproceso de
fragmentos ARCHIVED-no-enviados", en una tanda-3.

**Veredicto del doble check:** la tanda-2 es correcta y money-safe; cierra el caso dominante (rechazo total →
re-solicitable) sin doble pago. Quedan dos corners de re-solicitabilidad en escenarios de conexión intermitente,
documentados arriba.

---

# Parte B — Pendientes para "Homologación bancaria final"

Priorizados. "Bloqueante" = no homologaría sin cerrarlo; "Fuerte" = muy recomendado; "Operativo" = de entrega.

## B.1 — Money-path (núcleo) — **Bloqueante**

| Item | Estado | Nota |
|---|---|---|
| D2-R1: reproceso de INVALIDATED en run PARTIALLY_SENT | **Implementado + IT (tanda-3)** | Money-safe verificado |
| D2-R2: run mixto sent=0 rejected>0 invalidated>0 | **Implementado + IT (commit `73b6514e`)** | pay_status PARTIALLY_SENT (no FAILED) → habilita request-child (rechazados) + re-request (invalidados); cuarentena por-fragmento |
| Tandas 4-6 (dureza transporte/PAY normal): #7 DISPATCHING→ARCHIVED, #8a lista→INVALIDATED, tanda-5 uncertain **sticky**, #9 revert-skipped auditado, #9-eq lista + refuerzo bloqueo + gate prod | **Implementado + tests** | Cierra los huecos de v67/v68 con defensa en capas contra doble pago; ~200 tests verdes |
| Evidencia viva tandas 1-3 en nativo | **Hecha (2026-07-15)** | Ver `evidencias/validacion-viva-tandas-20260715.md`: H4 (100 filas raíz → REBUILD_SENT estable), D.2 (credencial mala → INVALIDATED re-solicitable → re-envío +40 exactos, cero doble pago). Destapó y arregló el hueco `deriveLifecycleStatus`+SUPERSEDED |
| Validación IT de tandas 2-3 (62 correctivos + nuevos) | **Hecha** | ≈175 tests verdes (62/62 correctivos, 9/9 rebuild, 3/3 H4 IT, D.2, validadores) |
| Evidencia de **1.000.000** de registros en esta versión | **Hecha (2026-07-15)** | Ver `evidencias/evidencia-1M-20260715.md`: BUILD SUCCESS 3/3, ~13 min, **heap `-Xmx768m` acotado sin OOM**, **cero deadlock H7** (batch a 200KB), 1M filas → SENT. Harness validado antes a 100k |

## B.2 — Resiliencia distribuida — **Bloqueante para banca real**

| Item | Estado |
|---|---|
| Prueba de **dos nodos** (claim por token, heartbeat, recovery, CERO reenvío físico bajo timeout) | **(A) cubierta (existente)** — `AsyncInboxClaimIT` 11/11: **8 hilos → 1 gana** (contención real), lease vencido re-clamable, nodo caído fenced (cero doble-ejecución), heartbeat bloquea robo, recovery sweep→DEAD/DLQ. PAY lease-expiry→UNCERTAIN sin reenvío por `payLateAcceptanceAfterLeaseExpiry`. **(B) real de 2 contenedores: pendiente** (confirmación operativa) |
| Validación **banco-a-banco real** (UAT con el banco, ACK/NACK reales, no simulados) | No hecha |

## B.3 — Gobierno y controles — **Requiere tu decisión (D.1)**

| Item | Estado |
|---|---|
| Maker-checker para `PAY_CONFLICT_RESOLVED` | **Implementado + operable + activo en prod** — opt-in (`mt101.pay.conflict.acknowledge.maker-checker.enabled`): request-acknowledge (maker) + approve-acknowledge (checker ≠ maker, fail-loud). Consola muestra la solicitud PENDING (tanda-8 #7). IT `Mt101PayConflictMakerCheckerIT` 12/12. **Activado por default en `application-prod.properties` (#10).** |

## B.4 — Seguridad y entrega — **Operativo, antes de prod**

| Item | Estado |
|---|---|
| **prod-template: controles bancarios activos en prod** (`direct-list=false`, `maker-checker=true`, `insert-batch=200000`) | **Hecho (#10, 2026-07-16)** — `application-prod.properties`, común a todas las nubes. Ver [`prod-template-10-20260716.md`](prod-template-10-20260716.md) |
| Separar `int-lab` (demo) de `prod-template` (sin secretos, `.env.example`) | **Frontera documentada (#10)** — prod usa `.env.example` sin secretos; `int/.env` demo aislado, marcado "nunca en prod" |
| Revertir config de test del lab: `directAccessGrants`, cert self-signed, usuarios fixture (`admin`/`approver`) | Pendiente (aislado en el int-lab demo) |
| Rotar credenciales/cert demo si alguna se reusara (viven en el historial de git) | Recordatorio |

## B.5 — Calidad / claridad — **Recomendado, no bloqueante**

| Item | Estado |
|---|---|
| `STRUCT.AMOUNT_FORMAT` (código preciso para monto no numérico, hoy cae en `AMOUNT_POSITIVE`) | Deferido |
| Unificar la rama REST-only de `MT101_STATUS` en el ejecutor route-aware (H5) | Deferido (SFTP ya funciona vía `resolveNormalPay`) |

---

# Resumen ejecutivo

**Dónde estamos:** el money-path MT101 (sync/async, cuarentena, corrección maker-checker, pago correctivo,
rechazo parcial con run hijo, resolución de UNCERTAIN, y ahora clasificación transporte-vs-banco sin doble
pago) está **maduro para UAT bancaria controlada**. Las tandas 1 y 2 cerraron los huecos de v65/v66 con tests.

**Qué falta para homologación FINAL, en orden:**
1. **Evidencia real, no simulada** (B.1 evidencia viva + 1M; B.2 dos nodos + banco-a-banco) — es el grueso.
2. **Cerrar D2-R1/R2** (reproceso de invalidados en runs parciales) — tanda-3, diseño acotado.
3. **Decidir D.1** (maker-checker del acknowledge).
4. **Hardening de entrega** (B.4): revertir config de test, separar lab/prod.

**Mi lectura:** el código está cerca; lo que separa de la homologación final es sobre todo **evidencia de
operación real a escala y distribuida** (1M, dos nodos, banco real), más los dos corners de re-solicitabilidad
y las decisiones de negocio/entrega. Nada de eso es un defecto de doble pago — esa propiedad crítica está
verificada.
