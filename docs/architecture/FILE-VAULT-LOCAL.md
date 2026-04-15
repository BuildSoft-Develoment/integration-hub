# File Vault Local Guide

## Objetivo

Usar keystore local compatible con el contrato File Vault como almacenamiento ligero de secretos en local/desarrollo sin exponer contraseñas al frontend.

## Diferencia entre `${secret:...}` y `${vault:...}`

Hoy no hay diferencia funcional:

- `${secret:connections/db/conexion1/password}`
- `${vault:connections/db/conexion1/password}`

Ambos usan el mismo provider local de keystore PKCS12.

Se mantienen dos prefijos solo por semantica y estabilidad del contrato:

- `secret`: el placeholder recomendado para configuracion de la app
- `vault`: alias explicito si luego quieres mover la implementacion a Vault/OpenBao sin cambiar el contrato visible para los procesos

## Formato recomendado de referencia

```text
${secret:area/recurso/campo}
```

Ejemplos:

```text
${secret:connections/db/conexion1/password}
${secret:rest/api/token}
```

La app mantiene esa key logica estable. Solo cambia internamente el provider que la resuelve.

## Como se traduce en local

Para el provider local basado en keystore usamos un provider por defecto configurado en Quarkus:

```properties
integrationhub.secrets.file-vault.default-provider=dev
quarkus.file.vault.provider.dev.path=../secrets/dev-secrets.p12
quarkus.file.vault.provider.dev.secret=change-me
```

Con eso:

- `${secret:connections/db/conexion1/password}`
- provider: `dev`
- alias en el keystore: `connections/db/conexion1`
- campo resuelto: `password`

## Crear un secreto en el keystore local

Script helper:

- [create-file-vault-secret.cmd](/create-file-vault-secret.cmd)

Uso:

```bat
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot
/create-file-vault-secret.cmd /secrets/dev-secrets.p12 change-me connections/db/conexion1 admin
```

Eso crea o actualiza el alias `connections/db/conexion1` dentro de `dev-secrets.p12` con el valor `admin`.

## Ejemplo real para una conexion JDBC

1. Crear el secreto de la password:

```bat
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot
/create-file-vault-secret.cmd /secrets/dev-secrets.p12 change-me connections/db/conexion1 admin
```

2. En la definicion de conexion usar la referencia logica:

```json
{
  "jdbcUrl": "jdbc:postgresql://localhost:5432/bdtrama",
  "username": "postgres",
  "password": "${secret:connections/db/conexion1/password}"
}
```

## Alcance actual

Esto queda pensado para local/dev.

Mas adelante se puede cambiar la implementacion del backend a Vault/OpenBao sin tocar:

- `JsonConfigurationMapper`
- `DB_WRITE`
- `DB_EXECUTE_SP`
- `DB_EXECUTE_FN`
- `REST_CALL`
- `NOTIFICATION`

porque la resolucion sigue pasando por la SPI de secretos.




## Ejemplos adicionales

Tambien quedan sembrados en el keystore local estos aliases de ejemplo:

- `connections/rest/erp`
  - uso sugerido: `${secret:connections/rest/erp/password}`
- `connections/sftp/proveedor1`
  - uso sugerido: `${secret:connections/sftp/proveedor1/password}`

Archivos ejemplo:

- [connection-rest-file-vault.json](/docs/examples/connection-rest-file-vault.json)
- [connection-sftp-file-vault.json](/docs/examples/connection-sftp-file-vault.json)

## Operacion del keystore

Helpers disponibles:

- crear o actualizar un secreto:
  - [create-file-vault-secret.cmd](/create-file-vault-secret.cmd)
- listar aliases:
  - [list-file-vault-secrets.cmd](/list-file-vault-secrets.cmd)
- borrar un alias:
  - [delete-file-vault-secret.cmd](/delete-file-vault-secret.cmd)

Listar:

```bat
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot
/list-file-vault-secrets.cmd /secrets/dev-secrets.p12 change-me
```

Borrar:

```bat
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot
/delete-file-vault-secret.cmd /secrets/dev-secrets.p12 change-me connections/db/conexion1
```



## Secretos para tasks

Helper guiado para tareas:

- [set-task-secret.cmd](/set-task-secret.cmd)

Uso:

```bat
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot
/set-task-secret.cmd /secrets/dev-secrets.p12 change-me rest notificacion1 token-demo
```

Eso crea el alias:

```text
tasks/rest/notificacion1
```

y te deja listo para usar:

```text
${secret:tasks/rest/notificacion1/password}
```

La misma idea aplica a otros tipos de task, por ejemplo:

- `${secret:tasks/webhook/alerta1/password}`
- `${secret:tasks/email/notificacion-diaria/password}`
