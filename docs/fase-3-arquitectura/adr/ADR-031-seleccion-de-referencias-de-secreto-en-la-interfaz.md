# ADR-031 — La interfaz ofrece las referencias de secreto que este despliegue resuelve, en vez de que el usuario las escriba de memoria

- **Estado**: propuesta
- **Fecha**: 2026-08-22
- **Ambito**: campos de credencial de fuentes, conexiones y tareas (`platform-app`, frontend), politica de OpenBao, requisito QA-006

## Contexto

Hoy, el campo de contrasena de una fuente o de una conexion es **texto libre**. QA-006 exige que ahi
no viaje una credencial en claro sino una referencia, y ADR-025 ya movio esa validacion al servidor.
Lo que sigue faltando es lo contrario del control: **ayudar a escribir la referencia correcta**. El
usuario tiene que saberse de memoria el prefijo, la ruta y el campo.

Siete hechos condicionan el diseno. Todos verificados sobre el repositorio, y los tres ultimos
**ejecutados** contra un OpenBao 2.6.1 desechable con la politica exacta de la aplicacion.

**1. El control de QA-006 avisa, pero no guia.** El frontend marca en rojo y bloquea el guardado
(`sources.credentialPlaintext`, `sources.credentialPlaintextBlock`). Eso impide lo prohibido; no
acerca lo correcto.

**2. No hay un prefijo, hay ocho.** Siete proveedores los atienden:

| fuente | proveedor | enumerable |
|---|---|---|
| `config` | configuracion de Quarkus | no procede |
| `env` | variables de entorno | no procede |
| `secret`, `vault` | File Vault de Quarkus (keystore PKCS12) | no |
| `vaultkv` | OpenBao por HTTP | **si** |
| `awssecret`, `azuresecret`, `gcpsecret` | gestores de las nubes | exige IAM que no tenemos |

**3. `${secret:...}` funciona en integracion y FALLA en produccion, y nada lo detecta antes de
ejecutar.** Es el hecho que justifica este ADR.

- Integracion configura el file-vault: `quarkus.file.vault.provider.dev.path=/work/secrets/dev-secrets.p12`,
  con la contrasena `change-me` escrita en claro.
- La VM lo omite **a proposito**, y su propio `application.properties` lo documenta: *"Un
  `${secret:...}` en esta maquina fallara con «Missing secret value» — y eso es lo correcto: fallar
  fuerte al leer una credencial es mejor que resolverla desde un almacen cuya clave esta publicada"*.
- El patron del frontend acepta **los ocho** prefijos:
  `/^\$\{(env|config|secret|vault|vaultkv|awssecret|gcpsecret|azuresecret):[^}]+\}$/`.

Sumado: una referencia `${secret:...}` **valida, guarda, pasa el bloqueo de texto plano** y revienta
en produccion a mitad de una ejecucion, con un mensaje indistinguible de "el secreto no existe". En
el camino del dinero. Y el texto de ayuda de la pantalla recomienda justo ese prefijo.

**4. El frontend no puede saber que fuentes resuelve el backend.** 115 rutas en
`contracts/api/openapi.yaml` y ninguna lo expone. La ayuda de la interfaz no esta equivocada por
descuido: esta adivinando porque no tiene a quien preguntar.

**5. La referencia es ruta MAS campo, no una ruta.** `VaultSecretValueProvider.resolve` parte por el
ultimo `/`: `${vaultkv:connections/sftp-banco/password}` lee el secreto `connections/sftp-banco` y de
el, el campo `password`. Un desplegable de una sola dimension no sirve.

**6. Enumerar rutas ya esta autorizado. Cero permisos nuevos.** La politica de la aplicacion concede
`list` sobre `secret/metadata/connections/*` y `secret/metadata/tasks/*`. Ejecutado con un token con
esa politica exacta:

```
kv list secret/tasks                 OK   -> rest/
kv list secret/tasks/rest            OK   -> notificacion1, notificacion2
kv list secret/connections/sftp      OK   -> banco/
kv list secret/connections/sftp/banco OK  -> prod
kv list secret/                      DENEGADO
```

Lista a cualquier profundidad, distingue carpeta de secreto por la barra final, y la raiz del motor
sigue cerrada. Habia motivo para dudar —el glob termina en `/*` y listar el padre podia quedar
fuera— y la duda se resolvio ejecutandola, no leyendola.

