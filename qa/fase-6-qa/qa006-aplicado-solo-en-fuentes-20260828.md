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
