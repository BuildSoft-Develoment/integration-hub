# Spec técnica — 009 SBS SUCAVE

Todo lo que sigue está contrastado contra el código de la rama, no contra documentación. Las
verificaciones y los tres errores que corregí por el camino están en
[`analisis-sbs-sucave-vertical-20260810.md`](../../docs/fase-3-arquitectura/analisis-sbs-sucave-vertical-20260810.md).

## 1. Lo que NO hay que construir

ADR-021 dejó hecho el camino de extensión. El docstring de `process-template-registry.ts` dice
literalmente *"SBS registra la suya y aparece en el editor sin tocar el motor"*.

| Necesidad | Pieza existente |
|---|---|
| Dar de alta un tipo de tarea | `TaskProvider` (SPI, descubierto por CDI) |
| Regla de publicación del vertical | `ProcessDefinitionValidator` (SPI) + `ProcessTaskView` |
| Plantilla de proceso | `PROCESS_TEMPLATE_REGISTRY` + `provideProcessTemplate()` (front) |
| Provider y formulario de tarea | `PROCESS_TASK_PROVIDERS`, `provideProcessTaskForms()` |
| Grupo propio en la paleta | `category: 'sbs-sucave'` en cada provider |
| Etiquetas del vertical | `provideSbsSucaveI18n()`, patrón de `swift-mt101-i18n.ts` |
| Schema propio en BD | `db/migration-sucave` + `quarkus.flyway.locations` (ADR-023) |
| Ensamblado en la app | `platform-plugin.manifest.ts`, dentro de `loadChildren` (lazy) |

### El calce afortunado: la salida ya tiene la forma que pide SUCAVE

`TxtWriter` (ADR-016) tiene modo **ancho fijo**: `length`, `pad` y `align` por columna,
cabecera/detalle/trailer, `encoding` (UTF-8, ISO-8859-1, Windows-1252, US-ASCII) y `lineEnding`
(LF/CRLF). Y **falla si un valor desborda su columna** — verificado en `TxtWriter.java:180-182`, no
solo en su javadoc:

```java
if (text.length() > spec.length()) {
    throw new IllegalArgumentException("TXT fixed-length: value '" + text + "' ("
            + text.length() + " chars) exceeds column width " + spec.length());
}
```

Un "diseño de registro" de la SBS **es** eso. `FILE_WRITE` se usa tal cual.

`FILE_COMPRESS` soporta ZIP y GZIP. **No se usa en el camino regulatorio** —SUCAVE importa el archivo
de texto y comprime él— pero queda disponible para archivo histórico o traslado interno.

## 2. Lo que sí falta

| Hueco | Detalle |
|---|---|
| **Sinks de salida** | 8 tipos de fuente de entrada, **2** de salida. Ver §3 |
| **Jerarquía en la paleta** | `ProcessTemplateRegistration` es plano: `{id, labelKey, tasks[]}`, una etiqueta y una lista encadenada `task[i] → task[i+1]`. Con ~30 formatos por varios anexos, una lista plana es inservible |
| **Versión del formato** | No existe nada de snapshot regulatorio. Es lo que hace posible CU-04 |
| **Pre-vuelo en ejecución** | Solo hay validación al **publicar**. El contexto regulatorio cambia en otro eje de tiempo (el periodo cierra, sube el layout), así que la validación de publicación no puede atraparlo |

## 3. Paridad entrada/salida (RF-011) — trabajo del MOTOR

Estado real hoy:

| Tipo | Entrada (`SourceProvider`) | Salida (`OutputSink`) |
|---|---|---|
| `FILESYSTEM` | ✅ | ✅ `FilesystemSink` |
| `SFTP` | ✅ | ✅ `SftpSink` |
| `FTP` | ✅ | ❌ |
| `S3` | ✅ | ❌ |
| `GCS` | ✅ | ❌ |
| `AZURE_BLOB` | ✅ | ❌ |
| `OCI_OBJECT_STORAGE` | ✅ | ❌ |
| `REST` | ✅ | ❌ (ver nota) |

**Hay una trampa que falla tarde.** El selector de destino de `FILE_DELIVER` ofrece cualquier fuente
marcada `direction` OUTPUT/BOTH, sin comprobar que exista un sink de ese tipo. Se puede elegir una
fuente FTP y **guardar el proceso sin error**; el fallo llega en ejecución, desde
`OutputSinkRegistry:35`:

```java
.orElseThrow(() -> new IllegalArgumentException("Unsupported output sink: " + type));
```

Aunque no se implemente ningún sink nuevo, **esto hay que cerrarlo**: o el picker ofrece solo tipos
con sink, o el guardado lo rechaza. Falla ruidoso, pero después de que alguien creyó tenerlo listo.

