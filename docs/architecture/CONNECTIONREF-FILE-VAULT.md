# ConnectionRef With File Vault

## Objetivo

Dejar un ejemplo real de catalogo de conexiones JDBC usando una clave logica estable de secretos.

## Configuracion local minima

En [application.properties](C:/chatgtp/quarkus/platform-app/src/main/resources/application.properties):

```properties
integrationhub.secrets.file-vault.default-provider=dev
quarkus.file.vault.provider.dev.path=../secrets/dev-secrets.p12
quarkus.file.vault.provider.dev.secret=change-me
```

## Crear el secreto local

```bat
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot
C:\chatgtp\quarkus\create-file-vault-secret.cmd C:\chatgtp\quarkus\secrets\dev-secrets.p12 change-me connections/db/conexion1 admin
```

Con eso:

- referencia logica en la app: `connections/db/conexion1/password`
- provider local efectivo: `dev`
- alias real dentro del keystore: `connections/db/conexion1`
- valor de `password`: `admin`

## JSON para el catalogo de conexiones

Archivo ejemplo:

- [connection-jdbc-file-vault.json](C:/chatgtp/quarkus/docs/examples/connection-jdbc-file-vault.json)

Contenido:

```json
{
  "jdbcUrl": "jdbc:postgresql://localhost:5432/bdtrama",
  "username": "postgres",
  "password": "${secret:connections/db/conexion1/password}",
  "minSize": 0,
  "maxSize": 10,
  "acquisitionTimeoutSeconds": 30,
  "validationTimeoutSeconds": 5,
  "reapTimeoutMinutes": 5,
  "jdbcProperties": {
    "ApplicationName": "integration-hub-local"
  }
}
```

## Como usarlo en la UI

1. Ir a `Connections`.
2. Crear una conexion JDBC nueva.
3. Pegar el JSON anterior en `configurationJson`.
4. Probar la conexion.

## Flujo real en backend

- [ConnectionPoolManager.java](C:/chatgtp/quarkus/platform-app/src/main/java/com/integrationhub/platform/service/ConnectionPoolManager.java) llama a [JsonConfigurationMapper.java](C:/chatgtp/quarkus/platform-app/src/main/java/com/integrationhub/platform/service/JsonConfigurationMapper.java).
- `JsonConfigurationMapper` resuelve `${secret:connections/db/conexion1/password}`.
- [FileVaultSecretValueProvider.java](C:/chatgtp/quarkus/platform-app/src/main/java/com/integrationhub/platform/service/secret/FileVaultSecretValueProvider.java) traduce la clave logica al alias del keystore local usando el provider por defecto.
- [QuarkusFileVaultSecretClient.java](C:/chatgtp/quarkus/platform-app/src/main/java/com/integrationhub/platform/service/secret/QuarkusFileVaultSecretClient.java) consulta el secreto local.
- `ConnectionPoolManager` crea el datasource con la password ya resuelta.

## Ventaja del contrato actual

La conexion no queda acoplada a File Vault. Si despues cambias a Vault/OpenBao, el JSON puede seguir igual:

```json
{
  "password": "${secret:connections/db/conexion1/password}"
}
```

Solo cambia la implementacion interna del provider.



## Extender el patron

El mismo esquema de clave logica sirve para otras conexiones:

- DB:
  - `${secret:connections/db/conexion1/password}`
- REST:
  - `${secret:connections/rest/erp/password}`
- SFTP:
  - `${secret:connections/sftp/proveedor1/password}`

La app mantiene siempre la referencia logica. Solo cambia el alias interno del keystore o, mas adelante, la implementacion del provider externo.
