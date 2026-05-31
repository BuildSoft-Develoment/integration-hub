> **Plantilla (no es el entregable).** Destino: `specs/<feature>/`. Fuente unica: `npm run scaffold:feature` (genera el archivo real con el slug). Regenera esta plantilla con `npm run plantillas:sync` — NO la edites a mano.

# Spec de tareas - <Titulo de la feature>

## Regla
Cada tarea es una FILA EJECUTABLE de la tabla `## Tabla ejecutable de tareas`. Sin
placeholders, sin paths inventados, sin comandos con `<...>`. Granularidad: 2-5 min
por T-NNN. Cada T tipo=impl exige un T tipo=test que la precede (TDD obligatorio).
El validador `check:tasks-executable` bloquea `check:all` si una fila viola estas reglas.

## Contexto
- Feature: `<nnn-feature>`
- Spec funcional: `spec-funcional.md`
- Spec tecnica: `spec-tecnica.md`
- API contract: `api-contract.md` (endpoint principal: `GET /api/<entidad>`)
- Entidad BD: `<entidad>`
- UX/prototipo: `prototype.md` + `prototype-html5/index.html` + `prototype-validation.md`
- SPDD frontend: `spdd-frontend.md`
- Rama sugerida: `feat/<nnn-feature>`
- Worktree sugerido: `worktrees/<nnn-feature>`
- Gate: `gate-4-6` (cierre de SDD -> construccion habilitada)

## Tabla ejecutable de tareas

> Columnas obligatorias (v12.119+): `id | rf | tipo | archivo | test | comando_red |
> expected_red | comando_green | expected_green | depende_de | paralelizable | estado`.
> Estados validos: `pending` | `in_progress` | `done` | `blocked`. Tipos validos:
> `test` | `impl` | `refactor` | `doc`. Paths deben ser exactos (no `<...>` ni TBD).

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-001 | RF-NN | test | tests/unit/<entidad>/<entidad>-rf-nn.test.ts | (self) | npm test -- <entidad>-rf-nn | FAIL (sin impl) | npm test -- <entidad>-rf-nn | PASS | - | si | pending |
| T-002 | RF-NN | impl | src/backend/application/<entidad>/<entidad>-rf-nn.ts | tests/unit/<entidad>/<entidad>-rf-nn.test.ts | npm test -- <entidad>-rf-nn | FAIL (test escrito) | npm test -- <entidad>-rf-nn | PASS | T-001 | no | pending |

## Checklist de cierre
- [ ] Todas las tareas tienen estado (pendiente / en curso / hecho / bloqueado).
- [ ] Cada tarea critica tiene evidencia TDD (prueba red + green).
- [ ] Cambios de contrato, seguridad, datos o UX critica tienen revision humana.
- [ ] Cambios frontend tienen consistencia con prototipo y SPDD.
- [ ] Pruebas ejecutadas y registradas en `qa/fase-6-qa/`.
- [ ] Preguntas abiertas o bloqueantes documentados en `traceability.md`.

Referencia: `docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
