# Contrato de configuración de tareas — 009 SBS SUCAVE

El `configuration_json` de cada tipo de tarea del vertical. Es lo que el formulario del editor produce
y lo que el provider de backend lee.

Convenciones heredadas del motor: `taskRef` identifica la tarea dentro del proceso; `input` enlaza con
la salida de otra (`{source, sourceTaskRef, sourceOutput}`); `executionMode` es `once` en todas estas
—ninguna admite scatter, porque un formato regulatorio se genera entero o no se genera—.

---

## `SBS_SUCAVE_PREPARE`

Resuelve el contexto y **congela** el snapshot. Todo lo que va después trabaja con lo que esta tarea
publica.

```json
{
  "taskRef": "preparar",
  "executionMode": "once",
  "formato": "0228",
  "anexo": "01",
  "grupoRemision": "INDIVIDUAL",
  "periodo": { "modo": "ejecucion", "expresion": "${_periodoContable}" },
  "versionLayout": { "modo": "vigente-al-periodo" },
  "nombreArchivo": "${anexo}${aa}${mm}${dd}.${formatoCorto}"
}
```

| Campo | Valores | Nota |
|---|---|---|
| `formato` | código de la SBS | Del catálogo de formatos del snapshot |
| `anexo` | código de anexo | Los anexos disponibles dependen del formato |
| `grupoRemision` | código de grupo · `INDIVIDUAL` | A qué envío pertenece este anexo. Todas las cadenas de un mismo proceso deben declarar el **mismo** grupo |
| `periodo.modo` | `ejecucion` · `fijo` · `expresion` | `ejecucion` toma el periodo del calendario de la corrida |
| `periodo.valor` | `2026-08` | Solo con `modo: fijo` |
| `versionLayout.modo` | `vigente-al-periodo` · `fijada` | **Por defecto `vigente-al-periodo`** |
| `versionLayout.version` | `5.09.00` | Solo con `modo: fijada`. Es lo que hace posible regenerar un periodo pasado |
| `nombreArchivo` | plantilla | La SBS usa `NNAAMMDD.FFF`. **Lo resuelve PREPARE**, ver notas |

> **Corrección: la extensión son los TRES últimos dígitos del formato, no el código entero.** La
> plantilla decía `.${formato}`, y con `formato: "0228"` habría producido `01260930.0228` — un nombre
> que la SBS no reconoce. El correcto es **`01260930.228`**.
>
> Por eso la plantilla usa `${formatoCorto}`, que PREPARE deriva del código. Y conviene recordar que
> **el archivo no lleva extensión `.txt`**: es texto plano con la extensión del formato.

> **No hay resolutor de plantillas del motor.** Cada provider que quiere sustituir `${...}` lo hace por
> su cuenta con un `String.replace` propio (`FileCompressTaskProvider:217`,
> `FileDeliverTaskProvider:107`). No existe un mecanismo central que expanda placeholders en cualquier
> configuración.
>
> Así que `nombreArchivo` **lo resuelve `SBS_SUCAVE_PREPARE`** y lo publica ya expandido como output.
> Es correcto —conoce formato, anexo y periodo, que es todo lo que necesita— pero hay que escribirlo,
> no darlo por heredado.

**Outputs:** `snapshotId`, `layout` (el que consume `FILE_WRITE`), `nombreArchivo`, `periodo`.

> `versionLayout.modo: fijada` con una versión que no cubra el periodo pedido debe **rechazarse al
> guardar**, no al ejecutar.

---

## `SBS_SUCAVE_MATERIALIZE`

Lleva las filas del origen a la estructura del formato.

```json
{
  "taskRef": "materializar",
  "executionMode": "once",
  "input": { "source": "task-output", "sourceTaskRef": "staging", "sourceOutput": "table" },
  "snapshotRef": "preparar",
  "tablaDestino": "sucave_dataset",
  "correspondencia": [
    { "origen": "tipo_doc",     "campo": "tipoDocumento", "catalogo": "TIPO_DOCUMENTO" },
    { "origen": "num_doc",      "campo": "numeroDocumento" },
    { "origen": "razon_social", "campo": "razonSocial" },
    { "origen": "saldo",        "campo": "saldoCapital" },
    { "origen": "moneda",       "campo": "moneda", "catalogo": "MONEDA" }
  ],
  "reglasCaracter": true,
  "pageSize": 500
}
```

