# Evidencia tanda-7 — completar maker-checker (v69 #6/#7/#8) — 2026-07-15

Autorizado tras el análisis v69. Completa el maker-checker de `PAY_CONFLICT_RESOLVED` end-to-end (backend ya
estaba; faltaban frontend, cobertura correctiva y gobernanza del request).

## #6 — Frontend maker-checker de dos pasos + settings endpoint

**Gap:** el backend tenía request/approve-acknowledge, pero la UI seguía llamando `/pay-conflicts/acknowledge`
(single-actor). Con maker-checker on en prod, el botón "Reconocer" habría dado **400**.

- Backend: `GET /api/query/mt101-fragments/pay-conflicts/settings` → `{ makerCheckerEnabled }`.
- Frontend (`mt101-pay-conflicts`): pregunta el settings al cargar. **maker-checker off** → botón "Reconocer"
  single-actor (igual). **maker-checker on** → dos pasos con actores DISTINTOS: "Solicitar reconocimiento"
  (maker, no apaga la alerta) + "Aprobar (checker distinto)". `audit-api`: métodos settings/request/approve.
  i18n es/en. **SPA build OK.**

## #7 — Cobertura de maker-checker sobre CORRECTIVE

**Gap:** el IT solo cubría `NORMAL`. Añadidos 2 tests sobre `CORRECTIVE` (rebuildRunId +
corrective_senders_reference): request no limpia el flag; approve mismo actor falla (segregación); approve
checker distinto limpia + **conserva pay_status**.

## #8 — Gobernanza del request maker: trama append-only + historial

**Gap:** `requestAcknowledge` no dejaba rastro append-only y sobrescribía un PENDING previo (se perdía historial).

- Ahora emite la trama append-only **`PAY_CONFLICT_ACK_REQUESTED`** (maker + reason + ticket + terminal
  conservado), en la MISMA transacción que la escritura del PENDING.
- **No sobrescribe:** un segundo request marca el PENDING previo **SUPERSEDED** e inserta la nueva solicitud
  (historial conservado). Sin migración (status es varchar; SUPERSEDED no rompe el índice parcial de PENDING).
- `readOpenPayConflict` lee PE/task/terminal/motivo del conflicto abierto para armar la trama sin tocar el flag.

## Validación (todo verde)

| Clase | Resultado | Cubre |
|---|---|---|
| `Mt101PayConflictMakerCheckerIT` | **8/8** (+3) | #7 correctivo (2) + #8 trama+historial (1) + los 5 previos |
| `Mt101PayConflictAcknowledgeAtomicityIT` | **4/4** | Regresión: single-actor intacto (default off) |
| SPA build (`nx build web`) | **OK** | Frontend #6 compila |

## Estado del maker-checker: cerrado end-to-end
Backend (opt-in, atómico, segregación) + frontend (dos pasos, settings-driven) + gobernanza (trama del request +
historial) + cobertura (NORMAL + CORRECTIVE). **Falta solo activarlo en la config de prod**
(`mt101.pay.conflict.acknowledge.maker-checker.enabled=true`).