> **Nota sobre `REST` y `OCI_OBJECT_STORAGE`.** `REST` de entrada es "leer de un endpoint"; de salida
> sería "publicar el archivo en un endpoint" — método, autenticación, multipart, qué se considera
> éxito. No es el espejo de la entrada y necesita decisión de diseño propia. Se deja fuera del
> barrido mecánico.

**El invariante hay que hacerlo comprobable.** `docs/transversal/90.17-catalogo-de-tipos.md` se genera
desde el código y el CI falla si está desfasado, pero **no publica los sinks**: hoy la asimetría no la
detecta nadie. Extender `ci/scripts/gen-catalogo-tipos.mjs` con la sección de salidas convierte
"registrar una entrada sin su salida" en un fallo de CI. Ver ADR-026.

## 4. Diseño del vertical

### Tipos de tarea del vertical

> **Corrección.** Una versión anterior de este documento proponía **dos** tipos y daba por hecho que
> `FILE_WRITE` cubría el resto. No es cierto: entre "tengo filas de mi core" y "tengo el registro tal
> como lo exige el diseño" hay trabajo que el motor no puede hacer porque no conoce los catálogos de
> la SBS. Y después de escribir el archivo hay comprobaciones sobre el **artefacto** que ninguna
> tarea previa puede hacer. El análisis previo lo tenía bien con `MATERIALIZE` y `POST_VALIDATE`;
> recortarlo a dos fue un error mío.

| Tipo | Qué hace | Por qué no puede ser del motor |
|---|---|---|
| `SBS_SUCAVE_PREPARE` | Resuelve formato, anexo, periodo y versión del diseño de registro; congela el snapshot y publica el layout y el nombre de archivo | El motor no sabe qué es un periodo regulatorio ni qué versión regía |
| `SBS_SUCAVE_MATERIALIZE` | Lleva las filas del origen a la estructura del formato: traduce catálogos, calcula campos derivados y aplica las reglas de carácter. **Solo el detalle** — la cabecera y el trailer los emite `FILE_WRITE` desde el layout | Los catálogos son de la SBS. `FILE_WRITE` mapea columnas, no traduce dominios |
| `SBS_SUCAVE_VALIDATE` | Comprueba las reglas del formato sobre el dataset y publica el rechazo por registro con su motivo | Las reglas vienen del snapshot regulatorio |
| `SBS_SUCAVE_POST_VALIDATE` | Comprueba el **archivo ya escrito**: recuento de líneas, longitud fija, encoding, nombre y cuadre del trailer contra el contenido | Ocurre después de `FILE_WRITE`; ninguna tarea anterior ve el artefacto |

Del motor, sin tocar: `FILE_READ` / `DB_EXECUTE_SP`, `DB_WRITE`, `FILE_WRITE`, `FILE_COMPRESS`,
`FILE_DELIVER`.

**Deliberadamente NO se crea un `SBS_SUCAVE_WRITE`.** Escribir ancho fijo ya lo hace `FILE_WRITE` con
el layout que `PREPARE` publica, y duplicarlo dentro del vertical rompería la razón de ser de ADR-016.

### Dejar el archivo en un destino NO es remitir a la SBS

La SBS tiene **su propio canal de transporte**, y no es un SFTP genérico. Verificado: existe una *"guía
para configuración del SUCAVE (software SIX/TCL)"* publicada por la SBS, la SBS opera **dos servidores
SIX** que reparten carga según el tamaño del archivo, y la página índice de SUCAVE los nombra —
`six01.sbs.gob.pe` y `six02.sbs.gob.pe`—. El aplicativo SUCAVE de escritorio es parte del canal
oficial, no solo un validador.

También está confirmado que una presentación tiene **desenlace**: queda *"Aceptado en SBS"* o
*"Devuelto con errores"*, y la entidad puede reenviar hasta que se acepte.

De ahí una distinción que este documento no hacía:

| | |
|---|---|
| `FILE_DELIVER` | Deja un archivo en un destino técnico: disco, SFTP, S3 |
| **Remisión a la SBS** | Ocurre por el canal oficial y tiene desenlace del regulador |

**No son lo mismo, y confundirlos es el error del money-path otra vez**: *despachado* no es *aceptado*.
Es exactamente la lección de `MT101_PAY` — un envío que sale no es un pago que el banco reconoce.

#### Lo que producimos es la ENTRADA de SUCAVE, no el envío

El aplicativo importa el archivo de texto con *"Ingresar desde archivo"*, lo valida, y **después genera
él su propio artefacto de envío**, que comprime cuando el tamaño lo pide (para eso trae 7-Zip) y
transmite por SIX/TCL.

Así que la cadena termina en el **archivo de texto conforme al diseño de registro**, no en un ZIP:

- `FILE_COMPRESS` **sale del blueprint regulatorio**. Entregarle un ZIP a SUCAVE no le sirve.
- El nombre es `NNAAMMDD.FFF` — **texto plano con la extensión del formato**, no `.txt`.
- El encoding que pide es **ANSI**. En Windows eso suele ser Windows-1252, que **no es idéntico a
  ISO-8859-1** (difieren en 0x80–0x9F). Hay que confirmar cuál en el diseño de registro.

