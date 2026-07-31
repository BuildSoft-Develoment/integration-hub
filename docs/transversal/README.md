# Documentacion transversal

[README principal](../../README.md) | [Indice docs](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Auditoria documental fases 0-8 vs codigo](90.37-auditoria-fases-0-8-vs-codigo.md)
- Siguiente: [Estandar para IA](90.00-estandar-ia.md)
<!-- nav-guided:end -->

## Objetivo

Concentrar las reglas transversales que gobiernan como se documenta, disena, construye, valida y opera `Integration Hub`.

## Adopcion real de este bloque

- Los documentos `90.xx` son criterios activos del repositorio.
- Este bloque conecta decisiones de escenario, stack, trazabilidad, IA, naming y entregables con las fases `00` a `08`.
- Cuando una regla transversal cambia, debe reflejarse en `docs/`, `specs/`, `qa/`, `ops/`, `ci/` o `releases/` segun impacto.

## Nota de numeracion

La documentacion transversal usa el bloque `90.xx` para diferenciar artefactos que aplican a varias fases sin mezclarlos con la numeracion operativa del proyecto.

## Convencion de breadcrumb

En esta carpeta el breadcrumb estandar es `[Volver a transversal](README.md)` para todos los documentos `90.xx`.

## Contenido

### Gobierno y adopcion

- [90.00-estandar-ia](90.00-estandar-ia.md)
- [90.01-gobernanza](90.01-gobernanza.md)
- [90.12-mapa-ia-por-fase](90.12-mapa-ia-por-fase.md)
- [90.13-modos-de-trabajo](90.13-modos-de-trabajo.md)
- [90.14-criterios-consolidacion-documental](90.14-criterios-consolidacion-documental.md)

### Escenario, stack y arquitectura

- [90.02-escenarios-de-referencia](90.02-escenarios-de-referencia.md)
- [90.03-checklist-seleccion-escenario](90.03-checklist-seleccion-escenario.md)
- [90.04-stacks-de-referencia](90.04-stacks-de-referencia.md)
- [90.05-checklist-seleccion-stack](90.05-checklist-seleccion-stack.md)
- [90.08-criterios-adr-por-stack](90.08-criterios-adr-por-stack.md)

### Estructura, trazabilidad y control

- [90.06-estructura-repositorio-real](90.06-estructura-repositorio-real.md)
- [90.07-convenciones-y-naming](90.07-convenciones-y-naming.md)
- [90.09-trazabilidad-sdd-por-stack](90.09-trazabilidad-sdd-por-stack.md)
- [90.10-entregables-minimos-por-fase](90.10-entregables-minimos-por-fase.md)
- [90.11-checklist-entregables](90.11-checklist-entregables.md)
- [90.37-auditoria-fases-0-8-vs-codigo](90.37-auditoria-fases-0-8-vs-codigo.md)
- [90.17-catalogo-de-tipos](90.17-catalogo-de-tipos.md) — fuentes, readers y task types, **generado desde el codigo**

### Seguridad, privacidad y cumplimiento

- [90.15-seguridad-dependencias](90.15-seguridad-dependencias.md) — ⚠️ objetivo, no implementado
- [90.16-privacidad-compliance](90.16-privacidad-compliance.md)
- [90.25-threat-modeling](90.25-threat-modeling.md)
- [90.26-contract-governance](90.26-contract-governance.md) — ⚠️ el gating descrito no existe

### Diseno y metodologia

- [90.30-principios-solid-diseno-modular](90.30-principios-solid-diseno-modular.md)
- [90.34-product-design-y-spdd-frontend](90.34-product-design-y-spdd-frontend.md)
- [90.35-trace-annotations-por-stack](90.35-trace-annotations-por-stack.md)
- [90.36-roadmap-metodologico](90.36-roadmap-metodologico.md)
- [90.14-instanciacion-fases-proyectos-reales](90.14-instanciacion-fases-proyectos-reales.md)

### Operacion del framework y agentes

- [90.18-definiciones-operativas](90.18-definiciones-operativas.md)
- [90.19-versionado-commits](90.19-versionado-commits.md)
- [90.28-anatomia-operativa-de-agents-prompts-skills](90.28-anatomia-operativa-de-agents-prompts-skills.md)
- [90.29-integracion-selectiva-agent-skills](90.29-integracion-selectiva-agent-skills.md)
- [90.32-agente-interno-framework-ai-first](90.32-agente-interno-framework-ai-first.md)
- [90.33-flujo-delivery-ia-proveedores](90.33-flujo-delivery-ia-proveedores.md)

> **Nota sobre la numeracion.** `90.14` esta duplicado: `90.14-criterios-consolidacion-documental` y
> `90.14-instanciacion-fases-proyectos-reales` comparten numero, lo que bifurca la cadena
> `nav-guided`. Se deja constancia en vez de renumerar: renumerar rompe todos los enlaces entrantes
> y el coste supera al de la ambiguedad, que es de indice y no de contenido.

## Regla de mantenimiento

Si una fase cambia su estructura, su ruta oficial o su forma de trabajo, este bloque transversal debe revisarse para evitar drift entre la norma y la ejecucion real.
