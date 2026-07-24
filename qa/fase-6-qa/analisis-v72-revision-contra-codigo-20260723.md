# Revisión del análisis v72 contra el código real — 2026-07-23

Contraste afirmación por afirmación del análisis v72 recibido, contra el código del repo.
**Este documento es solo análisis: no se cambió código.** El plan del §6 espera autorización.

Método: lectura directa del código + dos barridos de verificación independientes. Cada veredicto lleva
`archivo:línea`. Donde el análisis acierta se dice; donde se queda corto o se pasa, se corrige con evidencia.

**Veredicto global:** el análisis es **sustancialmente correcto** — ninguna de sus afirmaciones principales
resultó falsa. Pero **subdimensiona su propio hallazgo P1**: nombra 2-3 campos en riesgo y son **16**. Hay
además 3 imprecisiones que cambian conclusiones operativas, y 5 cosas que no menciona.

> **Nota de revisión (doble check).** La primera versión de este documento decía "el front emite 6 claves" y
> describía las 16 pérdidas como `22 − 6`. Ambas cifras estaban mal: el front emite **5 explícitas + 6 de
> runtime = 11**, y la resta correcta da **15**; la 16ª (`resolvesPayTaskRef`) se pierde por otra vía. Los
> números de abajo son los recontados con `comm` sobre las listas reales.

---

## 1. Confirmado sin correcciones

| # | Afirmación | Evidencia |
|---|---|---|
| 1 | Roles `pay-conflict-maker` / `pay-conflict-checker` existen y separan los endpoints | `PlatformRoles.java:15-16`; `Mt101FragmentLookupResource.java:249-251, 270-272` — un solo rol por endpoint, sin OR ni fallback |
| 1 | `payments-operator` ya no queda autorizado implícitamente | `Mt101OpenPayConflictsConsoleIT.java:320-327` → 403 |
| 2 | Barrera de identidad checker ≠ maker, HTTP 400 | `Mt101PayConflictAcknowledgeService.java:219-222` (case-insensitive); mapeo a 400 en `Mt101FragmentLookupResource.java:281-283` |
| 3 | `PAY_CONFLICT_ACK_SUPERSEDED` se emite en la MISMA transacción | `Mt101PayConflictAcknowledgeService.java:150` (`setAutoCommit(false)`) … `:178` `writeBatch` … `:179` `commit`, con rollback en `:180-182` |
| 4 | UI maker-checker fail-closed `LOADING\|OFF\|ON\|ERROR`, sin caer a OFF | `mt101-pay-conflicts.component.ts:66, 91-97`; ERROR solo ofrece Reintentar (`.html:130-134`) |
| 5 | `MT101_PAY` exige `executionMode=once`, fail-loud, y el front solo ofrece `once` | `Mt101PayTaskProvider.guardExecutionMode`; verificado **en vivo**: selector "Una vez" + deshabilitado |
| 6 | `MT101_STATUS` con guard POR CAMINO (query libre; callback/poll/resolveNormalPay exigen `once`) | `Mt101StatusTaskProvider` switch + guard dentro de `resolveNormalPay`; verificado **en vivo**: al pasar a `poll` el modo salta a "Una vez" y se deshabilita |
| 6 | STATUS resuelve el fragment-set paginado en vez de materializar la lista | `Mt101StatusTaskProvider.java:496` (`inputIsFragmentSetRef`) |
| 8 | ADR-017 `Mt101PaySinkConnectionResolver` con refs no-literales | `:119, :123-124, :132-133` (`toMapUnresolved`), `:134-135` (merge + `remove("sinkRef")`) |
| 8 | Los 7 casos de test citados **existen** (+3 no citados) | `Mt101PaySinkConnectionResolverTest.java:115, 122, 174, 150, 192, 210, 230` |
| 10 | PAY normal resuelve el sink EN VIVO; el correctivo materializa spec congelado | `Mt101PayTaskProvider.java:179-183` (gate por `correctivePayRunId == null`); `Mt101CorrectiveLifecycleService.java:950, 974` |
| 9 | ADR-017 es fase 1 (solo PAY); STATUS sin `sinkRef` | `statusSinkRef`: **0 coincidencias** en el repo; ADR-017 `:13, :78` se auto-declara fase 1 mientras `:31, :76, :106-108` describen STATUS como alcance |
| 11 | Evidencia 1M cruda | `TEST-…Mt101MillionFileProcessE2EIT.xml:2` → `tests=3 errors=0 failures=0 time=782.48` |
| 11 | `35-e2e-1m.txt` corrige el snapshot ~10k | `:1` titula "PARCIAL, ~10k — NO es la evidencia de 1M"; `:21-23` muestran 5059/10118 |
| 12 | El checklist banco-a-banco es plan, no evidencia | `uat-banco-a-banco-checklist.md`: **42 ítems, 0 marcados**, tabla de evidencia vacía |
| 12 | `BankProfileHomologationIT` valida perfil SIMULADO | `:47-48` lo dice explícito: "FICTICIO… valida el mecanismo de onboarding, no a un banco concreto" |

