# Revalidación del análisis "v66" contra el código + plan tanda-2

**Fecha:** 2026-07-14 · **Rama:** `experiment/quarkus-lts-native` · **Estado:** propuesta, PENDIENTE DE AUTORIZACIÓN.
Nota: el análisis externo llama "v66" a la tanda-1 de arreglos ya implementada
([arreglos-hallazgos-v65-20260714.md](evidencias/arreglos-hallazgos-v65-20260714.md)). No hay tocado ningún
archivo para esta tanda-2 todavía.

Principio (tuyo): **sin caminos de fallback ni legacy en el código fuente**; validar lo ya implementado.

---

## ✅ ESTADO DE IMPLEMENTACIÓN (autorizado: #1, #5, D.2)

| # | Trabajo | Estado |
|---|---------|--------|
| 1 | Multi-PAY: obligatoriedad por `resolvesPayTaskRef` (helper compartido `Mt101PayResolverPairing`) | **HECHO** + tests |
| 5 | H4: cuarentena del run hijo (propagación por tupla estable) | **HECHO** + IT |
| D.2 | Clasificar transporte/auth como `INVALIDATED` (re-solicitable), no `FAILED` | **HECHO** + tests |

Ver evidencia detallada: [evidencias/arreglos-tanda2-20260714.md](evidencias/arreglos-tanda2-20260714.md).
Verificación: `mvn test-compile` BUILD SUCCESS; 147 tests dirigidos verdes (incl. 62 del corrective lifecycle,
confirmando que D.2 no rompió el flujo). Evidencia e2e en nativo + IT de H4 pendientes del reinicio de Docker.

---

# Parte A — Veredicto del análisis externo

**Es sólido y en su mayoría correcto.** Confirma punto por punto la tanda-1 (acknowledge estricto, motivo
original preservado, evidencia por ejecución, `resolvesPayTaskRef`, flush por bytes, monto por fila,
SecretResolver CDI). Traigo **un hallazgo nuevo genuino y válido** (P1) y dos matices menores. Verificado
todo contra el código real:

| Punto del análisis | Verificación contra código | Veredicto |
|---|---|---|
| 1. Acknowledge body JSON + `source` estricto | `Mt101FragmentLookupResource:207`, `Mt101PayConflictAcknowledgeService:66` (switch NORMAL/CORRECTIVE, 400 si otro) | ✅ correcto |
| 2. Motivo original preservado (V98) | `V98__…sql` + `acknowledgeNormalPayConflict:1168` (no pisa `pay_conflict_reason`) | ✅ correcto |
| 3. Evidencia por `processExecutionId` | `Mt101FragmentRepository:1118` (`and a.process_execution_id = ?`) | ✅ correcto |
| 4. Acknowledge single-actor + ticket | rol `PAYMENTS_OPERATOR`; ticket obligatorio (400 si falta) | ✅ correcto; maker-checker = decisión de negocio (ver D.1) |
| **5. Hueco P1 multi-PAY en obligatoriedad** | **`Mt101PayResolutionValidator:72-76`** | ✅ **CONFIRMADO — hallazgo real, ver B.1** |
| 6. Flush por bytes | `Mt101BuildFromTableTaskProvider:294` (filas O bytes) | ✅ correcto |
| 7. Monto por fila; código `AMOUNT_FORMAT` | reusa `STRUCT.AMOUNT_POSITIVE` (no existe `AMOUNT_FORMAT`) | ⚠️ válido pero matizado, ver B.2 |
| 8. SecretResolver `@All`+prioridad | `SecretResolver:23` (`@All List<>`), `SecretResolverCdiWiringIT` 3/3 | ✅ correcto |
| 9. PAY por lista fuera del money-path | `mt101_pay_dispatch_intent.payload_hash` existe; sin cambios míos | ✅ coincido |
| 10. H3/H4/H10 diferidos | idénticos a la tanda-1 | ✅ correcto |
| 11B. Credenciales/cert demo en `int/` | `int/.env` + `nginx/certs/server.key` commiteados | ⚠️ real, pero fue decisión tuya explícita (lab); ver B.3 |
| 12. Confianza de plugins en money-path | `trusted/untrusted/degraded/shadowed_by_local` ya existe | ✅ coincido |

