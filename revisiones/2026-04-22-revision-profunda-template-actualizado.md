# Revision profunda 2026-04-22 - Template actualizado

## Objetivo

Evaluar el estado real del repositorio frente al template actualizado `C:\template\project-template`, identificar brechas de estandar, trazabilidad y gobernanza, y preparar una ruta de alineacion sin afectar la funcionalidad del sistema.

## Resumen ejecutivo

El repositorio ya logro una alineacion estructural parcial importante:

- existe la organizacion documental por fases `0-8`
- existen `specs/`, `qa/`, `ops/`, `ci/`, `releases/`, `ai/`, `likec4/`, `ejemplos/`, `diagramas/`, `estimacion/`, `escenarios/`, `stacks/` y `revisiones/`
- existe una capa de gobernanza inicial con `AGENTS.md`, `CONTRIBUTING.md` y `CHANGELOG.md`
- la estructura real del codigo fue preservada en `platform-app/` y `frontend/`

Sin embargo, todavia no cumple el nivel de estandar del template actualizado. La mayor brecha ya no es de carpetas, sino de calidad del estandar:

- navegacion guiada ausente en `docs/`
- documentos de fase demasiado resumidos frente al baseline del template
- ausencia de `plantillas/`, que en el template es una pieza central del metodo
- duplicidad legacy todavia viva en `docs/architecture/` y `docs/examples/`
- ausencia de `src/` y `tests/` como puntos de entrada documentales compatibles con el estandar

## Hallazgos priorizados

### P1. El repositorio no cumple aun la regla estructural minima de `docs/` definida por el template

Evidencia:

- [docs/README.md](C:\chatgtp\quarkus\docs\README.md)
- [docs/fase-0-iniciacion/README.md](C:\chatgtp\quarkus\docs\fase-0-iniciacion\README.md)
- [docs/transversal/90.07-convenciones-y-naming.md](C:\chatgtp\quarkus\docs\transversal\90.07-convenciones-y-naming.md)

Observacion:

El template actualizado exige breadcrumbs y bloque `nav-guided` en todos los documentos de `docs/`. El repositorio ya tiene la regla escrita en `90.07`, pero la propia documentacion no la cumple. Esto deja inconsistencia entre la norma y la implementacion real, y reduce mucho la navegabilidad del estandar.

Impacto:

- la documentacion no se recorre como flujo unico
- onboarding mas debil que el template
- la IA y los colaboradores humanos no reciben una ruta guiada consistente

### P1. Falta `plantillas/`, que es parte estructural del template y del metodo SDD/QA/Ops

Evidencia:

