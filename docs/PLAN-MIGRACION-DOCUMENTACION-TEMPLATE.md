# Plan de migracion documental al template estructurado

## Objetivo

Adoptar la estructura de `C:\template\project-template` en este repositorio para ordenar la documentacion en `modo estructurado`, reubicar lo que ya existe hacia carpetas canonicas y preservar por completo la funcionalidad actual del proyecto.

## Base de referencia

- Template base: `C:\template\project-template`
- Documento rector de trabajo: `docs/transversal/90.13-modos-de-trabajo.md` del template
- Principio aplicado: usar `modo estructurado` porque ya existe una base funcional, backlog tecnico, arquitectura inicial y artefactos operativos reales

## Estado actual resumido

El proyecto ya tiene material valioso, pero esta concentrado sobre todo en:

- `README.md` con vision funcional, stack, seguridad, observabilidad y ejemplos
- `docs/architecture/` con ADR, casos de uso, NFR, riesgos, trazabilidad, despliegue, runbook, roadmap y LikeC4
- `docs/examples/` con ejemplos de configuracion
- `keycloak/` con realm importable
- `otel/` con configuracion del collector
- `platform-app/` como modulo Quarkus ejecutable
- `frontend/` como workspace Nx/Angular

El problema no es falta de informacion, sino falta de distribucion por fases, dominios y rutas canonicas del template.

## Principios de no regresion

Estas reglas son obligatorias durante toda la migracion:

1. No mover ni renombrar codigo fuente ejecutable en `platform-app/` ni `frontend/` como parte de la migracion documental.
2. No mover artefactos operativos consumidos por runtime o despliegue, por ejemplo `keycloak/integration-hub-realm.json`, `otel/otel-collector-config.yaml`, scripts `.cmd`, `docker-compose.yml` y `pom.xml`.
3. No borrar rutas actuales hasta que existan sus equivalentes nuevos, se actualicen enlaces y se verifique que nada dependa de la ubicacion anterior.
4. Hacer primero migracion logica de documentacion y referencias; los movimientos fisicos delicados se dejan para una segunda pasada controlada.
5. Excluir de la reorganizacion artefactos generados como `target/`, `dist/`, `node_modules/`, caches y logs salvo que se documenten o limpien explicitamente.

## Estructura objetivo minima a adoptar

La adopcion no necesita copiar todo el template de golpe. La estructura minima recomendada para este proyecto es:

- `docs/README.md`
- `docs/fase-0-iniciacion/`
- `docs/fase-1-analisis-requerimientos/`
- `docs/fase-2-ux-ui/`
- `docs/fase-3-arquitectura/`
- `docs/fase-4-sdd/`
- `docs/fase-5-construccion/`
- `docs/fase-6-qa/`
- `docs/fase-7-deploy/`
- `docs/fase-8-operacion/`
- `docs/transversal/`
- `specs/`
- `qa/`
- `ops/`
- `ci/`
- `releases/`
- `likec4/`
- `ejemplos/`

## Mapeo de contenido actual hacia la estructura objetivo

### Documentacion raiz

- `README.md`
  - mantener como entrada principal del repositorio
  - dividir su contenido para poblar documentos formales por fase
  - dejar en el README una vista ejecutiva y enlaces a la nueva documentacion

### Arquitectura actual

- `docs/architecture/ADR-001-platform-architecture.md`
  - destino: `docs/fase-3-arquitectura/adr/ADR-001-platform-architecture.md`

- `docs/architecture/USE-CASES.md`
  - destino principal: `docs/fase-1-analisis-requerimientos/01.00-analisis-requerimientos.md`
  - destino secundario: insumo para `specs/` por feature

- `docs/architecture/NFRs.md`
  - destino: `docs/fase-3-arquitectura/03.00-arquitectura.md`

- `docs/architecture/RISKS.md`
  - destino: `docs/fase-0-iniciacion/00.01-vision-proyecto.md` para riesgos de contexto
  - destino complementario: `docs/fase-3-arquitectura/03.04-checklist-arquitectura.md`

