---
origin: nuevo
---

# Spec funcional — 009 SBS SUCAVE

## Problema

Una entidad supervisada por la SBS debe presentar periódicamente decenas de formatos (0100–0307,
0224, 0228–0238 en Sistema Financiero; 0040–0093 en Asegurador; 0700–0712 en SPP). Cada formato tiene
un **diseño de registro** propio: un layout posicional de ancho fijo, con reglas de validación y
catálogos que la SBS actualiza con frecuencia.

Hoy eso se prepara a mano o con scripts sueltos: sin trazabilidad de qué versión del layout se usó,
sin poder regenerar un periodo pasado, y sin que el proceso quede registrado como los demás del hub.

## Qué hace este vertical

Genera el archivo de un formato SBS a partir de datos de la entidad y lo deja listo en un
destino configurado, dentro del motor de procesos existente — con su ejecución, su auditoría y su
historial como cualquier otro proceso.

## Qué NO hace (y por qué)

**No presenta a la SBS.** El envío va por el canal oficial de la SBS —el aplicativo SUCAVE con su
software de comunicaciones SIX/TCL, o la vía que el formato tenga autorizada— y lo hace una persona. El
sistema termina dejando el archivo **listo para presentar**, no presentado.

La diferencia no es semántica: una presentación tiene desenlace del regulador —*Aceptado en SBS* o
*Devuelto con errores*, con reenvíos hasta que se acepte— y eso ocurre fuera del sistema. Tratar
"archivo depositado" como "envío hecho" es el mismo error que tratar un pago despachado como un pago
aceptado.

**No sustituye la validación de la SBS.** SUCAVE valida el archivo contra su diseño de registro y
devuelve su propio reporte. Lo que hacemos aquí es una **comprobación previa** que reduce rechazos;
no certifica nada ante el regulador. Cualquier nombre del tipo "artefacto calificado" se refiere a
nuestra comprobación local, nunca a la conformidad oficial.

**No modela el ciclo ante el regulador** (enviado → observado → aceptado, rectificaciones). Queda
fuera mientras la presentación sea manual. Si algún día se automatiza el envío, entra.

## Requisitos funcionales

| id | Requisito |
|---|---|
| RF-001 | Un operador arrastra un formato desde la paleta y obtiene un flujo completo ya configurado, que después puede editar |
| RF-002 | La paleta agrupa los formatos en árbol: SBS → SUCAVE → formato → anexo → variante de flujo |
| RF-003 | El origen de los datos puede ser archivo, tabla o procedimiento almacenado |
| RF-004 | Antes de generar, los datos se validan contra las reglas del formato; los rechazos quedan registrados con su motivo por registro |
| RF-005 | El archivo se genera en ancho fijo, con el encoding y el fin de línea que el formato exige, y falla si un valor desborda su columna **o si algún carácter no existe en esa codificación** — nunca se sustituye en silencio |
| RF-006 | El nombre del archivo sigue la nomenclatura del formato y su periodo |
| RF-007 | El archivo se entrega **sin comprimir**: es lo que el aplicativo SUCAVE importa. La compresión, cuando hace falta, la hace él antes de transmitir |
| RF-008 | El archivo se deposita en una carpeta **accesible desde la estación que ejecuta SUCAVE**, y nunca dentro de las carpetas internas del propio aplicativo |
| RF-009 | Cada ejecución congela la versión del layout con la que generó, para poder regenerar un periodo pasado tal como se presentó |
| RF-010 | Un proceso no puede activarse si le falta algo imprescindible para su propósito, y el motivo se explica |
| RF-011 | **Toda fuente de entrada del catálogo debe poder usarse también como destino de salida** |
| RF-012 | Quien prepara un envío no puede autorizar su presentación: la autorización queda a nombre de otra persona, y el control de autorizar explica por qué está bloqueado a quien no le corresponde |
| RF-013 | **La composición del envío la determina la definición regulatoria vigente para el periodo**, no el operador. Un grupo de remisión declara qué anexos viajan juntos, cuáles son obligatorios y en qué orden; no se entrega ningún archivo del grupo hasta que el vertical lo declara completo y válido |
| RF-014 | **Dar de alta un formato o una versión nueva no requiere desplegar.** Se registran desde la aplicación —importando el diseño de registro que publica la SBS— y quedan disponibles en la paleta sin release. Un formato nuevo entre versiones del producto es lo normal, no la excepción |

> RF-011 no es de SUCAVE: es del motor. Vive aquí porque es donde se detectó la asimetría.

## Actores

| Actor | Qué hace | Qué NO puede |
|---|---|---|
| **Analista regulatorio** | Ajusta el formato, genera el envío, corrige los reparos | Autorizar la presentación |
| **Responsable de cumplimiento** | Revisa el archivo generado; autoriza o devuelve con observaciones | Ajustar el formato (lo ve en solo lectura) |

