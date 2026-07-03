# Opción B — Etapa B4: fallos parciales (continueOnFailure para scatter) — 2026-07-03

Añade la política de fallos parciales al scatter-gather, espejando el `continueOnFailure` del batch
síncrono: por defecto **fail-fast** (una slice mala falla la tarea); con `continueOnFailure=true` se
procesan las slices buenas y la tarea **completa con errores**.

## Modelo

El tracker N→1 ahora contabiliza fallidas y define terminalidad por **completed + failed == total**:

- **`recordSliceCompleted`**: terminal cuando `completed+1+failed >= total`. En fail-fast, `failed`
  queda en 0 (un fallo pone FAILED y corta), así equivale a `completed==total` (compatible con B1).
- **`recordSliceFailed(peId, tdId, continueOnFailure)`**:
  - fail-fast → `status=FAILED` inmediato (terminal: la tarea fallará);
  - continueOnFailure → cuenta la fallida y cierra (`COMPLETED`) cuando todas están contadas.
- `SliceProgress(completed, failed, total, terminal)`: el que ve `terminal` reanuda/falla la tarea una
  vez; `failed>0` en un cierre ⇒ completó con errores.

## Consumer

`consumeSlice` lee `continueOnFailure` de la config de la slice y, cuando una slice **cierra** el
scatter (`terminal`), reanuda la tarea con el resultado agregado:
- `failed == 0` → `success` (scatter completado);
- `failed > 0` y `continueOnFailure` → `success` **con errores** (outputs: ok/fallidas/total) → la
  tarea completa, el proceso **sigue** (como `completeTaskWithErrors` del batch síncrono);
- `failed > 0` y fail-fast → `failure` → la tarea/proceso fallan.

El dedup por-slice + el incremento atómico (B1/B3) garantizan que **solo la slice que cierra** dispara
la reanudación, exactamente una vez, incluso con N workers y reentregas.

## Pruebas

- **`TaskAsyncDispatchRepositoryIT`** **4/4**: agrega hasta la última; reentrega idempotente; fail-fast
  transiciona a FAILED (terminal); **continueOnFailure** cuenta la fallida sin poner FAILED y cierra
  como `COMPLETED` con `failed=1` cuando todas están contadas.
- **`AsyncTaskConsumerTest`** **12/12** (nuevo: continueOnFailure en la slice de cierre → la tarea
  completa **con éxito** —con errores— en vez de fallar; fail-fast → falla).
- **`SliceGatherServiceTest`** 4/4 (safety net + firma nueva de `failSlice`).

## Estado del roadmap

| Etapa | Estado |
|---|---|
| B1 tracker · B2 dispatch · B3 gather · B2b motor · **B4 fallos parciales** | ✅ |
| B5 front (toggle sync/async + transporte + paralelismo + badge) | pendiente |
| Scatter para input table-streaming (N desconocido) | follow-up |
| Redrive por-slice de slices muertas (outbox DEAD ya se redrivea; inbox DEAD → follow-up) | follow-up |

Backend de la Opción B **completo** (B1–B4). Falta el front (B5) y los follow-ups de streaming/redrive
por-slice. Nota: el redrive de slices muertas en el **outbox** ya lo cubre `redriveOutboxDead` (grupo 3);
las que mueren en el **inbox** (continueOnFailure ya las cuenta como fallidas) necesitarían un re-dispatch
por-slice con sus records — follow-up.
