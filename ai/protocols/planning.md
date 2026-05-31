# Protocolo: planning

## Cuando aplica
- Toda tarea no-trivial. Si vas a tocar >1 archivo o necesitas mas de un commit, aplica.
- Despues de `brainstorming`, antes de tocar codigo.
- Antes de `tdd` y `subagent-execution`.

No aplica para: cambios triviales de 1 linea, fixes de typo, edits de auto-zones (via memory:sync).

## Pasos obligatorios

1. Lee `spec-funcional.md` y `spec-tecnica.md` cerradas.
2. Genera/actualiza `spec-tareas.md` como TABLA EJECUTABLE (v12.119+) con columnas:
   `id | rf | tipo | archivo | test | comando_red | expected_red | comando_green | expected_green | depende_de | paralelizable | estado`
3. Cada T-NNN debe ser ejecutable por un agente sin contexto adicional:
   - Sin placeholders (`<...>`, TBD, TODO).
   - Paths exactos (archivos existentes o `(planned)`).
   - Comandos copy-paste runnable (no `<comando>`).
   - Granularidad 2-5 minutos por T.
4. Para cada T tipo=impl: debe acompañarse de un T tipo=test que la precede (TDD).
5. Declara dependencias entre T (`depende_de`) y paralelizables (`paralelizable=si`).
6. Verifica con `npm run check:tasks-executable --feature <slug>` (debe EXIT 0).

## Output esperado

- `specs/<slug>/spec-tareas.md` con tabla ejecutable strict.
- `traceability.md > matriz` actualizada con los RFs cubiertos por T.

## Anti-patterns

- Tareas vagas ("implementar backend", "crear UI") sin paths/comandos.
- Comandos con placeholders o `<comando>`.
- T tipo=impl sin T tipo=test previo (rompe TDD).
- Sin estado declarado (rompe `check:tasks-executable`).
- Plan que tarda >2h en una sola T (granularidad rota).

## Verificacion

```bash
npm run check:tasks-executable -- --feature <slug>
# debe EXIT 0
```

Si el validador bloquea, NO puedes pasar al protocolo `tdd` ni `subagent-execution`.