La segregación no es nueva en el producto: es el mismo principio del maker-checker que ya gobierna el
cierre de conflictos de pago.

## Casos de uso

**CU-01 — Generar un formato desde archivo.** El operador arrastra `Formato 0228 / Anexo 01 / desde
archivo`, indica la fuente y el periodo, y ejecuta. Obtiene `01260930.228` en la carpeta de importación.

**CU-02 — Generar desde procedimiento almacenado.** Igual, pero el origen es un SP que ya deja los
datos con la estructura del formato. El sistema debe comprobar que esa salida tiene la forma esperada
antes de generar.

**CU-03 — Solo validar.** El operador quiere saber si sus datos pasarían, sin producir archivo. El
proceso termina tras la validación, con el informe de rechazos.

**CU-04 — Regenerar un periodo pasado.** El operador vuelve a generar el archivo de un periodo ya
presentado. Debe salir con el layout que regía entonces, aunque la SBS haya publicado dos versiones
desde entonces.

**CU-05 — Depositar donde SUCAVE lo tome.** El archivo va a disco local o a un recurso compartido que
la estación con SUCAVE pueda abrir. El almacenamiento de objetos vale como copia histórica, no como
carpeta de importación: el aplicativo elige el archivo con un explorador.

## Fuera de alcance

Presentación automática a la SBS · reporte de validación devuelto por SUCAVE · rectificaciones ·
firma digital del artefacto · formatos de otros reguladores.

## Preguntas abiertas

1. **Qué formato se implementa primero** y de qué origen (archivo, tabla o SP). El spec técnico asume
   0228 / Anexo 01 desde archivo como ejemplo; hay que confirmarlo.
2. **Qué destinos hacen falta de verdad** para RF-011, y en qué orden.
3. **`REST` y `OCI_OBJECT_STORAGE` como salida**: `REST` de entrada es "leer de un endpoint"; de
   salida sería "publicar el archivo en un endpoint", que no es la operación espejo. Necesita
   decisión de diseño, no port mecánico.
4. **Para cada formato que se incorpore, identificar en su instructivo** qué anexos forman un mismo
   grupo de remisión y cuáles van individualmente. Sale del instructivo y de la resolución, **no** de la página índice.
   *Reformulada: antes preguntaba "¿un ZIP por anexo o por formato?". La pregunta estaba mal puesta —
   lo que la SBS recibe es el archivo de texto por anexo y periodo; no hay ZIP nuestro.*
5. **Si existe reenvío de un anexo suelto** dentro de un grupo ya presentado, sin reenviar los demás.
   Cambia si el grupo es una unidad indivisible o solo la unidad *por defecto*.
6. **Si un anexo puede ser prerequisito de otro grupo.** Un prerequisito entre grupos no es cableado
   del grafo: es una dependencia **entre ejecuciones** —el grupo B no puede ir hasta que el A se
   presentó— y eso exige saber qué se presentó ya. Hoy el ciclo ante la SBS está fuera de alcance, así
   que si esto existe de verdad, ese alcance se queda corto.
7. ~~¿Qué ingiere el aplicativo SUCAVE?~~ **RESUELTA.** Importa el **archivo de texto** de cada anexo
   ("Ingresar desde archivo"), conforme a su diseño de registro y con nomenclatura `NNAAMMDD.FFF`.
   Después valida, genera **él** su artefacto de envío, y lo comprime con 7-Zip cuando supera el umbral
   configurado. **Nuestro blueprint no comprime**: entrega el archivo de texto.
8. **¿Qué code page concreta significa «ANSI» para el formato objetivo?** El manual exige ANSI, pero
   *ANSI* no identifica una codificación de forma inequívoca: en Windows occidental suele ser
   Windows-1252, que **no es idéntica** a ISO-8859-1 —difieren en `0x80–0x9F`, donde la primera tiene
   `€ " " ' ' – — …`—. El diseño de registro revisado no explicita ninguna.
   **No asumir ISO-8859-1. No asumir Windows-1252.** Se confirma con documentación adicional o con una
   prueba controlada contra el aplicativo.
   *Bloquea producción, no desarrollo*: `TxtWriter` admite ambas, así que T-023 se construye y se
   prueba con las dos; lo que no se puede es homologar sin saberlo.
8. **¿Cuál es la carpeta de handoff de la entidad?** Ruta accesible desde la estación que ejecuta
   SUCAVE, permisos, retención, y cómo se confirma que el archivo ya se cargó. **No** puede ser una
   carpeta interna del propio aplicativo. Es pregunta de implantación, una por instalación.
9. **Qué canal tiene autorizado cada formato**: SUCAVE/SIX-TCL, SEI SUCAVE Web o SFTP. Hay evidencia de
   los tres para flujos distintos, y no son intercambiables.
