# AGENTS.md

## Proposito

Este repositorio implementa una plataforma de integracion configurable y adopta una forma de trabajo `AI-first` gobernada por documentacion estructurada.

## Como debe trabajar un agente

1. Leer primero:
   - `docs/fase-0-iniciacion/00.00-guia-de-uso.md`
   - `docs/fase-0-iniciacion/00.01-vision-proyecto.md`
   - `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md`
   - `docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md`
   - `docs/transversal/90.10-entregables-minimos-por-fase.md`
   - `docs/transversal/90.11-checklist-entregables.md`
2. Si el trabajo involucra IA, revisar tambien:
   - `docs/transversal/90.00-estandar-ia.md`
   - `docs/transversal/90.12-mapa-ia-por-fase.md`
   - `ai/README.md`
   - `ai/agents/README.md`
   - `ai/prompts/README.md`
   - `ai/skills/README.md`
3. Mantener una sola nomenclatura:
   - `Spec-Driven Development (SDD)`
   - fases `0` a `8`
   - rutas canonicas definidas en `docs/`, `specs/`, `qa/`, `ops/`, `ci/`, `releases/`
4. No inventar decisiones tecnicas sin `ADR` o justificacion explicita.
5. Respetar la estructura real del codigo:
   - backend en `platform-app/`
   - frontend en `frontend/`
   - pruebas distribuidas por stack
   - puerta de entrada documental compatible en `src/README.md` y `tests/README.md`

## Salidas esperadas por dominio

- planificacion: roadmap, estimacion, riesgos y roles
- arquitectura: markdown, `ADR`, `LikeC4`, despliegue
- construccion: `specs/`, codigo y pruebas
- QA: casos y evidencias
- operacion: runbook, rollback, metricas y pipeline
