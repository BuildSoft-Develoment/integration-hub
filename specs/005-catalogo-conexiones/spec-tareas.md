# Spec de tareas - Catalogo de conexiones

## Regla
Cada tarea es una FILA EJECUTABLE de la tabla `## Tabla ejecutable de tareas`. Sin
placeholders, sin paths inventados, sin comandos con `<...>`. Granularidad: 2-5 min
por T-NNN. Cada T tipo=impl exige un T tipo=test que la precede (TDD obligatorio).
El validador `check:tasks-executable` bloquea `check:all` si una fila viola estas reglas.

## Contexto
- Feature: `005-catalogo-conexiones`
- Spec funcional: `spec-funcional.md`
- Spec tecnica: `spec-tecnica.md`
- API contract: `api-contract.md` (endpoint principal: `GET /api/connection-definitions`)
- Entidad BD: `connection_definition`
- UX/prototipo: `prototype.md` + `prototype-html5/index.html` + `prototype-validation.md`
- SPDD frontend: `spdd-frontend.md`
- Rama sugerida: `feat/005-catalogo-conexiones`
- Worktree sugerido: `worktrees/005-catalogo-conexiones`
- Gate: `gate-4-6` (cierre de SDD -> construccion habilitada)

## Tabla ejecutable de tareas

> Columnas obligatorias (v12.119+): `id | rf | tipo | archivo | test | comando_red |
> expected_red | comando_green | expected_green | depende_de | paralelizable | estado`.
> Estados validos: `pending` | `in_progress` | `done` | `blocked`. Tipos validos:
> `test` | `impl` | `refactor` | `doc`. Paths deben ser exactos (no `<...>` ni TBD).

| id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado |
|---|---|---|---|---|---|---|---|---|---|---|---|
| T-001 | RF-001 | test | tests/unit/connection_definition/connection_definition-rf-001.test.ts | (self) | npm test -- connection_definition-rf-001 | FAIL (sin impl) | npm test -- connection_definition-rf-001 | PASS | - | si | pending |
| T-002 | RF-001 | impl | src/backend/application/connection_definition/connection_definition-rf-001.ts | tests/unit/connection_definition/connection_definition-rf-001.test.ts | npm test -- connection_definition-rf-001 | FAIL (test escrito) | npm test -- connection_definition-rf-001 | PASS | T-001 | no | pending |
| T-003 | RF-002 | test | tests/unit/connection_definition/connection_definition-rf-002.test.ts | (self) | npm test -- connection_definition-rf-002 | FAIL (sin impl) | npm test -- connection_definition-rf-002 | PASS | - | si | pending |
| T-004 | RF-002 | impl | src/backend/application/connection_definition/connection_definition-rf-002.ts | tests/unit/connection_definition/connection_definition-rf-002.test.ts | npm test -- connection_definition-rf-002 | FAIL (test escrito) | npm test -- connection_definition-rf-002 | PASS | T-003 | no | pending |
| T-005 | RF-003 | test | tests/unit/connection_definition/connection_definition-rf-003.test.ts | (self) | npm test -- connection_definition-rf-003 | FAIL (sin impl) | npm test -- connection_definition-rf-003 | PASS | - | si | pending |
| T-006 | RF-003 | impl | src/backend/application/connection_definition/connection_definition-rf-003.ts | tests/unit/connection_definition/connection_definition-rf-003.test.ts | npm test -- connection_definition-rf-003 | FAIL (test escrito) | npm test -- connection_definition-rf-003 | PASS | T-005 | no | pending |
| T-007 | RF-004 | test | tests/unit/connection_definition/connection_definition-rf-004.test.ts | (self) | npm test -- connection_definition-rf-004 | FAIL (sin impl) | npm test -- connection_definition-rf-004 | PASS | - | si | pending |
| T-008 | RF-004 | impl | src/backend/application/connection_definition/connection_definition-rf-004.ts | tests/unit/connection_definition/connection_definition-rf-004.test.ts | npm test -- connection_definition-rf-004 | FAIL (test escrito) | npm test -- connection_definition-rf-004 | PASS | T-007 | no | pending |
| T-009 | RF-005 | test | tests/unit/connection_definition/connection_definition-rf-005.test.ts | (self) | npm test -- connection_definition-rf-005 | FAIL (sin impl) | npm test -- connection_definition-rf-005 | PASS | - | si | pending |
| T-010 | RF-005 | impl | src/backend/application/connection_definition/connection_definition-rf-005.ts | tests/unit/connection_definition/connection_definition-rf-005.test.ts | npm test -- connection_definition-rf-005 | FAIL (test escrito) | npm test -- connection_definition-rf-005 | PASS | T-009 | no | pending |

## Checklist de cierre
- [ ] Todas las tareas tienen estado (pendiente / en curso / hecho / bloqueado).
- [ ] Cada tarea critica tiene evidencia TDD (prueba red + green).
- [ ] Cambios de contrato, seguridad, datos o UX critica tienen revision humana.
- [ ] Cambios frontend tienen consistencia con prototipo y SPDD.
- [ ] Pruebas ejecutadas y registradas en `qa/fase-6-qa/`.
- [ ] Preguntas abiertas o bloqueantes documentados en `traceability.md`.

Referencia: `docs/transversal/90.33-flujo-delivery-ia-proveedores.md`
