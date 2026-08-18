# CONTRIBUTING

[README principal](README.md) | [Indice docs](docs/README.md)

Esta guia reune las reglas practicas para editar este repositorio sin romper su consistencia, navegabilidad, trazabilidad ni funcionalidad.

## Contenido

- [Principios](#principios)
- [Modelo de ramas](#modelo-de-ramas)
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
- No mover codigo ejecutable solo para armonizar la forma documental.
- Toda salida de IA debe terminar en una ruta canonica.
- Si un entregable final sigue sonando a instructivo o borrador, todavia no esta terminado.

<a id="modelo-de-ramas"></a>
## Modelo de ramas

| Rama | Que es | Quien escribe en ella |
|---|---|---|
| `main` | Lo desplegable. Cada commit debe poder salir a produccion | Solo merges desde `develop` o `hotfix/*` |
| `develop` | Integracion del equipo | Solo merges desde ramas de trabajo |
| `<tipo>/<asunto>` | Trabajo individual | Quien la abre |
| `hotfix/<asunto>` | Arreglo urgente sobre lo desplegado. Sale de `main` y vuelve a `main` **y** a `develop` | Quien la abre |

Los prefijos son los mismos tipos que ya usan los mensajes de commit, para que la rama y su historia
digan lo mismo: `feat/`, `fix/`, `refactor/`, `docs/`, `chore/`, `test/`, `perf/`.

Un prefijo por tipo, y no por herramienta ni por autor: quien escribio el codigo —persona o asistente—
no es una categoria de rama. Antes convivian `feat/` con `feature/`, `frontend/` y `codex/`, y eso hace
imposible saber de un vistazo si una rama arregla algo o anade algo.

### Que dispara cada cosa

```
pull request a develop   ->  CI (gobernanza, backend, frontend, compatibilidad de BD)
merge a develop          ->  + despliegue al entorno de integracion
pull request a main      ->  CI completo
tag v* sobre main        ->  build y despliegue a la nube
```

### La regla que no es opcional

**Las ramas nombradas en los disparadores de `.github/workflows/` tienen que existir.** Este
repositorio ya pago esa leccion: los workflows apuntaban a `main` y `develop` cuando esas ramas no
existian, asi que no se ejecutaron NUNCA y 23 dias de cambios estructurales pasaron sin una sola
alarma. El fallo es silencioso —no hay error, solo ausencia de ejecuciones, que se parece mucho a que
todo va bien—. Al renombrar o crear ramas, comprobar `git branch -r` ANTES de tocar los disparadores.

### Ramas fusionadas

Se borran al integrar. Una rama vieja que nadie recuerda es de donde sale, meses despues, un merge
que revive codigo ya retirado.

### Instalar los hooks — hace falta en cada clon

```bash
npm run hooks:install
```

Los hooks viven en `.git/hooks/`, que **no viaja con el clon**. Por eso el fichero esta versionado en
[`.githooks/`](.githooks/) y ese comando lo copia. Al clonar el repositorio en una maquina nueva, o al
cambiar de equipo, hay que volver a ejecutarlo.

`pre-push` rechaza empujar directo a `main` o `develop` y explica como seguir. Si en algun momento
hace falta saltarselo:

```bash
PERMITIR_EMPUJE_DIRECTO=1 git push origin main
```

Esa salida existe a proposito: un hook que no se puede saltar se acaba desinstalando entero, y eso
deja la maquina sin ninguna proteccion en vez de sin una. Usarla queda registrado igual — el job
`guard-pull-request` de CI ve el commit sin pull request asociado y lo deja en rojo.

**Por que hay un hook Y un job.** GitHub **no aplica** rulesets ni protecciones clasicas en
repositorios privados de este plan: se comprobo empujando a `main` a proposito, y tanto el push
directo como el force push pasaron. El hook previene, pero solo donde esta instalado; el job no
previene, pero delata lo que llegue desde una maquina sin hook. Ninguno de los dos basta solo, y los
dos sobran el dia que las protecciones se apliquen de verdad.

<a id="antes-de-editar"></a>
## Antes de editar

1. Leer `AGENTS.md` y el bloque `Primera lectura en 10 minutos` de `README.md`.
2. Revisar `docs/README.md`.
3. Revisar `docs/transversal/90.07-convenciones-y-naming.md`.
4. Revisar `docs/transversal/90.14-criterios-consolidacion-documental.md`.
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
- la estructura real del repositorio y sus puntos de entrada documentales estan descritos en `docs/transversal/90.06-estructura-repositorio-real.md`
- la documentacion debe describir la estructura real del proyecto, no forzar una migracion fisica del codigo ejecutable

<a id="agregar-o-actualizar-una-fase"></a>
## Agregar o actualizar una fase

1. Crear o ajustar el `README.md` de la fase con breadcrumb, `nav-guided` y objetivo.
2. Agregar los documentos `NN.00`, `NN.01`, etc. encadenados por `nav-guided`.
3. Actualizar `docs/README.md` si cambian puntos de entrada por rol.
4. Si la fase introduce un entregable nuevo, registrarlo en `docs/transversal/90.10-entregables-minimos-por-fase.md` y `90.11-checklist-entregables.md`.

<a id="agregar-o-actualizar-una-feature-sdd"></a>
## Agregar o actualizar una feature (SDD)

1. Crear o actualizar la carpeta `specs/NNN-nombre-feature/`.
2. Agregar `spec-funcional.md`, `spec-tecnica.md` y `spec-tareas.md` en la carpeta oficial de la feature.
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
- Confirmar que `nav-guided` sigue cerrando el ciclo desde `README.md` hacia `docs/` y de vuelta al indice.
- Si el cambio toca IA, revisar `docs/transversal/90.00-estandar-ia.md`.

<a id="ia-aplicada-al-repositorio"></a>
## IA aplicada al repositorio

- Cualquier salida producida con IA debe terminar en una ruta canonica del repositorio.
- Una salida de IA no reemplaza un documento oficial; lo ayuda a producirse o actualizarse.
- Si la IA introduce un cambio arquitectonico, reflejar la decision en `docs/fase-3-arquitectura/adr/` antes de cerrar el cambio.
