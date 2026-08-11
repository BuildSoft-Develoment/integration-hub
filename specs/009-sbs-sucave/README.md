# 009 — SBS SUCAVE (generación de formatos regulatorios)

Vertical para generar los archivos de formato que la SBS exige vía SUCAVE y dejarlos listos para que
el aplicativo oficial los cargue. **No dialoga con la SBS**: la presentación la hace una persona.

## Alcance en una frase

> Generar el archivo de un formato SBS (texto de ancho fijo, `NNAAMMDD.FFF`) y dejarlo en una carpeta
> accesible desde la estación que ejecuta SUCAVE.

## Documentos

| Documento | Qué contiene |
|---|---|
| `spec-funcional.md` | Qué hace el vertical, para quién, y qué queda fuera |
| `spec-tecnica.md` | Cómo se implementa contra el código que existe hoy |
| `api-contract.md` | **El `configuration_json` de cada tarea del vertical** |
| `spec-tareas.md` | **Las fases y su desglose ejecutable** |
| `prototype.md` · `prototype-validation.md` | El prototipo navegable y qué falta validar |

## Las tareas del vertical

| Tipo | Qué hace |
|---|---|
| `SBS_SUCAVE_PREPARE` | Resuelve formato, anexo, grupo de remisión, periodo y versión del diseño de registro; congela el snapshot |
| `SBS_SUCAVE_MATERIALIZE` | Lleva las filas del origen a la estructura del formato: catálogos, campos derivados y reglas de carácter. **Solo el detalle** — la cabecera y el trailer los escribe el motor desde el layout |
| `SBS_SUCAVE_VALIDATE` | Comprueba las reglas del formato y publica el rechazo por registro |
| `SBS_SUCAVE_POST_VALIDATE` | Comprueba el archivo ya escrito: recuento, longitud, encoding, nombre y cuadre del trailer |
| `SBS_SUCAVE_PACKAGE_VALIDATE` | **Solo con remisión grupal.** Comprueba el conjunto antes de entregarlo: mismo grupo, mismo periodo, versiones compatibles, ningún anexo obligatorio ausente |

Cada una con su formulario en el editor (`layout: 'workspace'`, `category: 'sbs-sucave'`). Leer,
escribir el archivo y entregarlo son del motor y no se duplican.

> **El blueprint no comprime.** SUCAVE importa el archivo de texto y comprime él antes de transmitir.
> `FILE_COMPRESS` sigue disponible para archivo histórico, pero fuera del camino regulatorio.

## La unidad de envío es el grupo de remisión

Un **anexo** produce un archivo. Un **grupo de remisión** produce un envío, y es lo que decide qué
viaja junto — lo declara la definición regulatoria vigente para ese periodo, no nosotros.

Un grupo de un solo anexo es el envío individual; uno con varios exige que todos estén listos antes de
entregar ninguno. **Un proceso cubre un grupo**, sea de uno o de varios.

## Los formatos son dato, no código

Treinta formatos y varias versiones al año: dar de alta uno **no puede exigir un despliegue**. El
diseño de registro, las reglas, los catálogos y los grupos viven en el snapshot, versionados por
periodo. Los cinco tipos de tarea son código porque son cinco y no varían por formato.

Dos huecos abiertos que esto destapa, y que deciden si el vertical se puede operar sin nosotros: las
plantillas de la paleta hoy son constantes compiladas, y no hay pantalla para dar de alta un formato.
Ver `spec-tecnica.md` §*Qué es dato y qué es código*.

Análisis previo que originó este spec, con las tres pasadas de verificación contra el código real:
[`docs/fase-3-arquitectura/analisis-sbs-sucave-vertical-20260810.md`](../../docs/fase-3-arquitectura/analisis-sbs-sucave-vertical-20260810.md).

## Contexto

- **Módulo back:** `vertical-sbs-sucave/` · paquete `com.integrationhub.vertical.sbs.sucave`
- **Lib front:** `frontend/libs/features/sbs-sucave/` · `@integration-hub/features/sbs-sucave`
- **Migraciones:** `db/migration-sucave`, schema propio (ADR-023)
- **Camino de extensión:** ADR-021 — el motor no se toca para dar de alta el vertical
- **Salida:** ADR-016 (`FILE_WRITE`/`FILE_COMPRESS`/`FILE_DELIVER`) y ADR-017 (destinos)

## Dos tracks independientes

**Track A — paridad entrada/salida (MOTOR).** Hoy hay 8 tipos de fuente de ENTRADA y solo **2** de
SALIDA. Toda fuente de entrada debe tener su salida. Es trabajo del motor, no del vertical: beneficia
a cualquier vertical y no puede vivir en `vertical-sbs-sucave`.

**Track B — el vertical SUCAVE.** Camino crítico. Su destino natural es una **carpeta accesible desde
la estación que ejecuta SUCAVE** —disco local o recurso compartido—, que el motor ya sabe escribir, así
que **no espera al Track A**.

## Estado

`pending` — documentación previa a la construcción. Nada implementado.
