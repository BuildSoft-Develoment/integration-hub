# SESSION_LOG

> Bitacora append-only de sesiones de trabajo del agente IA y del equipo.
> Cada sesion deja un registro estructurado: que cambio, que quedo pendiente,
> con que links de evidencia. El agente siguiente lee las ultimas entradas
> primero — es lo que evita que un proyecto pierda continuidad.
> `sync-memory` parsea este archivo y puebla `ai_session_events`.

## Reglas
- Append-only: nunca borres entradas anteriores; corrige con una entrada nueva.
- Una entrada por sesion (o por cambio significativo cuando una sesion produce varios hitos).
- Mantenlo cronologico descendente (la mas reciente arriba).
- Cada entrada DEBE usar el formato exacto de abajo para que el parser la lea.

## Formato de entrada
```md
## <YYYY-MM-DD HH:MM> — <Titulo corto de la sesion>
- Agente: <nombre o role del agente / humano>
- Resumen: <una linea de que se hizo>
- Cambios:
  - <archivo o area>
- Pendiente:
  - <que queda abierto y para quien>
- Evidencia:
  - <ruta a commits, PR, archivos>
```

---


## 2026-08-03 16:55 — La paleta del flow editor, y una guarda que vivia en un atributo de UI
- Agente: Claude Opus 5 (asistido por Natan Davila)
- Resumen: tercer caso del tooltip invisible, con un agravante que aparecio al mirarlo: lo UNICO que impedia soltar en el lienzo una tarea de plugin no confiable era el atributo `disabled` del boton de la paleta.
- Cambios:
  - process-flow-palette: el tooltip pasa al envoltorio (el boton sigue con `disabled`), + motivo para lector de pantalla
  - process-task-list.handleCreateNode: rechaza task types no disponibles, junto a `readonly`
  - process-task-list.component.spec.ts (nuevo): 2 casos sobre quien entra al lienzo
- Pendiente:
  - Revision visual: que el tooltip salga al pasar por un chip gris, que la paleta se vea igual en columna y en fila (<=900px), y que arrastrar una tarea disponible siga funcionando.
  - Sigue sin llegar a la consola desplegada hasta el proximo build nativo: en int corre e6c2d555.
- Evidencia:
  - `taskTooltip()` solo anade `STATUS: reason` cuando la tarea NO esta disponible: el motivo existia solo cuando era imposible verlo
  - `handleCreateNode` solo miraba `readonly()`; el test nuevo pasa a rojo si se quita la guarda (1 failed / 135 passed)
  - Foblex resuelve el item con `closest('[fExternalItem]')`, que sube desde el puntero: un ancestro nuevo no lo rompe. Sus dos `parentElement` son de nodos del lienzo, no de items externos
  - check-disabled-tooltip: 0 hallazgos sobre 126 plantillas · 136/136 test files · nx build web OK

## 2026-08-03 16:35 — El motivo del bloqueo del cuatro-ojos vivia en un tooltip que nadie podia ver
- Agente: Claude Opus 5 (asistido por Natan Davila)
- Resumen: en Material 21.2.14 un boton deshabilitado lleva el `disabled` NATIVO y no emite eventos de raton, asi que el `matTooltip` que explicaba por que el maker no puede aprobar su propio PAY no se mostraba jamas; el motivo pasa a texto visible y se anade un gate para que no vuelva a esconderse.
- Cambios:
  - mt101-quarantine y mt101-pay-conflicts: el motivo del bloqueo sale del tooltip a texto visible
  - frontend/apps/web/src/styles.scss: clase global `.ih-governance-note`
  - mt101-quarantine.component.ts: se elimina `MatTooltipModule`, que quedaba sin uso
  - ci/scripts/check-disabled-tooltip.mjs (nuevo), cableado en check:project tras check:touch-policy
- Pendiente:
  - process-flow-palette: MISMO defecto (`taskTooltip` solo devuelve el motivo cuando la tarea NO esta disponible). No se toca a ciegas: es fuente de arrastre (fExternalItem) con dos layouts responsive y su verificacion es visual. El gate lo deja rojo, y el hallazgo es real.
  - Nada de esto llega a la consola desplegada hasta el proximo build nativo (~1h13m): en int sigue corriendo la imagen e6c2d555.
- Evidencia:
  - @angular/material 21.2.14: `_getDisabledAttribute() { return this.disabledInteractive || !this.disabled ? null : true; }`
  - El remedio aparente (`disabledInteractive`) seria peor: el unico corte de click, `_setupAsAnchor`, solo corre si tagName === 'A'; en un <button> el handler se ejecutaria
  - check-disabled-tooltip: 3 hallazgos contra el HEAD previo, 1 contra el arbol arreglado
  - nx build web OK (sin empeorar el presupuesto de CSS, por eso la clase es global) y 745/745 tests

