# ADR-025 — Las credenciales de una fuente se validan en el servidor, y quien sabe cuales son es el provider

- **Estado**: aceptada
- **Fecha**: 2026-08-05
- **Ambito**: catalogo de fuentes (`platform-app`, `platform-spi`, frontend `sources`), requisito QA-006

## Contexto

QA-006 exige que las credenciales de una fuente se persistan **solo** como referencia
`${secret:...}`, nunca en texto plano. El control existia y estaba escrito con cuidado. Fallaba en
dos sitios a la vez, y los dos fallos son la misma clase de error.

**1. El control vivia entero en el navegador.** `source-catalog-command.service.ts` bloqueaba el
guardado desde el formulario, y `SourceCatalogService.apply()` guardaba el `configurationJson` tal
cual, sin mirarlo. Un `POST` directo a `/api/source-definitions` -o un cliente que no fuera nuestra
SPA- persistia el secreto en claro sin encontrar ninguna resistencia. Un control que solo esta en el
cliente no es un control: es una sugerencia.

**2. La lista de campos protegidos era central, y se quedo atras.** El mapa
`SOURCE_CREDENTIAL_KEYS` cubria `SFTP`, `FTP`, `S3`, `OCI_OBJECT_STORAGE` y `REST`. No cubria `GCS`
ni `AZURE_BLOB`, anadidos despues. Y como el lookup terminaba en `?? []`, para esos dos tipos el
resultado no era "no lo se": era **"no hay nada que proteger"**. Consecuencia medida: el
`serviceAccountJson` de Google -que lleva la clave privada RSA dentro- y el `connectionString` de
Azure -que da acceso total a la cuenta- se guardaban literales en
`source_definition.configuration_json`, mientras un password de SFTP si se rechazaba. El control
miraba a otro lado, y nada podia avisar de ello.

Hay un tercer efecto derivado del segundo: `GET /api/source-definitions` devolvia el
`configurationJson` crudo, y ese endpoint lo lee tambien el rol `AUDITOR`. Mientras toda credencial
fuera una referencia eso era inocuo -una referencia no es un secreto-; con secretos literales
guardados, se estaban entregando de verdad.

## Decision

### 1. Quien sabe que campos suyos son credenciales es el provider

Se anade `SourceProvider.credentialKeys()` al SPI. El valor por defecto se **deriva** de
`configSchema()`: un campo declarado `secret` ya significa exactamente eso, y su javadoc ya enunciaba
el invariante de QA-006. Asi los tipos aportados por plugins quedan cubiertos sin escribir nada, y
los built-in -que tienen formulario Angular propio, no schema- lo declaran explicitamente.

Devolver la lista vacia es una **afirmacion** ("este tipo no tiene credenciales", cierto para
`FILESYSTEM`), no un hueco. Un test lo comprueba contra los providers registrados.

El motivo de fondo: una lista central obliga a que alguien se acuerde de actualizarla al anadir un
tipo, y ese alguien no se acordo. Un provider no puede olvidarse de si mismo.

### 2. El servidor rechaza, no avisa

`SourceCatalogService.apply()` -por donde pasa todo lo que se persiste, venga de la UI o de un `curl`-
rechaza con `IllegalArgumentException` (HTTP 400) cualquier credencial en claro, nombrando los campos.
Se valida en `apply()` y no en `create()` porque `update()` comparte ese camino: cubrir solo la
creacion dejaria entrar el secreto por una edicion posterior.

Se rechaza en vez de auditar porque QA-006 dice "nunca", y porque un registro de auditoria no impide
que el secreto quede escrito. Rompe a cualquier cliente que hoy guarde en claro: eso es exactamente
lo que se quiere romper.

Dos detalles que no son obvios y que estan cubiertos por tests:

- Se parsea con `toMapUnresolved`. Con `toMap`, las referencias vendrian ya **resueltas a su valor
  real** y entonces toda credencial correcta pareceria texto plano: el control rechazaria justo las
  configuraciones bien hechas.
- Un campo vacio no es una credencial expuesta. REST con bearer no serializa `password`, y S3 con rol
  IAM no serializa `secretAccessKey`. Tratar el vacio como secreto seria un falso bloqueo, y un falso
  bloqueo acaba con alguien desactivando el control.

