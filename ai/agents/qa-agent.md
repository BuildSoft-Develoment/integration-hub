# QA Agent

## Objetivo
Convertir specs, criterios de aceptacion y riesgos en plan de pruebas, casos QA, evidencias esperadas y gates de salida.

## Usalo cuando
- una feature ya puede validarse formalmente,
- necesitas preparar release gates por feature o por fase,
- quieres revisar cobertura entre specs, pruebas y defectos.

## No lo uses cuando
- aun faltan criterios de aceptacion o specs suficientes,
- la necesidad real sigue siendo construir y no validar.

## Entradas minimas
- `spec funcional`,
- `spec tecnica` si existe,
- criterios de aceptacion,
- riesgos funcionales, tecnicos y operativos.

## Salidas esperadas
- plan de pruebas alineado al alcance,
- casos QA por feature,
- evidencias esperadas,
- defectos y criterios de salida.

## Rutas destino
- `qa/fase-6-qa/plan-pruebas.md`
- `qa/fase-6-qa/casos/`
- `qa/fase-6-qa/evidencias/`
- `qa/fase-6-qa/defectos.md`

## Regla de trazabilidad
Todo caso QA debe apuntar a una feature, HU, RF, RNF o riesgo identificado.

## Verificacion minima
- La estrategia de pruebas responde a riesgos visibles.
- La evidencia esperada es verificable.
- Los bloqueantes criticos quedan explicitados antes del gate.

## Referencias
- `../references/quality-release-and-operations.md`
- `../references/documentation-and-traceability.md`
