# ADR-018 FILE_WRITE: binding de origenes y expresiones de detalle (paridad DB_WRITE + evaluador JEXL money-safe)

[README principal](../../../README.md) | [Indice docs](../../README.md) | [Volver a ADR](README.md)

<!-- nav-guided:start -->
## Navegacion guiada
- Anterior: [ADR-017 Conexion de salida unificada: fuente OUTPUT reutilizada por FILE_DELIVER y MT101_PAY/STATUS (SFTP)](ADR-017-conexion-salida-unificada-file-deliver-mt101-pay.md)
- Siguiente: [Indice docs](../../README.md)
<!-- nav-guided:end -->

## Estado

**Implementado (2026-07-21).** Depende de ADR-004 (motor de inputs/outputs tipados) y ADR-016 (capa de salida generica / `FILE_WRITE`). Extiende `FILE_WRITE` para consumir datos con el mismo binding que `DB_WRITE` y para computar columnas con expresiones. El diseno se verifico contra codigo antes de implementar; el doble check de la propuesta corrigio dos premisas (ver *El evaluador de expresiones*). Commits: `c5d0fa8c` (salida de origen + campos), `0f3b7cbc` (binding summary/out a celdas, backend), `9defc2c8` (paleta drag&drop + celda binding, frontend), `e02e35f4` (evaluador de expresiones, backend), `ab19ce98` (expresiones en la UI).

## Contexto

Tras ADR-016, `FILE_WRITE` sabia leer registros de una tarea previa (`records`) o paginar una tabla (`table`), pero su binding de datos era pobre frente a `DB_WRITE`:

- **Sin eleccion de output**: la salida de la tarea de origen (`records`/`table`/`errors`) se auto-derivaba (`defaultOutputForTask`); el usuario no podia elegirla.
- **Sin sugerencias de campo** en modo records (el autocomplete del `field` quedaba vacio).
- **Sin binding de agregados**: no habia forma de poner un `summary`/`out` de una tarea previa en una celda de cabecera/trailer.
- **Sin drag&drop** de origenes ni el compuesto colapsable en mobile que `DB_WRITE` ofrece.
- **Sin valores computados**: cada columna leia un campo directo; no habia forma de concatenar, restar comisiones, condicionar, etc.

`DB_WRITE` ya resolvia esto (paleta + mapping board + `ProcessTaskBindingContextService`), pero su metafora es "origen -> columna de una tabla" (destinos discretos y fijos). `FILE_WRITE` escribe un ARCHIVO con estructura distinta (cabecera / detalle en streaming / trailer), asi que la adaptacion no es "copiar el board".

## Decision

Dar a `FILE_WRITE` el binding de `DB_WRITE` **reusando** el motor de binding (`ProcessTaskBindingContextService`) y la paleta (`ProcessDbWriteSourcePalette`), pero **enrutando cada tipo de origen a la seccion del archivo donde tiene sentido**, mas un evaluador de expresiones por columna.

| Origen | Naturaleza | Destino en el archivo |
|---|---|---|
| `records`, `table`, `errors` | stream de filas | columnas de **DETALLE** |
| `summary`, `out`, `metadata` | valor agregado (Map) | celda de **CABECERA/TRAILER** |
| expresion JEXL | derivado por registro | valor computado de una columna de detalle |

El invariante que lo hace correcto es un **hallazgo del backend** (`FileWriteTaskProvider.toRecords` solo acepta `ReadResult`/`List`): `summary`/`metadata`/`out` son Map-shaped y producen 0 filas, asi que **no** son consumibles como stream de detalle. Su lugar natural en un archivo es una celda. Esto se refleja en la UI filtrando lo que la paleta ofrece a cada destino (no-fallback: no se ofrecen origenes muertos).

### Binding de agregados a celdas (backend)

Nueva forma de celda `{sourceOutput, sourceTaskRef, sourceKey}`. `resolveCell` lee de `taskOutputs` el Map publicado por el motor bajo `<ref>.summary` / `<ref>.out` (ver `TaskOutputRegistry.registerTypedOutput`) y extrae el campo. Binding no resuelto -> celda vacia (consistente con `metadata`/`aggregate`). `metadata` queda en los 2 tokens que `TaskContext` expone (`_processExecutionId`, `_taskDefinitionId`); los de lote no aplican (`FILE_WRITE` es once-task).

## El evaluador de expresiones (guardarraíles money-path)

El corazon del ADR. Una columna de detalle puede declarar `expression` (JEXL) y su valor se computa por registro en vez de leer un campo. El type/format/rounding de la columna (`FieldValueFormatter`, HALF_UP de ADR-016) se aplica **encima** del resultado; la expresion solo produce el valor crudo.

**El doble check de la propuesta corrigio dos premisas:**

