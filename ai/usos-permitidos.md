# Usos permitidos de IA

[README principal](../README.md) | [Indice docs](../docs/README.md) | [Volver a IA](README.md)

## Objetivo

Delimitar los usos de IA que aportan valor real al proyecto sin sustituir decisiones de negocio, arquitectura o validacion humana.

## Usos permitidos

- consolidar notas y convertirlas en documentos oficiales por fase
- proponer estructuras de backlog, casos de uso e historias de usuario
- redactar o actualizar `specs/` y documentos tecnicos a partir de decisiones ya tomadas
- acelerar implementaciones en `platform-app/` y `frontend/` con trazabilidad a requerimientos
- preparar matrices de prueba, casos QA, checklist de salida y apoyo operativo
- revisar consistencia entre documentacion, codigo, pruebas y evidencia

## Usos no permitidos

- inventar decisiones de arquitectura sin `ADR`
- publicar borradores como entregables finales
- reemplazar aprobacion funcional, de seguridad o de despliegue
- dejar salidas fuera de rutas oficiales del repositorio
- generar texto genérico sin aterrizarlo a `Integration Hub`

## Regla de salida

Toda salida generada con IA debe terminar en una ruta canonica del proyecto:

- `docs/`
- `specs/`
- `qa/`
- `ops/`
- `ci/`
- `releases/`
- `platform-app/`
- `frontend/`
