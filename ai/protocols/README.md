# ai/protocols/

Los **protocolos** son disciplinas de ejecucion OBLIGATORIAS por tipo de tarea (Capa 1 del framework AI-first empresarial). Distintos de las skills:

- **Protocolos**: obligatorios por TIPO de tarea (selecciona `npm run agent:protocol -- --task "..."`).
- **Skills**: activables por CONTEXTO (el agente las invoca cuando aplican).

Cada `.md` aqui declara una estructura canonica (validada por `check:protocols`):

1. **Cuando aplica** (criterio claro de seleccion).
2. **Pasos obligatorios** (en orden, sin saltos).
3. **Output esperado** (artefactos persistidos).
4. **Anti-patterns** (lo que bloquea el protocolo).
5. **Verificacion** (como saber que se cumplio).

Ver [AGENT_RUNTIME.md](../../AGENT_RUNTIME.md) para el contexto completo.
