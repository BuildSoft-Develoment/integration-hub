# Seguridad y secretos

## Alcance

- uso de referencias `${secret:...}` en configuraciones
- `File Vault` local para desarrollo
- externalizacion futura en mecanismos corporativos

## Contrato vigente

Se mantiene como contrato estable:

```text
${secret:area/recurso/campo}
```

Ejemplos:

- `${secret:connections/db/conexion1/password}`
- `${secret:connections/rest/erp/password}`
- `${secret:tasks/rest/notificacion1/password}`

## File Vault local

Configuracion local minima en `application.properties`:

```properties
integrationhub.secrets.file-vault.default-provider=dev
quarkus.file.vault.provider.dev.path=../secrets/dev-secrets.p12
quarkus.file.vault.provider.dev.secret=change-me
```

Con eso, la referencia:

```text
${secret:connections/db/conexion1/password}
```

se traduce al alias `connections/db/conexion1` dentro del keystore local.

## Scripts relevantes

- `secrets/`
- `create-file-vault-secret.cmd`
- `set-connection-secret.cmd`
- `set-task-secret.cmd`
- `list-file-vault-secrets.cmd`
- `delete-file-vault-secret.cmd`

## Ejemplo JDBC con connectionRef

1. Crear el secreto local:

```bat
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot
/create-file-vault-secret.cmd /secrets/dev-secrets.p12 change-me connections/db/conexion1 admin
```

2. Usar la referencia logica en la configuracion:

```json
{
  "jdbcUrl": "jdbc:postgresql://localhost:5432/integration_hub",
  "username": "postgres",
  "password": "${secret:connections/db/conexion1/password}"
}
```

## Uso en backend

- `JsonConfigurationMapper` resuelve placeholders de secretos
- `FileVaultSecretValueProvider` traduce la clave logica al alias del keystore
- `QuarkusFileVaultSecretClient` consulta el secreto local

## Regla de evolucion

La app mantiene estable la referencia logica `${secret:...}`. Si mas adelante cambia la implementacion a Vault u otro proveedor corporativo, el contrato funcional no deberia cambiar.
