# Plan de alineacion al template con enfoque estructurado e IA

## Objetivo

Completar la alineacion de este repositorio con el estandar de `C:\template\project-template`, usando `modo estructurado`, reubicando o formalizando lo que ya existe en las carpetas correctas, incorporando la capa `AI-first` del template y preservando la funcionalidad actual del proyecto.

## Base de referencia

- Template base: `C:\template\project-template`
- Documento rector actual del proyecto: `docs/transversal/90.13-modos-de-trabajo.md`
- Estandar IA del template: `docs/transversal/90.00-estandar-ia.md`
- Mapa IA por fase del template: `docs/transversal/90.12-mapa-ia-por-fase.md`

## Estado actual del proyecto

El proyecto ya esta parcialmente alineado al template:

- existe `docs/` organizado por fases `0-8`
- existen `specs/`, `qa/`, `ops/`, `ci/`, `releases/`, `likec4/` y `ejemplos/`
- se mantiene una capa de compatibilidad en `docs/architecture/`
- `README.md` y `frontend/README.md` ya apuntan a la nueva estructura

## Brechas principales frente al template

### Brechas documentales

Faltan o estan incompletas varias piezas del estandar del template:

- `docs/transversal/90.00-estandar-ia.md`
- `docs/transversal/90.12-mapa-ia-por-fase.md`
- artefactos `ai/`
- carpetas de referencia como `diagramas/`, `estimacion/`, `escenarios/`, `stacks/`, `revisiones/`
- carpetas estandar de onboarding o gobierno como `AGENTS.md`, `CHANGELOG.md`, `CONTRIBUTING.md`

### Brechas de estructura estandar

El template asume un repositorio con:

- `src/`
- `tests/`
- `diagramas/`
- `estimacion/`
- `escenarios/`
- `stacks/`
- `revisiones/`
- `ai/`

En este proyecto no conviene mover codigo real a una estructura ficticia solo para parecerse al template. La alineacion debe ser semantica y documental, no destructiva.

### Brechas AI-first

El proyecto actual no tiene aun una capa `AI-first` propia del repositorio:

- no existe `ai/README.md`
- no existen `ai/agents/`
- no existen `ai/prompts/`
- no existen `ai/skills/`
- no existe una matriz explicita de como la IA participa por fase

## Principios de no regresion

1. No mover ni renombrar codigo ejecutable de `platform-app/` ni `frontend/` por motivos cosmeticos de template.
2. No mover activos operativos reales consumidos por runtime o scripts:
   - `keycloak/`
   - `otel/`
   - scripts `.cmd`
   - `pom.xml`
   - `docker-compose.yml`
3. No eliminar la capa `docs/architecture/` hasta verificar que no existan enlaces internos o flujos que aun dependan de ella.
4. La alineacion al template debe hacerse por capas:
   - primero estructura y gobernanza
   - luego IA y trazabilidad
   - luego limpieza y estandarizacion final
5. Toda salida de IA debe terminar en un artefacto canonico del repositorio y no en texto suelto.

## Criterio de alineacion correcto

La meta no es copiar literalmente cada carpeta del template. La meta correcta es:

- conservar la estructura ejecutable real del proyecto,
- completar las carpetas documentales y de gobierno que faltan,
- explicitar equivalencias donde la estructura del proyecto difiere del template,
- incorporar la gobernanza de IA del template,
- mantener trazabilidad entre `docs/`, `specs/`, `qa/`, `ops/`, `ci/` y el codigo real.

## Equivalencias recomendadas con el template

### Codigo

- `src/` del template equivale funcionalmente a:
  - `platform-app/src/`
  - `frontend/apps/`
  - `frontend/libs/`

- `tests/` del template equivale funcionalmente a:
  - `platform-app/src/test/`
  - `frontend/apps/web-e2e/`
  - pruebas frontend definidas en workspace `Nx`

Estas equivalencias deben documentarse, no imponerse con una reestructuracion riesgosa.

### Arquitectura y diagramas

- fuente editable: `likec4/`
- salida compatible actual: `docs/architecture/dist/`
- carpeta faltante a estandarizar: `diagramas/`

### AI-first

El template espera:

- `ai/agents/`
- `ai/prompts/`
- `ai/skills/`
- `ai/ejemplos/`

En este proyecto esa capa debe servir para:

- generar `specs/`
- sostener arquitectura y ADR
- acelerar frontend y backend sin perder trazabilidad
- producir casos QA y checklists operativos

## Plan de trabajo recomendado

### Etapa 1. Cerrar la brecha documental transversal

Objetivo:
- completar el estandar transversal que todavia falta

Entregables:
- `docs/transversal/90.00-estandar-ia.md`
- `docs/transversal/90.12-mapa-ia-por-fase.md`
- enriquecimiento del `README` transversal para incluir IA

Regla:
- estos documentos deben aterrizarse al proyecto real, no copiar el caso canonico del template tal cual

### Etapa 2. Crear la capa AI-first del repositorio

Objetivo:
- incorporar la estructura `ai/` del template

Entregables minimos:
- `ai/README.md`
- `ai/agents/README.md`
- `ai/prompts/README.md`
- `ai/skills/README.md`
- `ai/ejemplos/README.md`

Agentes recomendados para este proyecto:
- `planner-agent.md`
- `architect-agent.md`
- `backend-agent.md`
- `frontend-agent.md`
- `qa-agent.md`
- `devops-agent.md`

Prompts recomendados:
- estimar proyecto
- generar arquitectura
- generar C4
- generar spec funcional
- generar spec tecnica
- generar backend
- generar frontend
- generar tests

