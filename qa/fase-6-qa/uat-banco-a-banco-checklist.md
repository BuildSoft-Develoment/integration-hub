# UAT banco-a-banco — money-path MT101 (checklist de homologación)

Validación **con el banco real** (no simulada): conectividad, ACK/NACK reales, y —lo crítico— **cero doble pago**
bajo timeouts ambiguos. Cada caso indica el estado esperado del sistema (mapeado al ledger/trama real) y la
evidencia a capturar. Marca `[x]` al pasar; registra el resultado y la evidencia en la tabla final.

> **Prod-safe:** ejecutar con el perfil productivo y sus controles ON (`mt101.pay.direct-list.enabled=false`,
> `mt101.pay.conflict.acknowledge.maker-checker.enabled=true`) — así el UAT valida exactamente lo que irá a prod.
> Usar un entorno de UAT dedicado del banco; **nunca** pagos de valor real salvo el/los caso(s) piloto acordados.

Leyenda estado destino: `SENT` (aceptado banco) · `FAILED` (NACK real) · `UNCERTAIN` (ambiguo, conciliar) ·
`INVALIDATED` (no salió, re-solicitable) · `ARCHIVED`/`DISPATCHING` (transición) · `PAY_CONFLICT` (contradicción).

---

## 0. Sign-off y prerrequisitos (gating — nada arranca sin esto)

- [ ] **Acuerdo de UAT con el banco**: ventana, entorno, BIC de prueba, referencia de contacto operativo del banco.
- [ ] **Canal acordado**: SFTP (mTLS) y/o REST. Documentar cuál(es) y el formato de confirmación del banco
      (MT101 ACK/NACK, `pain.002`, `camt.054`, o el que aplique).
- [ ] **Alcance del piloto**: montos/moneda de prueba, si hay 1 pago de valor real piloto y su aprobación formal.
- [ ] **Rollback/contención**: procedimiento acordado si un pago sale por error (contacto banco, reverso/cancelación).

### 0.1 Conectividad y credenciales (reales, no fixture)
- [ ] SFTP: host/puerto, **host key** del banco fijada (known_hosts), usuario, **mTLS** (cert cliente emitido por
      CA aceptada por el banco; cadena completa). Cert **NO** self-signed (revertido el de lab).
- [ ] REST (si aplica): endpoint, mTLS/OAuth, timeouts, reintentos.
- [ ] Handshake de conectividad **sin pago**: subir/leer un archivo de control por SFTP (o ping REST autenticado) → OK.
- [ ] OIDC/Keycloak prod (sin `directAccessGrants`, sin usuarios fixture); roles `payments-operator`/checker reales.

### 0.2 Datos y trazabilidad
- [ ] Archivo(s) MT101 de UAT con **BIC emisor/receptor de prueba**, `:20:` únicos, value date válida, moneda/monto de UAT.
- [ ] Reloj sincronizado (NTP) app ↔ banco (para conciliar timestamps de ACK).
- [ ] Observabilidad lista: consola **PAY Conflicts**, **row-timeline/lineage**, **quarantine**, y el **audit spool**
      (tramas append-only) accesibles al equipo de QA.

---

## 1. Happy path (aceptación del banco)

- [ ] **1.1 Envío nominal end-to-end.** Un MT101 válido recorre `FILE_READ→DB_WRITE→BUILD_FROM_TABLE→VALIDATE→
      ARCHIVE→ROUTE→PAY→STATUS`. **Esperado:** el fragmento llega a **`SENT`**; el banco emite **ACK**; se registra
      una `mt101_confirmation` (`confirmation_type`, `gateway_reference`, `confirmed_status`) conciliada al `:20:`.
      *Evidencia:* row-timeline del `:20:` con hito PAY→SENT + la confirmación con su `gatewayReference`.
- [ ] **1.2 Lote multi-transacción.** Un archivo con N pagos → N `SENT`, cada uno con su ACK y `gatewayReference`
      distinto. Sin cruces de referencia entre transacciones.