| Campo | Nota |
|---|---|
| `snapshotRef` | `taskRef` de la tarea PREPARE. Sin él, MATERIALIZE no sabe contra qué layout mapear |
| `correspondencia[].campo` | Campo del **diseño de registro**, no una columna arbitraria: el formulario los ofrece desde el snapshot |
| `correspondencia[].catalogo` | Traduce el valor del origen al código de la SBS. Un valor sin equivalencia es un rechazo, no un hueco |
| `reglasCaracter` | Aplica las sustituciones que el formato exige (p. ej. `Ñ` → `#`) |

**Outputs:** `table`, `mappedCount`, `unmappedCount`.

> **Corrección: MATERIALIZE NO arma la cabecera ni el trailer.** Una versión anterior le daba
> `cabecera: true` y `trailer.generar`. Eso **duplica una capacidad que `FILE_WRITE` ya tiene**:
> `writeHeaderIfPresent` / `writeTrailerIfPresent` los emiten desde el layout, con los agregados que
> calcula el propio escritor. Era el mismo error que se evitó al no crear un `SBS_SUCAVE_WRITE`.
>
> MATERIALIZE produce **solo el detalle**. La cabecera y el trailer salen del layout que publica
> PREPARE, y los escribe el motor.

> ⚠️ **Limitación verificada del motor, y puede morder.** Leyendo desde tabla —que es exactamente esta
> cadena— `FILE_WRITE` **rechaza un `sum` en la cabecera** (`guardNoTableHeaderSum`, `FileWriteTaskProvider:368`):
>
> > *"aggregate 'sum' is not supported in the header for a table source; put the sum in the trailer"*
>
> Es razonable —el total se acumula al hacer streaming, y en la cabecera aún no se conoce— y un
> **conteo** sí funciona, con una consulta previa. Pero **dónde va el total lo decide la SBS, no
> nosotros**. Si el diseño de registro de un formato pide una suma en la cabecera, esta cadena no puede
> producirlo tal cual: haría falta pre-calcular en MATERIALIZE y pasarlo como valor fijo, o que el motor
> admita un agregado pre-computado.
>
> **Comprobarlo en el diseño de registro del 0228 antes de B2.** Es barato de mirar y caro de descubrir
> tarde.

---

## `SBS_SUCAVE_VALIDATE`

```json
{
  "taskRef": "validar",
  "executionMode": "once",
  "input": { "source": "task-output", "sourceTaskRef": "materializar", "sourceOutput": "table" },
  "snapshotRef": "preparar",
  "reglasAdicionales": "",
  "failOn": "ERROR",
  "publishIssuesTo": { "table": "sucave_validation_issue", "connectionRef": "" },
  "maxIssuesInOutput": 1000,
  "continueOnFailure": false,
  "pageSize": 500
}
```

| Campo | Nota |
|---|---|
| `reglasAdicionales` | Reglas propias de la entidad **encima** de las del snapshot. Nunca las sustituyen |
| `failOn` | `ERROR` · `WARNING` — severidad a partir de la cual se detiene |
| `publishIssuesTo` | Tabla + conexión. **Vaciar la tabla apaga el sink**, igual que en `MT101_VALIDATE` |
| `maxIssuesInOutput` | Tope de la muestra que viaja en el output; el detalle completo vive en la tabla |

**Outputs:** `validCount`, `invalidCount`, `issueCount`, `issues[]` (muestra).

> El draft del formulario debe transportar `publishIssuesTo` **verbatim** cuando no sepa parsearlo. En
> MT101 stringificarlo escribía `[object Object]` y el backend lo rechazaba en ejecución.

---

## `SBS_SUCAVE_POST_VALIDATE`

Comprueba el **archivo escrito**. Es la última red antes de entregarlo.

```json
{
  "taskRef": "revisar-archivo",
  "executionMode": "once",
  "input": { "source": "task-output", "sourceTaskRef": "escribir", "sourceOutput": "artifact" },
  "snapshotRef": "preparar",
  "comprobaciones": {
    "recuentoLineas": true,
    "longitudFija": true,
    "encoding": true,
    "nombreArchivo": true,
    "cuadreTrailer": true
  },
  "siNoCuadra": "detener"
}
```