---

## 2. Correcciones al análisis

### 2.1 `PAY_CONFLICT_ACK_SUPERSEDED` no depende de que sea *otro* maker

El análisis dice que la trama se emite "si se reemplaza una solicitud previa **de otro maker**". El emit está
gateado **solo** por la existencia de un PENDING previo, sin comparar identidad
(`Mt101PayConflictAcknowledgeService.java:170`):

```java
if (previousPending != null) {
    envelopes.add(Mt101PayConflictAudit.supersededEnvelope(...));
}
```

El propio javadoc lo dice: reemplazada por "otro —o **el mismo**— maker" (`Mt101PayConflictAudit.java:141`).
Es **mejor** que lo descrito para no-repudio (también deja rastro del re-request propio), pero el test solo
ejercita el camino maker-distinto (`Mt101PayConflictMakerCheckerIT.java:157-173`). **El re-request del mismo
maker no está testeado.**

### 2.2 El endpoint de un solo actor conserva los roles viejos

El análisis concluye que admin/operator "ya no quedan autorizados". Exacto para los dos endpoints
maker-checker, **pero** `/pay-conflicts/acknowledge` (un solo actor) sigue con
`@RolesAllowed({PLATFORM_ADMIN, INTEGRATION_ADMIN, PAYMENTS_OPERATOR})` (`Mt101FragmentLookupResource.java:214-215`).

No es bypass: el servicio lo rechaza cuando maker-checker está ON (`Mt101PayConflictAcknowledgeService.java:71-75`),
**pero ese rechazo es un 400 de capa de servicio, no un 403 de RBAC**. Para una auditoría de segregación de
funciones la diferencia importa: la ruta sigue siendo alcanzable por esos roles.

Además **no hay test que afirme 403 para `platform-admin` ni `integration-admin`** — solo para `payments-operator`.

### 2.3 El caso doble-rol está peor cubierto de lo que dice

El análisis lo describe como "no testeado por UI porque los fixtures usan usuarios separados". Es correcto,
pero se queda corto en dos direcciones:

- **Ningún test en ningún lado usa un principal con ambos roles.** Todos los `@TestSecurity` declaran un rol
  (`Mt101OpenPayConflictsConsoleIT.java:303, 312, 321, 330, 338`). La precedencia 403-vs-400 para un
  auto-aprobador con doble rol está sin verificar de punta a punta.
- **No existe ningún spec de frontend para el componente maker-checker.** No hay `mt101-pay-conflicts*.spec.ts`,
  así que `isMakerOf()` (`component.ts:113-116`) y el guard `[disabled]="resolveBusy() || isMakerOf(c)"`
  (`component.html:147`) no están cubiertos por **ninguna** prueba automática — no es que fallen los fixtures.

Al mismo tiempo, el análisis **subestima** el backend: la barrera de identidad no es solo teórica, está
testeada a nivel servicio, sin roles de por medio (`Mt101PayConflictMakerCheckerIT.java:94-97, 131-134`).

### 2.4 Detalles de la evidencia 1M

Números exactos del XML: `757.126` / **`1.87`** (el análisis escribe `1.870`) / `1.925`. La suma de casos es
`760.921 s` contra `782.48 s` de la suite; el delta (~21.5 s) es setup/teardown de clase, **no una
discrepancia**. Vale aclararlo porque a primera vista parece que faltan 21 segundos.

### 2.5 El test de "sobrevive edición/borrado de la fuente" no edita ni borra

`Mt101PaySinkConnectionResolverTest.java:210` no muta ninguna fuente: prueba que
`compiler.materialize(spec.specJson(), null)` **nunca consulta `SinkDefinitionService`** (`:221-226`). Es la
prueba estructural del mismo invariante y es sólida, pero la redacción del análisis promete más de lo que el
test literalmente ejerce.

