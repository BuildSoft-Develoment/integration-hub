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
2. Trabajar siempre sobre artefactos oficiales del proyecto y usar referencias de apoyo solo como insumo, nunca como entregable final.
3. Si el trabajo involucra IA, revisar tambien:
   - `docs/transversal/90.00-estandar-ia.md`
   - `docs/transversal/90.12-mapa-ia-por-fase.md`
   - `docs/transversal/90.14-criterios-consolidacion-documental.md`
   - `ai/README.md`
   - `ai/agents/README.md`
   - `ai/prompts/README.md`
   - `ai/skills/README.md`
   - `ai/ejemplos/README.md`
4. Mantener una sola nomenclatura:
   - `Spec-Driven Development (SDD)`
   - fases `0` a `8`
   - roles estandar definidos en `docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md`
   - rutas canonicas definidas en `docs/`, `specs/`, `qa/`, `ops/`, `ci/`, `releases/`
5. Para planificacion, producir o actualizar:
   - `docs/fase-0-iniciacion/00.02-roadmap.md`
   - `docs/fase-0-iniciacion/00.03-estimacion-tiempo-costo.md`
   - `docs/fase-0-iniciacion/00.04-roles-y-responsabilidades.md`
6. Para arquitectura, producir o actualizar:
   - `docs/fase-3-arquitectura/03.00-arquitectura.md`
   - `docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md`
   - `docs/fase-3-arquitectura/03.03-plan-despliegue.md`
   - `likec4/*`
   - `docs/fase-3-arquitectura/adr/*`
7. Para SDD, usar `docs/fase-4-sdd/04.00-spec-driven-development.md`, `docs/fase-4-sdd/04.01-checklist-spec-driven-development.md` y crear la carpeta oficial de la feature en `specs/`.
8. No inventar decisiones tecnicas sin `ADR` o justificacion explicita.
9. Respetar la estructura real del codigo:
   - backend en `platform-app/`
   - frontend en `frontend/`
   - pruebas distribuidas por stack
   - puerta de entrada documental compatible en `src/README.md` y `tests/README.md`
10. Cuando un entregable no viva en `docs/`, respetar la ruta canonica definida en `docs/transversal/90.10-entregables-minimos-por-fase.md`.

## Salidas esperadas por dominio

- planificacion: roadmap, estimacion, riesgos y roles
- arquitectura: markdown, `ADR`, `LikeC4`, despliegue
- construccion: `specs/`, codigo y pruebas con trazabilidad a requerimientos
- QA: casos y evidencias
- operacion: runbook, rollback, metricas y pipeline
