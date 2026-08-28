# QA-006 esta aplicado solo en fuentes: conexiones y tareas no tienen politica ni enmascarado — 2026-08-28

> Entrega **para autorizacion**. No se ha implementado nada. Regla: sin caminos legacy/fallback en el fuente.

Salio revisando la mejora de ADR-031 (elegir la referencia de secreto desde la interfaz en vez de
escribirla de memoria). Al preguntar si las tareas tienen claves propias aparecio esto, que es un
hallazgo por derecho propio y no un apendice de aquel ADR.

---

## El gap, confirmado contra el codigo

QA-006 exige que una credencial se persista **solo** como referencia, nunca en texto plano. ADR-025
(2026-08-05) movio ese control al servidor. Lo que nadie hizo despues fue extenderlo a las otras dos
superficies que guardan credenciales.

**Existe una sola politica de credenciales, y es de fuentes:**

```
platform-app/src/main/java/com/integrationhub/platform/service/source/SourceCredentialPolicy.java
```

Es la unica. `find` sobre `platform-app/src/main/java` no devuelve ninguna otra, ni para conexiones
ni para tareas. Se aplica en dos sitios, los dos de fuentes: `SourceCatalogService` al escribir y
`SourceApiMapper` al leer.

**Y solo dos ficheros del backend enmascaran algo**: `SourceApiMapper` y la propia
`SourceCredentialPolicy`. Los demas mappers devuelven la configuracion cruda:

| mapper | linea | que devuelve |
|---|---|---|
| `ConnectionApiMapper` | 18 | `definition.configurationJson` |
| `ProcessDefinitionApiMapper` | 71 | `task.configurationJson` |

**En el frontend, el bloqueo vive solo en `features/sources`:**

```
source-catalog-command.service.ts:36    feedback.error('sources.credentialPlaintextBlock')
source-catalog-command.service.ts:105   plaintextCredentialKeys(config, sourceType).length === 0
source-editor.component.ts:91           plaintextCredentialKeys(config, this.form().sourceType)
```

`plaintextCredentialKeys` se indexa por **sourceType**. No hay equivalente para conexiones ni para
tareas. En tareas lo unico que hay es un texto de ayuda (`ui.compress.passwordHint`), que es un
consejo, no un control.

## Como queda el reparto

| | frontend bloquea | servidor exige | servidor enmascara al leer |
|---|---|---|---|
| Fuentes | si | si | si |
| **Conexiones** | **no** | **no** | **no** |
| **Tareas** | **no** (solo un hint) | **no** | **no** |

## Por que importa, con el argumento del propio codigo

No hace falta razonarlo de cero: `SourceApiMapper` ya lo dejo escrito cuando cerro el agujero en
fuentes, y su razonamiento aplica igual a las otras dos superficies sin cambiar una coma.

> *"QA-006: la configuracion salia CRUDA por la API, y `GET /api/source-definitions` lo lee tambien
> el rol AUDITOR. Mientras toda credencial fuera una referencia `${secret:...}` eso era inocuo —una
> referencia no es un secreto—, pero las filas guardadas antes de que el servidor lo exigiera pueden
> traer el secreto literal, y ahi se estaba entregando de verdad."*

`GET /api/connection-definitions` tiene exactamente esa forma, y hoy entrega
`configurationJson` sin tocar.

**Tres tipos de tarea tienen credencial propia** —comprobado en los providers del frontend—:

| tarea | campo |
|---|---|
| `FILE_COMPRESS` | contrasena del zip |
| `NOTIFICATION` | token del webhook |
| `REST_CALL` | credencial de la llamada |

Y el resto del sistema ya cuenta con que existan: la politica de OpenBao concede `secret/data/tasks/*`,
el keystore de integracion tiene un alias `tasks/sftp/bank`, y hay pruebas con
`${secret:tasks/rest/notificacion1/password}`.

## Lo medido en integracion

Consulta sobre las cuatro tablas con `configuration_json`, validada con control positivo —encuentra
el `${vaultkv:...}` que si existe— y sin imprimir ningun valor:

```
sftp-bank-sink   SFTP   activa   campo: password   largo: 4    usada por 0 tareas
sftp-qa          SFTP   activa   campo: password   largo: 8    usada por 19 tareas (mt101-qa)
```

Dos fuentes activas con la contrasena en claro en `configuration_json`. Son credenciales de prueba,
pero son exactamente lo que QA-006 prohibe persistir.

De las 108 tareas de ese entorno, **ninguna** tiene campo de credencial: son `MT101_*`, `DB_WRITE` y
`FILE_READ`, que no llevan credencial propia sino que apuntan a una fuente o una conexion. El riesgo
de tareas es real pero **hoy no esta materializado en integracion**; el de conexiones si lo esta en
cuanto alguien guarde una sin referencia, porque nada se lo impide.

## Lo que este documento NO afirma

**Por que existen esas dos filas en claro.** La hipotesis que encaja sin inventar nada es que son
anteriores a la politica, que nacio con ADR-025 el 5 de agosto. No hay columna de fecha en
`source_definition` para comprobarlo, y no se ha hecho arqueologia de git. Cualquier explicacion que
implique "algo se salta el control" seria especulacion.

**Que el riesgo sea igual en las tres superficies.** No lo es: en tareas hoy no hay ni una credencial
guardada. Lo que es igual es la **ausencia de control**.

## Opciones de arreglo, sin implementar

1. **Generalizar la politica.** `SourceCredentialPolicy` deja de ser de fuentes y pasa a preguntarle
   al provider correspondiente que campos son credenciales —igual que ADR-025 decidio para fuentes:
   *quien sabe cuales son es el provider*—. Es la que menos duplica y la que mas cambia.