| Comprobación | Qué mira |
|---|---|
| `recuentoLineas` | Líneas del archivo contra los registros que MATERIALIZE declaró |
| `longitudFija` | Que cada línea tenga la longitud **en bytes** de su tipo de registro. Ver notas |
| `encoding` | Que el archivo sea legible en el encoding declarado y sin caracteres prohibidos |
| `nombreArchivo` | Que el nombre siga la nomenclatura del formato y el periodo |
| `cuadreTrailer` | Que los totales del trailer coincidan con el contenido real |

`siNoCuadra`: `detener` (por defecto) · `continuar-con-aviso`.

**Outputs:** `checkedLines`, `failedChecks[]`, `qualified` (booleano).

> `cuadreTrailer` es la comprobación que justifica la tarea entera. Un archivo cuyo trailer dice 12 486
> y contiene 12 480 líneas pasa cualquier validación previa —los registros eran válidos uno a uno— y lo
> rechaza la SBS.

> **Corrección: las líneas de un archivo NO miden todas lo mismo.** Una versión anterior de esta tabla
> decía *"que toda línea tenga la longitud del diseño de registro"*, en singular. Un diseño real tiene
> **una longitud por tipo de registro** — en el 0228 la cabecera ocupa 37 posiciones y el detalle 946.
> Esa comprobación, tal como estaba escrita, habría fallado en **todos** los archivos válidos.
>
> El motor ya lo soporta: `TxtWriter` toma columnas propias para cabecera (`layout.header`), detalle y
> trailer, así que las secciones pueden tener anchos distintos. El error era mío, en la comprobación.

> **Y se mide en BYTES, no en caracteres.** `TxtWriter` valida el ancho con `text.length()` —
> caracteres— porque para él es suficiente. Para el archivo que lee la SBS **no lo es**: si el encoding
> no es el correcto, un `Ñ` o una tilde ocupan dos bytes y desplazan todas las posiciones siguientes,
> con el conteo de caracteres perfectamente correcto.
>
> Es el único sitio del diseño donde se puede atrapar ese fallo, así que aquí se mide en bytes. Ver
> §*El encoding no está fijado* en la spec técnica.

---

## `SBS_SUCAVE_PACKAGE_VALIDATE`

**Solo en formatos con remisión grupal.** Un formato de un anexo no lleva esta tarea.

Comprueba el **conjunto** antes de entregar nada: es lo único que ninguna cadena puede verificar por sí
sola, porque cada una solo ve su anexo.

```json
{
  "taskRef": "revisar-paquete",
  "executionMode": "once",
  "grupoRemision": "G01",
  "cadenas": ["revisar-01", "revisar-02"],
  "comprobaciones": {
    "gruposCoinciden": true,
    "periodoUnico": true,
    "versionCompatible": true,
    "anexosObligatoriosPresentes": true,
    "relacionesEntreAnexos": true
  },
  "siFalta": "detener"
}
```

| Campo | Nota |
|---|---|
| `cadenas` | Los `taskRef` de las tareas de revisión por archivo. Cada una aporta su artefacto ya calificado |
| `gruposCoinciden` | Que todas las cadenas declaren el mismo `grupoRemision` — ninguna de otro grupo |
| `periodoUnico` | Que todos los anexos sean del mismo periodo. Mezclar periodos produce un envío que la SBS rechaza entero |
| `versionCompatible` | Que todos usen una definición regulatoria compatible entre sí |
| `anexosObligatoriosPresentes` | Que no falte ninguno de los que el grupo exige |
| `relacionesEntreAnexos` | Los cuadres cruzados que el formato defina (p. ej. que un total del anexo 02 coincida con la suma del 01) |

**Outputs:** `grupo`, `anexos[]`, `packageReady` (booleano), `missing[]`.

> **Tres de estas comprobaciones no van aquí.** *No hay un anexo de otro grupo*, *están todos los
> obligatorios* y *no falta un prerequisito* se saben **mirando el grafo al publicar**, así que las
> hace el validador del vertical. Dejarlas solo en ejecución sería descubrir al correr algo que se
> sabía al guardar. Aquí quedan como red de seguridad, no como única defensa.

