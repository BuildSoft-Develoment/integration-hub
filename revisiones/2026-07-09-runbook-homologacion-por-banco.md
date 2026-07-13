# Runbook — homologación banco-a-banco (H2H MT101)

**Fecha:** 2026-07-09
**Tipo:** guía operativa (config + proceso; **no** código). Convierte "homologar un banco" en una lista de pasos con
config, cada uno anclado a la superficie real de la plataforma.

> **Alcance.** La homologación en sí es bilateral (con el entorno de test y la firma del banco). Este runbook cubre lo
> que **vos** controlás: mapear el manual H2H del banco a la config de la plataforma, probar, capturar evidencia y
> quedar listo para el sign-off. **La plataforma es un motor config-driven**: casi todo es config, no código.

---

## 0. Pre-requisitos (a pedir al banco)

- [ ] **Manual H2H / especificación MT101** del banco (campos obligatorios/prohibidos, opciones, charset, longitudes).
- [ ] **Entorno de test / gateway** (URL REST o host+ruta SFTP) + **credenciales** (mTLS, API key, llaves SFTP).
- [ ] **Catálogo de estados** del banco (sus códigos de aceptado/rechazado y el formato del acuse: MT900/MT910,
      pacs.002 o propietario) y **campo** donde viaja el estado y la referencia del gateway.
- [ ] **Reglas operativas**: cutoff / value-date, manejo de duplicados, ventana de reintento, SLA de confirmación.
- [ ] **Requisitos de seguridad** (firma, mTLS, cifrado de archivo).

---

## 1. Pre-check de completitud (ANTES de sentarte con el banco)

Verificá que las superficies de config existen y están sanas — así no descubrís gaps en vivo:

- [ ] **Reglas por banco**: el reader/pantalla **payment-rules** acepta un `ruleSet='bank:<CODE>'` nuevo (crear vía UI o
      import JSON). `predicateKind` disponibles: `FIELD_REQUIRED`, `FIELD_FORBIDDEN`, `OPTION_ALLOWED`, `MAX_LENGTH`,
      `CURRENCY_ALLOWED`, `AMOUNT_MAX`, `CHARGES_ALLOWED`, `JEXL` (escape para lo no cubierto).
- [ ] **Transporte**: `MT101_STATUS.routeQuery` soporta REST (`Mt101StatusGateway`) y SFTP (`Mt101StatusSftpGateway`).
      Confirmar que la ruta del banco cae en uno de esos dos.
- [ ] **Mapeo de estados**: `MT101_STATUS` expone `acceptedStatuses`/`rejectedStatuses`/`finalStatuses`,
      `expectedGatewayResponse.statusField`/`referenceField`. Confirmar que los códigos del banco encajan.
- [ ] **Ledger aislado**: hay un `connectionRef` para el banco (o se puede crear).
- [ ] **Gap check**: si el banco pide un transporte/formato/campo que **no** entra en lo anterior ni en `JEXL` → es el
      único caso que requiere **código** (transporte nuevo, variante de formato). Escalarlo temprano.

---

## 2. Configuración (mapear el manual → plataforma)

### 2.1 Formato del mensaje (reglas por banco)
- [ ] Crear `ruleSet='bank:<CODE>'` en **payment-rules** con una regla por requisito del manual:
  - Campos obligatorios → `FIELD_REQUIRED` (`:57a`, `:59a`, …).
  - Campos prohibidos → `FIELD_FORBIDDEN`.
  - Opciones permitidas (p.ej. `:71A ∈ {OUR,SHA,BEN}`) → `OPTION_ALLOWED` / `CHARGES_ALLOWED`.
  - Longitudes → `MAX_LENGTH`; monto → `AMOUNT_MAX`; monedas → `CURRENCY_ALLOWED`.
  - Lo no cubierto → `JEXL`.
- [ ] Severidad: `E` (bloquea) para lo que el banco rechaza; `W`/`I` para advertencias.
- [ ] **Versionar**: exportar el rule set (botón Export en payment-rules) y guardarlo como evidencia de config.

### 2.2 Transporte (envío + consulta)
- [ ] Definir la **ruta** (MT101_ROUTE `rules[].routeTo` = `BANK_<CODE>`) que dirige los pagos del banco.
- [ ] En `MT101_STATUS.routeQuery`, agregar la entrada `BANK_<CODE>` con:
  - REST: `url`, `method`, `statusField`, `referenceField`, `timeoutSeconds`.
  - SFTP: `sftp` (host/creds), `responseFileTemplate`, `acceptedTokens`/`rejectedTokens`.
