# Plan de alineacion profunda al template actualizado

## Objetivo

Llevar este repositorio al nivel del template actualizado `C:\template\project-template` en `modo estructurado`, reubicando lo que ya existe hacia rutas canonicas, completando la metodologia faltante y preservando la funcionalidad actual del sistema.

## Principio rector

La alineacion correcta no consiste en mover `platform-app/` y `frontend/` para que “parezcan” el template. La alineacion correcta consiste en:

- mantener el codigo ejecutable donde ya funciona,
- completar la capa documental y metodologica del template,
- documentar equivalencias donde la estructura real difiere,
- eliminar ambiguedad entre legacy y canonico.

## No-regresion obligatoria

1. No mover ni renombrar `platform-app/` ni `frontend/`.
2. No mover activos operativos reales:
   - `keycloak/`
   - `otel/`
   - scripts `.cmd`
   - `pom.xml`
   - `docker-compose.yml`
3. No borrar `docs/architecture/` ni `docs/examples/` hasta completar redireccion y verificacion de enlaces.
4. No mezclar limpieza documental con refactor funcional.
5. Toda mejora del estándar debe dejar una ruta oficial más clara que la anterior.

## Workstream 1. Normalizacion de `docs/` al nivel del template

### Objetivo

Hacer que la documentación realmente cumpla la norma que ya declara.

### Acciones

1. Añadir breadcrumbs completos a todos los documentos bajo `docs/`.
2. Añadir bloque `nav-guided` a:
   - `docs/README.md`
   - todos los `README.md` de fase
   - todos los documentos `00.xx` a `08.xx`
   - todos los `90.xx`
3. Cerrar el recorrido guiado de extremo a extremo.
4. Alinear `90.07-convenciones-y-naming.md` al nivel operativo del template actualizado.

### Resultado esperado

- lectura guiada consistente
- onboarding similar al template
- reglas y ejecución alineadas

## Workstream 2. Completar `plantillas/`

### Objetivo

Incorporar la capa reutilizable del método que hoy falta.

### Acciones

1. Crear `plantillas/README.md`.
2. Crear:
   - `plantillas/fase-0-iniciacion/`
   - `plantillas/fase-1-analisis-requerimientos/`
   - `plantillas/fase-3-arquitectura/`
   - `plantillas/fase-4-sdd/`
   - `plantillas/fase-6-qa/`
   - `plantillas/fase-7-deploy/`
   - `plantillas/fase-8-operacion/`
   - `plantillas/transversal/`
3. Copiar o adaptar del template solo aquello que tenga sentido en este proyecto.
4. Conectar `specs/`, `qa/`, `ops/` y `docs/` a esas plantillas.

### Resultado esperado

- baseline reusable por fase
- mejor consistencia para trabajo humano y con IA

## Workstream 3. Compatibilidad estructural con `src/` y `tests/`

### Objetivo

Acercar el repositorio al template sin reestructurar el código real.

### Acciones

1. Crear `src/README.md`.
2. Crear `tests/README.md`.
3. Documentar claramente:
   - `platform-app/src/` como backend real
   - `frontend/apps/` y `frontend/libs/` como frontend real
   - `platform-app/src/test/` y `frontend/apps/web-e2e/` como pruebas reales
4. Referenciar estos documentos desde `docs/README.md`, `AGENTS.md` y `CONTRIBUTING.md`.

### Resultado esperado

- mejor alineación de navegación con el template
- cero impacto funcional

## Workstream 4. Consolidacion de rutas canonicas y reducción de duplicidad

### Objetivo

Evitar dos fuentes de verdad para la misma cosa.

### Acciones

1. Para arquitectura:
   - definir `docs/fase-3-arquitectura/` como canonico
   - mantener `docs/architecture/` solo como compatibilidad temporal
2. Para ejemplos:
   - definir `ejemplos/` como canonico
   - dejar `docs/examples/` solo como puente temporal
3. Revisar los planes sueltos en `docs/` y moverlos a:
   - `revisiones/`
   - `docs/transversal/`
   - `releases/`
   segun corresponda

### Resultado esperado

- menos drift
- menos ambigüedad
- mantenimiento más simple

## Workstream 5. Elevar README y onboarding al estándar actualizado

### Objetivo

Subir el nivel de entrada del repositorio para que se parezca al template actualizado.

### Acciones

1. Mejorar `README.md` con:
   - navegación guiada
   - lectura rápida inicial
   - estructura principal
   - resultado esperado
2. Añadir `00.06-ruta-guiada-caso-canonico.md` adaptado al proyecto real, no copiado del template canonico.
3. Ajustar `docs/README.md` con rutas por rol más completas:
   - `Tech Lead`
   - `Desarrollador`
   - `DevOps y operaciones`

### Resultado esperado

- onboarding más fuerte
- mayor semejanza con el estándar

## Workstream 6. Limpieza controlada del repositorio

### Objetivo

Reducir ruido sin tocar la ejecución.

### Acciones

1. Clasificar `frontend-nx-temp/`:
   - si ya no es activo, documentar y mover a revisión o remover en una ola posterior controlada
2. sacar logs de la conversación documental:
   - documentar que no forman parte del estándar
   - considerar limpieza posterior validada
3. evitar que archivos temporales de revisión vivan indefinidamente en `docs/`

### Resultado esperado

- repositorio más limpio
- menor confusión entre artefacto oficial y temporal

## Orden recomendado de ejecución

1. Normalizar `docs/` con breadcrumbs y `nav-guided`.
2. Crear `plantillas/`.
3. Crear `src/README.md` y `tests/README.md`.
4. Fortalecer `README.md` y fase `0`.
5. Consolidar rutas canonicas y mover artefactos de planeación/revisión a lugares correctos.
6. Planificar limpieza controlada de legacy y ruido.

## Entregables concretos de la siguiente ola

- `plantillas/README.md`
- `plantillas/fase-0-iniciacion/*`
- `plantillas/fase-4-sdd/*`
- `plantillas/fase-6-qa/*`
- `plantillas/fase-7-deploy/*`
- `plantillas/fase-8-operacion/*`
- `src/README.md`
- `tests/README.md`
- mejora integral de `README.md`
- mejora integral de `docs/README.md`
- `docs/fase-0-iniciacion/00.06-ruta-guiada-caso-canonico.md`
- normalización de `nav-guided` en `docs/`

## Criterio de terminado

La alineacion se considerará realmente profunda cuando:

- `docs/` cumpla el estándar editorial del template,
- `plantillas/` exista y se use,
- `src/` y `tests/` tengan puertas de entrada compatibles,
- exista una única ruta canónica por artefacto,
- el repositorio siga funcionando sin cambios de comportamiento.