**7. Los nombres de campo se pueden obtener SIN que los valores salgan de la boveda.** KV v2 expone
`secret/subkeys/<ruta>`, y OpenBao 2.6.1 lo implementa. Sobre un secreto de tres campos:

```json
"subkeys": { "host": null, "password": null, "usuario": null }
```

Los nombres si, los valores `null`. La alternativa —`secret/data/...`— devuelve `"password": "p"` en
claro. La politica de la aplicacion **no** cubre `subkeys` hoy: comprobado, denegado.

## Decision

Se adopta **seleccion asistida de referencias de secreto, servida por el backend**. Siete reglas.

**D1. El backend declara que fuentes resuelve este despliegue; la interfaz deja de adivinar.** Es la
regla que cierra el hecho 3, y la razon de que esto sea un ADR y no una mejora de usabilidad. Sin
ella, la pantalla seguiria recomendando en produccion un prefijo que alli falla.

**D2. El campo sigue aceptando texto libre.** Solo `vaultkv` es enumerable; `config`, `env` y los
tres gestores de nube no lo son, o exigen permisos que este despliegue no tiene. Un desplegable que
no sepa degradar a escritura manual rompe los despliegues en nube. El desplegable **asiste**, no
sustituye.

**D3. Enumerar rutas usa el token de la aplicacion tal cual.** Sin ampliar la politica, porque ya lo
permite (hecho 6). Si algun dia deja de permitirlo, la funcion se degrada a D2 en vez de fallar.

**D4. Los nombres de campo se leen por `secret/subkeys`, NUNCA por `secret/data`.** Cuesta dos lineas
de politica:

```hcl
path "secret/subkeys/connections/*" { capabilities = ["read"] }
path "secret/subkeys/tasks/*"       { capabilities = ["read"] }
```

No es una preferencia de estilo. Por `data`, el backend tendria los secretos en memoria y la
seguridad dependeria de que nadie escriba `return values` en un refactor de dentro de dos anos. Por
`subkeys`, **los valores no salen de la boveda**: el modo seguro deja de depender de la memoria de
quien mantiene el codigo.

**D5. El endpoint devuelve rutas y nombres de campo; jamas valores. Y se protege como tal.** Una
ruta no es un secreto, pero `connections/banco-XXX/sftp` dice con quien operas y cuantos son. Mismo
RBAC que editar conexiones, y registro de auditoria: en un sistema del camino del dinero, enumerar
las credenciales existentes es un acto que merece dejar rastro.

**D6. Un solo componente para fuentes, conexiones y tareas.** Los secretos de tareas ya existen
—contrasena de compresion, token de notificacion— y el aviso de texto plano ya vive en el diccionario
compartido. Tres formularios con tres desplegables distintos serian tres sitios donde arreglar el
mismo fallo.

**D7. El texto de ayuda deja de nombrar un prefijo fijo.** Lo que hoy dice `${secret:...}` pasa a
decir lo que D1 responda para ese entorno. Es la mitad barata del hecho 3, y conviene hacerla aunque
el desplegable se retrase.

## Consecuencias

**Lo que mejora.** QA-006 pasa de sostenerse sobre un bloqueo a sostenerse sobre la interfaz: lo
correcto se vuelve lo facil. Y desaparece una clase de fallo que hoy solo aparece en produccion y en
ejecucion.

**Lo que cuesta.** Un endpoint nuevo con su RBAC y su auditoria, una capacidad opcional en el SPI de
secretos —los proveedores que no sepan enumerar devuelven vacio y la interfaz degrada—, dos lineas de
politica, y un componente de frontend compartido.

**Lo que NO resuelve.** Los procesos que ya tienen `${secret:...}` guardado siguen rotos en la VM
hasta que alguien los reescriba a `${vaultkv:...}` y de de alta el valor en OpenBao. Este ADR evita
los nuevos; no migra los viejos. Merece un inventario aparte.

**Relacion con ADR-025.** No lo contradice: lo continua. ADR-025 puso la validacion en el servidor y
dejo escrito `${secret:...}` como la forma de la referencia, que era cierto cuando el unico almacen
era el file-vault. Con OpenBao en produccion, la forma correcta depende del entorno — y por eso D1
la pregunta en vez de fijarla.