- `docs/architecture/TRACEABILITY.md`
  - destino: `docs/fase-4-sdd/04.00-spec-driven-development.md`

- `docs/architecture/ROADMAP.md`
  - destino: `docs/fase-0-iniciacion/00.02-roadmap.md`

- `docs/architecture/DEPLOYMENT-ONPREM.md`
  - destino principal: `docs/fase-3-arquitectura/03.03-plan-despliegue.md`
  - respaldo operativo: `ops/deploy-onprem.md`

- `docs/architecture/RUNBOOK-OPERATIONS.md`
  - destino principal: `docs/fase-8-operacion/08.00-operacion-continua.md`
  - respaldo operativo: `ops/runbook-operaciones.md`

- `docs/architecture/CAPACITY-SIZING.md`
  - destino: `docs/fase-8-operacion/08.00-operacion-continua.md`
  - respaldo operativo: `ops/capacity-sizing.md`

- `docs/architecture/FRONTEND-NX-ANGULAR.md`
  - destino principal: `docs/fase-5-construccion/05.00-plantilla-proyecto-base.md`
  - relacion cruzada: `docs/fase-2-ux-ui/02.00-ux-ui.md`

- `docs/architecture/CONNECTIONREF-FILE-VAULT.md`
  - destino: `docs/fase-5-construccion/05.00-plantilla-proyecto-base.md`
  - evidencia tecnica complementaria: `ops/seguridad-secretos.md`

- `docs/architecture/FILE-VAULT-LOCAL.md`
  - destino: `ops/seguridad-secretos.md`

- `docs/architecture/HANDOFF-CONTEXT.md`
  - destino: `docs/transversal/90.01-gobernanza.md`

- `docs/architecture/OPERATIONS-BACKLOG.md`
  - destino: `ops/operaciones-backlog.md`

### LikeC4 y diagramas

- `docs/architecture/integration-hub.likec4`
  - destino: `likec4/integration-hub.likec4`

- `docs/architecture/likec4.config.mjs`
  - destino: `likec4/likec4.config.mjs`

- `docs/architecture/dist/`
  - no mover en la primera iteracion si hay enlaces o usos actuales
  - objetivo posterior: publicar desde `likec4/dist/` o documentar su generacion

- `docs/architecture/likec4-start.log`
- `docs/architecture/likec4-start.err.log`
  - no forman parte de la documentacion formal
  - deben salir del arbol documental en una fase de limpieza

### Ejemplos

- `docs/examples/*.json`
  - destino: `ejemplos/`
  - referenciados desde `docs/fase-5-construccion/05.00-plantilla-proyecto-base.md`

### Activos operativos

- `keycloak/integration-hub-realm.json`
  - se mantiene en su ruta actual por compatibilidad
  - se documenta en `ops/identidad-keycloak.md` y en fase de deploy

- `otel/otel-collector-config.yaml`
  - se mantiene en su ruta actual por compatibilidad
  - se documenta en `ops/observabilidad.md`

- scripts `.cmd` de arranque, test y secretos
  - se mantienen en la raiz mientras sigan siendo el mecanismo operativo real
  - se documentan en `ops/README.md` y `ci/README.md` segun corresponda

### Frontend y backend

- `platform-app/`
  - no se mueve
  - se documenta en `docs/fase-5-construccion/05.00-plantilla-proyecto-base.md`

- `frontend/`
  - no se mueve
  - el `frontend/README.md` actual es boilerplate y debe reemplazarse por un README contextual del proyecto

## Plan de ejecucion por etapas

### Etapa 1. Crear el esqueleto documental canonico

Objetivo:
- crear carpetas y `README.md` base segun el template
- mantener el contenido actual intacto

Entregables:
- `docs/README.md`
- carpetas `docs/fase-*`, `docs/transversal`, `specs`, `qa`, `ops`, `ci`, `releases`, `likec4`, `ejemplos`

### Etapa 2. Repartir la documentacion existente por fase

Objetivo:
- transformar el conocimiento ya escrito en documentos formales del template

