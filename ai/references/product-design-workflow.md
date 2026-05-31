# Referencia: Spec-Driven Product Design

## Usala cuando
- Product Owner, BA, UX o negocio necesitan convertir RF/HU en experiencia validable,
- la salida esperada vive en Fase 2,
- se necesita preparar HTML5-first y Penpot antes de construir,
- el equipo quiere evitar que el prototipo invente alcance.

## Flujo canonico
```text
RF / HU / notas de negocio
  -> analisis de producto
  -> dos alternativas si hay ambiguedad
  -> decision recomendada
  -> problema, personas, journey, hipotesis, alcance y metricas
  -> validacion inicial
  -> Product Design Output
  -> gate-ux-ready
```

## Reglas
- No prototipar funcionalidades que no tengan problema, usuario, valor o pregunta abierta.
- No cerrar Product Design sin problema, objetivo, usuarios, journey, alcance y metrica.
- No usar Penpot como reemplazo de Product Design.
- No pasar a SPDD si el producto/flujo no esta conceptualmente claro.

## Evidencia minima
| Bloque | Evidencia |
|---|---|
| Producto | objetivo, actor, resultado esperado |
| Alternativas | opcion A, opcion B y recomendacion si hay ambiguedad |
| Producto | problema, usuarios, journey, hipotesis, alcance y metricas |
| Validacion | aprobacion inicial, observaciones o preguntas abiertas |
| Trazabilidad | RF/HU/notas -> Product Design -> SPDD |

## Red flags
- el Product Owner define pantalla pero no problema,
- hay prototipo sin Product Design,
- se mezcla exploracion de producto con implementacion,
- no hay metrica para saber si la solucion funciona.

## Rutas relacionadas
- `../../docs/fase-2-ux-ui/02.09-spec-driven-product-design.md`
- `../../docs/fase-2-ux-ui/02.10-spdd-spec-prototype-driven-development.md`
- `../../docs/fase-2-ux-ui/02.13-penpot-ai-prototyping.md`
- `../../docs/fase-2-ux-ui/02.14-html5-first-prototyping.md`
- `../skills/spec-driven-product-design.skill.md`
- `../agents/product-design-agent.md`