### 3. La API enmascara lo que esta en claro, y solo eso

`SourceApiMapper` sustituye por `********` los valores de credencial que **son** texto plano. Las
referencias se devuelven tal cual: hay que verlas para poder editar la fuente, y enmascararlo todo
obligaria a reescribir la credencial en cada edicion, que termina con el operador pegando el secreto
en claro otra vez.

La mascara **no** es un centinela de "mantener el valor actual". A proposito no es una referencia
valida: si alguien reedita y reenvia una fila heredada, la decision 2 la rechaza y le obliga a poner
un `${secret:...}` de verdad. Enmascarar sin esa consecuencia solo escondería el problema.

Si la configuracion no parsea se devuelve `{}`. No se puede afirmar que no contenga un secreto, y
entregarla entera "porque no se pudo comprobar" es el fail-open que este trabajo viene a quitar.

### 4. No se restringe el endpoint por rol, y el mapa del frontend se queda

**Roles**: con el enmascarado, `AUDITOR` ya no puede ver un secreto. Quitarle el endpoint seria mas
disruptivo y no anadiria proteccion.

**El mapa del frontend NO se borra**, aunque duplique informacion que el backend ya tiene. Se
considero alimentarlo desde `/api/source-types` -que ya devuelve los tipos locales- y se descarto por
una razon concreta: esa carga es asincrona y su `catch` deja el catalogo vacio. Un fallo de red
desactivaria el bloqueo del cliente **en silencio**, que es precisamente el patron que este ADR
elimina. La autoridad es el servidor; el mapa del cliente es feedback inmediato, y su deriva la
vigila un test que lo compara con el catalogo generado desde el codigo. Por el mismo motivo no se
expone `credentialKeys` por la API: sin consumidor seria codigo muerto.

## Consecuencias

- Una fuente con credenciales en claro **ya no se puede guardar** por ningun camino. Cualquier
  automatizacion existente que lo hiciera empieza a recibir 400 con el campo ofensor en el mensaje.
- Las filas **ya guardadas** en claro siguen en la base de datos. Dejan de salir por la API, y la
  primera edicion obliga a convertirlas. No se migran automaticamente: reescribir credenciales
  ajenas sin que nadie lo pida es peor que dejarlas visibles para quien ya tiene acceso a la BD.
- Anadir un tipo de fuente nuevo obliga a decidir si tiene credenciales. Es trabajo extra, y es el
  punto.

### Hueco conocido

Si el tipo no resuelve a ningun provider no hay forma de saber que campos suyos son credenciales, y
no se puede juzgar. Rechazar seria lo coherente, pero rompe un caso legitimo: la API acepta crear una
fuente de un tipo aportado por un plugin que aun no esta instalado. Se deja pasar y se **avisa en
WARN** con el tipo concreto. Un tipo asi tampoco se puede ejecutar, asi que la ventana es estrecha;
lo que no se hace es callarse.

## Alternativas descartadas

- **Cifrar la columna en vez de exigir referencias.** Mueve el problema a la gestion de la clave de
  cifrado y deja el secreto dentro del producto. La infraestructura de secretos ya existe
  (`SecretResolver` con ocho proveedores, ADR-002); lo que faltaba era exigir que se usara.
- **Auditar en vez de rechazar.** Deja el secreto escrito y traslada el trabajo a quien lea el log.
- **Un validador central con la lista de campos por tipo.** Es lo que habia, en el frontend. Volver a
  hacerlo en Java habria reproducido el mismo fallo en otro idioma.

## Gate

Cambio de seguridad sobre el almacenamiento de credenciales → revision y firma humana. El agente no
auto-aprueba.

## Referencias

- [ADR-002 Principios de diseno](ADR-002-principios-diseno.md) (secretos `${secret:...}`)
- [ADR-006 Fuentes cloud](ADR-006-fuentes-almacenamiento-cloud.md) (GCS y Azure, los dos tipos sin cubrir)
- [ADR-014 Backend modular extensible por plugins](ADR-014-backend-modular-extensible-plugins.md) (tipos remotos con schema declarado)
- [Spec 001 - Catalogo de fuentes](../../../specs/001-catalogo-fuentes/spec-tecnica.md)
