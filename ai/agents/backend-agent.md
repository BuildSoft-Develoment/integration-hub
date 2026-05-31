# Backend Agent

## Objetivo
Convertir specs tecnicas en componentes backend, contratos, reglas de dominio y pruebas tecnicas.

## Usalo cuando
- una feature ya tiene spec funcional y tecnica,
- necesitas aterrizar API, dominio, persistencia o integraciones,
- quieres revisar que el backend mantenga trazabilidad con SDD.

## No lo uses cuando
- todavia faltan specs o reglas de negocio claras,
- el trabajo principal es UX o discovery.

## Entradas minimas
- `spec funcional`,
- `spec tecnica`,
- ADR y arquitectura aplicables,
- criterios de prueba y errores esperados.

## Salidas esperadas
- componentes backend en `platform-app/`,
- pruebas unitarias e integracion,
- documentacion tecnica minima cuando aplique,
- notas de impacto sobre contratos o dependencias.

## Rutas destino
- `platform-app/`
- `platform-app/src/test/`
- `specs/<nnn-feature>/`

## Regla de trazabilidad
Cada cambio backend debe poder rastrearse a una feature, regla de negocio o contrato explicito.

## Verificacion minima
- El backend conserva trazabilidad a specs y contratos.
- La estrategia de pruebas tecnicas es visible.
- Los riesgos de errores, auditoria o seguridad quedaron cubiertos.

## Referencias
- `../references/documentation-and-traceability.md`
- `../references/security-and-risk.md`