Skills recomendadas:
- `spec-writer`
- `architecture`
- `c4`
- `backend`
- `frontend`
- `qa`
- `devops`
- `estimacion`

### Etapa 3. Conectar IA con las rutas canonicas del proyecto

Objetivo:
- evitar que la IA produzca salidas huerfanas

Acciones:
- documentar que cada prompt, agente o skill debe terminar en:
  - `docs/` para direccion y fases
  - `specs/` para features
  - `qa/` para validacion
  - `ops/` para deploy y operacion
  - `ci/` para pipeline
  - `releases/` para snapshots
- registrar entradas minimas por salida:
  - vision
  - requerimientos
  - roles
  - arquitectura
  - ADR
  - spec previa si existe

### Etapa 4. Completar carpetas faltantes del estandar del template

Objetivo:
- reducir la distancia estructural con el template sin tocar la funcionalidad

Carpetas recomendadas a crear:
- `diagramas/`
- `estimacion/`
- `escenarios/`
- `stacks/`
- `revisiones/`

Uso recomendado:
- `diagramas/`: exportaciones estaticas desde `likec4/`
- `estimacion/`: matrices o versiones mas detalladas de estimacion
- `escenarios/`: variantes de despliegue, volumen o integracion
- `stacks/`: decisiones y convenciones tecnologicas por stack
- `revisiones/`: hallazgos de revision tecnica o documental por iteracion

### Etapa 5. Formalizar equivalencias estructurales con el template

Objetivo:
- explicar claramente donde vive cada cosa cuando no coincide 1:1 con el template

Entregables:
- documento transversal o de construccion que diga:
  - donde vive el backend
  - donde vive el frontend
  - donde viven las pruebas
  - como se mapea eso con `src/` y `tests/` del template

Resultado:
- el proyecto queda estandarizado sin reestructurar de forma riesgosa el codigo real

### Etapa 6. Completar gobierno de repositorio

Objetivo:
- acercar el repositorio al estandar de template a nivel onboarding y mantenimiento

Entregables recomendados:
- `AGENTS.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`

Regla:
- estos documentos deben alinearse a la realidad operativa del proyecto y a su flujo con IA

### Etapa 7. Limpieza y consolidacion

Objetivo:
- dejar una sola ruta canonica por artefacto

Acciones:
- revisar duplicidad entre `docs/architecture/` y `docs/fase-3-arquitectura/`
- decidir si `docs/examples/` queda solo como compatibilidad temporal
- limpiar logs y artefactos generados del arbol documental cuando ya no se necesiten

## Entregables priorizados

### Prioridad alta

- `docs/transversal/90.00-estandar-ia.md`
- `docs/transversal/90.12-mapa-ia-por-fase.md`
- `ai/`
- `diagramas/`
- `AGENTS.md`

### Prioridad media

- `estimacion/`
- `escenarios/`
- `stacks/`
- `revisiones/`
- `CONTRIBUTING.md`
- `CHANGELOG.md`

### Prioridad baja

- reduccion de compatibilidad legacy en `docs/architecture/`
- limpieza de logs antiguos del arbol documental

## Consideraciones especificas sobre IA

La capa IA debe respetar estas reglas:

1. No inventar decisiones de arquitectura sin ADR o justificacion.
2. No producir salidas fuera de rutas canonicas.
3. Si trabaja en `modo exploratorio`, cerrar con recomendacion y siguiente paso hacia artefactos formales.
4. Si trabaja en `modo estructurado`, actualizar directamente documentos oficiales.
5. Toda salida de IA debe declarar:
   - entradas usadas
   - fase afectada
   - ruta destino
   - si implica cambio de arquitectura, QA o deploy

## Validaciones obligatorias

- la estructura nueva no debe romper scripts, build ni runtime
- las nuevas carpetas no deben forzar mover codigo ejecutable
- los enlaces principales del `README.md` y `docs/README.md` deben seguir funcionando
- `specs/`, `qa/`, `ops/` y `ci/` deben mantenerse como rutas oficiales
- `ai/` debe quedar conectado con las fases y no como carpeta ornamental

## Secuencia recomendada de ejecucion

1. Completar documentos transversales de IA.
2. Crear `ai/` con sus `README` y artefactos base.
3. Crear carpetas faltantes `diagramas/`, `estimacion/`, `escenarios/`, `stacks/`, `revisiones/`.
4. Crear equivalencias formales entre `src/tests` del template y la estructura real del proyecto.
5. Agregar `AGENTS.md`, `CONTRIBUTING.md` y `CHANGELOG.md`.
6. Revisar duplicidad legacy y plan de limpieza.

## Criterio de termino

La alineacion se considera completa cuando:

- el repositorio cubre la estructura documental principal del template,
- la capa `AI-first` existe y esta integrada al flujo real,
- las rutas canonicas estan claras,
- la estructura real del codigo queda explicada sin reestructuracion riesgosa,
- la documentacion y la IA operan en `modo estructurado`,
- no se pierde funcionalidad ni compatibilidad operativa.

## Siguiente paso recomendado

Ejecutar una segunda ola de estandarizacion enfocada en IA y gobierno del repositorio:

1. crear `docs/transversal/90.00-estandar-ia.md`,
2. crear `docs/transversal/90.12-mapa-ia-por-fase.md`,
3. crear la carpeta `ai/` con `agents`, `prompts`, `skills` y `ejemplos`,
4. crear `diagramas/`, `estimacion/`, `escenarios/`, `stacks/` y `revisiones/`,
5. dejar documentada la equivalencia entre el template y la estructura ejecutable real del proyecto.
