> **Plantilla (no es el entregable).** Destino: `specs/<feature>/`. Fuente unica: `npm run scaffold:feature` (genera el archivo real con el slug). Regenera esta plantilla con `npm run plantillas:sync` — NO la edites a mano.

# TDD Evidence - <Titulo de la feature>

> **Que es esto.** Evidencia auditable del ciclo RED-GREEN-REFACTOR por cada T tipo=impl
> de `spec-tareas.md`. `agent:finish` actualiza este archivo con commits y timestamps
> reales antes de cerrar el feature. `check:tdd-evidence` (STRICT en `check:project`)
> exige que cada T en state=done tenga aqui un bloque con RED + GREEN reales (no `pending`).

> **Como llenarlo.** Cada bloque corresponde a un T tipo=impl de spec-tareas.md. Sigue el
> protocolo `tdd` (ver `ai/protocols/tdd.md`):
> 1. Escribe el test → corre → captura RED log + commit.
> 2. Escribe codigo minimo → corre → captura GREEN log + commit.
> 3. Refactor (opcional, agrupable).
> 4. Actualiza el bloque aqui con `Verified: <YYYY-MM-DD HH:MM>`.

## Contexto
- Feature: `<nnn-feature>`
- spec-tareas.md: ver para los T-NNN correspondientes
- Protocolo aplicable: `ai/protocols/tdd.md`

## RF-NN / T-002

- Test path: (planned) tests/unit/<entidad>/<entidad>-rf-nn.test.ts
- RED command: (planned) npm test -- <entidad>-rf-nn
- RED result: pending
- RED log: pending
- GREEN command: (planned) npm test -- <entidad>-rf-nn
- GREEN result: pending
- GREEN log: pending
- Commit RED: pending
- Commit GREEN: pending
- Verified: pending

> Nota: tras correr el ciclo RED-GREEN real (`ai/protocols/tdd.md`), reemplaza
> "(planned) ..." por el valor real entre backticks y "pending" por el log/timestamp real.
