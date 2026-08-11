# ADR-026 — Vertical SBS SUCAVE, y toda fuente de entrada debe tener su salida

- **Estado:** propuesto
- **Fecha:** 2026-08-10
- **Contexto previo:** ADR-016 (salida genérica), ADR-017 (destino unificado), ADR-021 (límite
  motor ↔ verticales), ADR-023 (schema por módulo)
- **Feature:** [`specs/009-sbs-sucave`](../../../specs/009-sbs-sucave/README.md)
- **Análisis:** [`analisis-sbs-sucave-vertical-20260810.md`](../analisis-sbs-sucave-vertical-20260810.md)

## Contexto

Una entidad supervisada por la SBS debe presentar decenas de formatos regulatorios vía SUCAVE. Cada
uno tiene un **diseño de registro**: un layout posicional de ancho fijo con reglas y catálogos que la
SBS actualiza con frecuencia (versión vigente 5.10.00, mayo 2026).

Es el segundo vertical del producto. El primero (MT101) forzó ADR-021, que dejó el camino de
extensión hecho: `TaskProvider`, `ProcessDefinitionValidator`, `PROCESS_TEMPLATE_REGISTRY`,
categorías de paleta, Flyway y schema por módulo. Este ADR comprueba que ese camino se sostiene con
un estándar de naturaleza distinta —regulatorio, no de mensajería— y registra lo único que no encajó.

## Decisión 1 — El vertical se llama `sbs-sucave` y no toca el motor

Módulo `vertical-sbs-sucave` (paquete `com.integrationhub.vertical.sbs.sucave`), lib
`frontend/libs/features/sbs-sucave`, migraciones en `db/migration-sucave` con schema propio.

Aporta **dos** tipos de tarea: `SBS_SUCAVE_PREPARE` (resuelve formato, anexo, periodo y versión de
layout) y `SBS_SUCAVE_VALIDATE`. Todo lo demás es del motor.

**No se crea un `SBS_SUCAVE_WRITE`.** `TxtWriter` ya escribe ancho fijo con `length`/`pad`/`align` por
columna y falla si un valor desborda: un diseño de registro **es** eso. Duplicarlo dentro del vertical
rompería la razón de ser de ADR-016.

## Decisión 2 — El alcance termina al depositar el archivo

El propósito es **generar**: producir los archivos, empaquetarlos en ZIP y dejarlos en un destino ya
configurado. La presentación a la SBS la hace una persona.

En consecuencia **no** se modela el recibo de entrega, el guard de entrega ni el ciclo de vida ante el
regulador (enviado → observado → aceptado, rectificaciones). Si algún día se automatiza el envío,
entra; hoy sería modelar un diálogo que el sistema no mantiene.

Corolario que conviene no olvidar: **quien valida de verdad es la SBS**, que devuelve su propio
reporte. Nuestra validación local reduce rechazos; no certifica conformidad. Ningún nombre interno
debe sugerir lo contrario.

## Decisión 3 — Toda fuente de entrada debe tener su salida

Estado al escribir este ADR: **8 tipos de fuente de entrada, 2 de salida**.

| Tipo | Entrada | Salida |
|---|---|---|
| `FILESYSTEM`, `SFTP` | ✅ | ✅ |
| `FTP`, `S3`, `GCS`, `AZURE_BLOB`, `OCI_OBJECT_STORAGE`, `REST` | ✅ | ❌ |

Se adopta como **invariante del motor**: si un tipo puede leerse, debe poder escribirse. La asimetría
no era una decisión, era una deuda: ADR-016 introdujo la salida genérica con los dos transportes que
el money-path necesitaba y nadie completó el resto.

Es trabajo del **motor**, no del vertical: beneficia a cualquier estándar y no puede vivir en
`vertical-sbs-sucave`.

### El invariante se convierte en trinquete, no en buena intención

[`90.17-catalogo-de-tipos.md`](../../transversal/90.17-catalogo-de-tipos.md) se genera desde el código
(`ci/scripts/gen-catalogo-tipos.mjs`) y el CI falla si queda desactualizado. Hoy publica fuentes,
readers y tipos de tarea — pero **no publica los sinks**, así que la asimetría que motiva este ADR es
literalmente invisible en la documentación que el propio proyecto considera fuente de verdad.

Se extiende el generador con la sección de **salidas**, emparejada con la de fuentes. Entonces
registrar un tipo de entrada sin su salida deja de ser una omisión silenciosa y pasa a ser un fallo
de CI. Un invariante que nadie comprueba es una intención; comprobado por el generador que ya existe,
es un trinquete.

> Esta decisión salió de un doble check de este mismo ADR: al verificar el número de tipos de tarea
> que había escrito a mano —dos veces mal— quedó a la vista que el catálogo generado no cubría las
> salidas.

### Y hay que cerrar una trampa que falla tarde

El selector de destino de `FILE_DELIVER` ofrece cualquier fuente marcada `direction` OUTPUT/BOTH **sin
comprobar que exista un sink de ese tipo**. Se puede guardar un proceso con destino FTP y descubrirlo
en ejecución (`OutputSinkRegistry`: `Unsupported output sink: FTP`).

Falla ruidoso, pero después de que alguien creyó tenerlo listo. Se cierra **antes** de añadir sinks
nuevos, para que cada uno entre en un sistema que ya no miente.

### Excepción explícita: `REST` y `OCI_OBJECT_STORAGE`

`REST` de entrada es "leer de un endpoint"; de salida sería "publicar un archivo en un endpoint" —
método, autenticación, multipart, qué cuenta como éxito. **No es la operación espejo** y no se
resuelve con un port mecánico. Queda fuera del barrido, con ADR propio pendiente.

