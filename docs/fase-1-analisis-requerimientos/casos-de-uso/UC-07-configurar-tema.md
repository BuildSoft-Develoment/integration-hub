# UC-07 Configurar tema del sistema

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [UC-06 Programar proceso](UC-06-programar-proceso.md)
- Siguiente: [HU-01 Administrar fuentes](../historias-usuario/HU-01-administrar-fuentes.md)
<!-- nav-guided:end -->

## Actor principal

`Platform Admin` / `Integration Admin`

## Trazabilidad

- RF global: `RF-10` · Modulo: administracion del sistema · Feature: `specs/007-tema-del-sistema`

## Precondiciones

- el usuario tiene permisos administrativos
- existe una configuracion de tema vigente (singleton del sistema)

## Flujo principal

1. El usuario abre la configuracion de tema del sistema.
2. Consulta la configuracion vigente (`GET /api/system/theme`).
3. Ajusta esquema, preset, densidad, colores, idioma (`locale`) y modo de sidebar.
4. Guarda los cambios (`PUT /api/system/theme`).
5. La consola aplica la nueva apariencia.

## Flujos alternos

- un valor fuera del catalogo soportado es rechazado
- el backend devuelve error y se conserva el tema previo
- el rol `auditor` solo puede consultar, no guardar

## Postcondiciones

- la configuracion de tema queda actualizada (registro unico del sistema)
- la consola refleja la apariencia/locale/sidebar elegidos