## 2026-08-03 15:30 — Redeploy nativo con los arreglos de consola + flyway repair de V12
- Agente: Claude Opus 5 (asistido por Natan Davila)
- Resumen: build nativo appih, imagen nueva y redeploy del stack int; el arranque fallo por el drift de checksum de V12 previsto en 0306be5b y se resolvio con `flyway repair` autorizado.
- Cambios:
  - Consola MT101: UNCERTAIN deja de verse como error, cuatro-ojos del PAY correctivo en la UI, motivos separados, aviso de truncado, accesibilidad del field-mapping-board
  - Imagen integration-hub:native-appih reconstruida (sha256:e6c2d555…, antes db577d4d…)
  - flyway_schema_history del entorno int: V12 pasa de checksum -134086729 a 598736224
- Pendiente:
  - El repair en PRODUCCION sigue pendiente y necesita ventana y runbook: aqui int es desechable, alli no.
  - Revision visual humana de la consola: el material esta en el informe, la firma es del humano.
- Evidencia:
  - Build nativo 1h13m, BUILD SUCCESS, runner de 89.9 MB verificado por timestamp (no por exit code)
  - Repair: "Repairing Schema History table for version 12" + "Successfully validated 104 migrations"
  - Post-repair: 104 filas intactas, mt101_pay_dispatch_intent con sus 5 registros, https://localhost:8443/appih/ HTTP 200

## 2026-08-03 09:42 — Politica de rutas del contrato de fases: corregir y vigilar
- Agente: Claude Opus 5 (asistido por Natan Davila)
- Resumen: touchAllow/touchForbid declaraban rutas de una plantilla generica (`src/**`, `tests/**`, `db/migration/**`) que en este monolito de 7 modulos Maven no describen nada; se derivan ahora del pom y se anade un validador que impide que vuelvan a apuntar al vacio.
- Cambios:
  - ci/scripts/_lib/code-roots.mjs (nuevo): deriva rutas de codigo desde el pom raiz
  - ci/scripts/_lib/phase-contracts.mjs: globs genericos -> tokens `<backend>`, `<migrations>`, `<frontend>`
  - ci/scripts/check-touch-policy.mjs (nuevo): oraculo sobre ficheros reales, en check:project
  - scripts/roadmap-audit.mjs, roadmap-next.mjs, prototype-prompt.mjs: pasar `root` a getTouchPolicy
- Pendiente:
  - Encender `roadmap:audit` en un pipeline: la guarda funciona y no la ejecuta nadie automaticamente
  - Decidir sobre las rutas declaradas que no existen: diagramas/, ops/release-notes/, ops/monitoring/, ops/dr/
- Evidencia:
  - Commits 48742c15, c2031891, 17e3e7b0
  - Verificado sobre ficheros reales: tocar `V13__*.sql` en fase 6 pasa de aviso entre 165 a violacion; el backend pasa de bloqueado a permitido en fase 5
  - Contra el contrato anterior, check-touch-policy da 35 hallazgos y EXIT=1

## 2026-08-01 00:54 — Gobernanza: strict por defecto y dos gates que gritaban en falso
- Agente: Claude Opus 5 (asistido por Natan Davila)
- Resumen: 17 de 54 invocaciones del pipeline eran incapaces de fallar y CI no exportaba CHECK_STRICT; se invierte el default y se corrigen dos validadores que reportaban en falso por comparar CRLF contra LF.
- Cambios:
  - ci/scripts/_lib/strict-mode.mjs: `defaultStrict` pasa de false a true
  - ci/scripts/check-plantillas.mjs: comparar contenido normalizado (11 hallazgos falsos -> 1 real)
  - ci/scripts/check-prototype-location.mjs: dejar de tomar el index.html de la app por un prototipo
- Pendiente:
  - 31 de 60 validadores siguen saliendo verdes contra un directorio vacio, incluso en strict
  - check:project queda en EXIT=1 por deuda real: runbooks de 008 sin RF ni SLO numerico, y Fase 2 de 008
  - El SLO numerico del money-path es dato de negocio: lo decide el equipo, no se inventa
- Evidencia:
  - Commit e94a571a

## 2026-08-01 00:18 — Fase 5: el mapa de construccion decia que el backend era un modulo
- Agente: Claude Opus 5 (asistido por Natan Davila)
- Resumen: docs/fase-5-construccion llevaba sin tocarse desde abril y no nombraba 6 de los 7 modulos ni 3 rutas del frontend; reescrito y vigilado con un gate que lo compara contra el pom.
- Cambios:
  - docs/fase-5-construccion/ (mapa, estructura y verificacion)
  - ci/scripts/check-construction-map.mjs (nuevo)
- Pendiente:
  - Ninguno de este bloque
- Evidencia:
  - Commit e4d59173; contra el mapa de abril el gate da 9 hallazgos y EXIT=1

