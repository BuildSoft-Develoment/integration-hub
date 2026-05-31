# Agents

[README principal](../../README.md) | [Indice docs](../../docs/README.md) | [Volver a ai](../README.md)

Agents representan roles especializados para producir entregables completos por fase o dominio.

## Regla de uso
- Usa un `agent` cuando necesitas una salida integral, no solo una instruccion puntual.
- Cada agente debe leer el contexto minimo de negocio, fase y trazabilidad antes de proponer cambios.
- La salida del agente siempre debe terminar en rutas canonicas del repositorio.
- Un agente oficial debe decir tambien cuando no conviene usarlo y como verificar que la salida quedo bien.

## Anatomia minima recomendada
- objetivo,
- usalo cuando,
- no lo uses cuando,
- entradas minimas,
- salidas esperadas,
- rutas destino,
- verificacion minima,
- referencias si hace falta.

## Uso en proyecto real
- Los agentes oficiales del proyecto deben describir roles, entradas y salidas del dominio real.
- Si un agente fue tomado como base desde la plantilla, debe adaptarse a los artefactos y rutas efectivas del proyecto antes de considerarse oficial.
- Un agente no debe quedarse amarrado al caso canonico si el proyecto ya adopto otro contexto.
- Si el trabajo es ambiguo, enruta primero con `../skills/using-project-skills.skill.md`.

## Anti-patron a evitar
- Copiar un agente de ejemplo y dejar referencias a features, actores o stacks que no pertenecen al proyecto real.
- Usar un agente generico como si ya estuviera validado para cualquier dominio sin revisarlo.

## Agentes disponibles
- [enterprise-ai-framework-agent.md](enterprise-ai-framework-agent.md)
- [product-design-agent.md](product-design-agent.md)
- [planner-agent.md](planner-agent.md)
- [architect-agent.md](architect-agent.md)
- [backend-agent.md](backend-agent.md)
- [frontend-agent.md](frontend-agent.md)
- [frontend-spdd-agent.md](frontend-spdd-agent.md)
- [qa-agent.md](qa-agent.md)
- [devops-agent.md](devops-agent.md)
