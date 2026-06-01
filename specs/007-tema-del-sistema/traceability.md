# Traceability - Tema del sistema

[README principal](../../README.md) | [Specs](../README.md)

> Feature de reingenieria (`origin: reingenieria`): el codigo y las pruebas ya existen y operan.
> La Fase 2 (UX/UI · prototipo · SPDD) NO aplica. `UX/SPDD` y `Prototipo` van en `-`. `Test` va
> en `-` donde no existe clase de prueba dedicada (pendiente QA).

## Proposito
Matriz viva RF -> API -> BD -> Codigo -> Test, detalle del rollup global en
`TRACEABILITY_MATRIX.md`. La parsea `sync-memory` para poblar `ai_trace_links`/`ai_gate_runs`.

## Matriz de trazabilidad

| RF | HU | UX/SPDD | Prototipo | API | BD | Codigo | Test | Estado | Evidencia |
|---|---|---|---|---|---|---|---|---|---|
| RF-001 | - | - | - | GET /api/system/theme | system_theme_setting | SystemThemeSettingService | - | Implementado | tdd-evidence.md |
| RF-002 | - | - | - | PUT /api/system/theme | system_theme_setting | SystemThemeSettingResource | - | Implementado | tdd-evidence.md |
| RF-003 | - | - | - | PUT /api/system/theme | system_theme_setting | SystemThemeSettingApiMapper | - | Implementado | tdd-evidence.md |

## Gates
> Fase 2 N/A por reingenieria: `gate-spdd-approved` y `gate-prototype-ready` no aplican.

| Gate | Estado | Aprobador | Fecha | Evidencia |
|---|---|---|---|---|
| gate-sdd-approved | pending | — | — | spec-tecnica.md |
| gate-qa-passed | pending | — | — | tdd-evidence.md |

## Decisiones
- Configuracion de tema como ajuste unico del sistema (singleton), no por usuario.

## Preguntas abiertas
- Confirmar mapeo RF local `RF-001..RF-003` ↔ requerimientos globales de Fase 1.
- Cobertura de prueba dedicada del tema del sistema (hoy `Test = -`).