## Decisión 4 — La unidad de envío es el grupo de remisión

Un **anexo** produce un archivo; un **grupo de remisión** produce un envío. Qué anexos viajan juntos lo
declara la definición regulatoria vigente para el periodo, no el operador ni nosotros.

Un grupo de un solo anexo es el envío individual; uno con varios exige que todos estén listos antes de
empaquetar. **Un proceso cubre un grupo**, sea de uno o de varios — con lo que la disyuntiva
"¿un proceso por anexo o por formato?" desaparece: las dos eran los extremos de la misma regla.

Se añade un quinto tipo de tarea, `SBS_SUCAVE_PACKAGE_VALIDATE`, **solo presente en formatos con
remisión grupal**: comprueba el conjunto —mismo grupo, mismo periodo, versiones compatibles, ningún
obligatorio ausente, cuadres entre anexos— antes de empaquetar. Es lo único que ninguna cadena puede
verificar sola, porque cada una ve solo su anexo.

**Orden de la cadena, que importa:** cada archivo se revisa individualmente (ahí vive el cuadre del
trailer) y **después** se revisa el conjunto. Comprimir antes dejaría las comprobaciones por archivo
sin entrada — su input sería un ZIP.

Y se separan dos conceptos que hoy se confunden porque ambos son "el ZIP": el **paquete regulatorio**
(qué debe viajar junto, lo dice la SBS) y el **empaquetado de transporte** (cómo se comprime, lo decide
el tamaño). Se declara la separación; se implementa solo ZIP hasta que haya un segundo transporte.

## Decisión 5 — Los formatos son DATO, no código

Hay del orden de treinta formatos con sus anexos, y la SBS publica versiones varias veces al año. **Dar
de alta un formato no puede exigir un despliegue.**

| Pieza | Dato o código |
|---|---|
| Formato, anexo, diseño de registro, reglas, catálogos, grupos | **Dato**, versionado por periodo |
| Los cinco tipos de tarea | **Código** — son cinco y no varían por formato |
| Formularios y reglas de publicación | **Código**, con contenido de dato |

Es la razón de fondo por la que se rechazó un tipo de tarea por formato —serían treinta y crecerían con
cada resolución— y por la que el layout tecleado a mano se rechaza dentro de una cadena SUCAVE: sacaría
ese archivo del sistema de versiones.

**Dos huecos que esta decisión deja al descubierto, y que hay que cerrar para que el vertical sea
entregable:**

`PROCESS_TEMPLATE_REGISTRY` registra plantillas con `useValue`, constantes compiladas en el bundle, y
nada las trae del backend. Con MT101 no importaba —una plantilla, que cambia con el producto—; aquí
significa que un formato nuevo **no aparecería en la paleta sin una release del frontend**.

Y no existe pantalla de catálogo de formatos ni importación del diseño de registro que publica la SBS.
Sin eso, "dato" significa "un desarrollador con acceso a la base", que es justo lo que este diseño
quería evitar.

## Decisión 6 — Se versiona el FORMATO, no el grafo del proceso

Lo que cambia bajo los pies es el layout que publica la SBS, no el diseño del proceso. Cada ejecución
congela el **snapshot regulatorio** (definición de formato/anexo vigente, columnas, reglas,
catálogos), de modo que un periodo pasado pueda regenerarse con el layout que regía entonces.

Vive entero en el schema del vertical: no requiere versionar procesos en el motor.

## Alternativas descartadas

**Grafo de capacidades (`consumes`/`produces`) en el SPI de tareas.** Era la propuesta del análisis
previo para validar garantías en vez de nombres de tarea. Se descarta **por ahora**: el objetivo ya se
cumple con `ProcessDefinitionValidator` —los tres validadores de MT101 comprueban emparejamiento y
cobertura, no nombres—, cuesta declarar el contrato en los 21 tipos existentes, y no elimina la
inspección específica del vertical (haría falta igualmente un adapter que compruebe columnas y tipos):
añade una capa, no la sustituye. Se reconsidera si el editor necesita avisar del impacto al borrar un
nodo.

**Modo de invocación síncrono/asíncrono configurable con `AUTO`.** El motor ya ejecuta de forma
durable y el provider declara su capacidad de offload (`AsyncOffloadSupport`, ADR-015). Un `AUTO` que
decidiera por volumen podría elegir un modo que el provider no puede honrar. Se descarta.

> Hueco real detectado al revisar esto: la capacidad existe en el backend pero **el editor no ofrece
> ningún control** para elegir el despacho por tarea. Queda registrado como pendiente, no como parte
> de este ADR.

## Consecuencias

**A favor:** el segundo vertical valida que ADR-021 se sostiene fuera de la mensajería; la salida se
vuelve simétrica y deja de sorprender en ejecución; queda un camino para regenerar periodos pasados.

**En contra:** seis sinks nuevos son trabajo real de motor con sus credenciales y sus pruebas de
integración; y el snapshot regulatorio introduce un modelo de datos que hay que mantener al ritmo con
que la SBS publica actualizaciones —si se queda atrás, genera archivos con layout viejo en silencio.
Mitigación: el pre-vuelo de ejecución debe fallar si el snapshot vigente no cubre el periodo pedido.

**Riesgo aceptado:** los códigos de formato y versiones manejados hasta ahora provienen de una lectura
resumida de la página índice de SUCAVE. Antes de implementar el primer formato hay que leer su diseño
de registro y su instructivo directamente.
