# Revalidación del análisis v65 contra el código + plan de arreglo de hallazgos abiertos

**Fecha:** 2026-07-14 · **Rama:** `experiment/quarkus-lts-native` · **Estado:** propuesta, pendiente de autorización.

Este documento (a) contrasta punto por punto el análisis externo de v65 contra el código real,
(b) consolida los hallazgos abiertos de
[hallazgos-money-path-mt101-20260714.md](evidencias/hallazgos-money-path-mt101-20260714.md), y
(c) propone el arreglo de cada uno, **sin caminos de fallback ni compatibilidad legacy**: donde hoy hay una
degradación silenciosa, la sustituyo por un fallo ruidoso.

---

## ✅ ESTADO DE IMPLEMENTACIÓN (2026-07-14, autorizado "procede")

Decisiones tomadas por defecto (mis recomendaciones; ninguna respondida explícitamente): acknowledge
**single-actor con ticketRef obligatorio** (no maker-checker), y **frontend en la misma tanda**.

| # | Trabajo | Estado |
|---|---------|--------|
| 1 | Acknowledge: `source` estricto + body JSON + motivos separados + ticket obligatorio (+Flyway V98 +front) | **HECHO** |
| 2 | Evidencia de confirmaciones acotada por `processExecutionId` (+front) | **HECHO** |
| 3 | Test CDI de secretos + selección determinista por `@Priority`/`@All` | **HECHO** |
| 4 | Flush del insert por bytes (`INSERT_BATCH_MAX_BYTES`) | **HECHO** |
| 6 | Monto no numérico → cuarentena por fila (no mata el lote) | **HECHO** |
| 8 | Validador PAY↔STATUS con `resolvesPayTaskRef` (fin del falso positivo multi-banco) | **HECHO** |
| 9 | `set-task-secret.cmd` reescrito + verificación real del valor (`VerifyVaultSecret.java`) | **HECHO** |
| — | Arreglo de 2 tests obsoletos preexistentes que bloqueaban la compilación de la suite | **HECHO** |
| 5 | Cuarentena del run hijo (H4) | **DIFERIDO** — ver nota |
| 7 | Unificar las 3 ramas de STATUS (H5) | **DIFERIDO** — bajo valor (SFTP ya funciona vía `resolveNormalPay`) |
| 10 | Clasificación transporte vs. banco (H3/D.2) | **DIFERIDO** — ver nota |

**Por qué se difieren 5, 7 y 10:** son los tres items que tocan el **core del money-path**. H10 (D.2) exige
reshapeo del modelo de estados terminales: `TransportResult` es un SPI compartido por todos los transportes y
hoy sólo distingue accepted/uncertain/rejected — para separar "fallo de transporte/auth re-solicitable" de
"rechazo de negocio del banco" hay que ampliar ese record, propagar un estado nuevo por el camino normal Y
correctivo, y migrar. Es alto riesgo y necesita tu confirmación explícita de la opción D.2 (nunca respondida).
H4 exige SQL de lifecycle que cruce generaciones por la tupla estable; es correctness real pero riesgo
moderado. H5 es una mejora de usabilidad de bajo valor. La decisión de ingeniería: **entregar y verificar el
lote sólido de 7 hallazgos antes que apilar cirugía de pagos sin validar**. Los tres quedan documentados para
una segunda tanda con tu visto bueno.

**Verificación:** `mvn -pl platform-app test-compile` → BUILD SUCCESS (main + tests). Tests dirigidos y
evidencia e2e contra el ambiente nativo: ver `evidencias/`.

---

---

## ⚠️ Correcciones tras el doble check (errores de la primera versión de ESTE documento)

Al revisar mis propias afirmaciones encontré tres errores. Los dejo escritos porque cambian prioridades:

1. **[GRAVE] "`MT101_STATUS` no puede funcionar por SFTP en el pipeline" — FALSO.**
   La rama `resolveNormalPay=true` **corta antes** del check de `query.url`
   (`Mt101StatusTaskProvider:484`) y usa el ejecutor route-aware, donde la URL es opcional si hay
   `routeQuery` (`:683-685`). **Verificado empíricamente**: proceso 11 / ejecución 15 con
   `resolveNormalPay: true` + `routeQuery.SFTP_BANK` → `MT101_STATUS COMPLETED`, proceso `COMPLETED`.
   Mi conclusión de que "`require-normal-pay-resolver=true` es imposible en un banco SFTP" era exactamente
   al revés: **esa property es precisamente el camino soportado para SFTP.**
   Lo que queda es un defecto menor de consistencia (ver C.1 reescrito).

