# Protocolo: tdd

## Cuando aplica
- Toda tarea T tipo=impl en fase 5 (construccion).
- Toda correccion de bug que toca codigo de produccion.
- NO aplica para: prototipos throwaway (fase 2 con `--freeform`), doc edits, refactor mecanico sin cambio de comportamiento (siempre que pruebas existentes pasen).

## Pasos obligatorios (RED → GREEN → REFACTOR)

### RED — test fallido primero
1. Identifica T tipo=impl objetivo en `spec-tareas.md`.
2. Localiza el T tipo=test que la precede.
3. Escribe el test (o usalo si ya existe).
4. Corre el test: **debe fallar** (RED). Captura el output.
5. Registra en `specs/<slug>/tdd-evidence.md`:
   - Test path
   - RED command
   - RED result + log
   - Commit del RED

### GREEN — codigo minimo
6. Escribe el codigo de produccion MINIMO para hacer pasar el test.
7. Corre el test: **debe pasar** (GREEN). Captura el output.
8. Corre la suite completa: nada debe romperse.
9. Registra en `tdd-evidence.md`:
   - GREEN command
   - GREEN result + log
   - Commit del GREEN

### REFACTOR — limpieza sin cambiar comportamiento
10. Refactoriza sin tocar el test.
11. Corre suite completa entre cada cambio.
12. Commit del REFACTOR (opcional, agrupable).

## Output esperado

- `specs/<slug>/tdd-evidence.md` con bloque por cada T tipo=impl que tiene:
  - Test path
  - RED command + result + log/commit
  - GREEN command + result + log/commit
  - Verified timestamp
- `traceability.md` con `Codigo` y `Test` con nombres reales (no `-`).

## Anti-patterns

- Escribir codigo de produccion ANTES del test fallido.
- Test que pasa la primera vez (no fallo en RED — no es TDD).
- Saltar el REFACTOR cuando hay code smell.
- Marcar T como done sin tdd-evidence bloque completo.
- Falsificar logs RED/GREEN sin correr realmente.

## Verificacion

```bash
npm run check:tdd-evidence -- --feature <slug>
# debe EXIT 0 para promover T a state=done
```

`agent:finish` corre este check automaticamente.