---

# Parte B — Lo accionable

> **⚠️ Corrección tras doble check (2026-07-14):** rebajé la severidad de P1 de "prioridad 1 / dinero
> incierto sin cierre" a **prioridad 2 / consistencia de validación**. Motivo: existe una garantía de RUNTIME
> (**G1**, `Mt101PayTaskProvider:218-219`) que ya impide el peligro real — un PAY UNCERTAIN señaliza
> `needsReconciliation` y el motor cierra en `NEEDS_RECONCILIATION`, **nunca COMPLETED silencioso**. Así que el
> dinero **no** se cierra en falso aunque P1 deje pasar el proceso. P1 es un hueco de validación **en tiempo de
> publicación** (la promesa del flag no se cumple para multi-PAY), no un agujero de seguridad del dinero. Sigue
> valiendo la pena cerrarlo (los dos validadores deben ser consistentes y el flag debe ser honesto), pero no es
> una emergencia. La sección B.1 queda corregida abajo.

## B.1 — [P1, prioridad 2] Hueco de obligatoriedad multi-PAY — **CONFIRMADO** (severidad corregida)

**El código.** `Mt101PayResolutionValidator.validate` decide "este PAY tiene resolutor" así
([líneas 72-76](../../vertical-swift-mt101/src/main/java/com/integrationhub/vertical/swift/mt101/service/Mt101PayResolutionValidator.java)):

```java
var hasDownstreamNormalPayResolver = tasks.stream().anyMatch(candidate ->
        MT101_STATUS.equalsIgnoreCase(candidate.taskType())
                && candidate.taskOrder() > pay.taskOrder()
                && boolConfig(candidate.configurationJson(), "resolveNormalPay"));
```

**No mira `resolvesPayTaskRef`.** Es el MISMO producto cartesiano que arreglé en el validador de conexión,
pero que quedó intacto aquí.

**El fallo concreto.** Con `mt101.pay.require-normal-pay-resolver=true` y este grafo:

```
1. MT101_PAY   taskRef=pay-a
2. MT101_PAY   taskRef=pay-b
3. MT101_STATUS resolveNormalPay=true  resolvesPayTaskRef=pay-a
```

Para `pay-b`: `hasDownstreamNormalPayResolver` = "¿hay algún STATUS(resolveNormalPay) en orden > 2?" → sí, el
de orden 3 → **pasa la validación**. Pero ese STATUS resuelve `pay-a`, no `pay-b`. Resultado: `pay-b` queda
**sin resolutor** y el ambiente "in-line" lo publica igual. Es el hueco exacto que el análisis describe.

**Impacto real (corregido por el doble check).** El runtime NO cierra el dinero en falso: G1
(`Mt101PayTaskProvider:218-219`) hace que un `pay-b` UNCERTAIN señalice `needsReconciliation` y el motor cierre
la ejecución en `NEEDS_RECONCILIATION`, no en COMPLETED. Lo que se rompe es la **promesa del flag**: el operador
activó `require-normal-pay-resolver=true` para que TODO PAY se auto-reconcilie in-line, pero `pay-b` no tiene
resolutor → su UNCERTAIN se queda en `NEEDS_RECONCILIATION` esperando resolución manual/separada, justo lo que
el flag pretendía evitar. Es un fallo de "fail-loud en configuración" e **inconsistencia** con el validador de
conexión (que YO ya hice multi-PAY-aware en la tanda-1): hoy uno exige `resolvesPayTaskRef` y el otro no.

**Fix propuesto (sin fallback).** Que la obligatoriedad exija emparejamiento EXACTO, igual que la cobertura de
conexión: por cada `MT101_PAY`, debe existir un `MT101_STATUS(resolveNormalPay=true)` posterior que resuelva
**ese** PAY.

- **Un solo PAY** en el proceso → un STATUS resolutor posterior sin `resolvesPayTaskRef` lo satisface
  (compat con el flujo simple; no rompe los tests actuales).