2. **El filtro que propuse en C.2 no existe.** `mt101_archive` **no tiene `fragment_set_id`**; sí tiene
   `process_execution_id`. La solución debe acotar por `process_execution_id` (que la consola ya conoce).

3. **"La evidencia del millón está bloqueada por el deadlock" — exagerado.**
   `Mt101MillionFileProcessE2EIT` corre por defecto con `maxBytesPerMessage=10_000` y
   `maxTransactionsPerMessage=100` (`:57-59`) → lotes de ~1 MB, que no disparan el deadlock. H7 sigue siendo
   un bug real (una config con fragmentos grandes cuelga pgJDBC), pero **no bloquea** la evidencia del millón.

---

# Parte A — Revalidación del análisis v65

## A.1 Lo que el análisis afirma que existe: **verificado, existe y hace lo que dice**

| Afirmación v65 | Verificación |
|---|---|
| Consola de PAY_CONFLICT abiertos, transversal, con cursor | `Mt101FragmentLookupResource:170` `/pay-conflicts/open` |
| Evidencia bancaria inline por `:20:` | `Mt101FragmentLookupResource:189` `/pay-conflicts/confirmations` |
| Acknowledge gobernado con motivo obligatorio, sin tocar el terminal | `Mt101PayConflictAcknowledgeService:55-97` (valida `reason`, no toca `status`/`pay_status`) |
| Atomicidad del acknowledge (flag + trama en una tx, rollback si falla el spool) | `Mt101PayConflictAcknowledgeService:69-93` + `AuditSpoolWriter.writeBatch(Connection, …)`; IT: `Mt101PayConflictAcknowledgeAtomicityIT` |
| Validador de `connectionRef` PAY↔STATUS | `Mt101PayStatusConnectionCoverageValidator:42-70` |
| `mt101.pay.require-normal-pay-resolver` opt-in, default `false` | `Mt101PayResolutionValidator:45` |
| PAY por lista con `payload_hash` en el intent | columna `mt101_pay_dispatch_intent.payload_hash` (verificada en BD) |
| Async con claim token y lease | `task_inbox`: `inbox_owner`, `claimed_until`, `inbox_claim_token` (verificadas en BD) |

**Conclusión:** el análisis no inventa nada. Su descripción del diseño de v65 es fiel.

## A.2 Sus críticas: **todas reales**, con la ubicación exacta

| # | Crítica v65 | Confirmación en código | Mi lectura |
|---|---|---|---|
| A2-1 | La evidencia de confirmaciones se busca **sólo por `:20:`** y puede mezclar ejecuciones | `Mt101FragmentRepository:1109-1112` — `join mt101_archive a on a.id=c.archive_id where a.senders_reference = ?`, sin `process_execution_id`/`fragment_set_id` | **Real y más grave de lo que dice.** Nuestras plantillas de `:20:` (`P${messageIndex}`) repiten referencias entre corridas: ya provocó colisiones en `mt101_archive` durante las pruebas. En un banco real, la evidencia mostrada podría ser de **otra ejecución**. |
| A2-2 | El acknowledge **sobrescribe** el motivo original del conflicto | `Mt101FragmentRepository:1152` — `set pay_conflict=false, pay_conflict_reason = ?` (el `ackReason`) | **Real.** La tabla operativa pierde el "por qué hubo conflicto" y sólo conserva el "por qué lo reconocí". La trama append-only lo conserva, pero el operador no la ve en la grilla. |
| A2-3 | `source` no se valida: cualquier valor ≠ `CORRECTIVE` cae en NORMAL | `Mt101PayConflictAcknowledgeService:66` — `var corrective = "CORRECTIVE".equalsIgnoreCase(source)` | **Real, y es exactamente el tipo de fallback silencioso que queremos erradicar.** `source=CORRECTIVO` (typo) reconocería el conflicto equivocado. |
| A2-4 | El `reason` viaja por **query param** | `Mt101FragmentLookupResource:215` `@QueryParam("reason")` | **Real.** El motivo acaba en access logs de nginx, proxies y trazas. Es el único endpoint del ciclo de pago que pide texto libre por URL. |
| A2-5 | El validador de conexión compara **cada PAY contra cada STATUS posterior** | `Mt101PayStatusConnectionCoverageValidator:46-68` — doble bucle sin emparejar | **Real.** Con dos bancos (PAY_A/STATUS_A, PAY_B/STATUS_B) rechazaría una definición legítima. Hoy no hay soporte multi-PAY, así que es riesgo latente, no bug activo. |
| A2-6 | `require-normal-pay-resolver` sigue opt-in (`false`) | `Mt101PayResolutionValidator:45` | **Real, y correcto como default.** Es decisión de ambiente, no de código. |

