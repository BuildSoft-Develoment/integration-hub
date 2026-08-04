# AI_CONTEXT

> Primer archivo que un agente IA debe leer al retomar este repositorio.
> `AGENTS.md` explica COMO debe trabajar el agente. Este archivo explica EN QUE
> ESTADO esta el proyecto AHORA. Se mantiene vivo: actualizalo al cerrar cada
> fase, feature o gate.

## Identidad
- Proyecto: Integration Hub — plataforma de integracion configurable, gobernada, auditable y observable.
- Dominio: orquestacion de integraciones batch (fuentes -> readers -> procesos -> ejecucion de tareas) con consola web administrativa y backend Quarkus.
- <!-- auto:start name=stack -->
Node >=22.0.0
<!-- auto:end -->
- Version actual: <!-- auto:start name=version -->
v0.4.0
<!-- auto:end -->

## Estado actual
- Fase activa: reingenieria — alinear documentacion existente al framework AI-first (fases 0-8) a partir del codigo ya funcionando.
- Resumen en una linea: plataforma Quarkus operativa (194 archivos Java) con motor de ejecucion de tareas multi-provider (REST, DB_WRITE, DB_EXECUTE_SP, DB_EXECUTE_FN, NOTIFICATION) sobre fuentes filesystem/ftp/sftp/rest y readers txt/csv/xls/xlsx/json/xml; se esta instanciando la capa de gobernanza (memoria viva, trazabilidad RF->codigo->test, gates con firma humana) sin perder lo que ya corre.
- Ultima actualizacion (auto):
<!-- auto:start name=ultima-actualizacion -->
2026-08-04 23:11
<!-- auto:end -->

## Features y su estado
Features base bajo SDD en `specs/`. La siguiente tabla la regenera
`regenerate-context` desde la BD; no edites manualmente entre los marcadores.

<!-- auto:start name=features -->
| Feature | Estado consolidado | Gates |
|---|---|---|
| 001-catalogo-fuentes | Bloqueado: gate-build-ready | gate-build-ready=approved; gate-deploy-ready=pending; gate-operations-ready=pending; gate-qa-passed=approved; gate-sdd-approved=approved |
| 002-catalogo-readers | Bloqueado: gate-build-ready | gate-build-ready=approved; gate-deploy-ready=pending; gate-operations-ready=pending; gate-qa-passed=approved; gate-sdd-approved=approved |
| 003-diseno-y-ejecucion-procesos | Bloqueado: gate-build-ready | gate-build-ready=approved; gate-deploy-ready=pending; gate-operations-ready=pending; gate-qa-passed=approved; gate-sdd-approved=approved |
| 004-observabilidad-y-auditoria | Bloqueado: gate-build-ready | gate-build-ready=approved; gate-deploy-ready=pending; gate-operations-ready=pending; gate-qa-passed=approved; gate-sdd-approved=approved |
| 005-catalogo-conexiones | Bloqueado: gate-build-ready | gate-build-ready=approved; gate-deploy-ready=pending; gate-operations-ready=pending; gate-qa-passed=approved; gate-sdd-approved=approved |
| 006-programacion-procesos | Bloqueado: gate-build-ready | gate-build-ready=approved; gate-deploy-ready=pending; gate-operations-ready=pending; gate-qa-passed=approved; gate-sdd-approved=approved |
| 007-tema-del-sistema | Bloqueado: gate-build-ready | gate-build-ready=approved; gate-deploy-ready=pending; gate-operations-ready=pending; gate-qa-passed=approved; gate-sdd-approved=approved |
| 008-mensajeria-pagos | Bloqueado: gate-build-ready | gate-build-ready=approved; gate-deploy-ready=pending; gate-html5-product-quality=approved; gate-operations-ready=pending; gate-prototype-human-visual-review=approved; gate-prototype-ready=approved; gate-qa-passed=approved; gate-sdd-approved=approved; gate-spdd-approved=approved |
<!-- auto:end -->