---

## `FILE_WRITE` con el layout del formato

> **Corrección.** Una versión anterior de este documento escribía `layout ← preparar.layout` como si
> `FILE_WRITE` supiera recibirlo. **No sabe**: `FileWriteTaskProvider:105` lee `layout` de su propia
> configuración literal (`mapValue(configuration.get("layout"))`). Solo `input` admite binding por
> `sourceTaskRef`. Tal como estaba escrito, alguien tendría que teclear a mano las 24 columnas del
> diseño de registro con sus anchos, rellenos y alineaciones — para cada formato y cada anexo.

**Decisión: se extiende `FILE_WRITE` del motor para aceptar el layout por referencia.**

```json
{
  "taskRef": "escribir",
  "format": "TXT",
  "input":  { "source": "task-output", "sourceTaskRef": "materializar", "sourceOutput": "table" },
  "layout": { "source": "task-output", "sourceTaskRef": "preparar",     "sourceOutput": "layout" }
}
```

`layout` pasa a admitir la **misma forma de binding que `input` ya tiene**. Si trae `source`, se
resuelve desde los outputs de la ejecución; si trae columnas, se usa literal como hasta hoy. Cambio
retrocompatible.

### Un archivo que no es de la SBS se comporta igual que hoy

El cambio es **aditivo y opt-in por la forma del dato**: si `layout` trae columnas, se usa literal
como siempre. Un proceso que escribe un CSV de conciliación o un TXT para un proveedor no se entera
de que esto existe. Sin migración, sin re-guardar nada.

Tres cosas lo garantizan:

**El validador nunca lo ve.** El contrato de `ProcessDefinitionValidator` obliga a cada validador a
*"ignorar en silencio los procesos que no le incumben"*. Un proceso sin tareas SUCAVE no llega a la
regla.

**El formulario ya sabe cambiar de modo, y lo hace derivándolo.** Hay un solo componente para
`FILE_WRITE` (`processes.providers.ts:44`), y su propio comentario lo dice: *"El modo se DERIVA (no hay
toggle, paridad con DB_WRITE): con tarea de origen → records; sin tarea → tabla directa"*. El layout
sigue exactamente esa regla: con `layout.source` → resuelto y de solo lectura; sin él → el editor de
columnas de siempre. No hay un interruptor nuevo que alguien pueda dejar mal puesto.

**No es una capacidad de SUCAVE.** Cualquier vertical que publique un layout puede consumirlo —
ISO 20022 tendrá el mismo problema el día que genere un fichero con estructura fija. Por eso el cambio
va en el motor y no en `vertical-sbs-sucave`.

### En una cadena SUCAVE, el literal se rechaza

El motor conserva las dos formas —cualquier proceso no regulatorio sigue escribiendo su layout a
mano—, pero **el validador del vertical rechaza un `FILE_WRITE` con layout literal aguas abajo de una
cadena SUCAVE**, y el formulario del paso ni siquiera lo ofrece: muestra la versión resuelta en solo
lectura.

No es rigidez por gusto. Un layout tecleado en un proceso concreto:

- no corresponde a **ninguna versión registrada**, así que regenerar ese periodo más adelante no puede
  reproducirlo — rompe RF-009 en silencio;
- se queda atrás cuando la SBS publica una versión nueva, y el proceso sigue generando con los anchos
  viejos sin que nada avise;
- convierte la garantía de "una sola versión por corrida" en una promesa que nadie comprueba.

**Si un formato no está en el catálogo, se registra ahí** —queda fechado, versionado y disponible para
todos los procesos— en vez de teclearlo en uno suelto. Es la misma disciplina que ya aplica el producto
a las credenciales: se referencian, no se escriben en el sitio donde se usan.

### Por qué esta opción y no las otras dos

| Opción | Por qué no |
|---|---|
| **Crear `SBS_SUCAVE_WRITE`** | Sería una tarea del vertical solo para pasar un layout. Los SPI de escritura (`FileFormatWriterResolver`, `FileWriteSession`, `ArtifactStore`) son públicos y podría reutilizarlos sin duplicar el escritor — pero el vertical acabaría manteniendo su propio camino de artefactos, compresión y entrega. Se resuelve lo mismo con menos superficie |
| **Precargar el layout en la plantilla** | Es la trampa peligrosa: al arrastrar el formato, el `FILE_WRITE` nacería con las 24 columnas escritas. Quedan **congeladas en el diseño**, así que una actualización de la SBS obligaría a re-arrastrar la plantilla en todos los procesos — y **rompe RF-009**, porque regenerar un periodo pasado usaría el layout tecleado, no el que regía |

