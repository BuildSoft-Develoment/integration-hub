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

## Reglas

- solo perfiles administrativos crean o editan fuentes
- la configuracion debe soportar secretos referenciados
- una fuente invalida no debe quedar activa

## Criterios de aceptacion

- se puede crear una fuente por cada tipo soportado
- la plataforma persiste la definicion
- la fuente queda disponible para `FILE_READ`
