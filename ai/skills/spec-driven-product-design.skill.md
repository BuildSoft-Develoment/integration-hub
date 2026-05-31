---
name: aif-spec-driven-product-design
description: "Transformar requerimientos, HU, reglas de negocio y notas de Product Owner en una definicion UX trazable, validable y lista para prototipo. Usala cuando el trabajo esta antes de construir."
---

# Skill: Spec-Driven Product Design

## Objetivo
Transformar requerimientos, HU, reglas de negocio y notas de Product Owner en una definicion UX trazable, validable y lista para prototipo.

## Aplicala cuando
- el trabajo esta antes de construir,
- la fase principal es `2 - UX/UI`,
- el equipo necesita decidir journeys, pantallas o estados,
- existen RF/HU pero todavia no hay prototipo consistente.

## No la apliques cuando
- la solicitud pide implementar codigo con UX y specs ya aprobadas,
- el trabajo es solo QA, deploy u operacion,
- el cambio es un ajuste visual menor sin impacto de flujo.

## Entradas minimas
- actor o rol afectado,
- problema o necesidad,
- RF/HU/spec relacionada,
- regla visible de negocio,
- resultado esperado para el usuario,
- restricciones o supuestos conocidos.

## Flujo recomendado
1. Identifica objetivo de producto y actor.
2. Mapea RF/HU a journeys y pantallas.
3. Detecta estados: loading, empty, error, success, unauthorized y edge cases.
4. Si hay ambiguedad relevante, propone dos alternativas.
5. Recomienda una alternativa y declara trade-offs.
6. Define criterios UX y accesibilidad minima.
7. Prepara salida para HTML5-first y Penpot si aplica.
8. Registra trazabilidad y preguntas abiertas.

## Anti-rationalizations
| Excusa | Respuesta |
|---|---|
| Es solo UX | UX decide alcance visible y debe quedar trazado |
| Lo vemos en Penpot | Primero debe existir estructura en Markdown |
| El PO lo dijo en una reunion | Debe quedar en ruta canonica |
| El mock lo resolvera | El mock valida, no reemplaza definicion |

## Red flags
- pantalla sin actor,
- journey sin resultado esperado,
- flujo sin estados de error o vacio,
- componentes sin sistema reutilizable,
- prototipo con funcionalidad no documentada,
- decision de producto sin pregunta abierta o aprobacion.

## Verification evidence
- objetivo de producto,
- alternativas evaluadas si aplica,
- journeys y pantallas,
- estados UX,
- criterios UX/accesibilidad,
- insumos para prototipo HTML5/Penpot,
- nombres de pantalla y componentes principales,
- trazabilidad RF/HU/spec -> UX.

## Referencias
- `../references/product-design-workflow.md`
- `../references/ux-accessibility-and-mocks.md`
- `../commands/ux-command.md`
