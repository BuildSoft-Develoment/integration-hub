# Corrida manual CSRC / CRDR / CCON contra el binario nativo — 2026-08-06

**Entorno**: `https://app.buildsoft.com.pe/appih` (stack de integración on-prem, imagen **nativa** GraalVM,
navegador Chrome con sesión Keycloak del usuario).
**Ejecutor**: agente conduciendo el navegador ya autenticado. El agente **no introduce credenciales**:
las que hacían falta se resolvieron por referencia (`${secret:...}` / `${env:...}`) contra el vault PKCS12
provisionado por el usuario (ver `C:\deploy\dist\onprem\provision-vault-qa.*`).

Objetos creados durante la corrida (no hay borrado físico: la baja es lógica):

| Entidad | ID | Nombre | Estado final |
|---|---|---|---|
| Fuente | 1 | Fuente SFTP QA | Activa |
| Fuente | 2 | Fuente FTP QA | Activa |
| Fuente | 3 | Fuente S3 QA | Activa |
| Fuente | 4 | TEMP validacion requeridos | **Inactiva** (residuo del defecto QA-CSRC-09) |
| Fuente | 5 | Fuente REST QA | Activa |
| Fuente | 6 | Fuente Filesystem QA | Activa |
| Lector | 1 | Reader SWIFT MT101 QA | Activa |
| Lector | 2 | Reader CSV MT101 QA | Activa |
| Lector | 3 | Reader JSON QA | Activa |
| Lector | 4 | Reader TXT QA | Activa |
| Conexión | 1 | Conexion PG QA | Activa |

---

## CSRC — Catálogo de fuentes

| CP | Resultado | Evidencia |
|---|---|---|
| CSRC-01 | **Pass** | Búsqueda por texto (`S3` → 1 de 1), filtro Tipo (`FTP` → 1 de 1) y filtro Estado (`Inactiva` → 1 de 1 con la S3 dada de baja; `Todos` → 3 de 3). Cada fila muestra nombre, ID, tipo y estado. |
| CSRC-02 | **Pass** | SFTP contra `sftp-source:22`, `Remote path=/upload/mt101-10k.csv`, password por `${secret:connections/sftp/qa-source/password}`. Probar → "La configuración de la fuente es válida". |
| CSRC-03 | **Pass** | S3/MinIO, `authMode=access-key`, `Path-style=ON`, secret por `${secret:connections/s3/qa-minio/password}`. Probar OK. |
| CSRC-04 | **Pass** | FTP contra `ftp-source:21`, password por `${secret:connections/ftp/qa-source/password}`. Probar OK. |
| CSRC-05 | **Pass** | REST `http://echo`, `GET`, Auth = Sin autenticación, `echo-payload.json`, timeout 10 s, `application/json`. Probar OK → guardada Activa (ID 5). |
| CSRC-06 | **Pass** | Editada la fuente SFTP: `Remote path` `/upload/mt101-10k.csv` → `/upload/qa`, guardado, cerrado y reabierto: muestra el valor nuevo. Restaurada después. |
| CSRC-07 | **Pass** | SFTP con password incorrecta: Probar falla con mensaje de error de conexión/autenticación; no se cuelga ni da la fuente por buena. |
| CSRC-08 | **Pass** | Desactivada la S3 → **Inactiva** (ámbar) y el botón pasa a *Activar*; aparece bajo filtro `Estado = Inactiva`; reactivada. **No existe botón de borrado físico**. |
| CSRC-09 | **FALLA** | Ver defecto **QA-CSRC-09** abajo. |
| CSRC-10 | **Pass** | Cambiar Tipo redibuja el formulario (SFTP → Amazon S3 → REST → File system) sin romperse. |
| CSRC-11 | **Pass (configuración)** | Ver nota de entorno abajo. |
| CSRC-12 | **Pass** | SFTP resuelve la ruta completa; FTP directorio + plantilla; S3 bucket + plantilla. |

### Comprobación adicional (QA-006): la máscara no corrompe el secreto

Al editar y **volver a guardar** la fuente SFTP (CSRC-06), el campo Password se muestra enmascarado
(`••••`). Tras el guardado, *Probar fuente* **vuelve a autenticar** contra el servidor SFTP real:

> La configuración de la fuente es válida.

Es decir, la referencia `${secret:...}` sobrevive el viaje de ida y vuelta por la máscara. Este era el
riesgo real de la política de enmascarado: que un guardado desde el detalle persistiera `********`
como si fuese la credencial.

### Los 8 providers del SPI están en el binario nativo

El desplegable **Tipo** del formulario de fuente ofrece exactamente:

```
File system · FTP · SFTP · REST · Amazon S3 · Google Cloud Storage · Azure Blob Storage · Oracle Cloud (OCI) Object Storage
```

Confirma en runtime (imagen nativa, no dev) los 4 providers cloud que motivaron el trabajo de likec4
y de QA-006 sobre `credentialKeys()`.

### Nota de entorno — CSRC-11 (File system)

