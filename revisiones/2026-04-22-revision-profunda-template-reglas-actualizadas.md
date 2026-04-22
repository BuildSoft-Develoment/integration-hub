# Revision profunda contra template actualizado

[README principal](../README.md) | [Indice docs](../docs/README.md) | [Volver a revisiones](README.md)

## Alcance

Revision comparativa entre el proyecto real `C:\chatgtp\quarkus` y el template actualizado `C:\template\project-template`, enfocada en reglas de trabajo estructurado, navegabilidad, documentacion canonica y preservacion de funcionalidad.

## Criterio usado

- no romper la estructura ejecutable real (`platform-app/`, `frontend/`, `keycloak/`, `otel/`)
- alinear la documentacion al estandar nuevo del template
- evitar salidas sueltas fuera de rutas canonicas
- conservar compatibilidad con el modo de trabajo `AI-first`

## Hallazgos prioritarios

### P1. El bloque transversal del proyecto quedo incompleto frente al template actualizado

El template actualizado ya incorpora `90.02`, `90.03`, `90.04`, `90.05`, `90.06`, `90.08`, `90.09` y `90.14` en `docs/transversal/README.md`, mientras que el proyecto solo expone `90.00`, `90.01`, `90.06-equivalencias-estructura-real`, `90.07`, `90.10`, `90.11`, `90.12` y `90.13`.

Impacto:

- el modo estructurado queda sin el bloque de seleccion de escenario y stack del template
- la navegacion transversal no coincide con el recorrido oficial actualizado
- falta el documento nuevo `90.14-instanciacion-fases-proyectos-reales.md`, clave para evitar que artefactos finales sigan sonando a plantilla

Evidencia:

- `docs/transversal/README.md`
- `docs/transversal/90.13-modos-de-trabajo.md`
- template `docs/transversal/README.md`
- template `docs/transversal/90.14-instanciacion-fases-proyectos-reales.md`

### P1. La navegacion guiada transversal se corta antes del cierre oficial del template

En el proyecto, `docs/transversal/90.13-modos-de-trabajo.md` vuelve directo al indice. En el template actualizado, `90.13` enlaza a `90.14-instanciacion-fases-proyectos-reales.md` y recien ahi cierra el ciclo.

Impacto:

- el recorrido `nav-guided` ya no refleja la secuencia oficial del template
- se pierde la regla documental que explica como pasar de plantilla a entregable real sin dejar texto instructivo residual

### P2. `docs/README.md` sigue util para el proyecto, pero no refleja el indice enriquecido del template

El `docs/README.md` actual conserva rutas por rol y artefactos aplicados, pero no incorpora la seccion `Rutas complementarias` del template ni expone el nuevo acceso a `90.14-instanciacion-fases-proyectos-reales.md`.

Impacto:

- el onboarding documental queda por debajo del template actualizado
- la ruta para trabajo estructurado y adopcion no queda visible desde el indice principal

### P2. `AGENTS.md` todavia no adopta el contrato operativo completo del template actualizado

El template actualizado exige revisar `plantillas/` antes de crear artefactos nuevos y usar `ejemplos/` solo como referencia. El `AGENTS.md` del proyecto no incorpora esa regla explicita ni aterriza con el mismo nivel las salidas esperadas por dominio y las rutas de produccion documental.

Impacto:

- un agente puede generar artefactos fuera del flujo canonico
- aumenta el riesgo de producir documentos que parezcan plantilla en vez de entregable real

### P2. `CONTRIBUTING.md` sigue siendo una version reducida frente al estandar nuevo

El template actualizado ya formaliza:

- tabla de contenido
- reglas de `breadcrumbs` y `nav-guided`
- pasos para agregar fase o feature `SDD`
- convenciones de codificacion (`UTF-8 sin BOM`, `LF`, sin espacios finales)
- verificacion de anclas y enlaces
- regla de ejecucion del validador documental

El `CONTRIBUTING.md` del proyecto hoy solo cubre principios, rutas canonicas y una verificacion minima.

Impacto:

- el repositorio no tiene una guia suficiente para sostener la alineacion en siguientes iteraciones
- la calidad documental depende demasiado de revision manual

### P2. Falta el validador documental `ci/scripts/check-docs.py`

El template actualizado ya lo declara como parte del estandar y lo usa para validar BOM, enlaces, anclas, `nav-guided` y formas ASCII reservadas. En el proyecto esa ruta todavia no existe.

