# Auditoría: pérdida de configuración en `toTaskPatch` — 23 providers — 2026-07-24

**Solo análisis: no se cambió código.** El plan del §5 espera autorización.

## La clase de bug

Cada provider Angular reconstruye el `configurationJson` **desde cero** en `toTaskPatch(draft)`, usando solo
los campos que su draft conoce. Toda clave que el backend lee y el draft no carga se **borra en silencio** al
editar cualquier campo del formulario y guardar.

Ya corregidos: `MT101_STATUS` (16 claves, commit 428c06d5) y `MT101_PAY` (6, commit 15776842).
Esta auditoría cubre los 21 providers restantes (23 en total con `toTaskPatch`).

Método: claves top-level que lee el backend (incluidas las que leen helpers compartidos y validadores de
proceso) menos las que emite `toTaskPatch`, contando como emitidas las 6 que agrega `withRuntime`
(`taskRef`, `executionMode`, `input`, `async`, `asyncTransport`, `continueOnFailure`).

---

## 1. El hallazgo principal NO está en un provider

`withRuntime` reconstruye el bloque `input` con 6 campos y `normalizeInput` lee esos mismos 6
(`process-task-provider.abstract.ts:98-135`). El motor lee **dos más**:

| Clave | Lee | Efecto de perderla |
|---|---|---|
| **`input.filters`** | `TaskInputResolver.java:79` | `filters(null)` → mapa vacío → **sin cláusula WHERE: la tarea consume la TABLA ENTERA** en vez del subconjunto filtrado |
| `input.cursor.orderBy` | `TaskInputResolver.java:78` | En blanco → `sanitizeQualifiedIdentifier("")` lanza `Invalid SQL identifier` (`DbTaskSupport.java:52`) |

`input.filters` es el peor hallazgo de toda la auditoría: **silencioso**, cambia *qué filas* procesa la tarea, y
afecta a **todos** los task types con `sourceOutput: 'table'`. Un export acotado al `${_processExecutionId}` de
la corrida se convierte, sin aviso, en un volcado completo de la tabla.

`input.cursor.orderBy` falla ruidoso (corrompe la config, no los datos) — **salvo en FILE_WRITE**, que lo
sustituye por `'id'` y sigue (ver §3).

**Vive en la clase base: un solo arreglo repara los 23 providers.**

---

## 2. Camino schema-driven de plugins remotos

`SchemaFormComponent` emite `valueChange.emit({ ...group.getRawValue() })` — solo los controles declarados en
el schema del plugin — y el host lo persiste tal cual
(`process-task-form-host.component.ts:161-163`). El valor inicial entra completo, pero lo que sale es solo lo
declarado, así que al editar cualquier campo de una tarea de plugin se pierden las claves de plataforma que
ningún schema declara: **`taskRef`** (identidad; las tareas aguas abajo la referencian por
`input.sourceTaskRef` → **rompe el cableado del pipeline**), **`executionMode`** (`TaskOutputRegistry` lo exige
y lanza), `input`, `async`, `asyncTransport`, `continueOnFailure`.

Falla ruidoso en ejecución, pero deja la tarea inutilizable.

**Falso positivo descartado:** `RemoteSchemaTaskProvider.toTaskPatch` emite solo `taskRef` +
`executionMode:'once'` hardcodeado. Leído aislado parece catastrófico; **no lo es** — solo siembra la config
inicial al crear la tarea; el guardado va por `onSchemaValue` y lo evita por completo.

---

## 3. Pérdidas por provider

### Limpios — cero pérdidas (9)

`MT101_PARSE`, `MT101_SPLIT`, `MT101_REPAIR`, `DB_WRITE`, `DB_EXECUTE_FN`, `DB_EXECUTE_SP`, `FILE_READ`,
`FILE_COMPRESS`, `FILE_DELIVER`. (`PAIN001_PARSE` no tiene provider frontend: el bug no es alcanzable.)

### Con pérdidas ALTAS