## A.3 Donde el análisis **se equivoca o se queda corto**

1. **"El acknowledge es seguro porque no mueve dinero" — cierto, pero incompleto.**
   No cambia `status`/`pay_status`, correcto. Pero **sí apaga la única alerta operativa** de que el ledger y el
   banco se contradicen. Un `PAY_CONFLICT` reconocido por error desaparece de la consola y ya nadie lo mira.
   El análisis lo clasifica como "single-actor gobernado por rol" y lo da por bueno; yo lo pondría en la lista
   de decisiones a tomar (ver **D.1**), no en la de resueltos.

2. **Da por buena la validación `connectionRef` PAY↔STATUS y no ve el hueco simétrico.**
   El validador cubre `resolveNormalPay`, pero **no** valida la conexión entre `MT101_PAY` y el
   `MT101_STATUS`/`MT101_RECONCILE` del **ciclo correctivo**, que se resuelve por otra vía
   (`Mt101CorrectiveLifecycleService.runPostPaySync`). Ahí el `connectionRef` sí se comprueba contra el run
   (`assertConnectionRef`), así que el hueco real es menor de lo que temía, pero el análisis no lo verificó:
   lo afirma por analogía.

3. **No menciona la asimetría de `MT101_STATUS` entre sus tres ramas.**
   `executeQuery` tiene tres caminos con capacidades distintas:
   - `resolveNormalPay=true` → route-aware (REST **y** SFTP). **Es el camino completo del money-path**:
     resuelve `UNCERTAIN`/`DISPATCHING`, **re-consulta los `SENT`** para detectar contradicciones
     (`reconcileSentAgainstStatus`) y registra confirmaciones.
   - Fuente correctiva presente → `executeCorrectiveQuery`, también route-aware.
   - **Ninguna de las dos** → sondeo REST puro sobre los registros archivados; exige `query.url`
     (`:497`) y **no mira `routeQuery`**.

   El defecto real es que la **misma** config SFTP funciona o revienta según un booleano, y el error
   (`requires configuration.query.url`) no dice nada de eso. Es una trampa de usabilidad, no un bloqueo:
   severidad **Media**, no Alta como escribí.

4. **"Evidencia de 1 millón pendiente" — cierto; el motivo que da (falta de Maven/Java 25) es plausible.**
   Yo afirmé que además estaba bloqueada por el deadlock de H7: **falso**, el IT corre con fragmentos de
   ~10 KB y no lo dispara. La evidencia del millón se puede correr hoy.

---

# Parte B — Hallazgos abiertos, re-verificados contra el código

| # | Hallazgo | Ubicación confirmada | Sev. |
|---|---|---|---|
| H2 | `set-task-secret.cmd` corrompe el secreto (guardó `C/B;B?bank` en vez de `bank`) | `set-task-secret.cmd` → delega en `create-file-vault-secret.cmd` | Alta |
| H3 | Rechazo **total** del pago correctivo = callejón sin salida | `Mt101RebuildService:173` (`payStatus == PARTIALLY_SENT` obligatorio) | Alta |
| H4 | La cuarentena no refleja el pago del run **hijo** | Las selecciones del hijo llevan `fragment_set_id = <set correctivo del padre>`; `synchronizeLifecycle` actualiza `mt101_failed_record` del set **original** vía `mt101_rebuild_selection` → **no cruzan nunca** (verificado en BD: hijo `E2E10K-12-FIX-4-FIX-5` con 500 selecciones `REBUILD_SENT`, cuarentena del set original intacta en `REBUILD_REJECTED`) | Media |
| H5 | La rama de sondeo REST de `MT101_STATUS` ignora `routeQuery` y muere con un mensaje engañoso | `Mt101StatusTaskProvider:497` | Media *(rebajada: el SFTP **sí** funciona con `resolveNormalPay=true` — ejecución 15 COMPLETED)* |
| H6 | `knownHostsPath` tratado como credencial | `Mt101DispatchPlanCompiler:32-34` (token `knownhosts`) | Baja (diseño) |
| H7 | Flush del insert de fragmentos sólo por filas → deadlock pgJDBC | `Mt101BuildFromTableTaskProvider:65` | Alta |
| H8 | Monto no numérico mata el lote entero del BUILD | `Mt101BuildTaskProvider:430` — `new BigDecimal(normalized)` sin capturar `NumberFormatException` | Media |
| H9 | Ningún test resuelve secretos a través del contenedor CDI | todos hacen `new SecretResolver(List.of(...))` | Media |