Lo que se persiste es **la referencia, no el layout**. Ahí está la diferencia entre poder regenerar
agosto en diciembre y no poder.

### Coste real del cambio

Menor de lo que parece: `writer.validateConfiguration(configuration)` se invoca en
`FileWriteTaskProvider:103`, **dentro de `execute`** — no al guardar. Basta resolver el layout antes de
esa línea y todo lo de abajo sigue igual. No hay validación de guardado que romper.

### La otra mitad: el formulario no debe pedir 24 columnas

El patrón ya existe en el producto. `FILE_WRITE` en modo tabla **introspecciona** la tabla y ofrece sus
columnas en vez de hacer teclearlas. Aquí es lo mismo con otra fuente de verdad: el formulario lee el
**diseño de registro** del formato elegido y muestra sus campos.

El operador ve el layout resuelto en solo lectura —los 24 campos, con su posición y su ancho— y lo
único que hace es **asociar de dónde sale cada valor**. Que es exactamente lo que ya configura en
`MATERIALIZE` con su correspondencia.

## Encadenado por defecto de la plantilla

```
preparar (PREPARE)
  → leer (FILE_READ | DB_EXECUTE_SP)
  → staging (DB_WRITE)
  → materializar (MATERIALIZE)  input ← staging.table       snapshotRef ← preparar
  → validar (VALIDATE)          input ← materializar.table  snapshotRef ← preparar
  → escribir (FILE_WRITE)       input ← materializar.table  layout ← preparar.layout (por referencia)
  → revisar-archivo (POST_VALIDATE)  input ← escribir.artifact
  → entregar (FILE_DELIVER)     a la carpeta desde la que SUCAVE lo importará
```

> **`FILE_COMPRESS` sale del camino normal.** El aplicativo SUCAVE importa **el archivo de texto**
> ("Ingresar desde archivo"), no un ZIP nuestro; y comprime **él** antes de transmitir cuando el tamaño
> lo pide —lleva 7-Zip entre sus componentes justamente para eso—. Entregarle un ZIP no le sirve.
>
> `FILE_COMPRESS` sigue siendo una tarea válida del motor y el operador puede añadirla si la quiere
> para archivo histórico o traslado interno. Lo que no hace es formar parte del blueprint regulatorio.

Todas las tareas de **esta cadena** apuntan a `preparar` con `snapshotRef`: **un solo diseño de
registro por archivo**. Repartir esa decisión por tarea permitiría que dos pasos del mismo archivo
trabajaran con versiones distintas y produjeran algo incoherente sin que nada se quejara.

## Varios anexos en un mismo envío

Un formato puede exigir varios anexos, y cada anexo es un archivo con su propio diseño de registro. El
contrato lo soporta **sin cambios**, porque `snapshotRef` es por tarea: se repite la cadena una vez por
anexo, se revisa el conjunto una sola vez, y **cada archivo se entrega por separado**.

```
preparar-01 (PREPARE · anexo 01 · grupo G01)   preparar-02 (PREPARE · anexo 02 · grupo G01)
  → materializar-01  snapshotRef ← preparar-01     → materializar-02  snapshotRef ← preparar-02
  → validar-01       snapshotRef ← preparar-01     → validar-02       snapshotRef ← preparar-02
  → escribir-01      layout      ← preparar-01     → escribir-02      layout      ← preparar-02
  → revisar-01       input ← escribir-01.artifact  → revisar-02       input ← escribir-02.artifact
                                   ↘             ↙
                      revisar-paquete (PACKAGE_VALIDATE · cadenas: revisar-01, revisar-02)
                                   ↙             ↘
              entregar-01 (FILE_DELIVER)     entregar-02 (FILE_DELIVER)
                     01260930.228                  02260930.228
                                   ↘             ↙
                          misma carpeta de importación
```