| Task type | Claves perdidas | Por qué es ALTA |
|---|---|---|
| **MT101_BUILD_FROM_TABLE** | `source` (objeto entero), `connectionRef`, `fragmentSetIdTemplate` + anidadas `envelope.uetr`, `sequenceA.orderingCustomer.bic`, `sequenceA.accountServicingInstitution.*`, `sequenceA.customerSpecifiedReference`, `sequenceA.authorisation` | `source` define **de qué tabla/columna/conexión se construyen los pagos**; al perderlo cae a `staging_record` + datasource por defecto, y `recordIndexIn` vacío **des-acota un rebuild selectivo** (reconstruye todo en vez de solo las filas corregidas). `fragmentSetIdTemplate` cambia el set id usado para idempotencia y, con `replaceExisting` (que el front fuerza a `true`), **cambia qué set se borra**. `envelope.uetr` y los campos de `sequenceA` son identidad de pago y trazabilidad. |
| **MT101_INBOUND_DELIVER** | 2 siempre (`loginTimeoutSeconds`, `tokenTtlSeconds`) + **13 al cambiar el transporte a DB** | Al guardar en DB se descarta el bloque HTTP entero: `url`, credenciales (`password`/`token`), login. **No es recuperable**: al volver a REST se guarda `url:''` y el backend lanza `requires url`. |
| **NOTIFICATION** | Wipe por canal: al guardar, se borran las claves de los otros canales | Pasar un webhook a `log` para probar **destruye la `url` de destino y las credenciales**. Sin `authType` el request sale **sin header `Authorization`**: es desactivar una protección, no un tuning. En `email`, `to` se pierde mientras la tarea esté en otro canal. |
| **MT101_PARSE_FROM_TABLE** | `connectionRef`, `source.processExecutionId`, `source.taskDefinitionId` | `processExecutionId` es el pin para re-parsear un lote **histórico**; perderlo repunta a la corrida actual → 0 filas → la tarea devuelve **"skipped" como ÉXITO**. `taskDefinitionId` ausente **elimina el predicado** y amplía la lectura a las filas de todas las tareas. |
| **MT101_RECONCILE** | `archiveStatusSync` | `boolValue(x, true)`: ausente == **true**. Reactiva la escritura de vuelta a la tabla de archivo que el operador apagó. **Misma clave y mismo modo de fallo ya corregidos en MT101_PAY.** |
| **FILE_WRITE** | `source`, `connectionRef`, `lineEnding` + `input.filters`, `input.payloadColumn`, `input.cursor.orderBy` | `source`/`connectionRef` cambian **de qué tabla y qué base** se exporta. `input.cursor.orderBy` se **pisa con `'id'`** cuando `sourceOutput==='table'`. |

### Pérdidas BAJAS (tuning)

`MT101_ARCHIVE` (`maxRecordsInOutput`, `pageSize`), `MT101_VALIDATE` (`maxIssuesInOutput`, `pageSize`),
`MT101_ROUTE` (`pageSize`), `REST_CALL` (`loginTimeoutSeconds`, `tokenTtlSeconds` — este último MEDIA: es la
única palanca para acortar el cacheo de token por debajo del `expires_in` del proveedor).

---

## 4. Un segundo defecto, de otra forma: hidratación que no sabe parsear

Distinto del diff de claves y **no se arregla con una lista**: cuando `hydrateDraft` no puede interpretar un
valor válido, `toTaskPatch` lo emite vacío o lo omite, y se pierde igual.

- **MT101_VALIDATE / MT101_RECONCILE** — el backend acepta tres formas para `publishIssuesTo` /
  `publishExceptionsTo` (mapa, nombre suelto, `table:conn:table`); el frontend solo parsea la tercera. Un
  `publishIssuesTo: "mt101_validation_issue"` se **borra** → las incidencias dejan de persistirse (se pierde el
  rastro de rechazo).
- **MT101_ARCHIVE** — `encryptionEnabled = hasEncryptColumn && hasSecretRef`. Con `encryptColumn` presente y
  `encryptionSecretRef` en blanco, hidrata a `false` y `toTaskPatch` **borra ambas**: el archivado revierte a
  texto plano en silencio.

---

## 5. Plan propuesto — requiere autorización

Orden por riesgo, no por esfuerzo:

1. **`input.filters` + `input.cursor` en `withRuntime`/`normalizeInput`** — un arreglo, 23 providers. Es el de
   mayor impacto y el más barato.
2. **Schema-driven remoto** — que `onSchemaValue` haga *merge* sobre el `configurationJson` existente en vez de
   reemplazarlo.
3. **NOTIFICATION** — preservar los canales inactivos.
4. **MT101_BUILD_FROM_TABLE**, **MT101_INBOUND_DELIVER** (incluye corregir el test que hoy **fija la pérdida
   como esperada**), **MT101_PARSE_FROM_TABLE**, **MT101_RECONCILE**, **FILE_WRITE** — patrón `PRESERVED_KEYS`
   ya usado en PAY/STATUS, más preservación de claves anidadas donde aplique.
5. **Hidrataciones que no parsean** (§4) — preservar el valor crudo cuando no se lo puede interpretar.
6. **Tuning BAJO** — misma lista de preservación, sin urgencia propia.

Evidencia comprometida por cada arreglo: test que **falla sin él** (verificado revirtiendo), suite completa en
verde, y anotación en `qa/fase-6-qa/evidencias/`.

### Aparte: config muerta en el sentido inverso

El frontend emite claves que **ningún backend lee**: `interpretSequenceAB`, `publishMultiOutput` (PARSE),
`table`, `hashAlgorithm` (ARCHIVE — la tabla y el hash están hardcodeados), `businessCalendar` (VALIDATE),
`splitBy` (BUILD), `functionSchema`, `procedureSchema`. Por la política de no dejar código obsoleto son
candidatas a eliminación, pero conviene confirmar una por una que no las lea un validador o un consumidor
futuro antes de tocarlas.