---

## 3. Lo que el análisis no vio

### 3.1 El P1 no son 2 campos: son 16

**Este es el punto central de esta revisión.**

El provider de STATUS lee en runtime **22 claves** de configuración
(`grep` sobre `configuration.get(...)` en `Mt101StatusTaskProvider.java`):

```
acceptedStatuses, archiveStatusSync, archiveStatusTable, callback, confirmationTable,
connectionRef, correctivePayStatuses, executedBy, executionMode, expectedGatewayResponse,
fragmentSetId, input, maxRecordsInOutput, mode, pageSize, poll, query, reason,
rejectedStatuses, resolveCorrectivePay, resolveNormalPay, routeQuery
```

El `toTaskPatch` del front emite **11**: 5 explícitas (`mode`, `query`, `expectedGatewayResponse`,
`connectionRef` condicional, `confirmationTable`) + 6 que agrega `withRuntime` (`taskRef`, `executionMode`,
`input`, `async`, `asyncTransport`, `continueOnFailure`).

Intersección real (`comm` sobre ambas listas): **se pierden 15 de las 22 de runtime**, más
**`resolvesPayTaskRef`** —que no lee el provider pero sí el validador de diseño desde el mismo
`configurationJson` de STATUS (`Mt101PayResolverPairing.java:60, 94`)— → **16 claves distintas en total**.

Las 15 de runtime, entre ellas:

- `resolveNormalPay`, `resolveCorrectivePay` — conciliación inline (lo que el análisis identificó)
- **`poll` y `callback`** — los bloques de configuración de **los dos modos que la propia UI ofrece en su
  selector**. Se puede elegir `mode: poll` en pantalla y su config (`finalStatuses`, `maxAttempts`) nunca se
  persiste. Esto el análisis no lo menciona y es igual de grave.
- `routeQuery` — consulta por ruta/banco
- `fragmentSetId`, `acceptedStatuses`, `rejectedStatuses`, `correctivePayStatuses`
- `archiveStatusSync`, `archiveStatusTable`, `pageSize`, `maxRecordsInOutput`, `executedBy`, `reason`

### 3.2 Precisión de severidad: abrir es seguro, el daño requiere editar+guardar

El análisis dice "si alguien **abre/guarda** la tarea desde la UI". Precisión: los forms emiten solo desde
eventos de usuario (`updateDraft`); `draft` es un `computed` sobre `hydrateDraft`, de solo lectura. **Abrir el
formulario no pierde nada.** La pérdida exige que el usuario modifique algún campo y guarde — p. ej. tocar la
URL de query hace desaparecer `resolveNormalPay` en silencio.

### 3.3 La red fail-loud existe pero está apagada por defecto

`Mt101PayResolverPairing` valida en tiempo de diseño el emparejamiento PAY ↔ STATUS(`resolveNormalPay`) y es
fail-loud (400 si es ambiguo). **Pero** está gobernado por `mt101.pay.require-normal-pay-resolver`, cuyo
`defaultValue = "false"` (`Mt101PayResolutionValidator.java:42`) y que además el **template de producción deja
en `false`** (`application-prod.properties:63`).

