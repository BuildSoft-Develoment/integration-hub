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
2026-06-01 19:59
<!-- auto:end -->

## Features y su estado
Features base bajo SDD en `specs/`. La siguiente tabla la regenera
`regenerate-context` desde la BD; no edites manualmente entre los marcadores.

<!-- auto:start name=features -->
| Feature | Estado consolidado | Gates |
|---|---|---|
| 001-catalogo-fuentes | Bloqueado: gate-prototype-ready | gate-prototype-ready=pending; gate-qa-passed=pending; gate-sdd-approved=pending; gate-spdd-approved=n/a (reingenieria) |
| 002-catalogo-readers | Bloqueado: gate-prototype-ready | gate-prototype-ready=pending; gate-qa-passed=pending; gate-sdd-approved=pending; gate-spdd-approved=n/a (reingenieria) |
| 003-diseno-y-ejecucion-procesos | Bloqueado: gate-prototype-ready | gate-prototype-ready=pending; gate-qa-passed=pending; gate-sdd-approved=pending; gate-spdd-approved=n/a (reingenieria) |
| 004-observabilidad-y-auditoria | Bloqueado: gate-prototype-ready | gate-prototype-ready=pending; gate-qa-passed=pending; gate-sdd-approved=pending; gate-spdd-approved=n/a (reingenieria) |
| 005-catalogo-conexiones | Bloqueado: gate-qa-passed | gate-qa-passed=pending; gate-sdd-approved=pending; gate-spdd-approved=n/a (reingenieria) |
| 006-programacion-procesos | Bloqueado: gate-qa-passed | gate-qa-passed=pending; gate-sdd-approved=pending; gate-spdd-approved=n/a (reingenieria) |
| 007-tema-del-sistema | Bloqueado: gate-qa-passed | gate-qa-passed=pending; gate-sdd-approved=pending; gate-spdd-approved=n/a (reingenieria) |
<!-- auto:end -->

## Gates pendientes
<!-- auto:start name=gates-pendientes -->
- `gate-prototype-ready` en `specs/001-catalogo-fuentes` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-qa-passed` en `specs/001-catalogo-fuentes` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-sdd-approved` en `specs/001-catalogo-fuentes` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-spdd-approved` en `specs/001-catalogo-fuentes` — n/a (reingenieria) (ultimo: Natan Angel Davila Lopez, 2026-06-01)
- `gate-prototype-ready` en `specs/002-catalogo-readers` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-qa-passed` en `specs/002-catalogo-readers` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-sdd-approved` en `specs/002-catalogo-readers` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-spdd-approved` en `specs/002-catalogo-readers` — n/a (reingenieria) (ultimo: Natan Angel Davila Lopez, 2026-06-01)
- `gate-prototype-ready` en `specs/003-diseno-y-ejecucion-procesos` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-qa-passed` en `specs/003-diseno-y-ejecucion-procesos` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-sdd-approved` en `specs/003-diseno-y-ejecucion-procesos` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-spdd-approved` en `specs/003-diseno-y-ejecucion-procesos` — n/a (reingenieria) (ultimo: Natan Angel Davila Lopez, 2026-06-01)
- `gate-prototype-ready` en `specs/004-observabilidad-y-auditoria` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-qa-passed` en `specs/004-observabilidad-y-auditoria` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-sdd-approved` en `specs/004-observabilidad-y-auditoria` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-spdd-approved` en `specs/004-observabilidad-y-auditoria` — n/a (reingenieria) (ultimo: Natan Angel Davila Lopez, 2026-06-01)
- `gate-qa-passed` en `specs/005-catalogo-conexiones` — pending (ultimo: Natan Angel Davila Lopez, 2026-06-01)
- `gate-sdd-approved` en `specs/005-catalogo-conexiones` — pending (ultimo: Natan Angel Davila Lopez, 2026-06-01)
- `gate-spdd-approved` en `specs/005-catalogo-conexiones` — n/a (reingenieria) (ultimo: Natan Angel Davila Lopez, 2026-06-01)
- `gate-qa-passed` en `specs/006-programacion-procesos` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-sdd-approved` en `specs/006-programacion-procesos` — pending (ultimo: Natan Angel Davila Lopez, 2026-05-31)
- `gate-spdd-approved` en `specs/006-programacion-procesos` — n/a (reingenieria) (ultimo: Natan Angel Davila Lopez, 2026-06-01)
- `gate-qa-passed` en `specs/007-tema-del-sistema` — pending (ultimo: Natan Angel Davila Lopez, 2026-06-01)
- `gate-sdd-approved` en `specs/007-tema-del-sistema` — pending (ultimo: Natan Angel Davila Lopez, 2026-06-01)
- `gate-spdd-approved` en `specs/007-tema-del-sistema` — n/a (reingenieria) (ultimo: Natan Angel Davila Lopez, 2026-06-01)
<!-- auto:end -->

## Sesiones recientes
<!-- auto:start name=sesiones-recientes -->
- _(sin entradas en SESSION_LOG.md)_
<!-- auto:end -->

## Decisiones recientes
<!-- auto:start name=decisiones-recientes -->
- Secretos referenciados con el contrato `${secret:...}`, nunca persistidos en claro (ADR-002). _(registrada)_ — [ver](specs/001-catalogo-fuentes/traceability.md)
- Secretos de conexion referenciados con `${secret:...}` (ADR-002). _(registrada)_ — [ver](specs/005-catalogo-conexiones/traceability.md)
- Patron providers + registries para fuentes (ADR-001). _(registrada)_ — [ver](specs/001-catalogo-fuentes/traceability.md)
- Motor providers + registries para tipos de tarea (DbWrite, StoredProcedure, etc.) (ADR-001). _(registrada)_ — [ver](specs/003-diseno-y-ejecucion-procesos/traceability.md)
- Metadata JDBC introspeccionada en vivo (no persistida) via `ConnectionMetadataService`. _(registrada)_ — [ver](specs/005-catalogo-conexiones/traceability.md)
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
