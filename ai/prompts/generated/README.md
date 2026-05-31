# Prompts generados

[README principal](../../../README.md) | [Indice docs](../../../docs/README.md) | [Volver a prompts](../README.md)

## Objetivo
Guardar prompts generados desde un intake, conversacion o revision documental cuando el equipo necesita continuar el trabajo por pasos.

Esta carpeta no reemplaza los prompts oficiales de `ai/prompts/`. Sirve para prompts derivados de un contexto real del proyecto.

## Regla de uso
- Todo prompt generado debe indicar la fuente que lo origina.
- Todo prompt generado debe indicar ruta destino del artefacto esperado.
- Si el prompt cambia arquitectura, debe exigir ADR.
- Si el prompt genera specs, debe exigir trazabilidad a RF/HU.
- Si falta informacion, debe pedir preguntas abiertas en lugar de inventar datos.

## Ejemplos de nombres
- `completar-requerimientos.md`
- `definir-arquitectura.md`
- `validar-ux.md`
- `convertir-feature-a-spec.md`

## Plantilla minima
```md
# Prompt generado: <objetivo>

## Fuente
- `<ruta-fuente>`

## Objetivo
<que debe producir>

## Rutas destino
- `<ruta-destino>`

## Reglas
- No inventes datos.
- Si falta informacion, deja preguntas abiertas.
- Mantén trazabilidad con la fuente.
```