Cada archivo se revisa **por separado** —ahí vive el cuadre del trailer— y solo después se revisa el
**conjunto**. La revisión del conjunto va **antes de entregar nada**: si falta un anexo obligatorio,
no sale ninguno.

> **Esto simplifica el diseño respecto a versiones anteriores.** Mientras se dio por hecho que el
> envío era un ZIP conjunto, hacía falta extender `FILE_COMPRESS` para aceptar varias tareas de origen
> —hoy toma **un solo** `input.sourceTaskRef` (`FileCompressTaskProvider:130`)—. Sabiendo que SUCAVE
> importa archivos individuales, **ese cambio del motor deja de hacer falta**: cada cadena tiene su
> propia entrega, con el `FILE_DELIVER` de una sola entrada que ya existe.

**Lo que la regla prohíbe** es que `materializar-01` apunte a `preparar-01` y `escribir-01` a
`preparar-02`. Eso produciría un archivo con los catálogos de un anexo y los anchos de otro — con
estructura válida y datos en la columna equivocada, que es el error que ninguna revisión estructural
atrapa.

**Lo que la regla permite**, y debe permitir, es tener tantas cadenas como anexos.

### Los anexos de un grupo van en la misma ejecución

El binding `task-output` resuelve contra el mapa de salidas **de la ejecución en curso**. Así que
`PACKAGE_VALIDATE` solo puede ver los artefactos de **su propia** ejecución.

No es una preferencia de diseño: **es una restricción del motor**, y decide la operativa. Si un grupo
exige que sus anexos se comprueben juntos, tienen que estar en el mismo proceso y la misma ejecución.

### Nada se entrega si el conjunto no está completo

Con `continueOnFailure` en una cadena, sin esta regla se entregarían los anexos que sobrevivieran y
alguien cargaría en SUCAVE un envío al que le falta uno. Una presentación incompleta es peor que no
presentar: **parece completa**.

Es la segunda garantía extendida al grupo — *nada se entrega sin haber revisado el archivo* pasa a ser
*…y ninguno sale hasta que están todos*.

### El coste real está en la UX, no en el contrato

Cinco anexos son ~20 tareas del vertical más las del motor. Nadie va a cablear eso a mano sin
equivocarse, así que **el árbol de plantillas necesita una variante de formato completo**:

```
SBS → SUCAVE → Formato 0228 → Anexo 01 → desde archivo
                            → Anexo 02 → desde archivo
                            → Todos los anexos → desde archivo   ← inserta las N cadenas ya cableadas
```

Sin esa variante, la regla se cumple igual pero el operador paga el precio de montarla a mano. Es
trabajo de **B3** (jerarquía de la paleta), no del contrato.

---

## HTTP: el catálogo de destinos entregables

RF-011 añade un endpoint al motor, y es el único de esta feature: todo lo demás son contratos de
configuración de tareas, no rutas.

### GET /api/output-sinks
**Trace**: `RF-011` · **Auth**: platform-admin, integration-admin, auditor · Devuelve los tipos a los
que el motor sabe ENTREGAR. Es el espejo de salida de `GET /api/source-types`, y existe porque las
dos listas no coinciden: el catálogo de fuentes admite más tipos de entrada de los que la salida sabe
escribir, y `direction: OUTPUT`
solo dice que una fuente *quiere* ser destino, no que se pueda escribir en ella. El editor cruza esta
lista con el `sourceType` de cada fuente para no ofrecer como destino algo que fallaría al ejecutar.

Respuesta: `{ "deliverableTypes": ["AZURE_BLOB", "FILESYSTEM", "FTP", "GCS", "S3", "SFTP"] }` —
ordenados y sin distinguir mayúsculas, tal y como los resuelve `OutputSinkRegistry`. La lista sale de
los beans registrados, así que **cambia sola** cuando se añade un sink; no hay ninguna copia que
mantener.

## Paths OpenAPI

```yaml
paths:
  /api/output-sinks:
    get:
      summary: Tipos a los que el motor sabe ENTREGAR (espejo de salida de /api/source-types). El editor lo cruza con el sourceType de cada fuente para no ofrecer como destino algo que no se puede escribir
      operationId: listOutputSinkTypes
      responses:
        '200':
          description: OK
```
