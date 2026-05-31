---
name: aif-using-git-worktrees
description: "Usa cuando una feature pasa de specs a construccion o se asigna a un agente IA, para ejecutar en un workspace aislado y rama limpia sin contaminar la rama principal. No la uses en trabajo de solo lectura/analisis ni si el repo no usa git."
---

# Skill Using Git Worktrees

## Objetivo
Ejecutar features en un workspace aislado y una rama limpia, evitando mezclar cambios de proveedor IA con trabajo en curso.

## Aplicala cuando
- una feature pasa de specs a construccion,
- se asigna trabajo a proveedor IA o agente externo,
- quieres ejecutar cambios sin contaminar la rama principal,
- hay varias tareas o agentes trabajando en paralelo.

## No la apliques cuando
- el trabajo es solo lectura o analisis,
- el repositorio no usa git,
- el usuario pidio explicitamente trabajar en el workspace actual.

## Entradas minimas
- rama base,
- slug de feature,
- ruta de worktree esperada,
- spec o task packet que se va a ejecutar.

## Flujo recomendado
1. Verifica estado del repositorio y rama base.
2. Crea una rama con nombre trazable, por ejemplo `feat/<feature-slug>`.
3. Crea un worktree aislado para la rama.
4. Ejecuta el task packet dentro del worktree.
5. Mantiene commits pequenos por tarea o slice.
6. Al cerrar, valida tests, PR/merge y limpieza.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Es mas rapido trabajar en main | Un proveedor IA necesita aislamiento y rollback simple |
| Luego separo los cambios | La separacion debe existir antes de ejecutar |
| El cambio es pequeno | Si toca codigo, tests o specs, merece rama trazable |

## Red flags
- Cambios directos en `main`.
- Worktree sin rama dedicada.
- Rama sin referencia a spec o feature.
- Cambios mezclados de varias features.

## Verification evidence
- rama creada o seleccionada,
- ruta de worktree,
- spec/task packet asociado,
- comandos git ejecutados,
- estado final de branch/worktree.

## Referencias
- `../../docs/transversal/90.19-versionado-commits.md`
- `../references/feature-delivery-workflow.md`