#### ⚠️ El encoding no está fijado, y su valor por defecto es peligroso aquí

`TxtWriter` lo toma de la configuración y admite **cualquier charset de la JVM** —
`Charset.forName(encoding)`—; el desplegable de cuatro opciones es solo sugerencia de la UI, no un
límite. Eso es bueno: no hace falta tocar el motor para un codepage nuevo.

**Lo peligroso es el default:**

```java
var encoding = String.valueOf(configuration.getOrDefault("encoding", "UTF-8"));
```

Una tarea que no lo declare escribe **UTF-8**. Y en un archivo de **ancho fijo** eso no es un detalle
de presentación: es corrupción silenciosa de las posiciones.

La validación de ancho mide **caracteres**, no bytes (`TxtWriter:180`, `text.length()`). Un `Ñ` o una
tilde ocupan **2 bytes en UTF-8** y 1 en Windows-1252. Así que un archivo mal codificado:

- pasa la comprobación fail-loud del ancho — el conteo de caracteres es correcto;
- sale con **las posiciones de byte desplazadas** a partir del primer carácter no ASCII;
- y la SBS lee por posición de byte.

La regla `Ñ` → `#` **reduce** el riesgo, no lo elimina: los acentos de un *José García* siguen ahí.

**Tres consecuencias de diseño:**

1. El encoding es **propiedad del diseño de registro**, no configuración suelta de la tarea. `PREPARE`
   lo publica junto al layout, y `FILE_WRITE` lo recibe por la misma referencia.
2. La comprobación `longitudFija` de `POST_VALIDATE` debe medir **bytes**, no caracteres. Si mide
   caracteres, es ciega precisamente al fallo que tiene que atrapar.
3. Un archivo regulatorio **no debería poder escribirse sin encoding declarado**. Heredar UTF-8 por
   omisión es el tipo de default que no se nota hasta que lo nota el regulador.

#### ⚠️ Y hay un fallo silencioso peor, verificado, que afecta a todo el motor

`grep CharsetEncoder|onUnmappableCharacter|CodingErrorAction` sobre `platform-app`, `platform-spi` y
`vertical-swift-mt101` no devuelve **nada**. Los dos escritores construyen su salida así:

```java
new OutputStreamWriter(nonClosing(out), Charset.forName(encoding))   // TxtWriter:82, CsvWriter:67
```

Ese constructor usa **`CodingErrorAction.REPLACE`**: un carácter que no existe en el charset elegido se
sustituye por `?` **sin error, sin aviso y sin traza**.

Combínalo con que el ancho se comprueba **antes** de codificar y el resultado es un archivo
perfectamente formado, con las posiciones exactas, y un `?` donde iba una letra. Pasa todas nuestras
comprobaciones. Lo descubre el regulador — o nadie, que es peor.

**Un archivo regulatorio debe escribirse con codificador estricto:**

```java
var encoder = charset.newEncoder()
        .onMalformedInput(CodingErrorAction.REPORT)
        .onUnmappableCharacter(CodingErrorAction.REPORT);
```

Y el error debe decir qué carácter, en qué campo y de qué registro de origen — la misma disciplina que
ya aplican los reparos de validación.

> **Esto no es un problema de SUCAVE.** Afecta igual a MT101: el nombre de un ordenante con un carácter
> fuera del charset elegido se manda al banco con un `?` y nadie se entera. Es un hallazgo del motor
> que este vertical destapó, y merece corregirse por separado.

#### La carpeta de entrega no es cualquier carpeta

Si el archivo lo importa una persona con el explorador de SUCAVE, tiene que estar **donde esa estación
pueda verlo**. Eso separa los destinos en dos grupos que no son intercambiables:

| Sirve para el handoff | No sirve directamente |
|---|---|
| Disco local, carpeta compartida SMB/UNC, unidad de red | S3, almacenamiento de objetos, blob |

S3 vale como archivo histórico o evidencia, **no** como carpeta de importación — salvo que algo
sincronice antes a una ruta accesible.