1. **No hay sandbox restrictivo que reusar.** `DbValidationRuleProvider` usa `JexlPermissions.UNRESTRICTED` (comentario: las reglas son *config confiable de admin, igual que MT101_ROUTE*). No existe un sandbox comun. -> `FILE_WRITE` usa el **default de JEXL 3.4 (`RESTRICTED`)** — que se obtiene *no* opt-in a UNRESTRICTED: mas cerrado que los usos existentes y menos codigo. Decision nueva, no reuso.

2. **El unico camino JEXL native-proven es el PLANO.** Lo que corre en el nativo desplegado es `MT101_ROUTE`, con `MapContext` + `createExpression` y **sin** namespace de funciones. `ReaderFieldSupport` si usa functions namespace, pero **no hay reflect-config** para el y un functions-namespace resuelve metodos por reflexion -> riesgo en native. -> el evaluador de `FILE_WRITE` sigue el patron **plano** (`FileWriteExpressionEvaluator`), **sin** functions namespace. **No requiere tocar `native-image.properties`.**

Guardarraíles (money-path):

- **BigDecimal**: `FileWriteArithmetic extends JexlArithmetic` hace `+ - * /` en BigDecimal (MathContext DECIMAL128) cuando ambos operandos son numericos. Evita la imprecision de double **y** el gotcha de JEXL de concatenar strings numericas en `+` (`"0.1" + "0.2"` da `0.3`, no `"0.10.2"` ni `0.30000000000000004`). Con un operando no numerico, `+` delega a la base (concatenacion, p.ej. `first + ' ' + last`). Se dispatch-ea por metodo directo (no reflexion) -> native-safe.
- **Fail-loud**: `strict(true).silent(false)`. Una variable indefinida (typo) o un error de tipo lanza `IllegalStateException` con contexto columna+expresion; nunca una celda incorrecta en silencio (a diferencia de `MT101_ROUTE`, null-tolerant para rutear).
- **Determinismo**: sin funciones -> sin `now()`/`uuid()`/random. Misma entrada = misma salida (requisito del re-run correctivo byte-identico).
- **Campos crudos**: cada expresion ve los campos del registro (mas `_processExecutionId`/`_taskDefinitionId`), no las columnas ya computadas (sin encadenamiento -> sin orden implicito).

### Integracion por proyeccion (SPI del writer intacto)

`FileWriteTaskProvider` **proyecta** cada registro antes de escribir: `out[col.field] = eval(col.expression, record)` para las columnas con expresion; el resto se conserva. Los writers (`CsvWriter`/`TxtWriter`/`XlsxWriter`) siguen leyendo por `col.field` — no se toca `FileFormatWriter`. Aplica a records y a table (por pagina; el cursor keyset toma el `nextKey` de la pagina cruda **antes** de proyectar). Sin columnas-expresion, `project` es no-op -> el camino sin expresiones queda **byte-identico**.

## Contrato (configuration_json)

```jsonc
{
  "layout": {
    "detail": { "columns": [
      { "field": "nombre", "expression": "first + ' ' + last" },
      { "field": "neto", "type": "NUMBER", "format": "0.00", "expression": "bruto - comision" }
    ] },
    "trailer": [
      { "sourceOutput": "summary", "sourceTaskRef": "sp1", "sourceKey": "processedCount" }
    ]
  }
}
```

## Consecuencias

Positivas:
- `FILE_WRITE` alcanza paridad de binding con `DB_WRITE` (paleta drag&drop + compuesto mobile) reusando el motor comun.
- Expresiones money-safe sin dependencia nueva ni reflection native.
- El camino sin expresiones no cambia (byte-identico; el E2E XLSX de ADR-016 sigue valido).

Costos:
- Una celda `binding` vacia y una `expression` vacia se emiten presentes (`''`) para sobrevivir el round-trip del draft (mismo patron que las regresiones de field/celda vacios); el backend las ignora.
- La aritmetica `+` de dos strings numericas SUMA (no concatena) — decision deliberada de money-safety, documentada.

## Alcance / lo que NO entra

- **Sin functions namespace** (`upper`/`substr`/`pad`/`formatDate`): romperia el "sin reflection". Si se piden, se agregan con una clase de funciones **+ reflect-config native + un build nativo real de verificacion** (no asumido).
- **Sin `now()`/`uuid()`/random** (rompen determinismo).
- **Sin encadenar** una columna computada dentro de otra expresion (cada una ve el registro crudo).
- Fan-in de celdas a summaries de **otras** tareas: la celda hoy toma `sourceTaskRef` de la tarea de origen del detalle.

## Referencias

- [ADR-004 Motor de tareas con inputs y outputs tipados](ADR-004-motor-input-output-tareas.md)
- [ADR-016 Salida generica: escritura de archivos y entrega por transporte](ADR-016-salida-generica-escritura-archivo-y-entrega.md)
- Codigo: `FileWriteExpressionEvaluator`, `FileWriteTaskProvider` (proyeccion + `resolveBinding`), `TaskOutputRegistry.registerTypedOutput`, `Mt101RouteTaskProvider` (patron JEXL plano native-proven), `ProcessTaskBindingContextService` (motor de binding reusado).