- **Varios PAY** → cada STATUS resolutor debe declarar `resolvesPayTaskRef`, y cada PAY debe tener el suyo por
  `taskRef`. Un PAY sin STATUS que lo nombre → 400. Un STATUS con `resolveNormalPay` pero sin
  `resolvesPayTaskRef` en un proceso multi-PAY → 400 (ambigüedad).

Esto reutiliza exactamente la lógica de emparejamiento (`matchPay`) que ya existe en
`Mt101PayStatusConnectionCoverageValidator`. Propongo **extraer ese emparejamiento a un helper compartido**
para no duplicarlo (una sola definición de "qué STATUS resuelve qué PAY"), y que ambos validadores lo usen.

**Tests.** `Mt101PayResolutionValidatorTest` + su IT: añadir los casos multi-PAY (pay-b sin resolutor → 400;
pay-a y pay-b con su resolvesPayTaskRef → OK). **Verificado en el doble check:** los 8 casos actuales del test
son todos single-PAY (o PAY-solo / STATUS-antes-de-PAY / sin-PAY), así que mi fix los preserva sin cambios —
"un solo PAY → STATUS resolutor sin `resolvesPayTaskRef` lo satisface" es exactamente el comportamiento que ya
esperan `whenEnvRequiresResolverPayWithDownstreamResolverAndContinueOnFailureIsAccepted` y compañía.

## B.2 — [prioridad 3] Código de issue para monto no numérico

**El análisis tiene razón en la semántica.** Hoy `parseAmount` devuelve `null` tanto para vacío como para no
numérico, y `MT101_VALIDATE` lo rechaza con `STRUCT.AMOUNT_POSITIVE` ("amount must be greater than zero") —
mensaje engañoso para un valor como `"ABC-NO-NUM"` (no es "no positivo", es "no es número").

**Pero el fix limpio no es trivial.** `STRUCT.AMOUNT_FORMAT` no existe, y —más importante— el VALIDATE sólo ve
el mensaje ya construido (amount=null); **no puede distinguir** "null por vacío" de "null por no numérico".
Para emitir un código preciso hay que **llevar esa información desde el BUILD** (que es quien tiene el string
crudo). Eso cambia el contrato BUILD→VALIDATE. Opciones:
- (a) El BUILD marca la transacción con un motivo estructurado cuando el parseo falla, y VALIDATE lo publica
  como `STRUCT.AMOUNT_FORMAT`. Más correcto, pero toca el flujo BUILD→VALIDATE.
- (b) Añadir una regla `STRUCT.AMOUNT_FORMAT` que valide el string ORIGINAL del staging (no el message), antes
  del BUILD. Más aislado, pero valida en otra capa.

**Mi recomendación:** dejarlo para después del P1; es una mejora de claridad operativa, no un hueco de
control. Si lo quieres ya, prefiero la opción (a) porque mantiene una sola fuente de verdad del monto.

## B.3 — [prioridad 2, pre-prod] Separar el material de laboratorio del productivo

El análisis marca que `ops/…/onprem/int/` trae `.env` con credenciales demo y `nginx/certs/server.key`
(llave privada). **Es correcto y están commiteados** (fue tu decisión explícita "commitear todo tal cual" para
el lab). No es un bug, pero para entrega a cliente conviene:
- Separar `onprem/int-lab/` (no productivo, con material demo) de un `onprem/prod-template/` (sin secretos,
  con `.env.example` y placeholders + instrucciones para generar cert/secretos).
- Marcar `int-lab` como NO productivo en el README.
- (Recordatorio ya dado: esas credenciales viven en el historial de git; si alguna se reusara en real, rotarla.)

No toca código fuente; es reorganización de `ops/`.

---

# Parte C — Puntos que el análisis reitera y que YA estaban decididos (sin cambio)

- **H3 (rechazo total del correctivo)** y **H10 (clasificar transporte vs. banco)**: siguen diferidos. Ambos
  reshapean el modelo de estados terminales / el SPI `TransportResult` y necesitan **tu confirmación de la
  opción D.2** (clasificar auth/transporte como `INVALIDATED` re-solicitable, dejando `FAILED` sólo para
  rechazo real del banco). El análisis lo confirma como "de los más importantes para homologación". Mi postura
  no cambia: alto riesgo, requiere tu decisión antes de tocar el core.