## Gates pendientes
<!-- auto:start name=gates-pendientes -->
- `gate-build-ready` en `specs/001-catalogo-fuentes` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-deploy-ready` en `specs/001-catalogo-fuentes` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-operations-ready` en `specs/001-catalogo-fuentes` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-qa-passed` en `specs/001-catalogo-fuentes` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-sdd-approved` en `specs/001-catalogo-fuentes` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-build-ready` en `specs/002-catalogo-readers` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-deploy-ready` en `specs/002-catalogo-readers` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-operations-ready` en `specs/002-catalogo-readers` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-qa-passed` en `specs/002-catalogo-readers` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-sdd-approved` en `specs/002-catalogo-readers` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-build-ready` en `specs/003-diseno-y-ejecucion-procesos` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-deploy-ready` en `specs/003-diseno-y-ejecucion-procesos` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-operations-ready` en `specs/003-diseno-y-ejecucion-procesos` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-qa-passed` en `specs/003-diseno-y-ejecucion-procesos` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-sdd-approved` en `specs/003-diseno-y-ejecucion-procesos` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-build-ready` en `specs/004-observabilidad-y-auditoria` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-deploy-ready` en `specs/004-observabilidad-y-auditoria` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-operations-ready` en `specs/004-observabilidad-y-auditoria` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-qa-passed` en `specs/004-observabilidad-y-auditoria` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-sdd-approved` en `specs/004-observabilidad-y-auditoria` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-build-ready` en `specs/005-catalogo-conexiones` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-deploy-ready` en `specs/005-catalogo-conexiones` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-operations-ready` en `specs/005-catalogo-conexiones` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-qa-passed` en `specs/005-catalogo-conexiones` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-sdd-approved` en `specs/005-catalogo-conexiones` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-build-ready` en `specs/006-programacion-procesos` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-deploy-ready` en `specs/006-programacion-procesos` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-operations-ready` en `specs/006-programacion-procesos` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-qa-passed` en `specs/006-programacion-procesos` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-sdd-approved` en `specs/006-programacion-procesos` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-build-ready` en `specs/007-tema-del-sistema` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-deploy-ready` en `specs/007-tema-del-sistema` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-operations-ready` en `specs/007-tema-del-sistema` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-qa-passed` en `specs/007-tema-del-sistema` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-sdd-approved` en `specs/007-tema-del-sistema` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-build-ready` en `specs/008-mensajeria-pagos` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-deploy-ready` en `specs/008-mensajeria-pagos` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-html5-product-quality` en `specs/008-mensajeria-pagos` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-operations-ready` en `specs/008-mensajeria-pagos` — pending (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-prototype-human-visual-review` en `specs/008-mensajeria-pagos` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-prototype-ready` en `specs/008-mensajeria-pagos` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-qa-passed` en `specs/008-mensajeria-pagos` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-sdd-approved` en `specs/008-mensajeria-pagos` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
- `gate-spdd-approved` en `specs/008-mensajeria-pagos` — approved (ultimo: Natan Angel Davila Lopez, 2026-08-04)
<!-- auto:end -->

## Sesiones recientes
<!-- auto:start name=sesiones-recientes -->
- **2026-08-03 17:35** — Claude Opus 5 (asistido por Natan Davila) — build nativo (34 min), imagen 1594624bfee0 y stack recreado entero; de paso, `PUBLIC_BASE_URL` tenia clavada la IP de la oficina anterior y el login habria muerto al cambiar de red.
- **2026-08-03 16:55** — Claude Opus 5 (asistido por Natan Davila) — tercer caso del tooltip invisible, con un agravante que aparecio al mirarlo: lo UNICO que impedia soltar en el lienzo una tarea de plugin no confiable era el atributo `disabled` del boton de la paleta.
- **2026-08-03 16:35** — Claude Opus 5 (asistido por Natan Davila) — en Material 21.2.14 un boton deshabilitado lleva el `disabled` NATIVO y no emite eventos de raton, asi que el `matTooltip` que explicaba por que el maker no puede aprobar su propio PAY no se mostraba jamas; el motivo pasa a texto visible y se anade un gate para que no vuelva a es
<!-- auto:end -->

## Decisiones recientes
<!-- auto:start name=decisiones-recientes -->
- Vertical SWIFT MT101 como modulo Maven propio, dentro del monolito modular (ADR-021). _(registrada)_ — [ver](specs/008-mensajeria-pagos/traceability.md)
- Unificar la peticion HTTP de `REST_CALL` y el canal `webhook` de `NOTIFICATION` en una pieza _(registrada)_ — [ver](specs/003-diseno-y-ejecucion-procesos/traceability.md)
- Segregacion de funciones sobre el cierre de conflictos de pago: `pay-conflict-maker` y _(registrada)_ — [ver](specs/008-mensajeria-pagos/traceability.md)
- Secretos referenciados con el contrato `${secret:...}`, nunca persistidos en claro (ADR-002). _(registrada)_ — [ver](specs/001-catalogo-fuentes/traceability.md)
- Secretos de conexion referenciados con `${secret:...}` (ADR-002). _(registrada)_ — [ver](specs/005-catalogo-conexiones/traceability.md)
<!-- auto:end -->

## Proximos pasos
1. Generar `ROADMAP_STATE.json` real con `roadmap:sync` (mapea fases 0-8 al estado actual de docs/specs/codigo).
2. Reconciliar la documentacion existente a la fase canonica correcta y completar los artefactos minimos por fase.
3. Construir trazabilidad RF -> codigo -> test desde los 194 archivos Java y las 4 specs.
4. Correr `check:all` y usar los hallazgos como checklist de reingenieria por fase.

## Como cargar contexto rapido
```sh
node scripts/ai-framework-agent.mjs index-docs   # indexa Markdown + FTS5
node scripts/ai-framework-agent.mjs sync-memory  # puebla trazabilidad/gates/decisiones
node scripts/ai-framework-agent.mjs status       # estado de la memoria
node scripts/ai-framework-agent.mjs search --query "<tema>"
```
La BD `ai/memory/framework-agent.db` es un indice reconstruible. La fuente de
verdad son los Markdown y el codigo. Si la BD contradice un Markdown, gana el Markdown.

## Punteros clave
- `AGENTS.md` — contrato de trabajo del agente.
- `CONSTITUTION.md` — principios no negociables del framework.
- `AGENT_RUNTIME.md` — disciplina de ejecucion del agente.
- `docs/README.md` — indice de documentacion por fase (0-8 + transversal).
- `specs/README.md` — features base bajo SDD.
- `ai/memory/README.md` — como funciona la memoria del agente.
- `README.md` — vision general del Integration Hub.

## Como actualizar este archivo
- Actualiza `Estado actual` y `Proximos pasos` al cerrar cada sesion de trabajo.
- Actualiza `Features y su estado` y `Gates pendientes` al mover un gate.
- Tras actualizar, corre `sync-memory` para reflejarlo en la memoria del agente.