El texto del CP dice `Path = /data/inbox` y anticipa marcarlo N/A "porque no hay volumen montado".
**Eso ya no es cierto**: `docker-compose.int.yml` monta `./int/data-filesystem → /work/data/filesystem`
en `platform-app`. El CP se ejecutó contra la ruta real:

- `Path = /work/data/filesystem`, sin plantilla → Probar OK (la ruta existe y es legible desde el binario nativo).
- Con `Plantilla de nombre = *.csv` → Probar falla con un diagnóstico preciso:

> La ruta existe pero no hay archivos que coincidan con el selector o la plantilla de nombre.

El directorio está vacío en el servidor, así que **la lectura real no se ejercitó**: lo verificado es la
configuración, la conectividad al volumen y el mensaje de error diferenciado (ruta inexistente vs sin
coincidencias). Para cerrar la lectura real basta dejar un `.csv` en `int/data-filesystem/`.

### `selectionMode` en File system — comprobado, NO es un defecto

Al guardar con `Modo de selección = Todos los archivos` y **sin** plantilla de nombre, al reabrir la
fuente el campo vuelve a `Ultimo modificado`. Parece pérdida de dato, pero no lo es:

- Frontend `file-system-source.provider.ts:47` sólo serializa `selectionMode` si hay `fileNameTemplate`.
- Backend `FilesystemSourceProvider.selectFiles()` sólo usa `selectionMode` dentro de `resolveFromDirectory`,
  al que **únicamente** se llega si hay `fileNameRule`; sin selector la ruta se trata como un fichero único.

O sea: sin plantilla el valor no tendría ningún efecto, y el frontend lo omite a propósito. Comprobado
que **con** plantilla (`*.csv`) el valor sí persiste (`Todos los archivos` tras reabrir).

Queda como observación menor de UX, no como defecto de datos: el formulario deja elegir un modo de
selección que va a descartar en silencio. Lo honesto sería deshabilitar el combo mientras la plantilla
esté vacía.

---

## Defecto QA-CSRC-09 — el alta acepta una fuente sin la configuración obligatoria del provider

**Severidad**: Media · **Tipo**: Negativo / validación · **Estado**: abierto

**Qué pide el CP**: "No deja guardar incompleto: el botón Guardar está deshabilitado o marca el campo requerido".

**Qué ocurre**:

1. *Nueva fuente*, Tipo SFTP. Con **Nombre y Host vacíos** el botón **Crear** está deshabilitado. Correcto.
2. Se rellena **sólo el Nombre**. **Crear se habilita** aunque Host siga vacío.
3. Inspección del DOM: ningún campo del provider (`Host`, `Usuario`, `Password`, `Ruta remota`) declara
   `required` ni `aria-required`. El único validador es el del Nombre.
4. *Probar fuente* **sí** falla, y bien:
   > No se pudo validar la fuente: Missing required configuration key: host
5. Pero **Crear guarda igual**: se creó la fuente **ID 4 "TEMP validacion requeridos"**, tipo SFTP, con
   `host` vacío, en estado **Activa**.

**Por qué importa**: la validación de claves obligatorias del provider existe (la usa *Probar*) pero **no
se aplica en el alta**. Queda un catálogo con una fuente activa e inservible, que sólo va a fallar cuando
un proceso intente leerla. Y como no hay borrado físico, la única limpieza posible es la baja lógica.

**Estado del residuo**: la fuente ID 4 quedó **Inactiva** al terminar la corrida.

**Arreglo sugerido** (el CP admite cualquiera de los dos; lo sólido es hacer ambos):
- Servidor: aplicar la misma validación de `configSchema()` en el alta/edición, no sólo en el test → 400 fail-loud.
- Cliente: derivar los `Validators.required` del `configSchema()` del provider en vez de dejarlos sólo en el Nombre.

---

## CRDR — Catálogo de lectores

| CP | Resultado | Evidencia |
|---|---|---|
| CRDR-01 | **Pass** | Lista con nombre, ID, tipo y estado; búsqueda y filtros por tipo y estado. |
| CRDR-02 | **Pass** | Reader SWIFT MT/FIN (ID 1). |
| CRDR-03 | **Pass** | Reader CSV MT101 con las 8 columnas por posición (ID 2). |
| CRDR-04 | **Pass** | Reader JSON, mappings vacíos (ID 3). |
| CRDR-05 | **Pass** | Reader TXT (ID 4) con **`Modo = fixed-length`** y campos `reference 1-16 TEXT` + `amount 17-32 NUMBER`. El detalle los muestra exactamente así tras guardar. |
| CRDR-06 | **Pass** | Editado el encoding `UTF-8` → **`ISO-8859-1`**; cerrado y reabierto: persiste. |
| CRDR-07 | **Pass** | Desactivado (botón pasa a *Activar*), aparece bajo `Estado = Inactiva` (1 de 1) y desaparece al reactivarlo (0 de 0). Sin borrado físico. Entorno restaurado: 4 lectores Activos. |