---

# Parte C — Plan de arreglo propuesto (sin fallback)

Principio transversal: **eliminar toda degradación silenciosa**. Cada arreglo convierte un camino tolerante
en un fallo explícito, o cierra el hueco de datos que hoy se rellena por conveniencia.

## C.1 — `MT101_STATUS`: unificar las tres ramas en el ejecutor compartido *(H5, corregido)* — **prioridad 3**

**Estado real.** El SFTP route-aware **ya funciona** en el pipeline vía `resolveNormalPay=true`
(evidencia: ejecución 15, `MT101_STATUS COMPLETED`). Lo que falla es sólo la rama de sondeo REST puro cuando
le pasas una config SFTP: muere con `requires configuration.query.url`, un mensaje que no orienta.

**Cambio.** `executeQuery` deja de construir su propio plan REST y delega en `Mt101StatusQueryExecutor`, igual
que las otras dos ramas. Con `routeQuery` presente → route-aware (REST/SFTP); sin él → `query.url` obligatorio.
Se **borra** la ruta REST-only ad-hoc (no queda lógica duplicada ni un segundo comportamiento).

**Evidencia.** Un proceso con STATUS SFTP **sin** `resolveNormalPay` debe funcionar (hoy falla), y el caso REST
existente debe seguir igual (los ITs de STATUS lo cubren).

## C.2 — Evidencia de confirmaciones acotada al conflicto *(A2-1)* — **prioridad 1**

**Cambio.** `/pay-conflicts/confirmations` deja de aceptar sólo `:20:`. Pasa a exigir el **contexto del
conflicto**: `sendersReference` + `processExecutionId` (que `/pay-conflicts/open` ya devuelve en cada fila).

- SQL nuevo: `join mt101_archive a on a.id = c.archive_id where a.senders_reference = ? and
  a.process_execution_id = ?`.
  ⚠️ **Corrección del doble check:** `mt101_archive` **no tiene `fragment_set_id`** (verificado en BD); la
  columna que acota es `process_execution_id`. Es suficiente: desambigua el caso real que rompe hoy (la misma
  plantilla `:20:` repetida entre corridas).
- `processExecutionId` pasa a ser **obligatorio**: si falta → `400`. Nada de "si no lo mandas, te doy todo lo
  que haya con ese `:20:`" (eso es justo el fallback que produce evidencia de otra ejecución).

## C.3 — Acknowledge: contrato estricto y motivos separados *(A2-2, A2-3, A2-4)* — **prioridad 1**

Tres cambios en el mismo endpoint:

1. **`source` estricto**: `NORMAL` | `CORRECTIVE`; cualquier otro valor → `400`. Se elimina el
   `equalsIgnoreCase("CORRECTIVE") ? … : NORMAL`.
2. **Body JSON** en vez de query params: `{source, setId, sendersReference, reason, ticketRef}`. El motivo
   deja de viajar en la URL. Se elimina la firma por query param (sin mantener la vieja: no queremos dos
   contratos).
3. **Motivo original preservado**: migración Flyway que añade a `mt101_build_fragment` y a
   `mt101_corrective_pay_fragment`:
   - `pay_conflict_ack_by`, `pay_conflict_ack_at`, `pay_conflict_ack_reason`, `pay_conflict_ack_ticket`.
   El `UPDATE` del acknowledge deja de pisar `pay_conflict_reason` y escribe en las columnas nuevas.
   La grilla puede mostrar ambas cosas: *"banco confirmó REJECTED sobre SENT"* + *"reconocido por ops: …"*.

**Nota de alcance.** Esto toca el frontend (consola de conflictos). Lo incluyo en el trabajo.