> ⚠️ **No escribir dentro de las carpetas del propio SUCAVE.** El aplicativo administra un repositorio
> de transferencia con carpetas como `Files` y `Envio`, y depositar ahí sería escribir dentro del
> estado interno de otra aplicación. La entrega va a una **zona de importación separada y nuestra**
> —p. ej. `\\fileserver\sucave-in\0228\2026-09\`—, de la que el operador toma el archivo.
>
> Es la diferencia entre *dejarlo donde lo pueda recoger* y *meterle la mano en el cajón*.

**El proceso termina en «listo para presentar», no en «entregado».** El sistema llega hasta dejar el
paquete calificado y registrado; el envío oficial lo hace el operador con el aplicativo de la SBS.

**El canal es dato regulatorio, no configuración global.** Hay evidencia de al menos tres vías —
SUCAVE/SIX-TCL, SEI SUCAVE Web y SFTP para flujos concretos— y **no son intercambiables**: cuál aplica
depende del formato, el anexo y el periodo. Va al snapshot, junto al layout y los grupos.

#### Lo que NO se automatiza, y por qué

No se implementa una integración directa contra SIX/TCL. Que se conozca el nombre del software y que
existan servidores no equivale a tener un protocolo publicado: habría sesión, autenticación,
identificación de entidad, confirmaciones y cifrado, y **reproducir eso sin especificación oficial
sería inventar un canal regulatorio**. Si algún día la SBS publica una interfaz soportada, entra por un
adaptador; hasta entonces, handoff al aplicativo oficial.

### Qué es dato y qué es código

Los formatos y anexos de la SBS **cambian**: se publican versiones nuevas varias veces al año, y hay
del orden de treinta formatos con sus anexos. Dar de alta uno **no puede exigir un despliegue**. De ahí
sale el reparto:

| Pieza | Dato o código | Por qué |
|---|---|---|
| Formato, anexo, diseño de registro, reglas, catálogos, grupos de remisión | **Dato** (snapshot, versionado por periodo) | Es lo que cambia. Es también lo que hace posible regenerar un periodo pasado |
| Los 5 tipos de tarea | **Código** | Son cinco y no varían por formato. Por eso se rechazó un tipo de tarea por formato: serían treinta y crecerían |
| Los formularios | **Código**, con contenido de dato | El formulario es fijo; los campos que ofrece salen del snapshot |
| Las reglas de publicación | **Código** | *Cada archivo un contexto*, *nada se entrega sin revisar* no dependen del formato |
| **Las plantillas de la paleta** | **CÓDIGO hoy** ⚠️ | Ver abajo |

### Modelo de datos

Todo lo de la columna *Dato* de la tabla anterior vive en el catálogo, versionado por periodo. La
forma importa porque de ella depende poder regenerar un periodo pasado.

| Entidad | Qué identifica | Notas |
|---|---|---|
| `FORMATO` | Código SBS (`0228`, `0301`…) y sistema al que pertenece (Financiero, Asegurador, SPP) | Agrupa anexos; **no** es la unidad de archivo |
| `ANEXO` | `(formato, código de anexo)` | **Es** la unidad de archivo: la nomenclatura `NNAAMMDD.FFF` lleva el anexo dentro |
| `DISEÑO DE REGISTRO` | `(formato, anexo, versión)` | El layout posicional: columnas, anchos, tipos, obligatoriedad. Dos anexos del mismo formato tienen estructuras distintas |
| `VERSIÓN` | Vigencia `[desde, hasta)` sobre periodos | Lo que hace posible RN-03. Una versión puede figurar **derogada** y seguir siendo la correcta para su rango |
| `NATURALEZA DEL ANEXO` | `RECURRENTE` · `EXTRAORDINARIO` · `RECTIFICACION` | Valor, no booleano. Decide si corresponde presentar el anexo en un periodo dado |
| `GRUPO DE REMISIÓN` | `(formato, periodo)` → lista ordenada de anexos, con cuáles son obligatorios | **La unidad de envío.** Un grupo de un solo anexo es el envío individual; no es un caso aparte |
| `CATÁLOGO` | Tablas de valores admitidos por columna | Los actualiza la SBS con frecuencia; versionan con el diseño |
| `REGLA DE VALIDACIÓN` | Ligada a `(formato, anexo, versión)` | Alimenta la comprobación previa. No sustituye la de SUCAVE |
| `EJECUCIÓN` | Proceso ejecutado | **Congela la terna `(formato, anexo, versión)`** con la que generó. Sin ese congelado, RF-009 y CA-04 son imposibles |

### Cómo se relacionan

```
FORMATO ──1:N──▶ ANEXO ──1:N──▶ DISEÑO DE REGISTRO (por VERSIÓN)
                                       │
                                       ├──▶ CATÁLOGO
                                       └──▶ REGLA DE VALIDACIÓN

FORMATO + PERIODO ──▶ GRUPO DE REMISIÓN ──N:M──▶ ANEXO  (ordenado, con obligatoriedad)

