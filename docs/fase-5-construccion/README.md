# Fase 5 - Construccion

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Checklist SDD](../fase-4-sdd/04.01-checklist-spec-driven-development.md)
- Siguiente: [Construccion](05.00-estructura-construccion-actual.md)
<!-- nav-guided:end -->

## Objetivo

Explicar como las specs se materializan en codigo, pruebas y trazabilidad dentro de la estructura real del repositorio.

## Contenido

- [05.00-estructura-construccion-actual](05.00-estructura-construccion-actual.md)
- [modulos/mapa-construccion-backend-frontend](modulos/mapa-construccion-backend-frontend.md)
- [modulos/frontend-nx-angular](modulos/frontend-nx-angular.md)
- [verificacion/verificacion-tecnica-y-trazabilidad](verificacion/verificacion-tecnica-y-trazabilidad.md)

## Adopcion real de la fase

- Esta fase documenta la estructura ejecutable del proyecto, no una base generica.
- El codigo real vive en `platform-app/` y `frontend/`.
- Las features se originan en `specs/` y deben quedar verificables contra pruebas, QA y operacion.
- `qa/`, `ops/`, `ci/` y `releases/` complementan la construccion, no la reemplazan.

## Referencias

- [../transversal/90.06-estructura-repositorio-real.md](../transversal/90.06-estructura-repositorio-real.md)
- [../../specs/README.md](../../specs/README.md)
- [../../ci/README.md](../../ci/README.md)