---

## CCON — Catálogo de conexiones

| CP | Resultado | Evidencia |
|---|---|---|
| CCON-01 | **Pass** | Búsqueda probada **en los dos sentidos** (`zzz-no-existe` → 0 de 0; `PG` → 1 de 1) y filtro por motor también (`Oracle` → 0 de 0; `PostgreSQL` → 1 de 1). Cada fila muestra nombre, motor y estado. |
| CCON-02 | **Pass** | Conexión PostgreSQL contra `jdbc:postgresql://postgres:5432/integration_hub`, usuario `postgres`, password por **`${env:QUARKUS_DATASOURCE_PASSWORD}`** (visible en el JSON de configuración del editor). Probar OK, guardada Activa (ID 1). |
| CCON-03 | **Pass** | Conexión nueva con los datos de CCON-02 pero password deliberadamente incorrecta: *Probar conexión* falla con `Cannot connect using the provided JDBC configuration`; no se cuelga ni da la conexión por buena. Cancelada sin crear (sigue habiendo 1 conexión). Ver observación de i18n abajo. |
| CCON-04 | **Pass** | `Tamaño máximo` `10` → `20`, guardado, **recarga completa de la página** y reapertura: muestra **20**. Ver abajo por qué hizo falta la recarga. |
| CCON-05 | **Pass** | Desactivada → **Inactiva**; filtro `Estado` probado en los dos sentidos (`Activa` → 0 de 0, `Inactiva` → 1 de 1); reactivada → Activa. Sin borrado físico. |

### CCON-04 — el primer intento no se guardó, y la UI no lo dejó claro

Secuencia real, reconstruida con el log de red:

1. Editar la conexión, `Tamaño máximo` `10` → `20`, *Guardar cambios*.
   → `PUT /api/connection-definitions/1` devolvió **401** (el token de la sesión había caducado).
2. Cerrar el panel y reabrir la conexión: el panel mostraba **20**, un valor que el servidor nunca aceptó.
3. Más tarde el detalle de la misma conexión mostraba **10**, y al salir del formulario apareció
   *"Tienes cambios sin guardar. ¿Descartar y continuar?"* — o sea, la aplicación **sabía** que el
   cambio seguía pendiente.
4. Tras volver a iniciar sesión, el mismo `PUT` devolvió **200** y, con recarga completa previa
   (store vacío → fetch real a `/api/query/connection-definitions`), la conexión muestra **20**.

Dos lecciones, una de método y una de producto:

- **Método**: el paso 2 es exactamente el falso verde que hay que evitar — *verificar un guardado leyendo
  la misma caché de cliente que lo originó*. Sin la recarga, esto se habría anotado como Pass.
- **Producto**: ver el defecto **QA-CCON-401** abajo.

### Defecto QA-CCON-401 — una escritura rechazada con 401 no se distingue de una guardada

**Severidad**: Media · **Estado**: abierto

Con el token caducado, `PUT /api/connection-definitions/1` devolvió **401** y el cambio no llegó al
servidor. Lo comprobado tras ese 401:

- El editor **salió del modo edición** y el panel de detalle renderizó el valor editado (`20`) como si
  se hubiera guardado.
- Las peticiones `GET` de la lista seguían respondiendo 200, así que la consola no daba ninguna señal
  de que la sesión hubiera caducado.
- Sólo mucho después, al abandonar el formulario, el diálogo *"Tienes cambios sin guardar"* delató que
  nunca se había guardado.

Para un operador, esto es indistinguible de un guardado correcto hasta que alguien recarga. En una
consola de configuración de un sistema que mueve dinero, una escritura perdida en silencio es un riesgo
real: se cree haber cambiado un pool, una URL o una credencial y no se cambió.

**Arreglo sugerido**: ante un 401 en una escritura, forzar la re-autenticación (renovar token o
redirigir a Keycloak) y **no** dar la operación por buena; el panel debe permanecer en modo edición
con el error visible.

### Observación de i18n en Conexiones

El error de CCON-03 llega **sin traducir**: `Cannot connect using the provided JDBC configuration`,
en una consola que por lo demás está en español. En Fuentes los mensajes equivalentes **sí** están
localizados y además son específicos ("La ruta existe pero no hay archivos que coincidan con el
selector...", "No se pudo validar la fuente: Missing required configuration key: host"). El de
Conexiones tampoco distingue causa (autenticación vs URL vs host inalcanzable). No bloquea el CP,
pero es peor diagnóstico que el de Fuentes.

---

## Pendiente para cerrar esta corrida

1. Opcional: dejar un `.csv` en `int/data-filesystem/` del servidor para cerrar la lectura real de CSRC-11.
2. Decidir el arreglo de **QA-CSRC-09** (servidor y/o cliente).
3. Decidir el arreglo de **QA-CCON-401** (manejo del 401 en escrituras).
4. Limpieza opcional: la fuente ID 4 "TEMP validacion requeridos" quedó Inactiva; no hay borrado físico.
