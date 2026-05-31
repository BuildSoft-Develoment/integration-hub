# Spec funcional - Catalogo de fuentes

## Objetivo

Permitir que `integration-admin` configure y mantenga fuentes `filesystem`, `ftp`, `sftp` y `rest`.

## Actores

- `integration-admin`
- `platform-admin`

## Flujo principal

1. Crear fuente.
2. Seleccionar tipo.
3. Cargar parametros de conexion.
4. Validar y guardar.
5. Dejar la fuente disponible para procesos.

## Requerimientos

- RF-001 crear una fuente por cada tipo soportado (`filesystem`, `ftp`, `sftp`, `rest`).
- RF-002 editar y activar/desactivar fuentes existentes.
- RF-003 persistir la configuracion de conexion en `configuration_json`.
- RF-004 referenciar secretos mediante el contrato `${secret:...}` sin exponer valores.
- RF-005 dejar la fuente disponible como insumo del paso `FILE_READ`.

## Reglas de negocio

- solo perfiles administrativos (`integration-admin`, `platform-admin`) crean o editan fuentes
- la configuracion debe soportar secretos referenciados, nunca valores en claro
- el `name` de la fuente es unico
- una fuente invalida no debe quedar activa

## Criterios de aceptacion

- se puede crear una fuente por cada tipo soportado
- la plataforma persiste la definicion
- la fuente queda disponible para `FILE_READ`

## Gates

Feature reconstruida por reingenieria sobre codigo en produccion; los gates de proceso se registran como `pending` hasta su validacion humana formal.

- `gate-spdd-approved`: pending
- `gate-prototype-ready`: pending
