---
name: aif-documentation-orchestration
description: "Orquestar documentacion enterprise AI-first usando fases, commands, gates, references, skills, prompts, agents y rutas canonicas del repositorio. Usala cuando el usuario no sabe que documento crear."
---

# Skill Documentation Orchestration

## Objetivo
Orquestar documentacion enterprise AI-first usando fases, commands, gates, references, skills, prompts, agents y rutas canonicas del repositorio.

## Aplicala cuando
- el usuario no sabe que documento crear,
- existe una idea, intake o requerimiento informal,
- se necesita avanzar de una fase a otra,
- se quiere revisar si la documentacion esta completa,
- se necesita convertir conversacion o notas en artefactos formales.

## No la apliques cuando
- el usuario pide directamente implementar codigo con spec ya aprobada,
- el trabajo pertenece exclusivamente a QA, deploy u operacion y ya existe una skill mas especifica,
- la solicitud es una correccion puntual de texto.

## Entradas minimas
- descripcion de la necesidad,
- fase conocida o inferida,
- contexto del proyecto si existe,
- artefactos existentes si aplica,
- fuente escrita opcional, por ejemplo un archivo de intake llamado necesidades-iniciales.md.

## Flujo recomendado
1. Identifica intencion.
2. Mapea intencion a fase.
3. Determina command aplicable.
4. Carga references necesarias.
5. Detecta entregables faltantes.
6. Haz preguntas minimas.
7. Propón archivos destino.
8. Genera contenido o plan de actualizacion.
9. Valida con gate.
10. Recomienda siguiente paso.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Lo documento despues | Si no esta documentado, no es trazable |
| La IA ya entendio | Debe quedar en ruta canonica |
| Es solo una idea | Toda idea util debe terminar como supuesto, riesgo, requerimiento o decision |
| No hace falta ADR | Si cambia arquitectura o tecnologia, si hace falta ADR |
| Ya tengo un intake | El intake no es entregable final; es fuente para `/document` |

## Red flags
- Documentos fuera de ruta canonica.
- Requerimientos sin criterios de aceptacion.
- Arquitectura sin ADR.
- Feature sin spec tecnica.
- QA sin evidencia.
- Deploy sin rollback.
- Decisiones tecnicas en chat pero no en repo.
- Intake plano sin preguntas abiertas ni trazabilidad.

## Verification evidence
- archivos creados o actualizados,
- fase asociada,
- command usado,
- gate aplicado,
- trazabilidad entrada -> artefacto,
- preguntas abiertas registradas.

## Referencias
- `../commands/document-command.md`
- `../references/documentation-orchestration.md`
- `../references/documentation-and-traceability.md`
- `../references/requirements-and-discovery.md`
- `../references/quality-release-and-operations.md`
- `../quality-gates/gate-documentation-ready.md`