2. **Replicar por superficie.** Una politica para conexiones y otra para tareas. Mas rapido, y tres
   sitios donde arreglar el mismo fallo la proxima vez.
3. **Solo enmascarar al leer.** Cierra la entrega del secreto por la API sin impedir que se guarde.
   Es media solucion, y deja las filas en claro en la base.

Relacionado con ADR-031: la seleccion asistida de referencias hace *facil* lo correcto, pero **no
sustituye al control**. Un desplegable no impide que alguien escriba la contrasena a mano en un campo
que nadie valida.

---

# Ampliacion — segunda pasada sobre tareas y conexiones (2026-08-28)

Escrita al ir a **implementar** el arreglo. La primera version proponia "generalizar
`SourceCredentialPolicy`" como la opcion 1. Esa propuesta se sostenia en una suposicion que no
aguanta: que el modelo de `credentialKeys()` sirve para las tres superficies. **No sirve para dos de
ellas**, y ademas el inventario de tareas afectadas estaba incompleto.

## 1. Hay mas tareas con credencial de las tres que se listaron

La primera version nombro `FILE_COMPRESS`, `NOTIFICATION` y `REST_CALL`, sacadas de los providers
del frontend. Buscando en el backend aparecen mas, y una esta en el camino del dinero:

| clase | linea | credencial |
|---|---|---|
| `FileCompressTaskProvider` | 188 | `configuration.get("password")` |
| `FtpSink` | 43 | `requireString(configuration, "password")` — **obligatoria** |
| `SftpSink` | 41 | `optionalString(configuration, "password")` — **la entrega al banco** |

`FileCompressTaskProvider:193` ya resuelve esa contrasena con
`jsonConfigurationMapper.resolveSecretsIn(...)`, asi que **el camino de resolucion de `${...}` en
tareas ya funciona**. Lo que falta no es resolver: es la politica que rechaza al escribir y enmascara
al leer.

## 2. El `default` derivado del esquema NO cubre a ninguno

`TaskProvider` tiene `configSchema()`, asi que a primera vista bastaba copiar el `default` de
`SourceProvider` —el que deriva las claves de los campos declarados `secret`—. Comprobado provider a
provider, **devolveria lista vacia en los tres**:

- `FileCompressTaskProvider` y `RestCallTaskProvider` **no declaran esquema**.
- `NotificationTaskProvider` si lo declara, y sus campos son `channel`, `message`, `url` y
  `bodyTemplate`: **ninguno es secreto**.

Y una lista vacia no es inocua. El javadoc de `SourceProvider.credentialKeys()` lo dice: *"devolver
la lista vacia es una AFIRMACION: «este tipo no tiene ninguna credencial» (...) no vale como
olvido"*. Copiar el `default` sin mas produciria tres afirmaciones falsas, con la apariencia de un
control activo.

## 3. Dos casos no caben en el modelo, y comparten forma

`credentialKeys()` devuelve **nombres de campo de primer nivel**. Hay dos credenciales que no son un
campo:

- **`REST_CALL`**: autentica por `headers`, un mapa clave-valor libre
  (`RestCallTaskProvider:64`). La credencial es una *entrada dentro* de un campo.
- **`MONGODB`**: la credencial viaja embebida en `connectionString`, en la forma
  `usuario:clave@host`.

Los dos son la misma forma de problema: **el secreto esta dentro de otro valor**. No se arregla
ampliando la lista de claves; pide otra idea (un predicado por campo, o que el provider devuelva
tambien "rutas" y no solo nombres). Ese diseno esta sin hacer.

## 4. `NOTIFICATION` guarda credenciales que el backend no lee

El provider del frontend envia estas claves (`notification-task.provider.ts`,
`NOTIFICATION_CHANNEL_KEYS`):

```
authType, username, password, token, loginUrl, loginMethod,
loginBodyTemplate, tokenPath, loginHeaders, loginTimeoutSeconds, tokenTtlSeconds
```

**Ninguna clase del backend de tareas las lee.** `NotificationTaskSupport` y `RestTaskSupport`: cero
ocurrencias. El unico lector de `authType`/`username`/`password`/`token` en todo el backend es
`RestSourceProvider`, que es una **fuente**.

Es decir: se guardan en `configuration_json` y no se consumen. Configuracion muerta transportando
credenciales vivas. Antes de protegerlas hay que decidir si deben existir.

## Que cambia en las opciones

La opcion 1 de la primera version —"generalizar la politica"— sigue siendo la direccion correcta,
pero **no es un cambio mecanico** y no puede hacerse de una pieza:

1. **Tareas con campo de primer nivel** (`FILE_COMPRESS`, `FtpSink`, `SftpSink`): encajan en el
   modelo actual. Requieren declarar `credentialKeys()` explicitamente en cada provider —no por
   `default`— y cablear la politica en el guardado y la lectura de procesos.
2. **`REST_CALL` y `MONGODB`**: no encajan. Necesitan una decision de diseno previa.
3. **`NOTIFICATION`**: necesita antes decidir si esos campos deben seguir existiendo.
4. **Conexiones**: ademas de lo anterior, no hay `ConnectionProvider` a quien preguntar. Es un
   `enum ConnectionType` manejado por `ConnectionCatalogService`.

Nada de esto invalida el hallazgo: **conexiones y tareas siguen sin ningun control**. Lo que cambia
es que el arreglo es mas grande de lo que parecia, y que una parte de el es diseno, no codigo.