Impacto:

- no hay una puerta automatica para detectar regresiones documentales
- la alineacion lograda hasta ahora puede degradarse con facilidad

### P3. `README.md` del proyecto comunica bien el producto, pero no esta alineado a la forma de adopcion del template

El `README.md` actual esta bien aterrizado al producto real, pero no replica la estructura ampliada del template (`Contenido`, `Que resuelve`, `Para quien sirve`, `Como empezar rapido`, `Ruta recomendada de adopcion`, version visible de release).

Impacto:

- la narrativa del proyecto es fuerte como producto, pero mas debil como repositorio estandarizado
- queda menos claro que partes son instancia real y cuales siguen la metodologia base

## Recomendacion de migracion

### Ola 1. Completar el bloque transversal y cerrar la navegacion

1. Incorporar desde el template:
   - `90.02-escenarios-de-referencia.md`
   - `90.03-checklist-seleccion-escenario.md`
   - `90.04-stacks-de-referencia.md`
   - `90.05-checklist-seleccion-stack.md`
   - `90.08-adr-ejemplo-por-stack.md`
   - `90.09-specs-ejemplo-por-stack.md`
   - `90.14-instanciacion-fases-proyectos-reales.md`
2. Resolver el choque de `90.06` sin perder funcionalidad:
   - mantener la idea de `equivalencias-estructura-real` porque este proyecto no usa `src/` como estructura ejecutable principal
   - agregar tambien la semantica del template sobre estructura por stack
   - recomendacion: integrar ambos enfoques en un `90.06` ampliado o mover la equivalencia actual a `90.15-equivalencias-estructura-real.md`
3. Actualizar `docs/transversal/README.md`.
4. Actualizar `docs/transversal/90.13-modos-de-trabajo.md` para que `Siguiente` apunte a `90.14`.

### Ola 2. Alinear documentos de gobierno

1. Expandir `docs/README.md` con:
   - `Rutas complementarias`
   - acceso a `AGENTS.md`
   - acceso a `ai/README.md`
   - acceso al caso canonico
   - acceso a `90.14-instanciacion-fases-proyectos-reales.md`
2. Llevar `AGENTS.md` al contrato del template:
   - revisar `plantillas/` antes de crear artefactos
   - usar `ejemplos/` solo como referencia
   - explicitar salidas por dominio y rutas canonicas
3. Llevar `CONTRIBUTING.md` al nivel del template:
   - contenido
   - breadcrumbs y `nav-guided`
   - reglas por fase y por `SDD`
   - codificacion y verificacion
4. Reforzar `README.md` sin perder identidad del proyecto:
   - mantener secciones especificas de `Integration Hub`
   - sumar secciones metodologicas del template
   - hacer visible la version documental alineada a release

### Ola 3. Automatizar la verificacion

1. Crear `ci/scripts/check-docs.py`.
2. Validar al menos:
   - archivos markdown sin `BOM`
   - enlaces relativos existentes
   - anclas internas validas
   - presencia y consistencia de `nav-guided`
   - formas ASCII reservadas del estandar
3. Documentar su uso en `CONTRIBUTING.md` y `ci/README.md`.

### Ola 4. Instanciar sin parecer plantilla

1. Revisar los documentos mas sensibles para quitar lenguaje residual de molde.
2. Aterrizar cada documento nuevo al contexto real de `Integration Hub`.
3. Confirmar que ningun archivo final use textos tipo:
   - `Describe`
   - `Completa`
   - `Usa esta seccion para`
4. Mantener la funcionalidad intacta:
   - no mover `platform-app/`
   - no mover `frontend/`
   - no convertir `src/` o `tests/` en estructuras ejecutables ficticias

## Plan recomendado

La siguiente iteracion deberia ejecutarse asi:

1. completar transversal y cerrar `nav-guided`
2. alinear `docs/README.md`, `AGENTS.md` y `CONTRIBUTING.md`
3. reforzar `README.md` y registrar release/changelog
4. crear `ci/scripts/check-docs.py`
5. correr una validacion final de enlaces, anclas y continuidad del recorrido documental

## Decision recomendada

Proceder con una migracion documental incremental, no destructiva, donde el template actualizado se usa como estandar de gobierno y navegacion, pero la estructura ejecutable real del proyecto se mantiene sin cambios.