## C.4 — Validador `connectionRef` PAY↔STATUS: emparejamiento explícito *(A2-5)* — **prioridad 2**

**Cambio.** El `MT101_STATUS(resolveNormalPay=true)` debe declarar **a qué PAY resuelve**:
`resolvesPayTaskRef: "<taskRef del MT101_PAY>"`. El validador:

- empareja STATUS→PAY por `resolvesPayTaskRef` y compara sólo ese par;
- si hay **más de un** `MT101_PAY` en el proceso y algún STATUS resolutor **no** declara `resolvesPayTaskRef`
  → `400` (ambigüedad, no adivinamos);
- con un único PAY, `resolvesPayTaskRef` es opcional y se infiere sin ambigüedad.

Esto elimina el producto cartesiano y el falso positivo, sin abrir un camino permisivo.

## C.5 — Rechazo total del correctivo: salida gobernada *(H3)* — **prioridad 2** ⚠️ *requiere tu decisión*

Ver **D.2**. Propuesta técnica: admitir `payStatus ∈ {PARTIALLY_SENT, FAILED}` en
`requestRebuildFromRejectedCorrective` (el método ya se llama "from **rejected** corrective" y los fragmentos
están en el mismo estado `REJECTED`), manteniendo intacto el maker-checker del hijo.

## C.6 — La cuarentena del run hijo *(H4)* — **prioridad 2**

**Cambio.** `synchronizeLifecycle` de un run con `parent_rebuild_run_id` debe propagar además al **set raíz**:
resolver la raíz subiendo por la cadena `parent_rebuild_run_id` y actualizar `mt101_failed_record` del set
original uniendo por la tupla **estable** `(staging_id, source_file_hash, source_record_number)` — no por
`senders_reference`, que cambia en cada generación (ese es exactamente el motivo por el que hoy no cruza).

**Evidencia.** El run hijo `E2E10K-12-FIX-4-FIX-5` ya pagó sus 20 fragmentos: tras el arreglo, las 52 filas de
cuarentena deben pasar de `REBUILD_REJECTED` a `REBUILD_SENT`.

## C.7 — Flush del insert por bytes *(H7)* — **prioridad 2**

**Cambio.** El buffer sólo se vacía por número de filas (`Mt101BuildFromTableTaskProvider:282`,
`insertBuffer.size() >= INSERT_BATCH_SIZE`). Pasa a flushear cuando se supera **cualquiera** de los dos
límites: filas **o** bytes acumulados (`INSERT_BATCH_MAX_BYTES`, ~1 MB). El tamaño ya está calculado en el
propio bucle (`payloadBytes`, `:234`), así que el cambio es de tres líneas.

**Evidencia.** Repetir el caso que deadlockeó: `maxBytesPerMessage: 100000` (fragmentos de ~100 KB) con 10 000
registros. Hoy cuelga pgJDBC 12+ minutos y falla; debe completar.

*(Corregido: esto **no** bloquea la evidencia del millón — el IT corre con fragmentos de ~10 KB.)*

## C.8 — Monto no numérico: cuarentena por fila, no muerte del lote *(H8)* — **prioridad 2**

**Cambio.** `Mt101BuildTaskProvider.parseAmount` deja de propagar `NumberFormatException`. La fila se marca
como fallida con `rule_code = STRUCT.AMOUNT_FORMAT` y va a `mt101_validation_issue`/cuarentena, igual que un
BIC inválido. El lote continúa.

**Ojo, esto no es "tragarse el error"**: es tratar un dato malo como un dato malo (cuarentena) en vez de como
un fallo de sistema. El fragmento **no** se construye y el registro **no** se paga.

## C.9 — `set-task-secret.cmd` *(H2)* — **prioridad 2**

**Cambio.** Reescribir sobre `keytool -importpass` con entrada por stdin (evitando el mangling del `.cmd`) y
añadir un paso `verify` obligatorio: releer el alias y comparar. Si no coincide → error, no "listo".

## C.10 — Test de resolución de secretos vía CDI *(H9)* — **prioridad 1**

**Cambio.** `@QuarkusTest` que inyecta el `SecretResolver` **del contenedor** y resuelve un `${secret:...}`
real contra un keystore de test, y otro que resuelve `${config:...}`. Es la prueba que faltaba y que habría
cazado el bug de `@DefaultBean` antes de producción. Además, dar prioridad explícita al
`TestConfigBackedSecretValueProvider` para que no compita con el de File Vault ahora que ambos están activos.

