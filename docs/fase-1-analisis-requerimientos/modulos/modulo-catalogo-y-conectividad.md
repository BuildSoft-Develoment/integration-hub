# Modulo catalogo y conectividad

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a la fase](../README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [Analisis de requerimientos](../01.00-analisis-requerimientos.md)
- Siguiente: [Modulo orquestacion y ejecucion](modulo-orquestacion-y-ejecucion.md)
<!-- nav-guided:end -->

## Objetivo

Agrupar la configuracion de fuentes, readers y conexiones necesarias para que los procesos puedan operar.

## Entradas

- alta y edicion de `source definitions`
- alta y edicion de `reader definitions`
- credenciales, rutas, endpoints y parametros de conexion
- validaciones de conectividad y compatibilidad de formatos

## Salidas

- catalogo de fuentes disponible para procesos
- catalogo de readers reusable por tipo de archivo
- configuraciones persistidas y auditables
- feedback de validacion para configuracion y pruebas de conexion

## Reglas

- solo perfiles administrativos crean o editan catalogos
- una fuente debe quedar validada antes de ser usada por un proceso productivo
- un reader debe declarar formato y layout compatibles con la fuente
- los secretos no deben quedar expuestos en frontend

## Integraciones

- `Keycloak` para permisos y autorizacion
- `PostgreSQL` para persistencia de catalogos
- endpoints y servidores externos usados por `filesystem`, `ftp`, `sftp` y `rest`

## Riesgos

- configuraciones inconsistentes entre fuente y reader
- credenciales invalidas o rotadas
- conectividad intermitente con sistemas remotos
- drift entre catalogo configurado y comportamiento real del origen