EJECUCIÓN ──▶ congela (FORMATO, ANEXO, VERSIÓN) + PERIODO
```

**Los cinco conceptos que no hay que fusionar.** `FORMATO`, `ANEXO`, `GRUPO DE REMISIÓN`, `PAQUETE
REGULATORIO` —qué debe viajar junto— y `EMPAQUETADO DE TRANSPORTE` —cómo se comprime—. Los dos últimos
se confunden porque hoy ambos serían "el ZIP", pero responden a preguntas distintas: la primera la
contesta la SBS, la segunda el tamaño del envío. En F1 se declara la separación y **no se modela el
empaquetado**: el transporte lo resuelve el aplicativo de la SBS, y abstraer un transporte antes de
tener un segundo canal sería especular.

**Lo que este modelo hace imposible.** Que dos anexos compartan diseño por pertenecer al mismo
formato; que una ejecución quede sin saber con qué versión generó; y que un grupo de remisión se
resuelva mirando el formato en vez del periodo.

#### Hueco 1 — las plantillas son código compiladas

`PROCESS_TEMPLATE_REGISTRY` registra con `useValue` un array de constantes de TypeScript, y **nada las
trae del backend**. Con MT101 daba igual: hay una plantilla y cambia con el producto.

Aquí no: **dar de alta el formato 0301 exigiría una release del frontend** para que aparezca en la
paleta, aunque su definición ya esté en el catálogo. Los formatos serían dinámicos y su puerta de
entrada estática — la contradicción se nota el día que la SBS publique un formato nuevo entre
releases.

Arreglarlo obliga a que el registro admita plantillas **construidas desde el catálogo** en vez de solo
constantes. No es cosmético: `ProcessEditorStore` las inyecta como array síncrono
(`inject(PROCESS_TEMPLATE_REGISTRY, {optional:true}) ?? []`), así que hay que resolver cuándo se
cargan. **Esto amplía B3**: no es "añadir jerarquía", es "plantillas dirigidas por dato **y**
jerárquicas".

#### Hueco 2 — no hay por dónde cargar un formato

Decir que el diseño de registro es *dato* solo es cierto si alguien puede meterlo sin escribir SQL. No
hay pantalla de catálogo de formatos, ni importación del fichero de diseño de registro que publica la
SBS (`.xls`/`.xlsx`).

Sin eso, "dinámico" significa "un desarrollador con acceso a la base", que es exactamente lo que este
diseño quería evitar. **Es una feature que no estaba en el alcance y hay que ponerla**, porque sin ella
el vertical no se puede operar sin nosotros.

#### El catálogo no puede aceptar lo que el sistema no sabe honrar

Que los formatos sean dato tiene un filo: **un catálogo abierto admite definiciones que las fases
todavía no soportan**. Si acepta una con remisión grupal antes de que exista el paquete conjunto, se
generará un envío suelto por anexo cuando la SBS espera el grupo — válido en estructura, equivocado
ante el regulador, y sin que nada falle.

La regla: **el catálogo rechaza al guardar lo que el sistema no puede procesar**, diciendo qué falta. Un
catálogo que acepta todo y procesa lo que puede es la versión de datos del mismo fallo tardío que se
corrigió en el selector de destino de `FILE_DELIVER`.

### La unidad de envío es el grupo de remisión, no el anexo

> **Corrección (revisión externa).** Este documento planteaba una disyuntiva binaria: *un ZIP por
> anexo* o *un ZIP por formato*. **Las dos son casos particulares de algo más general.** Lo que decide
> qué viaja junto no es el formato ni el anexo: es el **grupo de remisión** que la definición
> regulatoria vigente declara para ese periodo. Un grupo de un solo anexo es el envío individual; un
> grupo con todos es el envío completo. Modelarlo así no cuesta nada en el caso simple y evita
> rehacerlo cuando aparezca un formato con agrupaciones.

```
FORMATO
├── ANEXO            (unidad que produce un archivo)
│    └── ARTEFACTO REGULATORIO = formato + anexo + periodo
└── GRUPO DE REMISIÓN (unidad que produce un envío)
     ├── obligatorio / opcional por anexo
     ├── orden de remisión
     └── prerequisitos