## C.11 — `knownHostsPath` *(H6)* — **prioridad 3**

No es un bug. Propongo sólo mejorar el mensaje de error (que hoy habla de "secret" para una ruta) y
documentar el patrón `${config:...}` en el README del ambiente. Si prefieres, se puede sacar `knownhosts` de
la lista de tokens de credencial y validarlo aparte (exigiendo que sea estático, no un literal secreto), pero
eso sí cambia una regla de seguridad del compilador de planes: **no lo toco sin tu visto bueno**.

---

# Parte D — Decisiones que son tuyas, no mías

### D.1 — ¿El acknowledge de un conflicto debe ser maker-checker?

Hoy es single-actor por rol. Apagar la alerta de una contradicción ledger↔banco es, en la práctica, la última
puerta de control sobre un pago dudoso. El resto del ciclo de pago **sí** exige maker-checker.
**Mi recomendación:** exigir `ticketRef` obligatorio ya (barato, trazable) y dejar el maker-checker como
decisión de negocio. Si dices que sí, lo implemento con el mismo patrón de segregación de funciones que el
pago correctivo.

### D.2 — ¿Se permite el run hijo tras un rechazo total?

Es el hallazgo H3. Ya me dijiste una vez "no tocar, sólo reportar". Lo vuelvo a poner sobre la mesa porque
ahora sabemos que el rechazo total puede venir de un **fallo de transporte** (credencial), no del banco, y en
ese caso el run queda muerto sin motivo de negocio. Alternativa más conservadora: **no** tocar el guard y en
su lugar clasificar los fallos de autenticación/conexión como `INVALIDATED` (que ya es re-solicitable) en vez
de `FAILED`, dejando `FAILED` sólo para rechazos reales del banco. **Esta segunda opción me gusta más**: es
más honesta semánticamente y no abre la puerta a reintentar un rechazo bancario legítimo.

### D.3 — Alcance del frontend

C.2 y C.3 cambian contratos de API que la consola de conflictos consume. Los actualizo en el mismo trabajo,
salvo que prefieras dejar el front para otra tanda.

### D.4 — Lo que **no** propongo hacer ahora

- **Evidencia de 1 millón**: depende de C.7. Una vez arreglado el flush, la corro y la documento.
- **Prueba de dos nodos**: requiere levantar una segunda instancia del app en el compose. Es un trabajo aparte;
  dime si lo quieres y lo planifico.
- **PAY por lista en el money-path principal**: coincido con el análisis, sigue fuera.
- **Exactly-once en async**: coincido, `at-least-once` controlado es lo correcto; `MT101_PAY` fuera del broker.

---

# Resumen de lo que haría, por orden

*(Orden revisado tras el doble check: C.1 baja de prioridad 1 a 3 porque el SFTP ya funciona vía
`resolveNormalPay`; el acknowledge y la evidencia suben.)*

| Orden | Trabajo | Hallazgo | Riesgo |
|---|---|---|---|
| 1 | Acknowledge: `source` estricto + body JSON + motivos separados (+ Flyway + front) | A2-2/3/4 | Medio (contrato + migración) |
| 2 | Evidencia de confirmaciones acotada por `processExecutionId` (+ front) | A2-1 | Medio (contrato) |
| 3 | Test CDI de secretos + prioridad del provider de test | H9 | Bajo |
| 4 | Flush del insert por bytes | H7 | Bajo |
| 5 | Cuarentena del run hijo | H4 | Bajo |
| 6 | Monto no numérico → cuarentena por fila | H8 | Bajo |
| 7 | Unificar las 3 ramas de STATUS en el ejecutor compartido | H5 | Medio (hot-path de STATUS) |
| 8 | Validador PAY↔STATUS con `resolvesPayTaskRef` | A2-5 | Bajo |
| 9 | `set-task-secret.cmd` + verify | H2 | Nulo |
| 10 | Clasificación transporte vs. banco (D.2) o guard del hijo (H3) | H3 | **Requiere tu decisión** |
| 11 | Evidencia del millón (ya no está bloqueada) | — | Bajo (tiempo de ejecución) |

Cada punto se entrega con: cambio de código sin fallback, test automatizado, y evidencia ejecutada contra el
ambiente de integración nativo (`https://192.168.0.15:8443/appih`), documentada en `qa/fase-6-qa/evidencias/`.
