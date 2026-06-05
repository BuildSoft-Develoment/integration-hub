---
origin: reingenieria
---

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

### Evolucion: fuentes de almacenamiento cloud (ADR-006, WIP)

Amplia el catalogo para descargar archivos desde almacenamiento de objetos en la nube,
seleccionando explicitamente el proveedor y la ubicacion. Reutiliza el SPI de fuentes y el
bloque comun de seleccion; no cambia el motor. Ver
[ADR-006](../../docs/fase-3-arquitectura/adr/ADR-006-fuentes-almacenamiento-cloud.md).

- RF-006 crear fuentes de almacenamiento cloud `s3` (AWS), `gcs` (Google Cloud Storage) y
  `azure-blob` (Azure Blob Storage), con seleccion explicita de proveedor y ubicacion
  (bucket/contenedor + prefijo/key).
- RF-007 autenticarse con credenciales nativas del proveedor (IAM role/instance-profile,
  Application Default Credentials/Workload Identity, Managed Identity) o con claves explicitas
  referenciadas via `${secret:...}` (nunca en claro).
- RF-008 descargar los objetos por streaming, sin cargar el archivo completo en memoria, para
  soportar archivos grandes.

## Reglas de negocio

- solo perfiles administrativos (`integration-admin`, `platform-admin`) crean o editan fuentes
- la configuracion debe soportar secretos referenciados, nunca valores en claro
- el `name` de la fuente es unico
- una fuente invalida no debe quedar activa

## Criterios de aceptacion

- se puede crear una fuente por cada tipo soportado
- la plataforma persiste la definicion
- la fuente queda disponible para `FILE_READ`
- la UI ofrece un formulario de configuracion especifico por tipo (`filesystem`, `ftp`, `sftp`, `rest`)
- los secretos se capturan en la UI como referencia `${secret:...}`, nunca en claro
- (cloud, WIP) la UI permite elegir proveedor (`s3`/`gcs`/`azure-blob`), ubicacion (bucket/contenedor
  + prefijo) y modo de autenticacion (nativo o claves `${secret:...}`); la descarga es por streaming

## Gates

Feature reconstruida por reingenieria sobre codigo en produccion; los gates de proceso se registran como `pending` hasta su validacion humana formal.

- `gate-spdd-approved`: pending
- `gate-prototype-ready`: pending
