# Analisis v69 contra el código real + plan tanda-7 — 2026-07-15

> Entrega **para autorización**. No se ha implementado nada de esta ronda. Regla: sin caminos legacy/fallback en
> el fuente; lo ya implementado se valida.

## Veredicto

La v69 es **precisa**. Describe correctamente el trabajo commiteado (tandas 4-6 + #9-eq lista + refuerzo + gate +
maker-checker + UI chip). No trae bugs de money-safety nuevos: revisa lo hecho y levanta **3 hallazgos
accionables**, los tres en el área **maker-checker** (opt-in, hoy default off) — o sea, son "completar el
feature antes de activarlo en prod", no bloquean el estado actual. Los verifiqué contra el código.

## Validado — lo que la v69 da por hecho y confirmo implementado

| Punto v69 | Estado real |
|---|---|
| #1 Reversión omitida DISPATCHING→ARCHIVED → pay_conflict + PAY_CONFLICT | **Implementado** (`0a3131ef`) |
| #2 Gate `mt101.pay.direct-list.enabled` (default true) | **Implementado** (`17b3a9a9`) |
| #3 Lista: escalada a UNCERTAIN si accepted/uncertain + terminal re-reclamable | **Implementado** (`6d7d641d`) |
| #4 D2-R2 mixto → pay_status PARTIALLY_SENT / lifecycle PARTIALLY_FAILED | **Implementado + IT** (`73b6514e`) |
| #5 Maker-checker backend opt-in (request/approve, checker≠maker, atómico) | **Implementado + IT 5/5** (`c095949c`) |
| #9 UI chip "re-pagable por fallo técnico" en ARCHIVED+errorMessage | **Implementado** (`313af2bb`) |
| #10 Direct-list configurable para bloquear en prod | **Implementado** (gate) |
| #11 Evidencia de regresión (~200 tests) | **Presente** |

## Hallazgos nuevos de la v69 — verificados contra el código

### #6 (P1 operativo, si se activa maker-checker en prod) — el frontend sigue single-actor

**Confirmado.** `audit-api.service.ts` (L264-273) y `mt101-pay-conflicts.component.ts` (L178) llaman
`/pay-conflicts/acknowledge` (single-actor). **No** llaman a `/pay-conflicts/request-acknowledge` ni
`/approve-acknowledge`, y **no existe** un endpoint de settings que le diga a la UI si maker-checker está activo.

**Consecuencia:** con `mt101.pay.conflict.acknowledge.maker-checker.enabled=true` en prod, el guard del backend
(`acknowledge` lanza si maker-checker on) hará que el botón "Resolver conflicto" devuelva **400**. El feature
backend queda inutilizable desde la UI.

**Propuesta:**
- Backend: endpoint `GET /api/query/mt101-fragments/pay-conflicts/settings` → `{ makerCheckerEnabled }` (el
  getter `service.makerCheckerEnabled()` ya existe).
- Frontend `audit-api.service.ts`: métodos `requestAcknowledge(...)` y `approveAcknowledge(...)`.
- UI `mt101-pay-conflicts`: si `makerCheckerEnabled=false` → botón "Resolver conflicto" (actual); si `true` →
  flujo de dos pasos ("Solicitar reconocimiento" [maker] → "Pendiente de aprobación" → "Aprobar" [checker
  distinto]). Mirror del maker-checker de rebuild que la UI ya tiene (audit-api L556). i18n es/en.

### #7 (P2, cobertura) — falta test de maker-checker sobre CORRECTIVE

**Confirmado.** `Mt101PayConflictMakerCheckerIT` solo usa `NORMAL` (fragmentSetId). El servicio soporta
`CORRECTIVE` (rebuildRunId, corrective_senders_reference) pero no hay test directo.

**Propuesta:** añadir los 3 casos mínimos sobre CORRECTIVE (request no limpia; approve mismo actor falla; approve
checker distinto limpia + conserva pay_status + emite PAY_CONFLICT_RESOLVED). Requiere sembrar una fila
`mt101_corrective_pay_fragment` con pay_conflict en el IT. Bajo esfuerzo.

### #8 (P2, gobernanza/trazabilidad) — el request maker no deja rastro append-only + sobrescribe PENDING

**Confirmado.** `requestAcknowledge` hace `upsertPendingAckRequest` (ON CONFLICT DO UPDATE → **reemplaza** el
PENDING previo, se pierde el maker/reason/ticket anterior) y **no emite** ninguna trama append-only; solo la
aprobación emite `PAY_CONFLICT_RESOLVED`. No es riesgo de dinero, pero para banca la solicitud del maker debería
ser auditable e inmutable.

**Propuesta:**
- Emitir trama append-only `PAY_CONFLICT_ACK_REQUESTED` (maker + reason + ticket) en `request-acknowledge`.
- No sobrescribir un PENDING en silencio: o conservar historial (append + marcar el previo superseded), o
  rechazar un segundo request si ya hay PENDING (exigir cancelación auditada). Recomiendo **append-only +
  superseded** (conserva historial, banca-friendly).

## Propuesta: tanda-7 — completar maker-checker (pendiente de tu autorización)

1. **#6 (recomendado si activarás maker-checker):** settings endpoint + frontend de dos pasos + i18n. El más
   grande (backend chico + frontend).
2. **#7:** tests de maker-checker CORRECTIVE.
3. **#8:** trama `PAY_CONFLICT_ACK_REQUESTED` + historial de solicitudes (no sobrescribir).

Los tres son "completar maker-checker antes de encenderlo en prod". Si **no** planeas activar maker-checker
pronto, #6 puede esperar; #7 y #8 valen igual (cobertura + gobernanza).

## Sin cambios — pendientes de homologación FINAL (evidencia/operación, no código)

Evidencia de **1.000.000** sobre v69 · prueba de **dos nodos** (timeout ambiguo, recovery, cero reenvío físico) ·
**UAT banco-a-banco real** (ACK/NACK, SFTP/mTLS) · hardening de entrega (activar gates de prod, revertir config
de test, separar int-lab/prod-template).

## Qué autorizar
- **tanda-7 completa** (#6 + #7 + #8), o
- **solo #7 + #8** (dejar el frontend #6 para cuando decidas activar maker-checker), o
- **esperar** y priorizar la evidencia de escala (1M / dos nodos) primero.

No implemento nada hasta tu OK.