Eso es **decisión deliberada y documentada** ("Dejar false si concilias por scheduler; poner true si tu diseño
la resuelve inline", `:61-62`), así que no es defecto — pero significa que **en la configuración por defecto no
hay red**: perder `resolveNormalPay` desde la UI no rompe la publicación y la garantía se pierde en silencio.

Matiz adicional: `resolvesPayTaskRef` **no lo lee el provider de STATUS en runtime**; lo leen los validadores
de proceso (`Mt101PayResolverPairing.java:60, 94`). El análisis lo agrupa con los campos de runtime.

### 3.4 Hay un test cuyo nombre promete lo que no cubre

`mt101-status-task.provider.spec.ts:68` se llama **`'roundtrip preserves all fields'`**. Construye el draft con
`createDraft()` y compara `rehydrated` contra `initial`: round-trippea **los 9 campos del draft contra sí
mismos**. Es estructuralmente incapaz de detectar la pérdida de las otras 16 claves.

Es falsa garantía: un revisor que vea ese nombre en verde concluye que el round-trip es seguro.

### 3.5 El javadoc del provider de STATUS está obsoleto

`mt101-status-task.provider.ts:26-29` afirma: *"Slice 2.2 backend implementa solo `mode: "query"`. Los modos
`poll` y `callback` requieren M-2 y son **rechazados explícitamente por el backend**."*

**Falso hoy**: el backend implementa los tres modos (`Mt101StatusTaskProvider.execute` switch), y la clase
`implements SuspendableTaskProvider` con `suspendForCallback` (`:262`) y `pollRound` (`:445`).

---

## 4. Estado corregido

| Área | Análisis v72 | Corregido |
|---|---|---|
| Roles maker/checker separados | Implementado | Implementado; endpoint de un-solo-actor conserva roles viejos (bloqueo 400, no 403) |
| `PAY_CONFLICT_ACK_SUPERSEDED` | Implementado | Implementado y **más amplio** (también en re-request del mismo maker); ese caso sin test |
| Settings fail-closed | Implementado | Implementado, sin observaciones |
| Test doble-rol | No testeado por UI | **Sin test en ningún lado**; además cero specs del componente |
| `MT101_PAY executionMode=once` | Implementado | Implementado; verificado en vivo |
| STATUS guard por camino | Implementado | Implementado; verificado en vivo |
| ADR-017 PAY `sinkRef` | Implementado | Implementado; 7/7 tests citados existen |
| ADR-017 STATUS | Pendiente | Pendiente (0 coincidencias de `statusSinkRef`) |
| **UI de `resolveNormalPay`** | **Pendiente importante** | **Pendiente CRÍTICO: 16 claves, no 2** |
| Evidencia 1M | Conservada | Conservada; números exactos confirmados |
| Banco real | Pendiente | Pendiente (checklist 0/42) |

---

## 5. Riesgo priorizado

| Sev | Hallazgo | Por qué |
|---|---|---|
| **P1** | STATUS pierde 16 claves al editar+guardar desde la UI | Rompe conciliación inline y la config de poll/callback, en silencio y sin red por defecto |
| **P2** | `'roundtrip preserves all fields'` da falsa garantía | Oculta P1 a cualquier revisor |
| **P2** | Cero cobertura automática del componente maker-checker | El guard anti-auto-aprobación de UI no está probado |
| **P3** | Javadoc obsoleto del provider STATUS | Induce a error sobre capacidades del backend |
| **P3** | Sin test 403 para `platform-admin`/`integration-admin` | Hueco de cobertura RBAC |
| **P3** | SUPERSEDED del mismo maker sin test | Comportamiento real más amplio que el probado |

---

## 6. Plan propuesto — **requiere autorización**

Aplicando la política del proyecto: **sin fallback; el código obsoleto se elimina, no se deja de respaldo.**

### P1 — STATUS deja de perder configuración

Dos alternativas; **recomiendo la A**:

- **A. Draft completo + campos en el form.** Extender `Mt101StatusTaskDraft` con las 16 claves, exponer en el
  formulario las de decisión operativa (`resolveNormalPay`, `resolvesPayTaskRef`, `poll`, `callback`,
  `routeQuery`) y forzar `executionMode: once` cuando `resolveNormalPay` esté activo (espejo de lo ya hecho en
  `updateMode`). Ventaja: lo que se ve es lo que hay; sin campos fantasma.
- **B. Preservar desconocidos.** Que `toTaskPatch` parta del `configurationJson` original y solo sobreescriba
  lo que el form gobierna. Menos trabajo, pero deja campos invisibles que la UI no puede editar ni mostrar —
  reintroduce la clase de problema que venimos eliminando (la UI mintiendo sobre la configuración).

### Resto

1. **P2** — Renombrar el test a lo que realmente prueba y agregar uno que falle si `toTaskPatch` pierde claves
   (round-trip contra un `configurationJson` real con las 22 claves).
2. **P2** — Spec del componente maker-checker: `isMakerOf()`, guard deshabilitado, y los cuatro estados.
3. **P3** — Corregir el javadoc obsoleto (**eliminar** la afirmación falsa, no matizarla).
4. **P3** — Tests: 403 para admin/integration-admin; SUPERSEDED del mismo maker; principal doble-rol.
5. **Fuera de alcance de esta tanda** (requieren decisión de producto): completar ADR-017 en STATUS, dos
   réplicas reales, métricas operativas del 1M, UAT banco real, migración de roles en el Keycloak productivo.

### Evidencia comprometida

Por cada fix: test que **falla sin el arreglo** (verificado revirtiendo, como se hizo con los fixes de DB_WRITE
de hoy), suite completa en verde, y anotación en `qa/fase-6-qa/evidencias/`.