```

**La identidad de lo que se produce es la terna `formato + anexo + periodo`.** El archivo lleva esa
terna en el nombre (`NNAAMMDD.FFF`), y es lo que hay que poder localizar, regenerar y auditar.

### Un anexo no es «activo o inactivo»: tiene naturaleza

El 0228 muestra por qué un booleano no basta. Su **Anexo 01** es trimestral y recurrente; su **Anexo
11** cubre diciembre de 2023 y diciembre de 2024, se remite **una sola vez**, y su hoja de diseño
aparece rotulada como **derogada** — mientras un oficio ordena remitirlo igualmente.

Un catálogo con `active = true/false` no puede representar eso. La naturaleza del anexo es un valor:

| Naturaleza | Qué significa |
|---|---|
| `RECURRENTE` | Se presenta cada periodo según su periodicidad |
| `EXTRAORDINARIO` | Una sola vez, para periodos históricos concretos |
| `RECTIFICACION` | Corrige una presentación anterior |

> **Este caso es la mejor justificación del snapshot versionado que hemos encontrado.** Un diseño
> marcado como derogado que aun así debe usarse para periodos de 2023 y 2024 **es** literalmente
> *"regenerar con el layout que regía entonces"*. Deja de ser una precaución elegante y pasa a ser un
> requisito del primer caso real.

**Cinco conceptos distintos, y conviene no fusionarlos:** `FORMATO`, `ANEXO`, `GRUPO DE REMISIÓN`,
`PAQUETE REGULATORIO` (qué debe viajar junto) y `EMPAQUETADO DE TRANSPORTE` (cómo se comprime). Los dos
últimos se confunden fácilmente porque hoy ambos son "el ZIP", pero responden a preguntas distintas —
la primera la contesta la SBS, la segunda el tamaño del envío.

Para F1 se declara la separación y **no se implementa ningún empaquetado**: el transporte lo resuelve
el aplicativo de la SBS. Construir una abstracción de transporte antes de tener un segundo canal sería
especular.

### `SBS_SUCAVE_PACKAGE_VALIDATE`: el quinto tipo, condicional

Cuando el formato tiene remisión grupal hace falta una comprobación que **ninguna tarea anterior puede
hacer**, porque es sobre el *conjunto*: que estén todos los anexos obligatorios del grupo, que todos
sean del mismo periodo y la misma versión, que ninguno sea de otro grupo, y que las relaciones entre
anexos cuadren.

Solo aparece en formatos con grupo. Un formato de un anexo no lo lleva.

**Sus comprobaciones se reparten en dos momentos, y mezclarlos sería el error:**

| Comprobación | Cuándo | Dónde |
|---|---|---|
| No hay un anexo de otro grupo · están todos los obligatorios · no falta un prerequisito | **Al publicar** — se sabe mirando el grafo | Validador del vertical |
| Mismo periodo · misma versión · cada anexo validó · cada archivo se generó · las relaciones cuadran | **Al ejecutar** — depende de la corrida | `PACKAGE_VALIDATE` |

Comprobar en ejecución algo que se sabía al guardar es descubrir tarde lo que se podía saber pronto.

### El orden correcto de la cadena

La revisión externa proponía `FILE_WRITE ×N → PACKAGE_VALIDATE → FILE_COMPRESS → POST_VALIDATE →
FILE_DELIVER`. **Ahí hay un problema:** si `POST_VALIDATE` corre después de comprimir, su entrada es un
ZIP, y entonces no puede hacer las comprobaciones por archivo —recuento de líneas, longitud fija,
cuadre del trailer—. Justo la del trailer era la que justificaba su existencia.

El orden que preserva las dos garantías:

```
escribir-01 → revisar-01 ┐
escribir-02 → revisar-02 ┼→ PACKAGE_VALIDATE → FILE_COMPRESS → FILE_DELIVER
escribir-03 → revisar-03 ┘
```

Cada archivo se revisa **individualmente** (ahí vive el cuadre del trailer), después se revisa el
**conjunto** (composición y coherencia), y solo entonces se empaqueta. `PACKAGE_VALIDATE` queda además
más simple: comprueba composición, no contenido.

### Formato y anexo: el anexo sigue siendo la unidad de archivo

Un formato tiene **uno o varios anexos**, y cada anexo produce **su propio archivo**. No es una
suposición: la nomenclatura de la SBS es `NNAAMMDD.FFF`, donde `NN` es el código del anexo y `FFF` el
del formato. Si el anexo va en el nombre del archivo, cada anexo es un archivo.

De ahí se derivan cuatro cosas, y conviene no discutirlas después:

| | |
|---|---|
| El **diseño de registro es por (formato, anexo, versión)** | Dos anexos del mismo formato tienen estructuras distintas — uno puede ser el detalle por deudor y otro el resumen por agencia |
| El **snapshot se identifica por esa terna** | No por formato a secas |
| **Un proceso genera un anexo**, por defecto | Es lo que hace que el árbol de la paleta tenga sentido: SBS → SUCAVE → formato → anexo → variante de flujo |
| El anexo **manda sobre todo lo que va debajo** | Layout, correspondencia de MATERIALIZE y reglas de VALIDATE dependen de él |

**Cómo se comporta la configuración cuando cambia la elección.** El desplegable de anexo se filtra por
el formato elegido. Y cambiar formato o anexo **invalida la correspondencia origen → campo** que el
operador ya había configurado en MATERIALIZE, porque los campos de destino son otros.

Eso no se resuelve borrando en silencio: hay que avisar de qué correspondencias dejan de ser válidas y
dejar que el operador decida. Un mapeo que apunta a campos de otro anexo es exactamente el tipo de
error que produce un archivo con estructura correcta y datos en la columna equivocada.

**Si varios anexos deben viajar juntos, el motor ya lo soporta.** `FileCompressTaskProvider` resuelve
una **lista** de archivos y ZIP agrupa varias entradas
(`supportsMultipleEntries`). Así que el caso "un ZIP con los cinco anexos del 0228" es un proceso con
varias ramas de escritura y un solo empaquetado — sin maquinaria nueva.

> **Pendiente de confirmar con el instructivo del formato:** cuántos anexos tiene cada formato
> objetivo, y si SUCAVE espera **un ZIP por anexo** o **uno por formato y periodo**. Eso decide si el
> caso normal es un proceso por anexo o un proceso por formato con varias ramas. El diseño soporta los
> dos; lo que falta es saber cuál es el habitual.

### Formulario de cada tarea

Cada tipo se registra en el front con su provider (draft tipado ↔ `configuration_json`) y su
componente de formulario, vía `PROCESS_TASK_PROVIDERS` y `provideProcessTaskForms(...)`, con
`category: 'sbs-sucave'` y `layout: 'workspace'` — el mismo patrón que los 12 de MT101.

El contrato de configuración de cada uno está en [`api-contract.md`](api-contract.md). Resumen de lo
que el operador ve y decide:

| Tarea | Lo que configura |
|---|---|
| **PREPARE** | Formato · anexo · de dónde sale el periodo (calendario de la ejecución, fijo o expresión) · qué versión del diseño de registro usar (*la vigente al periodo* por defecto, o una fijada) · plantilla del nombre de archivo |
| **MATERIALIZE** | Entrada · tabla de trabajo de salida · correspondencia origen → campo del formato · qué catálogos traducir · aplicar reglas de carácter |
| **VALIDATE** | Entrada · reglas adicionales sobre las del snapshot · severidad que detiene · dónde publicar los rechazos (tabla + conexión) · tope de rechazos en el output · continuar o no ante fallo |
| **POST_VALIDATE** | Artefacto de entrada · qué comprobar (recuento, longitud, encoding, nombre, cuadre del trailer) · qué hacer si no cuadra |

**Dos decisiones de forma que conviene no deshacer:**

*La versión del diseño de registro se elige en PREPARE, no en cada tarea.* Repartirla dejaría que dos
tareas de la misma ejecución trabajaran con versiones distintas, y el archivo saldría incoherente sin
que nada se quejara.

*El sink de rechazos de VALIDATE copia el patrón de `MT101_VALIDATE`*: tabla + `connectionRef`, y
**vaciar la tabla apaga el sink**. Es un patrón ya probado en producción y con su trampa conocida —el
valor crudo debe viajar verbatim cuando el hydrate no sabe parsearlo, o se escribe `[object Object]`
y el backend lo rechaza en ejecución.

### Flujo recomendado (plantilla)

```
SBS_SUCAVE_PREPARE → FILE_READ → DB_WRITE → SBS_SUCAVE_VALIDATE
                   → FILE_WRITE → FILE_COMPRESS → FILE_DELIVER
