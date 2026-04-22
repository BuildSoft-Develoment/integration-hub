# Changelog

Todos los cambios relevantes del proyecto a nivel documental y de estandarizacion se registran aqui.

## v0.4.0

- Se completo el bloque transversal del estandar con `90.02`, `90.03`, `90.04`, `90.05`, `90.08`, `90.09` y `90.14`.
- Se cerro el recorrido `nav-guided` transversal hasta `90.14-criterios-consolidacion-documental.md`.
- Se reenfoco `90.06` como documentacion de la estructura real del repositorio sin mover `platform-app/` ni `frontend/`.
- Se eliminaron nombres y contenidos de corte plantilla en `fase-0`, `fase-5` y transversal para que la documentacion oficial describa el proyecto real.
- Se consolido `fase-1` con modulos, casos de uso e historias de usuario como documentacion oficial del proyecto.
- Se retiro la carpeta `plantillas/` del arbol activo del repositorio.
- Se retiro la biblioteca metodologica de `ai/` y se reemplazo por documentacion del uso real de IA en el proyecto.
- Se alinearon `docs/README.md`, `AGENTS.md`, `CONTRIBUTING.md` y `README.md` al template actualizado.
- Se agrego `ci/scripts/check-docs.py` para validar BOM, enlaces, anclas y `nav-guided`.
- Se documento la nueva ola de estandarizacion en `releases/v0.4.0-template-updated-rules-alignment.md`.

## v0.3.0

- Se normalizo `docs/` con breadcrumbs y recorrido `nav-guided` en fases y transversal.
- Se agrego `plantillas/` como baseline metodologico alineado al template actualizado.
- Se agregaron `src/README.md` y `tests/README.md` como puertas de entrada compatibles con el estandar.
- Se fortalecio onboarding en `README.md`, `docs/README.md` y `docs/fase-0-iniciacion/00.06-ruta-guiada-integration-hub.md`.
- Se reforzo `90.07-convenciones-y-naming.md` al nivel operativo del template.
- Se movieron planes historicos fuera de `docs/` hacia `revisiones/`.

## v0.2.0

- Se completo la segunda ola de alineacion al template.
- Se agregaron `docs/transversal/90.00-estandar-ia.md`, `90.11-checklist-entregables.md`, `90.12-mapa-ia-por-fase.md` y el documento base de estructura real hoy consolidado como `90.06-estructura-repositorio-real.md`.
- Se creo la carpeta `ai/` con `agents/`, `prompts/`, `skills/` y `ejemplos/`.
- Se agregaron las carpetas `diagramas/`, `estimacion/`, `escenarios/`, `stacks/` y `revisiones/`.
- Se agregaron `AGENTS.md`, `CONTRIBUTING.md` y este `CHANGELOG.md`.
- Se formalizo que la estructura real del codigo permanece en `platform-app/` y `frontend/`.

## v0.1.0

- Se reorganizo la documentacion por fases `0-8`.
- Se crearon `specs/`, `qa/`, `ops/`, `ci/`, `releases/`, `likec4/` y `ejemplos/`.
- Se mantuvo compatibilidad con `docs/architecture/` y los activos operativos reales.