Acciones:
- extraer desde `README.md` la vision, alcance, modulos, estado actual y setup base
- convertir `USE-CASES`, `ROADMAP`, `NFRs`, `DEPLOYMENT`, `RUNBOOK` y `TRACEABILITY` en documentos por fase
- conservar referencias cruzadas al origen hasta cerrar la migracion

### Etapa 3. Separar lo documental de lo operativo

Objetivo:
- distinguir claramente documentacion, ejemplos, configuraciones operativas y artefactos generados

Acciones:
- mover ejemplos de `docs/examples` a `ejemplos/`
- crear `ops/` para runbooks, seguridad, observabilidad y despliegue
- dejar `keycloak/`, `otel/` y scripts reales en su ubicacion actual si son consumidos por el flujo

### Etapa 4. Formalizar SDD y trazabilidad por feature

Objetivo:
- llevar la parte funcional a una estructura escalable por feature

Acciones:
- crear `docs/fase-4-sdd/04.00-spec-driven-development.md`
- crear `specs/README.md`
- priorizar primeras features canonicas, por ejemplo:
  - catalogo de fuentes
  - catalogo de readers
  - definicion de procesos
  - ejecucion y auditoria
  - overview operativo

### Etapa 5. Formalizar QA, deploy y operacion

Objetivo:
- completar las fases que hoy estan dispersas entre README, arquitectura y scripts

Acciones:
- crear plan base en `docs/fase-6-qa/`
- crear checklist de salida en `docs/fase-7-deploy/`
- consolidar operacion continua en `docs/fase-8-operacion/` y `ops/`

### Etapa 6. Limpieza final y compatibilidad

Objetivo:
- reducir duplicidad sin romper referencias existentes

Acciones:
- reemplazar o simplificar `docs/architecture/README-ARCHITECTURE.md` para que apunte a la nueva estructura
- decidir si `docs/architecture/` queda como capa de compatibilidad temporal o se descontinua
- remover logs y artefactos generados del arbol documental

## Orden recomendado de implementacion real

1. Crear estructura y archivos indice.
2. Migrar contenido del `README.md` y de `docs/architecture/` a documentos canonicos.
3. Crear `ops/`, `qa/`, `ci/`, `releases/`, `specs/`, `likec4/` y `ejemplos/`.
4. Actualizar enlaces internos.
5. Reemplazar READMEs boilerplate, especialmente en `frontend/`.
6. Ejecutar validaciones funcionales antes de eliminar rutas viejas.

## Validaciones obligatorias despues de cada ola

- El proyecto backend debe seguir compilando con su flujo actual.
- El frontend debe seguir construyendo con su flujo actual.
- Los scripts `.cmd` deben seguir apuntando a rutas reales.
- Los enlaces a Keycloak, OTel y LikeC4 no deben quedar rotos.
- Los documentos nuevos deben apuntar a rutas existentes y no a deseos futuros.
- Ningun cambio documental debe alterar nombres de modulos, propiedades o rutas consumidas por build/deploy.

## Riesgos a vigilar

- romper enlaces por mover `LikeC4` o su `dist` demasiado pronto
- mezclar documentacion formal con artefactos generados
- dejar duplicado el contenido sin marcar una ruta canonica
- mover archivos operativos reales a `ops/` cuando aun son referenciados desde scripts o procesos manuales
- mantener el `frontend/README.md` como boilerplate y perder coherencia con la arquitectura real

## Criterio de termino del plan

La migracion documental se considera bien hecha cuando:

- el repositorio tiene un indice `docs/README.md` alineado al template,
- existe una ruta por fases `0-8`,
- la arquitectura vive en `fase-3` y `likec4/`,
- la operacion vive en `fase-8` y `ops/`,
- las features pueden evolucionar hacia `specs/`,
- los activos operativos siguen funcionando sin cambios de comportamiento,
- las rutas antiguas solo se eliminan despues de verificar compatibilidad.

## Siguiente paso recomendado

Ejecutar una primera ola no destructiva:

1. crear la estructura canonica,
2. generar los archivos indice por fase,
3. migrar contenido desde `README.md` y `docs/architecture/` por copia controlada,
4. dejar la eliminacion o movimiento fisico fino para una segunda ola con validacion.