```

Es una **recomendación**, no una jaula: el operador puede quitar, sustituir o añadir tareas. Lo que
no puede es **activar** un proceso al que le falte una garantía de su propósito — que es exactamente
como se comporta hoy el motor (`ProcessCatalogService` solo valida cuando `request.active()`).

### Comportamiento definitivo del blueprint

Esta es la respuesta cerrada a *"qué pasa cuando arrastro un formato"*, y a qué puede hacer el
operador después.

**1 — Al arrastrar se inserta la cadena completa, ya cableada.** No un nodo suelto ni un asistente. El
mecanismo ya existe (`PROCESS_TEMPLATE_REGISTRY` + `ProcessEditorStore.applyTemplate`): el vertical
aporta el QUÉ —tipos, `taskRef` y overrides— y el editor el ENSAMBLADO —defaults del provider, merge,
orden y conectores—. Todas las tareas SUCAVE quedan apuntando con `snapshotRef` a la de contexto.

**2 — Después es un proceso normal, sin privilegios.** El blueprint **no se persiste**: el backend no
sabe qué plantilla lo originó, y no hay `blueprintHash` ni nodos marcados como intocables. El operador
puede **quitar, reemplazar, reordenar y añadir cualquier paso**, incluidos los de la SBS. Esto no es una
concesión: es el comportamiento que el motor ya tiene, y mantenerlo es lo que hace que el editor siga
siendo el mismo para SUCAVE que para MT101.

**3 — Un borrador roto se guarda; lo que no se puede es activarlo.** El motor ya funciona así
(`ProcessCatalogService` solo valida `if (request.active())`). Así que se puede dejar a medias el
viernes y seguir el lunes, pero no ponerlo a correr.

**4 — Lo que se exige al activar son garantías, no nombres de tarea.** Dos reglas, y solo dos:

| Regla | Por qué es innegociable |
|---|---|
| **Cada archivo se construye con un solo contexto** | Materializar, validar, escribir y revisar un mismo archivo deben apuntar al **mismo** contexto. Incluye al `FILE_WRITE`: su layout viene por referencia, nunca tecleado. Si una cadena mezclara dos contextos, el archivo saldría con los anchos de una versión y los catálogos de otra, sin que nada avisara |
| **Nada se entrega sin haber revisado el archivo** | Es la única regla que protege al regulador: un archivo con el trailer descuadrado pasa todas las revisiones de datos y lo rechaza la SBS |

> **Corrección.** La primera versión de esta regla decía *"un solo contexto"* **por proceso**. Estaba
> mal: habría rechazado el caso legítimo de varios anexos del mismo formato en un solo envío, que
> necesita un contexto por anexo. El peligro nunca fue tener dos contextos en un proceso — fue que
> **un archivo** se construyera con dos. La regla es por cadena, no por proceso.

> La primera regla alcanza a una tarea **del motor**. Es deliberado: `FILE_WRITE` sigue admitiendo
> layout literal para cualquier proceso no regulatorio, pero dentro de una cadena SUCAVE el literal se
> rechaza al activar. Un layout tecleado no corresponde a ninguna versión registrada, así que el
> archivo que produce no se puede regenerar igual más adelante — rompe RF-009 sin hacer ruido.

Todo lo demás es opcional. Se puede quitar el mapeo si el origen ya viene con la estructura del
formato; se puede quitar la revisión de datos si la entidad valida aguas arriba —se pierde el detalle
por registro, y la regla lo advierte sin bloquear—; se puede sustituir la lectura de archivo por un
procedimiento almacenado.

**5 — El propósito se deduce del grafo, no se declara.** No hay campo `purpose`. Un proceso que
termina tras la revisión de datos **es** un "solo validar" y no se le exige archivo ni post-revisión;
uno que entrega **es** un "generar y depositar" y sí. La regla mira si hay una entrega aguas abajo de
una cadena SUCAVE y actúa en consecuencia.

Es la implementación barata de lo que el análisis previo llamaba `requiredCapabilitiesByPurpose`: la
misma garantía, sin pedirle al operador que clasifique su proceso ni al motor que entienda propósitos.

### Cómo se implementa esa validación

`SucaveProcessDefinitionValidator implements ProcessDefinitionValidator`, al estilo de los tres de
MT101: lee el `configurationJson` crudo de las tareas que le incumben, ignora en silencio los procesos
ajenos, y rechaza con `IllegalArgumentException` (→ 400) explicando **la consecuencia**, no solo la
regla — *"…se entregaría a la SBS un archivo cuyo trailer nadie comprobó"*, no *"falta POST_VALIDATE"*.

### Lo que este diseño NO da, y hay que saberlo

**No avisa al borrar, solo al activar.** Si el operador quita la post-revisión, se entera cuando
intente activar. Es aceptable pero mejorable: correr los mismos validadores en seco contra el borrador
daría el aviso en el momento del borrado. Está en F7 y no necesita grafo de capacidades.

**No impide que una tarea ajena produzca el artefacto.** Si alguien escribe el archivo con un
procedimiento almacenado en vez de con la cadena SUCAVE, la regla de entrega no lo reconoce como
artefacto regulatorio y no exige revisarlo. Cerrar ese hueco es lo que el análisis previo resolvía con
el adapter de certificación (F7).

> **Por qué no un grafo de capacidades.** Es el mecanismo que proponía el análisis previo. Cuesta
> declarar `consumes`/`produces` en los 21 tipos de tarea existentes, y aun así no elimina la
> inspección específica del vertical (el propio análisis concede que hace falta un adapter que mire
> columnas y tipos): añade una capa, no la sustituye. Se difiere hasta que el editor lo pida.

### Snapshot regulatorio

Tablas propias en el schema del vertical: definición de formato/anexo versionada por vigencia, sus
columnas (nombre, posición, longitud, relleno, alineación, tipo), sus reglas y sus catálogos. Cada
ejecución **congela** el id de snapshot con el que trabajó.

Es lo que hace posible CU-04, y lo verdaderamente crítico: lo que cambia bajo los pies es el layout
del formato (la SBS va por la 5.10.00 con actualizaciones constantes), no el grafo del proceso.

## 5. Frontend

`frontend/libs/features/sbs-sucave/`, con **dos** entry points, como MT101:

- el barril, para la ruta de la feature;
- `/vocabulary`, estrecho, para que `overview`, `executions` y `audit` traduzcan las etiquetas del
  vertical sin arrastrarse la consola al chunk.

Todo lazy: los imports viven dentro de `loadChildren` en `platform-plugin.manifest.ts`.

La jerarquía de la paleta necesita ampliar `ProcessTemplateRegistration` con su ruta de grupos (p.ej.
`group: readonly string[]`) y que el árbol la pinte. Es el único cambio en una lib del core, y es
aditivo: MT101 sigue funcionando sin declararlo.

## 6. Nativo

Cualquier record que se (de)serialice con Jackson **fuera** de la capa REST debe registrarse para
reflexión, o en imagen nativa falla con "No serializer found". El vertical tendrá su propio
`SucaveReflectionRegistrations`, como hizo MT101 — el motor no nombra los tipos del vertical.

Este fichero ya documenta cuatro capturas de esa misma trampa. No es hipotética.