- [ ] **1.3 Idempotencia de reenvío del MISMO archivo.** Reprocesar el mismo archivo (mismo hash) **no** genera
      pagos nuevos (dedupe por idempotencia). *Esperado:* 0 pagos adicionales al banco.

## 2. Confirmaciones / STATUS (ACK) y reconciliación

- [ ] **2.1 ACK positivo** (pACK/ACK del banco) → `MT101_STATUS`/`MT101_RECONCILE` marca la confirmación; el ledger
      queda consistente (`SENT` confirmado). *Evidencia:* la confirmación inline en la consola.
- [ ] **2.2 Confirmación tardía.** El ACK llega con retraso (minutos/horas) → se concilia igual contra el `:20:` +
      ejecución, sin reenviar. *Esperado:* sin segundo pago; confirmación asociada a **esa** ejecución (no otra corrida).
- [ ] **2.3 Confirmación de otra corrida con el mismo `:20:`.** El sistema acota por `process_execution_id` → no
      mezcla evidencia entre corridas. *Esperado:* la evidencia mostrada corresponde a la ejecución correcta.

## 3. Rechazo del banco (NACK) y corrección

- [ ] **3.1 NACK real** (el banco rechaza el pago: formato/negocio) → estado terminal **`FAILED`** (rechazo del
      banco, no de transporte). *Esperado:* NO re-solicitable a ciegas; el motivo del banco queda auditado.
- [ ] **3.2 Corrección tras NACK.** El pago rechazado se corrige (quarantine/rebuild) y se re-solicita por el flujo
      correctivo (run hijo). *Esperado:* solo el/los `:20:` rechazados se re-envían; los `SENT` no se tocan.
- [ ] **3.3 Rechazo parcial de lote** (algunos `SENT`, otros NACK). *Esperado:* run `PARTIALLY_SENT`; los NACK van a
      corrección; **cero reenvío** de los aceptados.

## 4. Money-safety / anti-doble-pago (CRÍTICO — el corazón de la homologación)

> Estos casos requieren inducir fallos/timeouts reales con el banco (coordinar con su operación). Son los que
> distinguen "funciona" de "es seguro para banca".

- [ ] **4.1 Fallo ANTES del envío** (credencial/conexión mala **pre-dispatch**). *Esperado:* clasifica
      **transportFailure → `INVALIDATED`** (nunca llegó al banco) → **re-solicitable**; al re-enviar, el banco recibe
      **exactamente uno**. *Verificar en el banco:* 1 solo pago por `:20:`.
- [ ] **4.2 Timeout ambiguo DURANTE/DESPUÉS del put** (se cortó tras empezar a despachar). *Esperado:* **`UNCERTAIN`**
      (pudo llegar) → **NO** hay reenvío ciego; se **concilia** contra la confirmación del banco. *Verificar:* si el
      banco lo recibió → resuelve `UNCERTAIN→SENT` sin segundo pago; si no → re-solicitable.
- [ ] **4.3 Reinicio de la app a mitad de un PAY.** Matar el proceso durante el despacho y reiniciar. *Esperado:* el
      claim persistido (`ARCHIVED→DISPATCHING`) impide re-despachar el mismo fragmento; queda `UNCERTAIN`/consistente.
      *Verificar en el banco:* sin duplicado.
- [ ] **4.4 Dos nodos + caída de uno (fencing).** Con 2 réplicas, matar el nodo A a mitad de un PAY. *Esperado:* el
      lease vencido lo re-clama otro nodo con **token de fencing**; el nodo A al "despertar" **no** finaliza ni pisa el
      work-item re-tomado; el PAY queda **`UNCERTAIN`** (conciliar), **nunca** re-enviado. *(Garantía ya probada por
      `AsyncInboxClaimIT`; aquí es la confirmación operativa en vivo — ítem two-node (B).)*
- [ ] **4.5 Doble entrega/duplicado a nivel SWIFT (PDE).** Verificar que un reintento no produce un mensaje duplicado
      aceptado por el banco (idempotencia + fencing). *Verificar:* el banco no reporta Possible Duplicate Emission real.
