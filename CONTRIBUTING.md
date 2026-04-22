# CONTRIBUTING

[README principal](README.md) | [Indice docs](docs/README.md)

Esta guia reune las reglas practicas para editar este repositorio sin romper su consistencia, navegabilidad, trazabilidad ni funcionalidad.

## Contenido

- [Principios](#principios)
- [Antes de editar](#antes-de-editar)
- [Convenciones de escritura](#convenciones-de-escritura)
- [Breadcrumbs y nav-guided](#breadcrumbs-y-nav-guided)
- [Enlaces y rutas canonicas](#enlaces-y-rutas-canonicas)
- [Regla sobre estructura real](#regla-sobre-estructura-real)
- [Agregar o actualizar una fase](#agregar-o-actualizar-una-fase)
- [Agregar o actualizar una feature (SDD)](#agregar-o-actualizar-una-feature-sdd)
- [Agregar una release](#agregar-una-release)
- [Codificacion y formato de archivos](#codificacion-y-formato-de-archivos)
- [Verificacion antes de integrar](#verificacion-antes-de-integrar)
- [IA aplicada al repositorio](#ia-aplicada-al-repositorio)

<a id="principios"></a>
## Principios

- La documentacion y el codigo deben mantenerse alineados.
- No crear rutas paralelas para artefactos que ya tienen ubicacion oficial.
- No mover codigo ejecutable solo para parecerse al template.
- Toda salida de IA debe terminar en una ruta canonica.
- Si un entregable final sigue sonando a plantilla, todavia no esta terminado.

<a id="antes-de-editar"></a>
## Antes de editar

1. Leer `AGENTS.md` y el bloque `Primera lectura en 10 minutos` de `README.md`.
2. Revisar `docs/README.md`.
3. Revisar `docs/transversal/90.07-convenciones-y-naming.md`.
4. Revisar `docs/transversal/90.14-instanciacion-fases-proyectos-reales.md`.
5. Si el cambio afecta arquitectura, preparar o actualizar un `ADR`.

<a id="convenciones-de-escritura"></a>
## Convenciones de escritura

- Estilo directo, sin marketing y sin frases instructivas residuales en entregables finales.
- Usar la forma ASCII en titulos, encabezados, breadcrumbs y etiquetas `nav-guided`.
- Mantener consistente la nomenclatura `Spec-Driven Development (SDD)` en su primera aparicion.
- Nombrar features como `NNN-nombre-feature`.

<a id="breadcrumbs-y-nav-guided"></a>
## Breadcrumbs y nav-guided

- Todo documento bajo `docs/` debe tener:
  - `# Titulo` en la primera linea.
  - breadcrumb con enlaces a `README principal` e `Indice docs`.
  - bloque `<!-- nav-guided:start -->` y `<!-- nav-guided:end -->`.
- Dentro de `nav-guided`, `Anterior` y `Siguiente` deben ser enlaces markdown navegables.
- Los `README.md` raiz fuera de `docs/` deben tener breadcrumbs hacia `README principal` e `Indice docs`.
- Si agregas un documento nuevo dentro de una fase o en transversal, debes reencadenar el recorrido guiado completo.

<a id="enlaces-y-rutas-canonicas"></a>
## Enlaces y rutas canonicas

- direccion y fases: `docs/`
- features: `specs/`
- equivalencia de codigo: `src/`
- equivalencia de pruebas: `tests/`
- QA: `qa/`
- deploy y operacion: `ops/`
- pipeline: `ci/`
- snapshots: `releases/`
- IA: `ai/`
- usar enlaces relativos, no rutas absolutas del repositorio

<a id="regla-sobre-estructura-real"></a>
## Regla sobre estructura real

- backend real: `platform-app/`
- frontend real: `frontend/`
- la equivalencia con `src/` y `tests/` del template esta documentada en `docs/transversal/90.06-equivalencias-estructura-real.md`
- la alineacion al template en este proyecto es semantica y documental, no una migracion fisica del codigo ejecutable

<a id="agregar-o-actualizar-una-fase"></a>
## Agregar o actualizar una fase

1. Crear o ajustar el `README.md` de la fase con breadcrumb, `nav-guided` y objetivo.
2. Agregar los documentos `NN.00`, `NN.01`, etc. encadenados por `nav-guided`.
3. Actualizar `docs/README.md` si cambian puntos de entrada por rol.
4. Si la fase introduce un entregable nuevo, registrarlo en `docs/transversal/90.10-entregables-minimos-por-fase.md` y `90.11-checklist-entregables.md`.

<a id="agregar-o-actualizar-una-feature-sdd"></a>
## Agregar o actualizar una feature (SDD)

1. Crear o actualizar la carpeta `specs/NNN-nombre-feature/`.
2. Agregar `spec-funcional.md`, `spec-tecnica.md` y `spec-tareas.md` usando `plantillas/fase-4-sdd/`.
3. Reflejar el impacto en codigo real (`platform-app/`, `frontend/`) y en las puertas de entrada documentales (`src/`, `tests/`) cuando corresponda.
4. Agregar pruebas minimas y trazabilidad a `qa/` si la feature llega a validacion.

<a id="agregar-una-release"></a>
## Agregar una release

1. Crear `releases/vX.Y.Z-*.md` con resumen, cambios principales, snapshot y artefactos clave.
2. Agregar la entrada a `releases/README.md`.
3. Actualizar `CHANGELOG.md`.
4. Hacer visible la version documental activa en `README.md` si el cambio lo amerita.

<a id="codificacion-y-formato-de-archivos"></a>
## Codificacion y formato de archivos

- Todos los archivos markdown deben guardarse como `UTF-8 sin BOM`.
- No se admite `BOM` al inicio.
- Preferir finales de linea `LF`.
- Evitar lineas en blanco multiples consecutivas.
- Evitar espacios al final de linea.

<a id="verificacion-antes-de-integrar"></a>
## Verificacion antes de integrar

- Revisar que los enlaces markdown nuevos o modificados resuelvan a archivos existentes.
- Revisar que las anclas internas coincidan con los `<a id="..."></a>` o con encabezados reales.
- Ejecutar el script de verificacion si esta disponible: `python ci/scripts/check-docs.py`.
- Confirmar que `nav-guided` sigue cerrando el ciclo desde `README.md` hacia `docs/` y de vuelta al indice.
- Si el cambio toca IA, revisar `docs/transversal/90.00-estandar-ia.md`.

<a id="ia-aplicada-al-repositorio"></a>
## IA aplicada al repositorio

- Cualquier salida producida con agentes, prompts o skills debe terminar en una ruta canonica del repositorio.
- Una salida de IA no reemplaza un documento oficial; lo ayuda a producirse o actualizarse.
- Si la IA introduce un cambio arquitectonico, reflejar la decision en `docs/fase-3-arquitectura/adr/` antes de cerrar el cambio.