- [ ] Recordar **#2 (cobertura de rutas)**: si el STATUS es route-aware, `routeQuery` debe cubrir **todas** las rutas
      declaradas por el `MT101_ROUTE` upstream, o no publica (400).

### 2.3 Mapeo de estados
- [ ] `expectedGatewayResponse.statusField` / `referenceField` → dónde el banco pone el estado y su referencia.
- [ ] `acceptedStatuses` = códigos "OK" del banco; `rejectedStatuses` = códigos "NOK"; `finalStatuses` (poll) = los
      terminales. (Traducís SUS códigos → SENT/REJECTED internos.)
- [ ] `mode`: `query` (pull inmediato), `poll` (reintenta hasta `poll.maxAttempts`/`intervalSeconds`), o `callback`
      (el banco hace push a `POST /api/process-executions/resume/{token}`).

### 2.4 Ledger + money-path
- [ ] `connectionRef` del banco en **MT101_PAY y MT101_STATUS** (mismo valor — lo exige **#2-ext**).
- [ ] Si el ambiente es de lazo cerrado in-line → activar `mt101.pay.require-normal-pay-resolver=true` (ver el runbook
      del flag) y cablear `MT101_PAY(continueOnFailure=true) → MT101_STATUS(resolveNormalPay=true)`.

### 2.5 Seguridad
- [ ] Credenciales del gateway via `${secret:...}` (Vault), **nunca** en claro. Llaves SFTP / certs mTLS cargados.

---

## 3. Matriz de pruebas (con el entorno del banco)

| Caso | Qué probar | Resultado esperado |
|---|---|---|
| **Feliz** | pago válido | banco confirma; fragmento → SENT/CONFIRMED; archive CONFIRMED |
| **Rechazo** | pago que el banco rechaza (formato/negocio) | fragmento → REJECTED; motivo registrado |
| **Contradicción** | terminal del ledger vs banco distinto | `pay_conflict=true` + trama `PAY_CONFLICT` visible en la consola |
| **Duplicado** | reenvío de la misma correlación | idempotencia (`payload_hash`/`idempotency_key`) — no doble pago |
| **Cutoff / value-date** | fuera de ventana | comportamiento del manual (rechazo o encolado) |
| **Timeout de confirmación** | banco no responde en SLA | `poll` reintenta; queda pendiente/`NEEDS_RECONCILIATION` (no falso-cierre) |

---

## 4. Captura de evidencia (para el sign-off)

- [ ] **Confirmaciones del banco**: consola `/audit/mt101-pay-conflicts` → botón **Evidencia** por fila
      (gatewayReference + último STATUS) y **Exportar evidencia** (JSON).
- [ ] **Lineage E2E** por pago: `/audit/mt101-fragments` → resolver línea física/hoja-fila → **Lineage aquí**
      (staging→fragmento→archive→PAY→STATUS→RECONCILE→conflictos).
- [ ] **Persistente**: `mt101_archive` (estado durable), `mt101_confirmation` (respuesta del banco), tramas
      `PAY_CONFLICT` (append-only).
- [ ] Guardar: el rule set exportado, la config del STATUS/routeQuery, y los JSON de evidencia por caso de prueba.

---

## 5. Go-live checklist

- [ ] Todos los casos de la matriz (§3) pasan y con evidencia (§4).
- [ ] Rule set del banco **activo** y versionado.
- [ ] `routeQuery` apunta al gateway de **producción** del banco (no test); credenciales de prod en Vault.
- [ ] `connectionRef` de prod consistente PAY↔STATUS (#2-ext valida al publicar).
- [ ] Firma / sign-off del banco archivado.
- [ ] Gates de gobernanza en verde al publicar el proceso productivo (G1/G2/#1/#2/#2-ext).

## 6. Rollback

- Desactivar el `ruleSet` del banco (toggle en payment-rules) y/o el proceso (setActive=false) detiene nuevos envíos.
- Los pagos ya despachados siguen su ciclo de confirmación/reconciliación normal (nunca se re-envía a ciegas).

---

## Resumen: qué es config vs. código

- **Config (99% de los bancos):** rule set, routeQuery/gateway, mapeo de estados, connectionRef, secretos, cutoffs.
- **Código (excepción):** transporte no soportado, variante de formato propietaria, o validación fuera de los
  `predicateKind` + `JEXL`. Detectarlo en el **pre-check §1** y escalarlo, no descubrirlo en vivo con el banco.
