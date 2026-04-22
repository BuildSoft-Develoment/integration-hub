# CONTRIBUTING

[README principal](README.md) | [Indice docs](docs/README.md)

Esta guia reune reglas practicas para editar el repositorio sin romper consistencia, trazabilidad ni funcionalidad.

## Principios

- la documentacion y el codigo deben mantenerse alineados
- no crear rutas paralelas para artefactos que ya tienen ubicacion oficial
- no mover codigo ejecutable solo para parecerse al template
- toda salida de IA debe terminar en una ruta canonica

## Antes de editar

1. Leer `AGENTS.md`.
2. Revisar `docs/README.md`.
3. Revisar `docs/transversal/90.07-convenciones-y-naming.md`.
4. Si el cambio afecta arquitectura, preparar o actualizar un `ADR`.

## Rutas canonicas

- direccion y fases: `docs/`
- features: `specs/`
- QA: `qa/`
- deploy y operacion: `ops/`
- pipeline: `ci/`
- snapshots: `releases/`
- IA: `ai/`

## Regla sobre estructura real

- backend real: `platform-app/`
- frontend real: `frontend/`
- la equivalencia con `src/` y `tests/` del template esta documentada en `docs/transversal/90.06-equivalencias-estructura-real.md`

## Verificacion minima

- comprobar que los enlaces nuevos apunten a archivos existentes
- evitar referencias a rutas futuras o ficticias
- si el cambio involucra IA, revisar `docs/transversal/90.00-estandar-ia.md`