- [ ] **4.6 Contradicción ledger↔banco (PAY_CONFLICT).** Forzar/observar un caso donde el terminal del ledger
      contradice la confirmación del banco → aparece en la consola **PAY Conflicts** con su evidencia inline.

## 5. Gobierno y controles (four-eyes + auditoría)

- [ ] **5.1 Maker-checker en un PAY_CONFLICT.** Un **maker** solicita reconocer (motivo + ticket) → la alerta **no**
      se apaga; un **checker distinto** aprueba → se apaga. *Esperado:* el mismo actor NO puede aprobar (segregación,
      400); la consola muestra la solicitud PENDING (maker/ticket/motivo).
- [ ] **5.2 Fail-loud en carrera.** Dos checkers intentan aprobar el mismo conflicto → exactamente uno cierra; el otro
      falla explícito (sin doble-cierre). *(Cubierto por IT; confirmar comportamiento en la UI real.)*
- [ ] **5.3 Auditoría append-only.** Cada acción deja su trama (`PAY_CONFLICT_ACK_REQUESTED`, `PAY_CONFLICT_RESOLVED`,
      etc.) con actor(es), motivo y ticket. *Esperado:* trazabilidad completa exportable para el auditor del banco.
- [ ] **5.4 Autorización por rol.** Un rol sin permiso (p. ej. `AUDITOR` read-only) **no** puede reconocer ni pagar.

## 6. No funcionales

- [ ] **6.1 Volumen representativo.** Enviar un lote de tamaño acordado con el banco (p. ej. el pico diario esperado)
      end-to-end. *Esperado:* todos conciliados; sin degradación. *(Escala interna ya evidenciada a 1M; aquí es contra
      el banco real.)*
- [ ] **6.2 Seguridad de transporte.** Confirmar mTLS efectivo (cert cliente presentado y aceptado), cifrado en
      tránsito, y que ningún secreto/monto viaja en URL/logs.
- [ ] **6.3 Reintentos/backoff** ante fallos transitorios del canal → sin duplicar y sin quedar colgado.
- [ ] **6.4 Reconciliación de fin de día.** Cuadre: total enviado por la plataforma == total confirmado por el banco;
      diferencias → `UNCERTAIN`/`PAY_CONFLICT` con evidencia (cero descuadre silencioso).

## 7. Operacion / observabilidad (readiness)

- [ ] **7.1 Alertas** ante PAY_CONFLICT / UNCERTAIN / FAILED llegan al equipo operativo.
- [ ] **7.2 Runbook** de resolución de conflictos y de recuperación de nodo probado por el operador (no solo el dev).
- [ ] **7.3 Health/readiness** del servicio nativo (`/q/health/ready`) verde con DB+messaging.

---

## Criterios de salida (exit criteria — homologación)

- [ ] **Cero doble pago** verificado **en el banco** en todos los casos de §4 (el criterio bloqueante).
- [ ] Happy path (§1), confirmaciones (§2) y NACK+corrección (§3) OK.
- [ ] Four-eyes y auditoría (§5) demostrados end-to-end.
- [ ] Cuadre de fin de día (§6.4) sin descuadres silenciosos.
- [ ] Sign-off firmado por: **operación del banco**, **QA/homologación**, **seguridad/cumplimiento**, **dueño del producto**.

## Registro de evidencia

| Caso | Fecha | Ejecutor | Resultado (OK/NOK) | Evidencia (row-timeline / confirmación / consola / export auditoría) | Notas |
|---|---|---|---|---|---|
| 1.1 |  |  |  |  |  |
| 4.1 |  |  |  |  |  |
| 4.2 |  |  |  |  |  |
| 4.4 |  |  |  |  |  |
| 5.1 |  |  |  |  |  |
| 6.4 |  |  |  |  |  |
| … |  |  |  |  |  |

> Nota: los casos de §4 (money-safety) exigen **verificación cruzada con el banco** (¿cuántos pagos recibió por
> `:20:`?), no solo el estado interno del ledger — es la única forma de probar "cero doble pago" de verdad.