- carpeta inexistente: `C:\chatgtp\quarkus\plantillas\`
- referencia del template: `C:\template\project-template\plantillas\`
- documento dependiente: [docs/fase-4-sdd/04.00-spec-driven-development.md](C:\chatgtp\quarkus\docs\fase-4-sdd\04.00-spec-driven-development.md)

Observacion:

El template no usa `plantillas/` como carpeta decorativa; la usa para proveer baseline reutilizable por fase. Sin ella, el repositorio tiene estructura y algunas specs, pero no tiene el soporte metodologico completo para reproducir el estándar de forma consistente.

Impacto:

- creacion de nuevos artefactos sin baseline comun
- mayor variabilidad entre specs, QA, deploy y operacion
- la capa `AI-first` queda sin una base documental reusable comparable a la del template

### P1. Existen dos arboles documentales en paralelo para arquitectura y ejemplos

Evidencia:

- [docs/architecture/README-ARCHITECTURE.md](C:\chatgtp\quarkus\docs\architecture\README-ARCHITECTURE.md)
- [docs/fase-3-arquitectura/README.md](C:\chatgtp\quarkus\docs\fase-3-arquitectura\README.md)
- `C:\chatgtp\quarkus\docs\examples\`
- `C:\chatgtp\quarkus\ejemplos\`

Observacion:

La capa de compatibilidad legacy sigue siendo razonable a corto plazo, pero ya existe suficiente estructura nueva como para que la duplicidad empiece a crear ambiguedad sobre la ruta canonica. El template actualizado privilegia una sola ubicacion oficial por artefacto.

Impacto:

- riesgo de drift entre documentos equivalentes
- referencias mezcladas entre legacy y estandar
- mayor costo de mantenimiento

### P2. El proyecto no ofrece todavia una equivalencia documental visible para `src/` y `tests/` al nivel de entrada del template

Evidencia:

- [docs/README.md](C:\chatgtp\quarkus\docs\README.md)
- [docs/fase-5-construccion/05.00-plantilla-proyecto-base.md](C:\chatgtp\quarkus\docs\fase-5-construccion\05.00-plantilla-proyecto-base.md)
- archivo ausente: `C:\chatgtp\quarkus\src\README.md`
- archivo ausente: `C:\chatgtp\quarkus\tests\README.md`

Observacion:

Ya se documentó la equivalencia conceptual con `platform-app/` y `frontend/`, lo cual es correcto para no romper funcionalidad. Pero el template actualizado también usa `src/README.md` y `tests/README.md` como puertas de entrada para desarrolladores. Esa capa de compatibilidad de navegación todavía no existe.

Impacto:

- menor similitud operativa con el template
- rutas por rol incompletas para desarrollo
- más fricción al onboardear con expectativas del estándar

### P2. El `README.md` principal sigue fuerte en contenido de producto, pero debajo del estándar actualizado como README de plantilla gobernable

Evidencia:

- [README.md](C:\chatgtp\quarkus\README.md)
- template de referencia: `C:\template\project-template\README.md`

Observacion:

El README actual explica muy bien la solución `Integration Hub`, pero no alcanza todavía el nivel de entrada del template actualizado: falta navegación guiada, ruta de adopción más formal y una lectura corta equivalente a “Primera lectura en 10 minutos”.

Impacto:

- onboarding inicial más dependiente de lectura libre
- menor alineación con el estándar que ahora se quiere seguir

### P2. La calidad del estándar transversal todavía es inferior al template actualizado

Evidencia:

- [docs/transversal/90.07-convenciones-y-naming.md](C:\chatgtp\quarkus\docs\transversal\90.07-convenciones-y-naming.md)
- template de referencia: `C:\template\project-template\docs\transversal\90.07-convenciones-y-naming.md`

Observacion:

La versión actual cubre conceptos base, pero no llega al detalle operativo del template sobre estructura mínima por documento, codificación, reglas del recorrido `nav-guided`, y criterios de consistencia editorial.

Impacto:

- reglas menos aplicables
- revisiones futuras más ambiguas
- mayor dispersión de estilo documental

### P3. Hay ruido estructural que no pertenece al estándar documental

Evidencia:

- `C:\chatgtp\quarkus\frontend-nx-temp\`
- logs en raíz:
  - `platform-app-dev.err.log`
  - `platform-app-native.out.log`
  - `quarkus-dev.log`
  - otros similares
- planes operativos en `docs/`:
  - [PLAN-MIGRACION-DOCUMENTACION-TEMPLATE.md](C:\chatgtp\quarkus\docs\PLAN-MIGRACION-DOCUMENTACION-TEMPLATE.md)
  - [PLAN-ALINEACION-TEMPLATE-IA.md](C:\chatgtp\quarkus\docs\PLAN-ALINEACION-TEMPLATE-IA.md)

Observacion:

Estos artefactos no rompen funcionalidad, pero sí diluyen el estándar del repositorio. En el template actualizado, ese material debería vivir como revisión, release o documento transversal claramente acotado, no como presencia difusa en la raíz o en `docs/`.

Impacto:

- menor limpieza del estándar
- ruido en onboarding
- confusión entre artefacto oficial, temporal y generado

## Fortalezas actuales

- se preservó correctamente la funcionalidad real del proyecto
- existe base fuerte de arquitectura, operación y ejemplos reales
- la capa `AI-first` ya está creada
- ya hay `specs/`, `qa/`, `ops/` y `ci/` utilizables
- existe una primera formalización de equivalencias con el template

## Conclusion de la revision

El repositorio ya no está “desordenado”; ahora su problema principal es de madurez de estándar. La siguiente ola no debe centrarse en crear más carpetas, sino en:

1. elevar la calidad de los documentos al nivel del template,
2. cerrar la capa metodológica faltante con `plantillas/`,
3. unificar rutas canonicas y navegación,
4. crear una compatibilidad documental limpia para `src/` y `tests/`,
5. limpiar ruido legacy sin tocar la ejecución del sistema.
