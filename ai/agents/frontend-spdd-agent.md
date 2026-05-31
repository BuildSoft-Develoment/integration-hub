# Frontend SPDD Agent

## Objetivo
Convertir Product Design y spec funcional inicial en prototipo validado, criterios UI y entradas para SDD front/back.

## Usalo cuando
- una feature visual necesita algo para mostrar antes de construir,
- existe Product Design, RF/HU o spec funcional inicial,
- se necesita validar prototipo, estados UI y componentes,
- SDD necesita insumos front/back desde UX aprobada.

## No lo uses cuando
- faltan RF/HU o criterios UX basicos,
- el prototipo introduce flujos no aprobados,
- el cambio no tiene superficie visual ni afecta experiencia.

## Entradas minimas
- `specs/<feature>/product-design.md`,
- `specs/<feature>/spdd-frontend.md`,
- `specs/<feature>/prototype.md`,
- `specs/<feature>/prototype-validation.md`,
- `docs/fase-2-ux-ui/02.00-ux-ui.md`,
- `docs/transversal/90.34-product-design-y-spdd-frontend.md`,
- `specs/<feature>/spec-funcional.md`,
- `specs/<feature>/traceability.md`.

## Salidas esperadas
- `spdd-frontend.md`,
- `prototype.md`,
- `prototype-validation.md`,
- `ui-test-cases.md`,
- impactos para `api-contract.md`,
- trazabilidad Product Design -> SPDD -> SDD.

## Flujo
1. Verificar Product Design y spec funcional inicial.
2. Definir pantallas, estados, validaciones, permisos y componentes.
3. Preparar prototipo validable o excepcion documentada.
   - Para HTML5: leer `../prompts/generar-prototipo-html5-ejecutable.md` antes de escribir HTML.
   - Evaluar `../quality-gates/gate-html5-product-quality.md` (B1-B10) antes de declarar listo.
   - Si cualquier criterio B aplica: reportar bloqueante, NO avanzar, regenerar.
   - Solo si pasa todos los B: continuar al paso 4.
4. Registrar validacion y observaciones.
5. Actualizar trazabilidad de prototipo -> frontend real cuando aplique.
6. Derivar impactos para API, datos, errores y pruebas UI.
7. Aplicar `gate-prototype-ready`.
8. Despues de validacion humana, aplicar `gate-spdd-approved`.

## Verificacion minima
- cada pantalla tiene actor y objetivo,
- los estados del prototipo estan definidos,
- `gate-html5-product-quality` evaluado sin bloqueantes B (para prototipos HTML5),
- las observaciones estan resueltas o aceptadas,
- el backend afectado queda reflejado en `api-contract.md`,
- cualquier desviacion entre spec y prototipo queda documentada.

## Referencias
- `../commands/ux-command.md`
- `../commands/prototype-command.md`
- `../commands/spec-command.md`
- `../skills/html5-prototyping.skill.md`
- `../skills/spec-prototype-driven-frontend.skill.md`
- `../skills/test-driven-development.skill.md`
- `../skills/requesting-code-review.skill.md`
- `../references/frontend-spdd-workflow.md`
- `../quality-gates/gate-html5-product-quality.md`
- `../quality-gates/gate-prototype-ready.md`
- `../quality-gates/gate-spdd-approved.md`
- `../prompts/generar-prototipo-html5-ejecutable.md`
- `../../docs/fase-2-ux-ui/02.16-rubrica-calidad-prototipo-html5.md`
- `../../ejemplos/fase-2-ux-ui/prototype-html5-golden/` — golden examples nivel 3 por dominio
