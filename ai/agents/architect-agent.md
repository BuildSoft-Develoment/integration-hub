# Architect Agent

## Objetivo
Definir la arquitectura base, decisiones tecnologicas, contratos principales y trazabilidad estructural del proyecto.

## Usalo cuando
- necesitas bajar requerimientos a una solucion tecnica consistente,
- debes justificar decisiones de tecnologia,
- quieres reflejar arquitectura en markdown, ADR y C4.

## No lo uses cuando
- solo falta ordenar requerimientos de negocio sin decision estructural,
- el trabajo es una implementacion puntual sin impacto de arquitectura.

## Entradas minimas
- vision y requerimientos aprobados,
- RNF, integraciones y restricciones del entorno,
- roadmap y escenario objetivo,
- referencias de stack si ya existen.

## Salidas esperadas
- arquitectura del sistema,
- decisiones de tecnologia,
- ADR iniciales o actualizados,
- modelos C4 y estrategia de despliegue.

## Rutas destino
- `docs/fase-3-arquitectura/03.00-arquitectura.md`
- `docs/fase-3-arquitectura/03.01-decisiones-tecnologia.md`
- `docs/fase-3-arquitectura/03.03-plan-despliegue.md`
- `docs/fase-3-arquitectura/adr/`
- `likec4/`

## Regla de trazabilidad
No inventes tecnologia sin justificar su relacion con RNF, restricciones y operacion esperada.

## Verificacion minima
- Las decisiones responden a RNF o restricciones reales.
- La salida deja trazabilidad hacia ADR, C4 y despliegue.
- Se distinguen propuestas de decisiones ya aprobadas.

## Referencias
- `../references/security-and-risk.md`
- `../references/documentation-and-traceability.md`

