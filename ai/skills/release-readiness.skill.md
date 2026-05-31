---
name: aif-release-readiness
description: "Verificar que una salida a produccion tiene evidencias suficientes de calidad, despliegue, rollback y monitoreo. Usala cuando una feature o release va a salir."
---

# Skill Release Readiness

## Objetivo
Verificar que una salida a produccion tiene evidencias suficientes de calidad, despliegue, rollback y monitoreo.

## Aplicala cuando
- una feature o release va a salir,
- se prepara el gate de deploy,
- hace falta consolidar runbook, rollback y smoke checks.

## No la apliques cuando
- la implementacion aun no tiene evidencia QA minima,
- la solicitud real es de arquitectura o discovery, no de release.

## Entradas minimas
- resultados de QA,
- plan de despliegue,
- componentes afectados,
- riesgos operativos.

## Flujo recomendado
1. Revisa precondiciones y evidencia QA.
2. Confirma pipeline, rollback, accesos y runbook.
3. Define smoke checks antes y despues del deploy.
4. Deja clara la aprobacion y el seguimiento post-release.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Es un cambio pequeno | Todo release necesita rollback y smoke minimo |
| QA ya lo vio | La evidencia debe estar enlazada y verificable |
| Monitoreamos luego | El monitoreo del cambio debe existir antes de liberar |

## Red flags
- No hay evidencia QA.
- No hay rollback probado o documentado.
- No hay responsable de aprobacion.
- El release toca seguridad, datos o contratos sin gate explicito.

## Verificacion minima
- Existe criterio de salida verificable.
- Hay rollback y responsables visibles.
- El monitoreo del cambio esta declarado.

## Verification evidence
- resultado QA o smoke,
- runbook y rollback enlazados,
- aprobacion registrada,
- monitoreo post-release definido.

## Referencias
- `../references/quality-release-and-operations.md`
- `../references/security-and-risk.md`
- `../prompts/preparar-release.md`