- **H4 (cuarentena del run hijo)**: diferido; el análisis propone exactamente la tupla estable
  `(staging_id, source_file_hash, source_record_number)` que yo ya había identificado. Riesgo moderado. Puede
  entrar en la tanda-2 si lo autorizas.
- **Evidencia de 1 millón** y **prueba de dos nodos**: pendientes de ejecutar; no son cambios de código.
- **Maker-checker para PAY_CONFLICT_RESOLVED** (D.1): decisión de negocio. Recomendación del análisis y mía:
  opt-in por ambiente, obligatorio en producción bancaria.

---

# Parte D — Qué propongo para la tanda-2 (a tu autorización)

| Orden | Trabajo | Origen | Riesgo | Requiere decisión |
|---|---|---|---|---|
| 1 | **P1**: obligatoriedad multi-PAY con emparejamiento por `resolvesPayTaskRef` (+ helper compartido + tests) | análisis pto.5 | Bajo | No |
| 2 | H4: propagar cuarentena del run hijo por tupla estable (+ evidencia en el correctivo ya existente) | H4 | Medio | No |
| 3 | `STRUCT.AMOUNT_FORMAT` para monto no numérico (opción a) | análisis pto.7 | Bajo-medio | No |
| 4 | Separar `int-lab` / `prod-template` en `ops/` | análisis pto.11B | Nulo (no es código) | No |
| 5 | H3 + H10: clasificación transporte vs. banco + salida del rechazo total | H3/H10/D.2 | **Alto** | **Sí (D.2)** |
| 6 | Maker-checker de PAY_CONFLICT_RESOLVED por ambiente | D.1 | Bajo | **Sí (D.1)** |

**Mi recomendación:** autorizar 1–4 (bajo riesgo, cierran huecos reales, todos con test + evidencia). Dejar 5
y 6 para cuando decidas D.2 y D.1, porque tocan el core del money-path o son política de negocio. Nota: P1 (orden 1)
es prioridad **2** en severidad real (runtime seguro por G1) pero lo pongo primero por ser el más barato y de
menor riesgo — cierra la inconsistencia entre los dos validadores.

---

# Parte E — Doble check de ESTE análisis (2026-07-14)

Auditoría escéptica de mis propias afirmaciones. Un hallazgo material:

| Afirmación revisada | Resultado |
|---|---|
| **Severidad de P1** | ❌→✅ **Corregida.** Escribí "dinero incierto sin cierre" (prioridad 1). El doble check encontró G1 (`Mt101PayTaskProvider:218-219`): el runtime cierra en `NEEDS_RECONCILIATION`, nunca COMPLETED en falso. P1 es consistencia de validación en config-time, no seguridad del dinero. Rebajado a prioridad 2. |
| Compat del fix P1 con tests actuales | ✅ Verificado: los 8 casos del `Mt101PayResolutionValidatorTest` son single-PAY (o PAY-solo/sin-PAY); el fix "single-PAY → bare STATUS satisface" los preserva. |
| Punto 7: `STRUCT.AMOUNT_FORMAT` no existe y VALIDATE no distingue null-vacío de null-no-numérico | ✅ Confirmado en `Mt101StructuralRules` (solo `AMOUNT_POSITIVE`); el fix limpio exige tocar BUILD→VALIDATE. |
| Punto 11B: `.env` + `server.key` demo commiteados | ✅ Confirmado en `int/`; fue decisión explícita del lab, no bug. |
| H3/H4/H10 siguen siendo los diferidos correctos | ✅ Sin cambios respecto a la tanda-1. |

**Conclusión del doble check:** el hallazgo P1 es real y vale cerrarlo, pero **no es una emergencia de dinero**
—el runtime ya está protegido por G1—; es una inconsistencia de validación en tiempo de publicación. El resto
del análisis se sostiene.

Cada punto se entregaría con: cambio sin fallback, test automatizado, y evidencia ejecutada contra el ambiente
nativo (`https://192.168.0.15:8443/appih`) en `qa/fase-6-qa/evidencias/`.

**No implemento nada hasta tu visto bueno.**