## 2026-08-01 00:09 — Revertir 5 migraciones ya aplicadas que un commit de trazabilidad rompio
- Agente: Claude Opus 5 (asistido por Natan Davila)
- Resumen: el commit 17aeb7c6 edito comentarios de 5 migraciones ya aplicadas y cambio su checksum CRC32; con validateOnMigrate=true y migrate-at-start=true ninguna instalacion existente arrancaba.
- Cambios:
  - Revertidas V13, V16 (motor) y V45, V46, V48 (vertical mt101) a sus bytes exactos
  - ci/migrations.lock + ci/scripts/check-migration-immutability.mjs (nuevos)
  - Mt101CorrectiveLifecycleService: la traza de RF-024 se mueve a la clase, que no esta sujeta a checksum
- Pendiente:
  - V12 sigue divergiendo del entorno int y NO se revierte: su cambio arregla un bloqueador de instalacion bancaria. Requiere `flyway repair` coordinado y documentado ANTES de desplegar. Decision de operacion.
- Evidencia:
  - Commit 0306be5b
  - Checksums antes/despues contrastados contra flyway_schema_history del entorno de integracion

## 2026-07-31 23:59 — La matriz global no conocia la feature del dinero
- Agente: Claude Opus 5 (asistido por Natan Davila)
- Resumen: TRACEABILITY_MATRIX.md no contenia 008-mensajeria-pagos y afirmaba "Requerimientos sin implementacion: Ninguno" con 3 RF del money-path sin implementar; 004 tenia 10 RF y 5 filas.
- Cambios:
  - TRACEABILITY_MATRIX.md: +29 filas generadas desde los traceability.md de cada feature
  - docs/fase-1-analisis-requerimientos/01.00: RF-10 estaba duplicado; renumerado el bloque nuevo a RF-11/12/13
  - ci/scripts/check-global-matrix.mjs (nuevo); check:trace-scope cableado a check:project
- Pendiente:
  - RF-015, RF-020 y RF-021 de 008 siguen sin implementar (linaje UETR, enmascarado en logs, retencion de archivado)
- Evidencia:
  - Commit 758e0f7e; tras sync-memory, 008 pasa de 0 a 164 enlaces en ai_trace_links

## 2026-07-31 23:32 — El cosechador de trazas no leia .sql
- Agente: Claude Opus 5 (asistido por Natan Davila)
- Resumen: por ADR-023 la migracion ES la implementacion de un requisito de modelo de datos; 18 anotaciones ya escritas en 16 migraciones eran invisibles. Ademas se corrigen 3 anotaciones propias colgadas del RF equivocado.
- Cambios:
  - scripts/ai-framework-agent.mjs: `.sql` en HARVEST_EXTENSIONS (404 -> 430 trazas)
  - Tests de Flyway: @covers repuntado de RF-013 a RF-004
  - PaymentValidationRuleResource: @trace de RF-023
- Pendiente:
  - RF-013 sigue sin @covers legitimo: el test que la matriz declara construye su propio DDL en vez de aplicar la migracion real. Falta un test de DDL de verdad.
- Evidencia:
  - Commit 0fe3bc91

## 2026-07-31 23:16 — El parser de frontmatter no leyo nunca ni una clave
- Agente: Claude Opus 5 (asistido por Natan Davila)
- Resumen: en ficheros CRLF se perdia siempre la ultima clave del frontmatter; como cada spec declara una sola, `origin: reingenieria` nunca se leyo y el roadmap inventaba 8 bloqueadores.
- Cambios:
  - ci/scripts/_lib/feature-filter.mjs: normalizar saltos de linea antes de parsear
  - ci/scripts/check-feature-origin.mjs (nuevo): oraculo independiente contra el fichero en disco
- Pendiente:
  - Ninguno de este bloque
- Evidencia:
  - Commit 2bad8fcb; bloqueadores 8 -> 1 (el que queda, 008, es real)

## 2026-07-31 22:13 — flyway.clean() estaba habilitado en produccion
- Agente: Claude Opus 5 (asistido por Natan Davila)
- Resumen: Quarkus 3.37.2 invierte el default seguro de Flyway (`cleanDisabled` con @WithDefault("false")) y el proyecto no lo declaraba; una variable de entorno bastaba para vaciar la base, incluido el ledger que impide pagar dos veces.
- Cambios:
  - application.properties + application-prod.properties: `quarkus.flyway.clean-disabled=true`
  - FlywayCleanVetoCallback: veto en `Event.BEFORE_CLEAN`, declarado por config de BUILD-TIME
  - FlywayCleanGuard: segunda linea, cubre las dos rutas a clean() de doStartActions
- Pendiente:
  - Ninguno de este bloque
- Evidencia:
  - Commits 413884d8, 5cad5c76, b58e3ec4; 11/11 tests, verificado en el bytecode de flyway-core 12.0.0
